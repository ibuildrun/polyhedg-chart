import json
import sys
import os
import glob


def count_events_in_file(filename):
    """
    Opens a JSON file, counts the number of items in the top-level list,
    and returns the count.

    Args:
        filename (str): The path to the JSON file.

    Returns:
        int: The number of events, or None if an error occurred.
    """
    try:
        with open(filename, "r", encoding="utf-8") as f:
            # We don't need to store the data, just count it.
            # Loading it into memory is the simplest way for most files.
            data = json.load(f)

        # The JSON files we've created are a list of event objects.
        # The number of events is the length of this list.
        if isinstance(data, list):
            return len(data)
        else:
            # This handles the edge case where the JSON is valid but not a list
            print(f"Error: The data in '{filename}' is not a list of events.")
            return None

    except FileNotFoundError:
        print(f"Error: The file '{filename}' was not found.")
        return None
    except json.JSONDecodeError:
        print(
            f"Error: The file '{filename}' could not be parsed. It may not be valid JSON."
        )
        return None


def main():
    """
    Counts events from all JSON files in the data/res folder.
    """
    # Define the res folder path
    res_folder = "./data/res"

    # Check if the res folder exists
    if not os.path.exists(res_folder):
        print(f"Error: The folder '{res_folder}' does not exist.")
        return

    # Get all JSON files in the res folder
    json_files = glob.glob(os.path.join(res_folder, "*.json"))

    if not json_files:
        print(f"No JSON files found in '{res_folder}'.")
        return

    # Sort files by name for consistent output
    json_files.sort()

    print(f"Counting events from all JSON files in '{res_folder}'...\n")

    total_events = 0
    successful_files = 0

    # Process each JSON file
    for json_file in json_files:
        filename = os.path.basename(json_file)
        event_count = count_events_in_file(json_file)

        if event_count is not None:
            print(f"{filename}: {event_count} events")
            total_events += event_count
            successful_files += 1

    # Print summary
    print("\n--- Summary ---")
    print(f"Total files processed: {successful_files}/{len(json_files)}")
    print(f"Total events across all files: {total_events}")


if __name__ == "__main__":
    main()
