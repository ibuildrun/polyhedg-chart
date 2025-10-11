from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv
from app.models import (
    FilterByTagsRequest,
    FilterByTagsResponse,
    EventCountResponse,
    CategoryMatchRequest,
    SmartSearchRequest
)
from app.services.events import count_events_in_folder
from app.services.filters import filter_events_by_tags_from_folder, filter_events_by_tags_from_file
from app.services.category_matcher import CategoryMatcher, load_categories_from_file
from app.services.event_transformer import transform_events_batch
from app.services.relevance_scorer import RelevanceScorer, limit_events_per_category
from app.services.event_prefilter import prefilter_events_by_category

# Load environment variables
load_dotenv()

# Create FastAPI app
app = FastAPI(
    title="Polymarket API",
    description="API for Polymarket event data filtering and analysis",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins - configure as needed
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Initialize category matcher and relevance scorer
category_matcher = CategoryMatcher()
relevance_scorer = RelevanceScorer()

# Load categories from file at startup
CATEGORIES_FILE = "data/res/unique_tags.json"
try:
    available_categories = load_categories_from_file(CATEGORIES_FILE)
    print(f"✅ Loaded {len(available_categories)} categories from {CATEGORIES_FILE}")
except Exception as e:
    print(f"⚠️  Warning: Could not load categories from {CATEGORIES_FILE}: {e}")
    available_categories = []


@app.get("/", tags=["Health"])
async def root():
    """Health check endpoint"""
    return {
        "status": "ok",
        "message": "Polymarket API is running",
        "version": "1.0.0",
        "categories_loaded": len(available_categories),
        "features": ["event_counting", "tag_filtering", "ai_category_matching"]
    }


@app.get("/health", tags=["Health"])
async def health():
    """Detailed health check"""
    return {
        "status": "healthy",
        "categories_available": len(available_categories) > 0,
        "openai_configured": bool(os.getenv("OPENAI_API_KEY"))
    }


@app.get("/events/count", response_model=EventCountResponse, tags=["Events"])
async def count_events(
    folder_path: str = Query(
        default="./data/res",
        description="Path to folder containing JSON files"
    )
):
    """
    Count events in all JSON files in the specified folder.

    Returns the number of events per file and total statistics.
    """
    try:
        result = count_events_in_folder(folder_path)
        return result
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@app.post("/events/filter-by-tags", response_model=FilterByTagsResponse, tags=["Events"])
async def filter_by_tags(request: FilterByTagsRequest):
    """
    Filter events by tags from JSON files in the specified folder.

    Returns only events that contain at least one of the specified tags.
    """
    try:
        if not request.target_tags:
            raise HTTPException(status_code=400, detail="target_tags cannot be empty")

        result = filter_events_by_tags_from_folder(
            target_tags=request.target_tags,
            input_folder=request.input_folder
        )
        return result
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@app.get("/api/categories", tags=["Categories"])
async def get_categories():
    """Get all available event categories"""
    return {
        "categories": available_categories,
        "count": len(available_categories)
    }


@app.post("/api/smart-search/simplified", tags=["AI Search"])
async def smart_search_simplified(request: SmartSearchRequest):
    """
    AI-powered event search with simplified frontend-friendly format.
    
    Returns events in a clean structure without nested markets,
    optimized for graph visualization and UI display.
    """
    if not available_categories:
        raise HTTPException(
            status_code=503,
            detail="Categories not loaded. Please check server configuration."
        )
    
    if not os.getenv("OPENAI_API_KEY"):
        raise HTTPException(
            status_code=503,
            detail="OpenAI API key not configured. Please set OPENAI_API_KEY environment variable."
        )
    
    try:
        # Log the incoming query
        print(f"\n🔍 Smart Search Query: '{request.query}'")
        print(f"   Min Confidence: {request.min_confidence}")
        
        # Step 1: Match categories using AI
        category_result = category_matcher.match_categories(
            user_query=request.query,
            available_categories=available_categories,
            max_categories=20
        )
        
        # Filter categories by min_confidence
        matched_categories = []
        if "categories" in category_result and isinstance(category_result["categories"], list):
            matched_categories = [
                cat for cat in category_result["categories"]
                if isinstance(cat, dict) and cat.get("confidence", 0) >= request.min_confidence
            ]
        
        # Extract category names for filtering
        category_names = [cat["name"] for cat in matched_categories if "name" in cat]
        
        print(f"   ✅ Matched {len(category_names)} categories: {', '.join(category_names[:5])}{'...' if len(category_names) > 5 else ''}")
        
        if not category_names:
            return {
                "events": [],
                "stats": {
                    "total_events": 0,
                    "matched_categories": [],
                    "message": "No categories matched with sufficient confidence"
                }
            }
        
        # Step 2: Filter events by matched categories
        events_result = filter_events_by_tags_from_file(
            target_tags=category_names,
            input_file=request.input_file
        )
        
        # Step 3: Transform to simplified format
        simplified_events = transform_events_batch(events_result["matched_events"])
        
        print(f"   🔄 Transformed {len(simplified_events)} events")
        
        # Step 3.5: Pre-filter to max_total_events BEFORE AI scoring (saves cost/time)
        if len(simplified_events) > request.max_total_events:
            print(f"   ✂️  Pre-filtering from {len(simplified_events)} to {request.max_total_events} events (randomized from top volume per category)")
            simplified_events = prefilter_events_by_category(
                events=simplified_events,
                max_total=request.max_total_events,
                prioritize_by="volume",
                randomize=True  # Add variety by randomizing within top events
            )
        
        # Step 4: AI Relevance Scoring (if enabled)
        if request.enable_ai_scoring and simplified_events:
            print(f"   🤖 AI scoring {len(simplified_events)} events for relevance (single API call)...")
            scored_events = relevance_scorer.score_events(
                events=simplified_events,
                user_query=request.query
            )
            
            # Sort by relevance score
            scored_events.sort(key=lambda e: e.get("relevance_score", 0), reverse=True)
            
            print(f"   ⭐ Sorted by AI relevance scores")
            simplified_events = scored_events
        
        # Step 5: Return clean response
        total_events = len(simplified_events)
        print(f"   📊 Returning {total_events} events ({round(total_events / events_result['total_events_processed'] * 100, 2)}% match rate)\n")
        return {
            "events": simplified_events,
            "count": total_events,
            "stats": {
                "total_events": total_events,
                "total_scanned": events_result["total_events_processed"],
                "match_rate": round(total_events / events_result["total_events_processed"] * 100, 2) if events_result["total_events_processed"] > 0 else 0,
                "matched_categories": matched_categories,
                "categories_used": category_names,
                "overall_confidence": category_result.get("overall_confidence", 0.0)
            }
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error in smart search: {str(e)}"
        )


@app.post("/api/smart-search", tags=["AI Search"])
async def smart_search(request: SmartSearchRequest):
    """
    AI-powered event search: Uses natural language to find relevant events.
    
    This endpoint combines AI category matching with event filtering:
    1. Uses AI to match your query to relevant categories
    2. Filters events by those categories
    3. Returns matching events with category insights
    
    Example:
        Query: "Bitcoin price predictions"
        → Finds categories: Bitcoin, Crypto Prices, ATH
        → Returns all events tagged with those categories
    """
    if not available_categories:
        raise HTTPException(
            status_code=503,
            detail="Categories not loaded. Please check server configuration."
        )
    
    if not os.getenv("OPENAI_API_KEY"):
        raise HTTPException(
            status_code=503,
            detail="OpenAI API key not configured. Please set OPENAI_API_KEY environment variable."
        )
    
    try:
        # Step 1: Match categories using AI
        category_result = category_matcher.match_categories(
            user_query=request.query,
            available_categories=available_categories,
            max_categories=20
        )
        
        # Filter categories by min_confidence
        matched_categories = []
        if "categories" in category_result and isinstance(category_result["categories"], list):
            matched_categories = [
                cat for cat in category_result["categories"]
                if isinstance(cat, dict) and cat.get("confidence", 0) >= request.min_confidence
            ]
        
        # Extract category names for filtering
        category_names = [cat["name"] for cat in matched_categories if "name" in cat]
        
        if not category_names:
            return {
                "query": request.query,
                "matched_categories": matched_categories,
                "events": [],
                "total_events": 0,
                "message": "No categories matched with sufficient confidence"
            }
        
        # Step 2: Filter events by matched categories from single file
        events_result = filter_events_by_tags_from_file(
            target_tags=category_names,
            input_file=request.input_file
        )
        
        # Step 3: Combine results with detailed stats
        return {
            "query": request.query,
            "matched_categories": matched_categories,
            "category_count": len(matched_categories),
            "overall_confidence": category_result.get("overall_confidence", 0.0),
            "events": events_result["matched_events"],
            "stats": {
                "unique_matched_events": events_result["total_matched"],
                "total_events_scanned": events_result["total_events_processed"],
                "match_rate": round(events_result["total_matched"] / events_result["total_events_processed"] * 100, 2) if events_result["total_events_processed"] > 0 else 0,
                "categories_used": category_names,
                "source_file": request.input_file
            }
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error in smart search: {str(e)}"
        )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
