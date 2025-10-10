# fetch-polymarket.sh

## Overview
Bash script that fetches Polymarket event data from the Gamma API using parallel curl requests and saves the responses to individual JSON files.

## How It Works

### 1. Setup
- Creates the `data/res` directory if it doesn't exist
- Sets maximum parallel requests to 10 to avoid overwhelming the API

### 2. Request Loop
- Loops through offsets from 0 to 10000 in steps of 500
  - offset=0: events 0-499
  - offset=500: events 500-999
  - offset=1000: events 1000-1499
  - etc.

### 3. Parallel Job Control
- Checks how many background jobs are currently running
- If 10 or more jobs are running, waits (sleeps 0.1s) until a slot frees up
- This prevents too many simultaneous requests to the API

### 4. API Request (Background Process)
- For each offset, launches a curl request in the background:
  - Constructs the API URL with the current offset
  - Sets output file to `data/res/{offset}.json`
  - Prints progress message
  - Executes curl with silent mode (-sS) to fetch data

### 5. Completion
- Waits for all background jobs to finish
- Prints completion message

## Usage
```bash
./fetch-polymarket.sh
```

## Output
- Creates files: `data/res/0.json`, `data/res/500.json`, `data/res/1000.json`, etc.
- Each file contains up to 500 Polymarket events

## API Endpoint
- **URL**: `https://gamma-api.polymarket.com/events`
- **Parameters**:
  - `related_tags=true`: Include tag information
  - `closed=false`: Only fetch active (non-closed) events
  - `limit=500`: Get 500 events per request
  - `offset={offset}`: Starting position for pagination
