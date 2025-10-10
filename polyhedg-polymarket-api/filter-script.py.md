# filter-script.py

## Overview
Python script that filters event data from all JSON files in the `data/res` folder, keeping only specified fields to reduce file size, and combines the results into a single output file.

## How It Works

### 1. Configuration (Lines 8-48)
**Two allowlists define which fields to keep**:

**EVENT_KEYS_TO_KEEP**:
- Top-level event fields (id, title, description, liquidity, volume, tags, etc.)
- Customize this list to include/exclude event-level data

**MARKET_KEYS_TO_KEEP**:
- Nested market object fields (id, question, outcomes, prices, liquidity, etc.)
- Customize this list to include/exclude market-level data

### 2. filter_nested_markets(market_list)
**Purpose**: Filter fields from the nested markets array

**Steps**:
- Checks if the input is a valid list
- Iterates through each market object in the list
- For each market:
  - Creates a new dictionary with only the keys from MARKET_KEYS_TO_KEEP
  - Uses `.get()` to safely extract values (returns None if key doesn't exist)
- Returns the cleaned list of market objects

### 3. process_data(data)
**Purpose**: Filter the main event list and its nested markets

**Steps**:
- Validates that input data is a list
- For each event in the data:
  - Creates a clean event dictionary with only EVENT_KEYS_TO_KEEP fields
  - If the event has a 'markets' field:
    - Calls `filter_nested_markets()` to clean the nested markets
    - Replaces the original markets array with the filtered version
  - Adds the clean event to the output list
- Returns the filtered data

### 4. main()
**Purpose**: Process all JSON files and create combined output

**Steps**:
- Defines paths:
  - Input folder: `./data/res`
  - Output file: `./data/res/filtered-combined.json`
- Gets all JSON files from the res folder (sorted)
- Validates folder exists and contains JSON files
- Initializes:
  - `all_filtered_data`: Empty list to accumulate all filtered events
  - `total_original_size`: Running total of input file sizes
- For each JSON file:
  - Opens and loads the JSON data
  - Tracks the original file size
  - Counts events in the file
  - Calls `process_data()` to filter the events
  - Extends the combined list with filtered events
  - Prints progress for the file
- After processing all files:
  - Writes the combined filtered data to output file with indentation
  - Calculates output file size
  - Computes size reduction (bytes and percentage)
  - Prints summary statistics

## Usage
```bash
python3 filter-script.py
```

## Customization
Edit the allowlists at the top of the file to control which fields are kept:
```python
EVENT_KEYS_TO_KEEP = ["id", "title", "description", ...]
MARKET_KEYS_TO_KEEP = ["id", "question", "outcomes", ...]
```

## Example Output
```
Found 7 JSON files to process: ['0.json', '1000.json', ...]

Reading data from '0.json'...
Processing 500 events from '0.json'...
Added 500 filtered events from '0.json'

[... processing continues ...]

--- Success! ---
Combined filtered data has been saved to './data/res/filtered-combined.json'.
Total events processed: 2712
Total original size: 65571.57 KB
New file size:      23874.94 KB
Size reduction:     41696.63 KB (63.59%)
```

## Input Requirements
- JSON files must be in `./data/res/` folder
- Each file must contain an array of event objects
- Events should have the standard Polymarket API structure

## Output
- Single combined file: `./data/res/filtered-combined.json`
- Contains all filtered events from all input files
- Formatted with 2-space indentation for readability
