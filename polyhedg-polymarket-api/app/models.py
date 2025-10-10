from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


# Request Models
class FilterByTagsRequest(BaseModel):
    target_tags: List[str] = Field(..., description="List of tags to filter events by")
    input_folder: Optional[str] = Field(
        default="./data/res", description="Path to folder containing JSON files"
    )


# Response Models
class FileEventCount(BaseModel):
    filename: str
    event_count: int


class EventCountResponse(BaseModel):
    files: List[FileEventCount]
    total_files_processed: int
    total_files_found: int
    total_events: int


class FilterByTagsResponse(BaseModel):
    matched_events: List[Dict[str, Any]]
    total_events_processed: int
    total_matched: int
    files_processed: int
