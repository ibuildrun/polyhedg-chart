# Polymarket API

A FastAPI-based REST API for processing and filtering Polymarket event data from JSON files.

## Overview

This API provides endpoints to count and filter Polymarket events stored in JSON files. It extracts core functionality from Python scripts and exposes them as RESTful endpoints with proper validation and error handling.

## Features

- Count events across multiple JSON files
- Filter events by tags with flexible criteria
- Automatic JSON file discovery and processing
- CORS enabled for frontend integration
- Interactive API documentation (Swagger UI)
- Pydantic validation for type safety

## Installation

### Prerequisites

- Python 3.8+
- pip

### Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd polyhedg-polymarket-api
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

## Running the Server

### Development Mode

Start the server with auto-reload enabled:

```bash
uvicorn app.main:app --reload
```

### Production Mode

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

The server will start at `http://localhost:8000`

## API Documentation

Once the server is running, access the interactive documentation at:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## API Endpoints

### Health Check

#### `GET /`

Check if the API is running.

**Response:**
```json
{
  "status": "ok",
  "message": "Polymarket API is running",
  "version": "1.0.0"
}
```

---

### Count Events

#### `GET /events/count`

Count the number of events in all JSON files within a specified folder.

**Query Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| folder_path | string | No | ./data/res | Path to folder containing JSON files |

**Example Request:**
```bash
curl "http://localhost:8000/events/count?folder_path=./data/res"
```

**Response:**
```json
{
  "files": [
    {
      "filename": "1000.json",
      "event_count": 150
    },
    {
      "filename": "2000.json",
      "event_count": 200
    }
  ],
  "total_files_processed": 2,
  "total_files_found": 2,
  "total_events": 350
}
```

**Error Responses:**
- `404 Not Found`: Folder doesn't exist
- `400 Bad Request`: No JSON files found in folder
- `500 Internal Server Error`: Server error

---

### Filter Events by Tags

#### `POST /events/filter-by-tags`

Filter events that contain at least one of the specified tags.

**Request Body:**
```json
{
  "target_tags": ["Business", "Fed", "Economic Policy"],
  "input_folder": "./data/res"
}
```

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| target_tags | array[string] | Yes | - | List of tags to filter by |
| input_folder | string | No | ./data/res | Path to folder containing JSON files |

**Example Request:**
```bash
curl -X POST "http://localhost:8000/events/filter-by-tags" \
  -H "Content-Type: application/json" \
  -d '{
    "target_tags": ["Business", "Fed"],
    "input_folder": "./data/res"
  }'
```

**Response:**
```json
{
  "matched_events": [
    {
      "id": "event-123",
      "title": "Federal Reserve Interest Rate Decision",
      "tags": [
        {"label": "Fed"},
        {"label": "Economic Policy"}
      ],
      ...
    }
  ],
  "total_events_processed": 500,
  "total_matched": 45,
  "files_processed": 3
}
```

**Error Responses:**
- `400 Bad Request`: Empty target_tags array or no JSON files found
- `404 Not Found`: Folder doesn't exist
- `500 Internal Server Error`: Server error

---

## Data Format

### Event Structure

Events in JSON files should follow this structure:

```json
{
  "id": "string",
  "ticker": "string",
  "slug": "string",
  "title": "string",
  "description": "string",
  "startDate": "string",
  "endDate": "string",
  "tags": [
    {
      "label": "string",
      "id": "string"
    }
  ],
  "markets": [],
  ...
}
```

### Excluded Files

The filter-by-tags endpoint automatically excludes these files:
- `unique_tags.json`
- `filtered-combined.json`
- `filtered_by_tags.json`

---

## Project Structure

```
polyhedg-polymarket-api/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI app & endpoints
│   ├── models.py            # Pydantic models
│   ├── services/
│   │   ├── __init__.py
│   │   ├── events.py        # Event counting logic
│   │   └── filters.py       # Filtering logic
│   └── utils/
│       ├── __init__.py
│       └── file_utils.py    # File utilities
├── data/
│   └── res/                 # JSON data files
├── count-events.py          # Original script
├── filter-by-tag.py         # Original script
├── filter-script.py         # Original script
├── get-tags.py              # Original script
├── requirements.txt
└── README.md
```

---

## Development

### Adding New Endpoints

1. Add request/response models in `app/models.py`
2. Implement business logic in `app/services/`
3. Create endpoint in `app/main.py`
4. Update this README

### Running Tests

```bash
pytest
```

---

## CORS Configuration

CORS is enabled for all origins by default. To restrict access, modify the CORS middleware in `app/main.py`:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://yourdomain.com"],  # Specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## Error Handling

All endpoints return structured error responses:

```json
{
  "detail": "Error message description"
}
```

Common HTTP status codes:
- `200 OK`: Successful request
- `400 Bad Request`: Invalid input
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

---

## Dependencies

- **FastAPI**: Modern web framework for building APIs
- **Uvicorn**: ASGI server for running FastAPI
- **Pydantic**: Data validation using Python type hints

See `requirements.txt` for specific versions.

---

## License

[Add your license information here]

---

## Contributing

[Add contributing guidelines here]

---

## Support

For issues and questions, please open an issue on GitHub.
