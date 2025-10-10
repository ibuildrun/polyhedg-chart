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


def filter_events_by_tags_from_file(
    target_tags: List[str],
    input_file: str = "./data/res/combined-and-filtered.json"
) -> Dict[str, Any]:
    """
    Filters events by tags from a single JSON file.
    Optimized for the combined-and-filtered.json file.

    Args:
        target_tags: A list of tag strings to match against
        input_file: Path to JSON file containing events

    Returns:
        Dictionary with matched events and statistics

    Raises:
        FileNotFoundError: If the file doesn't exist
    """
    # Convert target tags to set for fast lookup
    target_tags_set = set(target_tags)
    
    matched_events_dict = {}  # Use dict to deduplicate: {event_id: event}
    total_events_processed = 0

    try:
        data = load_json_file(input_file)
        
        if not isinstance(data, list):
            raise ValueError(f"Expected a list in {input_file}")

        # Single pass through all events
        for event in data:
            total_events_processed += 1
            
            # Get event tags
            event_tags_list = event.get("tags", [])
            if not isinstance(event_tags_list, list):
                continue
            
            # Extract tag labels
            event_tag_labels = {
                tag.get("label")
                for tag in event_tags_list
                if isinstance(tag, dict) and tag.get("label")
            }
            
            # Check if event matches any target tag
            if not event_tag_labels.isdisjoint(target_tags_set):
                # Get unique identifier
                event_id = event.get("id") or event.get("slug") or event.get("title")
                if event_id and event_id not in matched_events_dict:
                    matched_events_dict[event_id] = event
                elif not event_id:
                    # No ID, use a generated key to avoid overwriting
                    fallback_key = f"no_id_{total_events_processed}"
                    matched_events_dict[fallback_key] = event

    except (ValueError, FileNotFoundError, Exception) as e:
        raise

    # Convert dict back to list
    all_matched_events = list(matched_events_dict.values())

    return {
        "matched_events": all_matched_events,
        "total_events_processed": total_events_processed,
        "total_matched": len(all_matched_events)
    }


def filter_events_by_tags_from_folder(
    target_tags: List[str],
    input_folder: str = "./data/res"
) -> Dict[str, Any]:
    """
    Filters events by tags from all JSON files in the specified folder.
    Scans once and deduplicates on-the-fly.

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

    # Convert target tags to set for fast lookup
    target_tags_set = set(target_tags)
    
    matched_events_dict = {}  # Use dict to deduplicate: {event_id: event}
    total_events_processed = 0
    files_processed = 0

    # Single pass through all files
    for json_file in json_files:
        try:
            data = load_json_file(json_file)
            validate_json_list(data, json_file)

            # Process each event once
            for event in data:
                total_events_processed += 1
                
                # Get event tags
                event_tags_list = event.get("tags", [])
                if not isinstance(event_tags_list, list):
                    continue
                
                # Extract tag labels
                event_tag_labels = {
                    tag.get("label")
                    for tag in event_tags_list
                    if isinstance(tag, dict) and tag.get("label")
                }
                
                # Check if event matches any target tag
                if not event_tag_labels.isdisjoint(target_tags_set):
                    # Get unique identifier
                    event_id = event.get("id") or event.get("slug") or event.get("title")
                    if event_id and event_id not in matched_events_dict:
                        matched_events_dict[event_id] = event
                    elif not event_id:
                        # No ID, use a generated key to avoid overwriting
                        fallback_key = f"no_id_{total_events_processed}"
                        matched_events_dict[fallback_key] = event
            
            files_processed += 1

        except (ValueError, FileNotFoundError, Exception) as e:
            # Skip files that can't be processed
            continue

    # Convert dict back to list
    all_matched_events = list(matched_events_dict.values())

    return {
        "matched_events": all_matched_events,
        "total_events_processed": total_events_processed,
        "total_matched": len(all_matched_events),
        "files_processed": files_processed
    }
