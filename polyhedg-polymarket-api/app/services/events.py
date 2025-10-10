import os
from typing import List, Dict
from app.utils.file_utils import get_json_files, load_json_file, validate_json_list


def count_events_in_file(file_path: str) -> int:
    """
    Opens a JSON file, counts the number of items in the top-level list,
    and returns the count.

    Args:
        file_path: The path to the JSON file

    Returns:
        The number of events

    Raises:
        ValueError: If the data is not a list
        FileNotFoundError: If the file doesn't exist
        json.JSONDecodeError: If the file is not valid JSON
    """
    data = load_json_file(file_path)
    validate_json_list(data, file_path)
    return len(data)


def count_events_in_folder(folder_path: str = "./data/res") -> Dict:
    """
    Counts events from all JSON files in the specified folder.

    Args:
        folder_path: Path to folder containing JSON files

    Returns:
        Dictionary with file counts and totals

    Raises:
        FileNotFoundError: If the folder doesn't exist
        ValueError: If no JSON files are found
    """
    json_files = get_json_files(folder_path)

    file_counts = []
    total_events = 0
    successful_files = 0

    for json_file in json_files:
        filename = os.path.basename(json_file)
        try:
            event_count = count_events_in_file(json_file)
            file_counts.append({
                "filename": filename,
                "event_count": event_count
            })
            total_events += event_count
            successful_files += 1
        except (ValueError, FileNotFoundError, Exception) as e:
            # Skip files that can't be processed
            continue

    return {
        "files": file_counts,
        "total_files_processed": successful_files,
        "total_files_found": len(json_files),
        "total_events": total_events
    }
