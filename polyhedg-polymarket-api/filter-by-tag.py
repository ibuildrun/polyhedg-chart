import json

# --- CONFIGURATION ---
#  EDIT THIS LIST to include the tags you want to filter for.
#  The script will find any event that has AT LEAST ONE of these tags.
#  Tags are case-sensitive.
TARGET_TAGS = ["Business", "Fed", "Economic Policy"]

# --- SCRIPT LOGIC ---


def filter_events_by_tags(all_events_data, target_tags):
    """
    Filters a list of events, keeping only those that contain at least one of the target tags.

    Args:
        all_events_data (list): The list of event dictionaries to search through.
        target_tags (list): A list of tag strings to match against.

    Returns:
        list: A new list containing only the matching event dictionaries.
    """
    # Using a set for target_tags provides a significant speed boost for lookups.
    target_tags_set = set(target_tags)
    matching_events = []

    for event in all_events_data:
        # Safely get the list of tags for the current event
        event_tags_list = event.get("tags", [])

        if not isinstance(event_tags_list, list):
            continue  # Skip if 'tags' isn't a list for some reason

        # Extract just the string labels from the list of tag dictionaries
        event_tag_labels = {
            tag.get("label")
            for tag in event_tags_list
            if isinstance(tag, dict) and tag.get("label")
        }

        # The core logic: check for any intersection between the two sets of tags.
        # .isdisjoint() returns True if they have NO elements in common.
        # So, 'not .isdisjoint()' means they have AT LEAST ONE element in common.
        if not event_tag_labels.isdisjoint(target_tags_set):
            matching_events.append(event)

    return matching_events


def main():
    """
    Main function to load data, run the filter, and save the results.
    """
    input_filename = "data/get-events-100k-filtered.json"
    output_filename = "data/filtered_by_tags.json"

    try:
        with open(input_filename, "r", encoding="utf-8") as f:
            print(f"Reading data from '{input_filename}'...")
            all_data = json.load(f)
    except FileNotFoundError:
        print(
            f"Error: '{input_filename}' not found. Please ensure it's in the same directory."
        )
        return
    except json.JSONDecodeError:
        print(f"Error: Could not decode JSON from '{input_filename}'.")
        return

    print(
        f"Filtering for events with any of the following tags: {', '.join(TARGET_TAGS)}"
    )

    # Run the filtering logic
    matched_events = filter_events_by_tags(all_data, TARGET_TAGS)

    print(f"\n--- Success! ---")
    print(f"Found {len(matched_events)} events matching the specified tags.")

    # Save the filtered data to a new file
    with open(output_filename, "w", encoding="utf-8") as f:
        json.dump(matched_events, f, indent=2)

    print(f"The filtered events have been saved to '{output_filename}'.")


if __name__ == "__main__":
    main()
