# Polymarket API - TEE Configuration

AI-powered prediction market event search API with TEE (Trusted Execution Environment) support.

## Features

- **AI Category Matching**: Natural language queries to match relevant event categories
- **Smart Event Search**: Combined AI + filtering for relevant events
- **Event Scoring**: AI relevance scoring (0-100) for each event
- **TEE Ready**: Docker + Caddy with TLS for secure deployment

## Quick Start

### Local Development

```bash
# Install dependencies
pip install -r requirements.txt

# Set up environment
cp .env.example .env
# Edit .env and add your OPENAI_API_KEY

# Run server
python -m app.main
# or
uvicorn app.main:app --reload --port 80
```

### Docker Deployment

```bash
# Build image
docker build -t polymarket-api .

# Run container
docker run -p 80:80 \
  -e OPENAI_API_KEY=your_key_here \
  -e PORT=80 \
  polymarket-api
```

### TEE Deployment with TLS

The application is configured to work with Caddy for automatic HTTPS:

```bash
# Environment variables needed:
# - DOMAIN: Your domain name
# - APP_PORT: Internal app port (default: 80)
# - OPENAI_API_KEY: OpenAI API key
# - PORT: Port the app listens on (default: 80)

# TLS certificates expected at:
# - /run/tls/fullchain.pem
# - /run/tls/privkey.pem
```

## API Endpoints

### Health Check
```bash
GET /health
```

### Get Available Categories
```bash
GET /api/categories
```

### Smart Search (Simplified)
```bash
POST /api/smart-search/simplified
Content-Type: application/json

{
  "query": "Bitcoin price predictions",
  "max_total_events": 25,
  "min_confidence": 0.5,
  "enable_ai_scoring": true
}
```

**Response (Signed with TEE Wallet):**
```json
{
  "data": {
    "events": [
      {
        "id": "38001",
        "title": "Bitcoin to hit $100k by Dec 2025?",
        "description": "...",
        "relevance_score": 95,
        "relevance_reason": "Directly related to Bitcoin price predictions",
        "category": "bitcoin",
        "market_data": {...},
        "dates": {...},
        "metadata": {...}
      }
    ],
    "count": 25,
    "stats": {
      "total_events": 25,
      "total_scanned": 2712,
      "match_rate": 0.92,
      "matched_categories": [...],
      "overall_confidence": 0.85
    }
  },
  "signature": "0x1234567890abcdef...",
  "wallet": "0xAbC123...",
  "timestamp": "2025-10-11T01:23:45.678Z"
}
```

## Architecture

```
polyhedg-polymarket-api/
├── app/
│   ├── main.py                 # FastAPI application
│   ├── models.py               # Pydantic models
│   ├── services/
│   │   ├── category_matcher.py    # AI category matching
│   │   ├── relevance_scorer.py    # AI event scoring
│   │   ├── event_prefilter.py     # Pre-filtering logic
│   │   ├── event_transformer.py   # Event data transformation
│   │   └── filters.py              # Event filtering
│   └── prompts/
│       └── system_prompt.txt   # LLM system prompt
├── data/
│   └── res/
│       ├── unique_tags.json    # Available categories
│       └── combined-and-filtered.json  # Event data
├── Dockerfile              # Docker build config
├── Caddyfile              # Caddy TLS config
├── requirements.txt       # Python dependencies
└── .env                   # Environment variables (not in git)
```

## Environment Variables

```bash
# Required
OPENAI_API_KEY=sk-...
MNEMONIC="your twelve word mnemonic phrase"

# Optional
PORT=80                    # Server port (default: 80)
DOMAIN=localhost           # Domain for TLS (Caddy)
APP_PORT=80               # Internal app port (Caddy)
```

## Development

### Adding New Endpoints

1. Add route to `app/main.py`
2. Define request/response models in `app/models.py`
3. Add business logic in `app/services/`

### Updating Categories

Categories are loaded from `data/res/unique_tags.json`. To reload without restart:

```bash
POST /api/categories/reload
```

## Deployment Notes

### TLS/HTTPS

The Caddyfile expects TLS certificates at:
- `/run/tls/fullchain.pem`
- `/run/tls/privkey.pem`

These are typically provided by the TEE platform's `tls-keygen` service.

### Security Headers

Caddy automatically adds:
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- X-XSS-Protection: 1; mode=block
- Referrer-Policy: strict-origin-when-cross-origin

### Health Checks

The `/health` endpoint is available on both HTTP (port 80) and HTTPS.

## License

MIT
