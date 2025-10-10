import json
from collections import defaultdict
from datetime import datetime

# --- Configuration ---
# 1. SET YOUR INPUT AND OUTPUT FILE NAMES
INPUT_FILE_PATH = (
    "data/res/combined-and-filtered.json"  # <-- The large JSON file with 2712 events
)
OUTPUT_FILE_PATH = (
    "data/react_flow_data.json"  # <-- The final file to be used by the frontend
)

# 2. TUNE YOUR TAGS TO IGNORE
# These are tags that are too broad and would create a messy graph.
# Add or remove tags as you see fit.
IGNORE_TAGS = {
    "Business",
    "Politics",
    "2025 Predictions",
    "Science",
    "Technology",
    "Crypto",
    "World",
    "US Politics",
}
# --- End of Configuration ---


def create_react_flow_data(all_events: list[dict]) -> dict:
    """
    Processes a list of Polymarket event objects to generate nodes and edges
    for React Flow.
    """
    # Create a quick-access map of events by their ID for efficient lookups
    events_map = {event["id"]: event for event in all_events}

    # --- 1. Create the `nodes` list in the React Flow format ---
    print("Step 1: Creating nodes for each event...")
    nodes = [
        {
            "id": event["id"],
            "position": {"x": 0, "y": 0},  # The frontend will calculate the layout
            "data": {"label": event.get("title", "No Title")},
        }
        for event in all_events
    ]
    print(f" -> Created {len(nodes)} nodes.")

    # --- 2. Build an index of tags to event IDs ---
    print("\nStep 2: Building an index from tags to events...")
    tag_to_event_ids = defaultdict(list)

    for event in all_events:
        if isinstance(event.get("tags"), list):
            for tag in event["tags"]:
                tag_label = tag.get("label")
                if tag_label and tag_label not in IGNORE_TAGS:
                    tag_to_event_ids[tag_label].append(event["id"])
    print(f" -> Found {len(tag_to_event_ids)} relevant tags.")

    # --- 3. Generate `edges` based on shared tags and end dates ---
    print("\nStep 3: Generating edges based on shared tags and end dates...")
    edges = []
    added_edge_ids = set()  # To prevent creating duplicate edges

    for tag, event_ids in tag_to_event_ids.items():
        if len(event_ids) < 2:
            continue

        # Compare every event with every other event that shares the same tag
        for i in range(len(event_ids)):
            for j in range(len(event_ids)):
                if i == j:
                    continue

                source_id = event_ids[i]
                target_id = event_ids[j]

                source_event = events_map.get(source_id)
                target_event = events_map.get(target_id)

                if not all(
                    [
                        source_event,
                        target_event,
                        source_event.get("endDate"),
                        target_event.get("endDate"),
                    ]
                ):
                    continue

                try:
                    # Python's fromisoformat handles the 'Z' for UTC timezone correctly in 3.11+
                    # For older versions, a replace might be needed: .replace('Z', '+00:00')
                    source_end_date = datetime.fromisoformat(source_event["endDate"])
                    target_end_date = datetime.fromisoformat(target_event["endDate"])
                except (ValueError, TypeError):
                    continue  # Skip if date format is invalid

                # The core logic: an edge goes from the earlier event to the later event
                if source_end_date < target_end_date:
                    edge_id = f"e-{source_id}-{target_id}"
                    if edge_id not in added_edge_ids:
                        edges.append(
                            {"id": edge_id, "source": source_id, "target": target_id}
                        )
                        added_edge_ids.add(edge_id)

    print(f" -> Generated {len(edges)} edges.")
    return {"nodes": nodes, "edges": edges}


# This makes the script runnable from the command line
if __name__ == "__main__":
    print(f"Starting data processing...")
    print(f"Input file: '{INPUT_FILE_PATH}'")

    try:
        # Read the large JSON data file
        with open(INPUT_FILE_PATH, "r", encoding="utf-8") as f:
            events_data = json.load(f)

        if not isinstance(events_data, list):
            raise TypeError(
                "The root of the JSON data file should be a list of events."
            )

        # Process the data to get the React Flow format
        react_flow_output = create_react_flow_data(events_data)

        # Write the processed data to the output file
        with open(OUTPUT_FILE_PATH, "w", encoding="utf-8") as f:
            json.dump(react_flow_output, f, indent=2)

        print(f"\n✅ Success! Processed data has been saved to '{OUTPUT_FILE_PATH}'")

    except FileNotFoundError:
        print(
            f"❌ Error: Input file not found at '{INPUT_FILE_PATH}'. Please check the file name and path."
        )
    except json.JSONDecodeError:
        print(
            f"❌ Error: Could not decode JSON from '{INPUT_FILE_PATH}'. Please ensure it is a valid JSON file."
        )
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
