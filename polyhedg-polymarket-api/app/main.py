from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from app.models import (
    FilterByTagsRequest,
    FilterByTagsResponse,
    EventCountResponse
)
from app.services.events import count_events_in_folder
from app.services.filters import filter_events_by_tags_from_folder

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


@app.get("/", tags=["Health"])
async def root():
    """Health check endpoint"""
    return {
        "status": "ok",
        "message": "Polymarket API is running",
        "version": "1.0.0"
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


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
