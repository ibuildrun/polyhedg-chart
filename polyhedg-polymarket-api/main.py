from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
from typing import Optional, List
from dotenv import load_dotenv
from src.category_matcher import CategoryMatcher, load_categories_from_file

# Load environment variables from .env file
load_dotenv()

app = FastAPI(title="PolyMarket API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize category matcher
category_matcher = CategoryMatcher()

# Load categories from file at startup
CATEGORIES_FILE = "data/events/unique_tags.json"
try:
    available_categories = load_categories_from_file(CATEGORIES_FILE)
except Exception as e:
    print(f"Warning: Could not load categories from {CATEGORIES_FILE}: {e}")
    available_categories = []


class CategoryMatchRequest(BaseModel):
    """Request model for category matching"""
    query: str
    min_confidence: Optional[float] = 0.5


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "PolyMarket API Server",
        "version": "1.0.0",
        "status": "running",
        "categories_loaded": len(available_categories)
    }

@app.get("/health")
async def health():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "categories_available": len(available_categories) > 0
    }

@app.get("/api/categories")
async def get_categories():
    """Get all available categories"""
    return {
        "categories": available_categories,
        "count": len(available_categories)
    }

@app.post("/api/match-categories")
async def match_categories(request: CategoryMatchRequest):
    """
    Match a natural language query to relevant event categories.
    
    This endpoint uses OpenAI to intelligently match user queries to the most
    relevant categories from PolyMarket events.
    
    Args:
        request: CategoryMatchRequest containing the user's natural language query
        
    Returns:
        Dictionary with matched categories, reasoning, and confidence score
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
        result = category_matcher.match_categories(
            user_query=request.query,
            available_categories=available_categories,
            max_categories=20  # Allow up to 20, but LLM filters by confidence
        )
        
        # Filter categories by min_confidence
        if "categories" in result and isinstance(result["categories"], list):
            result["categories"] = [
                cat for cat in result["categories"]
                if isinstance(cat, dict) and cat.get("confidence", 0) >= request.min_confidence
            ]
        
        return result
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error matching categories: {str(e)}"
        )

@app.get("/api/events")
async def get_events(
    categories: Optional[str] = Query(None, description="Comma-separated list of categories to filter by")
):
    """
    Get filtered events by categories.
    
    Args:
        categories: Optional comma-separated list of category tags to filter by
    
    Returns:
        Dictionary with events and count
    """
    # TODO: Implement your event filtering logic based on categories
    category_list = categories.split(",") if categories else []
    
    return {
        "events": [],
        "count": 0,
        "filters": {
            "categories": category_list
        }
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "80"))
    uvicorn.run(app, host="0.0.0.0", port=port)

