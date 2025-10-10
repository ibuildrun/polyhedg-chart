import json
import os

# --- CUSTOMIZE YOUR FILTERING HERE ---

# Define the keys you want to keep for the main (top-level) event object.
# These are fields that describe the event group as a whole.
EVENT_KEYS_TO_KEEP = [
    "id",
    "ticker",
    "slug",
    "title",
    "description",
    "startDate",
    "endDate",
    "image",
    "icon",
    "active",
    "closed",
    "liquidity",
    "volume",
    "volume24hr",
    "volume1wk",
    "commentCount",
    "tags",
    "markets",  # We need to keep 'markets' to process the nested data
]

# Define the keys you want to keep for the nested market objects inside the 'markets' array.
# These are fields for the individual betting markets.
MARKET_KEYS_TO_KEEP = [
    "id",
    "question",
    "slug",
    "endDate",
    "liquidity",
    "description",
    "outcomes",
    "outcomePrices",
    "volume",
    "active",
    "closed",
    "groupItemTitle",  # Useful for markets that are part of a group (e.g., "0", "1", "7 (175 bps)")
    "lastTradePrice",
    "bestBid",
    "bestAsk",
    "spread",
]

# --- SCRIPT LOGIC ---


def filter_nested_markets(market_list):
    """Processes the list of nested markets within an event."""
    if not isinstance(market_list, list):
        return []

    clean_markets = []
    for market_data in market_list:
        clean_market = {key: market_data.get(key) for key in MARKET_KEYS_TO_KEEP}
        clean_markets.append(clean_market)
    return clean_markets


def process_data(data):
    """
    Filters the main list of events and their nested markets based on the allow lists.
    """
    if not isinstance(data, list):
        print("Error: Input data is not a list. Aborting.")
        return None

    filtered_data = []
    for event_data in data:
        # Create a new dictionary for the clean event
        clean_event = {key: event_data.get(key) for key in EVENT_KEYS_TO_KEEP}

        # Process the nested 'markets' array if it exists
        if "markets" in clean_event and clean_event["markets"]:
            clean_event["markets"] = filter_nested_markets(clean_event["markets"])

        filtered_data.append(clean_event)

    return filtered_data


def main():
    """
    Main function to load, process, and save the data from multiple files.
    """
    input_folder = "./data/res"
    output_filename = "./data/res/filtered-combined.json"

    # Get all JSON files from the res folder
    try:
        json_files = sorted([f for f in os.listdir(input_folder) if f.endswith('.json')])
        if not json_files:
            print(f"Error: No JSON files found in '{input_folder}'.")
            return
    except FileNotFoundError:
        print(f"Error: Folder '{input_folder}' not found.")
        return

    print(f"Found {len(json_files)} JSON files to process: {json_files}")

    all_filtered_data = []
    total_original_size = 0

    # Process each JSON file
    for json_file in json_files:
        input_filepath = os.path.join(input_folder, json_file)

        try:
            with open(input_filepath, "r", encoding="utf-8") as f:
                print(f"\nReading data from '{json_file}'...")
                original_data = json.load(f)
                file_size = os.path.getsize(input_filepath)
                total_original_size += file_size

                # Process and filter data
                print(f"Processing {len(original_data) if isinstance(original_data, list) else 1} events from '{json_file}'...")
                filtered_data = process_data(original_data)

                if filtered_data is not None:
                    all_filtered_data.extend(filtered_data)
                    print(f"Added {len(filtered_data)} filtered events from '{json_file}'")

        except FileNotFoundError:
            print(f"Warning: '{json_file}' not found. Skipping.")
            continue
        except json.JSONDecodeError:
            print(f"Warning: Could not decode JSON from '{json_file}'. Skipping.")
            continue

    # Write combined output
    if all_filtered_data:
        with open(output_filename, "w", encoding="utf-8") as f:
            json.dump(all_filtered_data, f, indent=2)

        output_size = os.path.getsize(output_filename)
        size_reduction = total_original_size - output_size
        reduction_percent = (
            (size_reduction / total_original_size) * 100 if total_original_size > 0 else 0
        )

        print("\n--- Success! ---")
        print(f"Combined filtered data has been saved to '{output_filename}'.")
        print(f"Total events processed: {len(all_filtered_data)}")
        print(f"Total original size: {total_original_size / 1024:.2f} KB")
        print(f"New file size:      {output_size / 1024:.2f} KB")
        print(
            f"Size reduction:     {size_reduction / 1024:.2f} KB ({reduction_percent:.2f}%)"
        )
    else:
        print("\nNo data was processed successfully.")


if __name__ == "__main__":
    main()
