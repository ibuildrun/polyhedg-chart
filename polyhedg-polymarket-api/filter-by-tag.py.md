# filter-by-tag.py

## Overview
Python script that filters events from all JSON files in the `data/res` folder, keeping only events that have at least one of the specified target tags, and combines matching events into a single output file.

## How It Works

### 1. Configuration (Lines 7)
**TARGET_TAGS**: List of tag labels to filter for

**Default**:
```python
TARGET_TAGS = ["Business", "Fed", "Economic Policy"]
```

**Customize**: Edit this list to match your specific filtering needs. Tags are case-sensitive.

### 2. filter_events_by_tags(all_events_data, target_tags)
**Purpose**: Filter events that contain at least one target tag

**Steps**:
- Converts target_tags list to a set for fast lookups
- Creates empty list to accumulate matching events
- For each event in the input data:
  - Safely gets the 'tags' field (defaults to empty list)
  - Validates it's a list
  - Extracts just the label strings from tag objects into a set:
    - Uses set comprehension
    - Filters for dictionaries with 'label' keys
    - Creates set of label strings
  - Checks for intersection between event tags and target tags:
    - Uses `.isdisjoint()` method
    - `.isdisjoint()` returns True if no common elements
    - `not .isdisjoint()` means at least one match found
  - If match found, appends entire event to results
- Returns the list of matching events

**Why sets?**: Set operations like `.isdisjoint()` are very fast for membership checking

### 3. main()
**Purpose**: Process all JSON files and combine filtered results

**Steps**:
- Defines paths:
  - Input folder: `./data/res`
  - Output file: `./data/res/filtered_by_tags.json`
- Gets all JSON files, excluding output files:
  - Excludes: `unique_tags.json`, `filtered-combined.json`, `filtered_by_tags.json`
  - Prevents circular processing
- Sorts files for consistent order
- Prints the target tags being filtered for
- Initializes:
  - `all_matched_events`: Empty list to accumulate matches from all files
  - `total_events_processed`: Counter for all events checked
- For each JSON file:
  - Opens and loads the JSON data
  - Validates it's a list
  - Calls `filter_events_by_tags()` with the data and target tags
  - Extends the combined list with matching events
  - Increments event counter
  - Prints progress (matches found / total events in file)
- After processing all files:
  - Writes combined filtered data to output file
  - Prints summary:
    - Total events processed across all files
    - Total matching events found
    - Output file location

## Usage
```bash
python3 filter-by-tag.py
```

## Customization
Edit the TARGET_TAGS list at the top of the file:
```python
# Example: Filter for sports events
TARGET_TAGS = ["NFL", "NBA", "Soccer", "Baseball"]

# Example: Filter for crypto events
TARGET_TAGS = ["Bitcoin", "Ethereum", "Crypto", "Crypto Prices"]

# Example: Filter for politics
TARGET_TAGS = ["Elections", "Politics", "U.S. Politics"]
```

## Example Output
```
Found 7 JSON files to process: ['0.json', '1000.json', ...]
Filtering for events with any of the following tags: Business, Fed, Economic Policy

Reading data from '0.json'...
Found 55 matching events from 500 events in '0.json'

Reading data from '1000.json'...
Found 6 matching events from 500 events in '1000.json'

[... processing continues ...]

--- Success! ---
Processed 2712 total events across 7 files
Found 95 events matching the specified tags.
The filtered events have been saved to './data/res/filtered_by_tags.json'.
```

## Tag Matching Logic
**At least one match**: An event is included if it has ANY of the target tags

Example:
- TARGET_TAGS = ["Business", "Fed", "Sports"]
- Event with tags ["Business", "Economics"] → **Matches** (has "Business")
- Event with tags ["Fed", "Inflation"] → **Matches** (has "Fed")
- Event with tags ["Gaming", "Esports"] → **No match** (has none)

## Input Requirements
- JSON files must be in `./data/res/` folder
- Each file must contain an array of event objects
- Events should have a 'tags' field with tag objects

## Output
- File: `./data/res/filtered_by_tags.json`
- Format: Array of complete event objects that match the tag filter
- Contains all fields from original events (not filtered by field)

## Use Cases
- Create focused datasets for specific topics
- Filter markets by category (sports, politics, crypto, etc.)
- Build specialized analysis pipelines
- Reduce data size by focusing on relevant events
