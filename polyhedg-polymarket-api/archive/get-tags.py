import json
import os


def extract_tags_from_events(events_data):
    """
    Extracts unique tag labels from a list of event dictionaries.

    Args:
        events_data (list): A list of event dictionaries.

    Returns:
        set: A set of unique tag strings.
    """
    unique_tags_set = set()

    # The data is a list of event dictionaries
    for event in events_data:
        # We use .get() to safely access the 'tags' key, defaulting to an empty list
        # This prevents errors if an event has no tags.
        tags_list = event.get("tags", [])
        if isinstance(tags_list, list):
            for tag_object in tags_list:
                # Check if the tag is a dictionary and has a 'label' key
                if isinstance(tag_object, dict) and "label" in tag_object:
                    unique_tags_set.add(tag_object["label"])

    return unique_tags_set


def main():
    """
    Main function to extract unique tags from all JSON files in the res folder.
    """
    input_folder = "./data/res"
    output_filename = "./data/res/unique_tags.json"

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

    # A set is used to automatically store only unique values across all files
    all_unique_tags = set()
    total_events = 0

    # Process each JSON file
    for json_file in json_files:
        input_filepath = os.path.join(input_folder, json_file)

        try:
            with open(input_filepath, "r", encoding="utf-8") as f:
                print(f"\nReading data from '{json_file}'...")
                data = json.load(f)

                if not isinstance(data, list):
                    print(f"Warning: Data in '{json_file}' is not a list. Skipping.")
                    continue

                # Extract tags from this file
                file_tags = extract_tags_from_events(data)
                all_unique_tags.update(file_tags)
                total_events += len(data)

                print(f"Processed {len(data)} events, found {len(file_tags)} unique tags in this file")

        except FileNotFoundError:
            print(f"Warning: '{json_file}' not found. Skipping.")
            continue
        except json.JSONDecodeError:
            print(f"Warning: Could not decode JSON from '{json_file}'. Skipping.")
            continue

    # Convert the set to a sorted list
    sorted_unique_tags = sorted(list(all_unique_tags))

    if sorted_unique_tags:
        print("\n--- Extraction Complete ---")
        print(f"Processed {total_events} total events across {len(json_files)} files")
        print(f"Found {len(sorted_unique_tags)} unique tags across all files.")

        # Print the tags to the console for a quick look
        print("\nList of Unique Tags:")
        for tag in sorted_unique_tags:
            print(f"- {tag}")

        # Save the list to the output file
        with open(output_filename, "w", encoding="utf-8") as f:
            json.dump(sorted_unique_tags, f, indent=2)

        print(f"\nSuccessfully saved the unique tags to '{output_filename}'.")
    else:
        print("\nNo tags were found in any of the files.")


if __name__ == "__main__":
    main()
