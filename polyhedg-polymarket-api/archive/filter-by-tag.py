import json
import os

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
    Main function to load data from multiple files, run the filter, and save the results.
    """
    input_folder = "./data/res"
    output_filename = "./data/res/filtered_by_tags.json"

    # Get all JSON files from the res folder, excluding output files
    try:
        # Exclude output files that aren't event data
        exclude_files = {'unique_tags.json', 'filtered-combined.json', 'filtered_by_tags.json'}
        json_files = sorted([
            f for f in os.listdir(input_folder)
            if f.endswith('.json') and f not in exclude_files
        ])
        if not json_files:
            print(f"Error: No JSON files found in '{input_folder}'.")
            return
    except FileNotFoundError:
        print(f"Error: Folder '{input_folder}' not found.")
        return

    print(f"Found {len(json_files)} JSON files to process: {json_files}")
    print(
        f"Filtering for events with any of the following tags: {', '.join(TARGET_TAGS)}\n"
    )

    all_matched_events = []
    total_events_processed = 0

    # Process each JSON file
    for json_file in json_files:
        input_filepath = os.path.join(input_folder, json_file)

        try:
            with open(input_filepath, "r", encoding="utf-8") as f:
                print(f"Reading data from '{json_file}'...")
                data = json.load(f)

                if not isinstance(data, list):
                    print(f"Warning: Data in '{json_file}' is not a list. Skipping.")
                    continue

                # Run the filtering logic on this file's data
                matched_events = filter_events_by_tags(data, TARGET_TAGS)
                all_matched_events.extend(matched_events)
                total_events_processed += len(data)

                print(f"Found {len(matched_events)} matching events from {len(data)} events in '{json_file}'")

        except FileNotFoundError:
            print(f"Warning: '{json_file}' not found. Skipping.")
            continue
        except json.JSONDecodeError:
            print(f"Warning: Could not decode JSON from '{json_file}'. Skipping.")
            continue

    # Save the combined filtered data to a new file
    if all_matched_events:
        with open(output_filename, "w", encoding="utf-8") as f:
            json.dump(all_matched_events, f, indent=2)

        print(f"\n--- Success! ---")
        print(f"Processed {total_events_processed} total events across {len(json_files)} files")
        print(f"Found {len(all_matched_events)} events matching the specified tags.")
        print(f"The filtered events have been saved to '{output_filename}'.")
    else:
        print(f"\nNo events matched the specified tags.")


if __name__ == "__main__":
    main()
