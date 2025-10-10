import json


def extract_unique_tags(input_filename="./data/get-events-100k-filtered.json"):
    """
    Parses a JSON file of event data to extract a unique, sorted list of tag labels.

    Args:
        input_filename (str): The name of the JSON file to read.

    Returns:
        list: A sorted list of unique tag strings, or None if an error occurs.
    """
    try:
        with open(input_filename, "r", encoding="utf-8") as f:
            print(f"Reading data from '{input_filename}'...")
            data = json.load(f)
    except FileNotFoundError:
        print(f"Error: Input file '{input_filename}' not found.")
        print(
            "Please make sure you have run the previous filtering script or provide the correct filename."
        )
        return None
    except json.JSONDecodeError:
        print(
            f"Error: Could not decode JSON from '{input_filename}'. The file may be corrupt."
        )
        return None

    # A set is used to automatically store only unique values
    unique_tags_set = set()

    # The data is a list of event dictionaries
    for event in data:
        # We use .get() to safely access the 'tags' key, defaulting to an empty list
        # This prevents errors if an event has no tags.
        tags_list = event.get("tags", [])
        if isinstance(tags_list, list):
            for tag_object in tags_list:
                # Check if the tag is a dictionary and has a 'label' key
                if isinstance(tag_object, dict) and "label" in tag_object:
                    unique_tags_set.add(tag_object["label"])

    # Convert the set to a list and sort it alphabetically
    sorted_unique_tags = sorted(list(unique_tags_set))

    return sorted_unique_tags


def main():
    """
    Main function to run the extraction and save the results.
    """
    output_filename = "./data/unique_tags.json"

    unique_tags = extract_unique_tags()

    if unique_tags is not None:
        print("\n--- Extraction Complete ---")
        print(f"Found {len(unique_tags)} unique tags.")

        # Print the tags to the console for a quick look
        print("\nList of Unique Tags:")
        for tag in unique_tags:
            print(f"- {tag}")

        # Save the list to the output file
        with open(output_filename, "w", encoding="utf-8") as f:
            json.dump(unique_tags, f, indent=2)

        print(f"\nSuccessfully saved the unique tags to '{output_filename}'.")


if __name__ == "__main__":
    main()
