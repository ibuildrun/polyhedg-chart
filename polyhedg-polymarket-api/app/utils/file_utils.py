import json
import os
import glob
from typing import List, Optional, Any


def get_json_files(folder_path: str, exclude_files: Optional[set] = None) -> List[str]:
    """
    Get all JSON files from the specified folder, optionally excluding certain files.

    Args:
        folder_path: Path to the folder containing JSON files
        exclude_files: Set of filenames to exclude

    Returns:
        Sorted list of JSON file paths

    Raises:
        FileNotFoundError: If the folder doesn't exist
        ValueError: If no JSON files are found
    """
    if not os.path.exists(folder_path):
        raise FileNotFoundError(f"Folder '{folder_path}' does not exist")

    if exclude_files is None:
        exclude_files = set()

    json_files = glob.glob(os.path.join(folder_path, "*.json"))

    # Filter out excluded files
    json_files = [
        f for f in json_files
        if os.path.basename(f) not in exclude_files
    ]

    if not json_files:
        raise ValueError(f"No JSON files found in '{folder_path}'")

    return sorted(json_files)


def load_json_file(file_path: str) -> Any:
    """
    Load and parse a JSON file.

    Args:
        file_path: Path to the JSON file

    Returns:
        Parsed JSON data

    Raises:
        FileNotFoundError: If the file doesn't exist
        json.JSONDecodeError: If the file is not valid JSON
    """
    with open(file_path, "r", encoding="utf-8") as f:
        return json.load(f)


def validate_json_list(data: Any, file_path: str) -> List[Any]:
    """
    Validate that the data is a list.

    Args:
        data: Data to validate
        file_path: Path to the file (for error messages)

    Returns:
        The data if it's a list

    Raises:
        ValueError: If the data is not a list
    """
    if not isinstance(data, list):
        raise ValueError(f"Data in '{file_path}' is not a list")
    return data
