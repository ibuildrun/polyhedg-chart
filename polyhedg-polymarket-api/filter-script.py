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
    Main function to load, process, and save the data.
    """
    input_filename = "./data/get-events-100k.json"
    output_filename = "./data/get-events-100k-filtered.json"

    try:
        with open(input_filename, "r", encoding="utf-8") as f:
            print(f"Reading data from '{input_filename}'...")
            original_data = json.load(f)
            original_size = os.path.getsize(input_filename)
    except FileNotFoundError:
        print(
            f"Error: '{input_filename}' not found. Please save your API response in this file."
        )
        return
    except json.JSONDecodeError:
        print(
            f"Error: Could not decode JSON from '{input_filename}'. The file may be corrupt."
        )
        return

    print("Processing and filtering data...")
    filtered_data = process_data(original_data)

    if filtered_data is not None:
        with open(output_filename, "w", encoding="utf-8") as f:
            json.dump(filtered_data, f, indent=2)

        output_size = os.path.getsize(output_filename)
        size_reduction = original_size - output_size
        reduction_percent = (
            (size_reduction / original_size) * 100 if original_size > 0 else 0
        )

        print("\n--- Success! ---")
        print(f"Filtered data has been saved to '{output_filename}'.")
        print(f"Original file size: {original_size / 1024:.2f} KB")
        print(f"New file size:      {output_size / 1024:.2f} KB")
        print(
            f"Size reduction:     {size_reduction / 1024:.2f} KB ({reduction_percent:.2f}%)"
        )


if __name__ == "__main__":
    main()
