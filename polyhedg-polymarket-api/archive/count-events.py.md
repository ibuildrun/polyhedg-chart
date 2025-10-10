# count-events.py

## Overview
Python script that counts the number of events in all JSON files within the `data/res` folder and provides both individual and total counts.

## How It Works

### 1. count_events_in_file(filename)
**Purpose**: Count events in a single JSON file

**Steps**:
- Opens the specified JSON file with UTF-8 encoding
- Loads the JSON data into memory
- Checks if the data is a list (expected format for event files)
- Returns the length of the list (number of events)
- Handles errors:
  - FileNotFoundError: File doesn't exist
  - JSONDecodeError: Invalid JSON format
  - TypeError: Data is not a list

### 2. main()
**Purpose**: Process all JSON files in the res folder

**Steps**:
- Defines the input folder path: `./data/res`
- Checks if the folder exists
- Uses glob to find all `*.json` files in the folder
- Sorts the file list for consistent output order
- Initializes counters:
  - `total_events`: Running sum of all events
  - `successful_files`: Count of successfully processed files
- Iterates through each JSON file:
  - Extracts just the filename (not full path)
  - Calls `count_events_in_file()` for that file
  - If successful:
    - Prints the count for that file
    - Adds to the running total
    - Increments successful file counter
- Prints summary:
  - Total files processed vs total files found
  - Total events across all files

## Usage
```bash
python3 count-events.py
```

## Example Output
```
Counting events from all JSON files in './data/res'...

0.json: 500 events
500.json: 500 events
1000.json: 500 events
1500.json: 500 events
2000.json: 500 events
2500.json: 212 events
3000.json: 0 events

--- Summary ---
Total files processed: 7/7
Total events across all files: 2712
```

## Input Requirements
- JSON files must be in `./data/res/` folder
- Each JSON file must contain a top-level array of event objects

## Error Handling
- Gracefully handles missing files (skips and continues)
- Handles corrupt JSON (skips and continues)
- Handles non-list data structures (prints error, skips)
