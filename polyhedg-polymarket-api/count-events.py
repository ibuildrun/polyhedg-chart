import json
import sys


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
    Handles command-line arguments to determine which file to count.
    """
    # Check if a filename was provided as a command-line argument
    if len(sys.argv) > 1:
        # Use the filename provided by the user (e.g., python count_events.py my_file.json)
        input_filename = sys.argv[1]
    else:
        # If no filename is provided, use a default and inform the user.
        input_filename = "./data/get-events-100k-500.json"
        print(f"No filename provided. Using default: '{input_filename}'")
        print(
            "Tip: You can specify any file, like: python count_events.py api_response.json\n"
        )

    event_count = count_events_in_file(input_filename)

    # If the function ran successfully (didn't return None), print the result.
    if event_count is not None:
        print("\n--- Result ---")
        print(f"The file '{input_filename}' contains {event_count} events.")


if __name__ == "__main__":
    main()
