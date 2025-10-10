import os
from typing import List, Dict, Any
from app.utils.file_utils import get_json_files, load_json_file, validate_json_list


def filter_events_by_tags(all_events_data: List[Dict], target_tags: List[str]) -> List[Dict]:
    """
    Filters a list of events, keeping only those that contain at least one of the target tags.

    Args:
        all_events_data: The list of event dictionaries to search through
        target_tags: A list of tag strings to match against

    Returns:
        A new list containing only the matching event dictionaries
    """
    # Using a set for target_tags provides a significant speed boost for lookups
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

        # The core logic: check for any intersection between the two sets of tags
        # .isdisjoint() returns True if they have NO elements in common
        # So, 'not .isdisjoint()' means they have AT LEAST ONE element in common
        if not event_tag_labels.isdisjoint(target_tags_set):
            matching_events.append(event)

    return matching_events


def filter_events_by_tags_from_folder(
    target_tags: List[str],
    input_folder: str = "./data/res"
) -> Dict[str, Any]:
    """
    Filters events by tags from all JSON files in the specified folder.

    Args:
        target_tags: A list of tag strings to match against
        input_folder: Path to folder containing JSON files

    Returns:
        Dictionary with matched events and statistics

    Raises:
        FileNotFoundError: If the folder doesn't exist
        ValueError: If no JSON files are found
    """
    # Exclude output files that aren't event data
    exclude_files = {'unique_tags.json', 'filtered-combined.json', 'filtered_by_tags.json'}
    json_files = get_json_files(input_folder, exclude_files)

    all_matched_events = []
    total_events_processed = 0
    files_processed = 0

    # Process each JSON file
    for json_file in json_files:
        try:
            data = load_json_file(json_file)
            validate_json_list(data, json_file)

            # Run the filtering logic on this file's data
            matched_events = filter_events_by_tags(data, target_tags)
            all_matched_events.extend(matched_events)
            total_events_processed += len(data)
            files_processed += 1

        except (ValueError, FileNotFoundError, Exception) as e:
            # Skip files that can't be processed
            continue

    return {
        "matched_events": all_matched_events,
        "total_events_processed": total_events_processed,
        "total_matched": len(all_matched_events),
        "files_processed": files_processed
    }
