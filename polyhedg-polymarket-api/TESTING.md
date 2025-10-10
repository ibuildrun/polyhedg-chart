# Testing the Polymarket API

This guide explains how to test the Polymarket API endpoints to verify functionality.

## Prerequisites

Before testing, ensure:

1. **Server is running**:
```bash
uvicorn app.main:app --reload
```

2. **Server is accessible** at `http://127.0.0.1:8000`

3. **Data files exist** in `./data/res/` folder

---

## Test Files

Two test scripts are provided:

### 1. Shell Script (`test-api.sh`)

**Requirements:**
- `curl` - command-line HTTP client (usually pre-installed)
- `jq` - JSON processor for formatting output

**Install jq (if needed):**
```bash
# macOS
brew install jq

# Ubuntu/Debian
sudo apt-get install jq

# Windows (via Chocolatey)
choco install jq
```

**Run the tests:**
```bash
./test-api.sh
```

**What it tests:**
1. Health check endpoint
2. Count events (default folder)
3. Count events (custom folder)
4. Filter by tags: Business & Fed
5. Filter by tags: Economic Policy
6. Filter by multiple tags
7. Error handling: Empty tags
8. Error handling: Invalid folder

---

### 2. Python Script (`test-api.py`)

**Requirements:**
- Python 3.8+
- `requests` library

**Install requirements:**
```bash
pip install requests
```

**Run the tests:**
```bash
python3 test-api.py
```

or

```bash
./test-api.py
```

**What it tests:**
- Same 8 tests as the shell script
- Includes connection error handling
- Formats output for readability
- Limits large response payloads automatically

---

## Manual Testing with curl

You can also test individual endpoints manually:

### Test 1: Health Check
```bash
curl http://127.0.0.1:8000/
```

**Expected Response:**
```json
{
  "status": "ok",
  "message": "Polymarket API is running",
  "version": "1.0.0"
}
```

---

### Test 2: Count Events
```bash
curl "http://127.0.0.1:8000/events/count"
```

**Expected Response:**
```json
{
  "files": [
    {
      "filename": "1000.json",
      "event_count": 150
    }
  ],
  "total_files_processed": 1,
  "total_files_found": 1,
  "total_events": 150
}
```

---

### Test 3: Filter by Tags
```bash
curl -X POST "http://127.0.0.1:8000/events/filter-by-tags" \
  -H "Content-Type: application/json" \
  -d '{
    "target_tags": ["Business", "Fed"]
  }'
```

**Expected Response:**
```json
{
  "matched_events": [...],
  "total_events_processed": 500,
  "total_matched": 45,
  "files_processed": 3
}
```

---

## Using Interactive API Documentation

The easiest way to test is using the built-in Swagger UI:

1. **Start the server**:
```bash
uvicorn app.main:app --reload
```

2. **Open browser** and navigate to:
```
http://127.0.0.1:8000/docs
```

3. **Test endpoints interactively:**
   - Click on any endpoint
   - Click "Try it out"
   - Enter parameters
   - Click "Execute"
   - View response

---

## Testing with Postman or Insomnia

### Import Collection

**GET /events/count**
- Method: `GET`
- URL: `http://127.0.0.1:8000/events/count`
- Query Params: `folder_path` (optional)

**POST /events/filter-by-tags**
- Method: `POST`
- URL: `http://127.0.0.1:8000/events/filter-by-tags`
- Headers: `Content-Type: application/json`
- Body (raw JSON):
```json
{
  "target_tags": ["Business", "Fed"],
  "input_folder": "./data/res"
}
```

---

## Expected Test Results

### Successful Tests

All successful API calls should return:
- **Status Code**: `200 OK`
- **Valid JSON response**
- **Matching response schema** from `app/models.py`

### Error Tests

Error cases should return appropriate status codes:

**Empty tags array:**
```bash
curl -X POST "http://127.0.0.1:8000/events/filter-by-tags" \
  -H "Content-Type: application/json" \
  -d '{"target_tags": []}'
```
- Status: `400 Bad Request`
- Response: `{"detail": "target_tags cannot be empty"}`

**Invalid folder path:**
```bash
curl "http://127.0.0.1:8000/events/count?folder_path=/invalid/path"
```
- Status: `404 Not Found`
- Response: `{"detail": "Folder '/invalid/path' does not exist"}`

---

## Troubleshooting

### Server Not Running
**Error:** `Connection refused` or `Failed to connect`

**Solution:**
```bash
# Start the server
uvicorn app.main:app --reload
```

### Port Already in Use
**Error:** `Address already in use`

**Solution:**
```bash
# Find and kill process using port 8000
lsof -ti:8000 | xargs kill -9

# Or run on different port
uvicorn app.main:app --port 8001
```

### Import Errors
**Error:** `ModuleNotFoundError`

**Solution:**
```bash
# Install dependencies
pip install -r requirements.txt
```

### No Data Files Found
**Error:** `No JSON files found in './data/res'`

**Solution:**
- Ensure `./data/res/` folder exists
- Ensure it contains `.json` files
- Check file permissions

---

## Continuous Testing

For development, you can use these commands:

**Watch mode testing (requires `watch` or `entr`):**
```bash
# Run tests every 2 seconds
watch -n 2 ./test-api.sh

# Or run on file changes
ls app/**/*.py | entr -c python3 test-api.py
```

---

## Next Steps

After verifying the API works:

1. **Write unit tests** using `pytest`
2. **Add integration tests** for full workflows
3. **Set up CI/CD** to run tests automatically
4. **Add performance tests** for large datasets

---

## Summary

| Test Method | Best For | Command |
|-------------|----------|---------|
| Shell Script | Quick verification | `./test-api.sh` |
| Python Script | Automated testing | `python3 test-api.py` |
| Swagger UI | Interactive testing | Visit `/docs` |
| Manual curl | Single endpoint tests | See examples above |
| Postman/Insomnia | API development | Import collection |

Choose the method that best fits your workflow.
