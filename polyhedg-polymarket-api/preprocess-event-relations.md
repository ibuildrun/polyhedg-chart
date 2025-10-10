# Polymarket Event Graph Pre-processor

This document describes a Python script designed to pre-process a JSON file containing event data from Polymarket. The script's primary goal is to identify potential relationships between these events and generate a structured JSON output file that is directly consumable by the [React Flow](https://reactflow.dev/) library for graph visualization.

This approach is optimized for a hackathon environment: it is fast, requires no external API calls, and produces a clean, ready-to-use asset for the frontend team.

## How It Works: The Core Logic

The script determines relationships between events using a simple but effective heuristic: **Shared Tags + Date Comparison**.

The underlying assumption is that if two separate events share a specific, non-generic tag (e.g., "NVIDIA" or "Fed Rates"), they are topically related. If one of these events is scheduled to end *before* the other, it can be reasonably inferred that the outcome of the earlier event might influence the outcome of the later one.

The process is broken down into three main steps:

1.  **Node Creation**: The script first iterates through every event in the input JSON file. For each event, it creates a `node` object in the format required by React Flow. Each node is given a unique `id` (from the event data) and a `label` (the event's title).

2.  **Tag Indexing & Filtering**: It then builds an index (a dictionary or map) where each key is a tag label and the value is a list of all event IDs that share that tag. To ensure the final graph is readable and meaningful, a predefined list of overly generic tags (like "Business", "Politics", "2025 Predictions") is used to filter out noise.

3.  **Edge Generation**: Finally, the script iterates through the tag index. For any tag associated with two or more events, it compares the `endDate` of every pair of events. If an event A ends before an event B, a directed **edge** is created from node A to node B. This process results in a directed acyclic graph (DAG) of potential influence.

The final output is a single JSON file containing two primary keys: `nodes` and `edges`, which can be directly passed to a React Flow component.

## How to Use the Script

Follow these steps to generate the graph data file for the frontend.

### Step 1: Prerequisites

-   Ensure you have **Python 3.8+** installed on your machine. No external libraries are needed.

### Step 2: Setup

1.  Save the script as `process_data.py`.
2.  Place your large Polymarket events JSON file in the same directory. For this example, let's assume your file is named `polymarket_events.json`.

Your folder structure should look like this:

```
/your-project-folder
|-- process_data.py
|-- polymarket_events.json
```

### Step 3: Configuration

Open the `process_data.py` script in an editor and configure the variables at the top of the file:

```python
# --- Configuration ---
# 1. SET YOUR INPUT AND OUTPUT FILE NAMES
INPUT_FILE_PATH = "polymarket_events.json"  # <-- Make sure this matches your data file name
OUTPUT_FILE_PATH = "react_flow_data.json"   # <-- This will be the generated file

# 2. TUNE YOUR TAGS TO IGNORE
# Add or remove tags here to improve the quality of the final graph.
IGNORE_TAGS = {
    "Business", "Politics", "2025 Predictions", "Science", "Technology",
    "Crypto", "World", "US Politics"
}
# --- End of Configuration ---
```

-   `INPUT_FILE_PATH`: Must exactly match the name of your source data file.
-   `OUTPUT_FILE_PATH`: The name of the file the script will create.
-   `IGNORE_TAGS`: This is the most important setting for tuning the graph's quality. If your final graph is too cluttered, add more generic tags to this set.

### Step 4: Run the Script

Open your terminal or command prompt, navigate to the project folder, and run the script:

```bash
python process_data.py
```

You will see output in the console tracking the progress:

```
Starting data processing...
Input file: 'polymarket_events.json'
Step 1: Creating nodes for each event...
 -> Created 2712 nodes.

Step 2: Building an index from tags to events...
 -> Found 853 relevant tags.

Step 3: Generating edges based on shared tags and end dates...
 -> Generated 5142 edges.

✅ Success! Processed data has been saved to 'react_flow_data.json'
```

### Step 5: Use the Output

A new file, `react_flow_data.json`, will now be in your directory. This file is the final product. It can be committed to your repository and used directly by the frontend application.

## For the Frontend Team

The generated `react_flow_data.json` file is a static asset ready for you to `fetch` or `import` into your React application.

-   **Data Structure**: The JSON file contains an object with two keys: `nodes` and `edges`. The format of the objects in these arrays matches the requirements of React Flow.
-   **Node Positioning**: All nodes are generated with a default position of `{ x: 0, y: 0 }`. **You must use a layouting library** (like [Dagre](https://github.com/dagrejs/dagre) or [ELK.js](https://www.eclipse.org/elk/)) on the frontend to automatically calculate the positions and arrange the nodes neatly. Manually positioning over 2000 nodes is not feasible.
-   **Example Usage**: The frontend can fetch this file and set the state for the `ReactFlow` component.
