# PolyMarket API Server

Basic FastAPI HTTP server running on port 80.

## Quick Start

### Local Development
```bash
# Install dependencies
pip install -r requirements.txt

# Run server
python main.py

# Test
curl http://localhost/
```

### Docker
```bash
# Build
docker build -t polymarket-api .

# Run
docker run -p 80:80 polymarket-api

# Test
curl http://localhost/
```

### Deploy to EigenCompute
```bash
# Terminate old instances if needed
eigenx app list
eigenx app terminate <app-name>

# Deploy
eigenx app deploy your-dockerhub-username/polymarket-api

# Test
curl http://<IP>/
```

## Endpoints

- `GET /` - Root endpoint with API info
- `GET /health` - Health check
- `GET /api/events` - Get filtered events (TODO)

## Development

Add your endpoints in `main.py`:

```python
@app.get("/api/my-endpoint")
async def my_endpoint():
    return {"data": "your data"}
```

