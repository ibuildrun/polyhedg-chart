# get-tags.py

## Overview
Python script that extracts all unique tag labels from event data across all JSON files in the `data/res` folder and saves them to a single sorted list.

## How It Works

### 1. extract_tags_from_events(events_data)
**Purpose**: Extract unique tag labels from a list of events

**Steps**:
- Creates an empty set to store unique tags
- Iterates through each event in the data
- For each event:
  - Safely gets the 'tags' field (defaults to empty list if missing)
  - Validates it's a list
  - For each tag object in the tags list:
    - Checks if it's a dictionary with a 'label' key
    - Adds the label string to the set
- Returns the set of unique tag labels

**Why a set?**: Sets automatically prevent duplicates, perfect for collecting unique values

### 2. main()
**Purpose**: Process all JSON files and combine unique tags

**Steps**:
- Defines paths:
  - Input folder: `./data/res`
  - Output file: `./data/res/unique_tags.json`
- Gets all JSON files from folder, excluding output files:
  - Excludes: `unique_tags.json`, `filtered-combined.json`, `filtered_by_tags.json`
  - This prevents processing output files as input
- Sorts the file list for consistent processing order
- Initializes:
  - `all_unique_tags`: Empty set to accumulate tags from all files
  - `total_events`: Counter for events processed
- For each JSON file:
  - Opens and loads the JSON data
  - Validates the data is a list
  - Calls `extract_tags_from_events()` to get tags from this file
  - Updates the main set with new tags using `.update()`
  - Increments event counter
  - Prints progress (events processed, unique tags found in file)
- After processing all files:
  - Converts the set to a sorted list
  - Prints the sorted list to console
  - Writes the list to JSON file with 2-space indentation
  - Prints summary statistics

## Usage
```bash
python3 get-tags.py
```

## Example Output
```
Found 7 JSON files to process: ['0.json', '1000.json', ...]

Reading data from '0.json'...
Processed 500 events, found 380 unique tags in this file

Reading data from '1000.json'...
Processed 500 events, found 172 unique tags in this file

[... processing continues ...]

--- Extraction Complete ---
Processed 2712 total events across 7 files
Found 616 unique tags across all files.

List of Unique Tags:
- AI
- Bitcoin
- Business
- Elections
- Fed
- NFL
- Politics
[... etc ...]

Successfully saved the unique tags to './data/res/unique_tags.json'.
```

## Tag Structure in Events
Tags in Polymarket events are stored as:
```json
"tags": [
  {"label": "Business"},
  {"label": "Fed"},
  {"label": "Economic Policy"}
]
```

This script extracts just the label strings.

## Input Requirements
- JSON files must be in `./data/res/` folder
- Each file must contain an array of event objects
- Events should have a 'tags' field with tag objects containing 'label' keys

## Output
- File: `./data/res/unique_tags.json`
- Format: Alphabetically sorted array of tag label strings
- Example: `["AI", "Bitcoin", "Business", "Elections", ...]`

## Use Cases
- Discover all available tags in your dataset
- Build tag filters or selectors
- Analyze tag coverage and distribution
- Input for the `filter-by-tag.py` script
