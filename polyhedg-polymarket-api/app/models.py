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


# Category Matching Models
class CategoryMatchRequest(BaseModel):
    """Request model for category matching with LLM"""
    query: str = Field(..., description="Natural language query to match categories")
    min_confidence: Optional[float] = Field(default=0.5, description="Minimum confidence threshold for categories")


class SmartSearchRequest(BaseModel):
    """Request model for AI-powered event search"""
    query: str = Field(..., description="Natural language query to search for events")
    min_confidence: Optional[float] = Field(default=0.5, description="Minimum confidence threshold for categories")
    input_file: Optional[str] = Field(default="./data/res/combined-and-filtered.json", description="Path to JSON file containing events")
    max_total_events: Optional[int] = Field(default=25, description="Maximum total events to return (pre-filtered before AI scoring)")
    enable_ai_scoring: Optional[bool] = Field(default=True, description="Enable AI relevance scoring")


class SimplifiedEvent(BaseModel):
    """Simplified event structure for frontend"""
    id: str
    title: str
    description: str
    value: Optional[str] = None
    change: Optional[str] = None
    type: str = "neutral"  # positive, negative, neutral
    selected: bool = False
    size: str = "medium"  # small, medium, large
    category: str
    market_data: Dict[str, Any]
    dates: Dict[str, str]
    metadata: Dict[str, Any]
