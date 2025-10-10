#!/usr/bin/env python3
"""
Test script for Polymarket API
Make sure the server is running: uvicorn app.main:app --reload
"""

import requests
import json
from typing import Dict, Any

API_URL = "http://127.0.0.1:8000"


def print_test_header(test_num: int, description: str):
    """Print formatted test header"""
    print(f"\n{'='*60}")
    print(f"{test_num}. {description}")
    print('='*60)


def print_response(response: requests.Response, limit_results: bool = False):
    """Print formatted response"""
    print(f"Status Code: {response.status_code}")
    try:
        data = response.json()
        if limit_results and 'matched_events' in data and len(data['matched_events']) > 2:
            # Limit matched_events to first 2 for readability
            data_copy = data.copy()
            data_copy['matched_events'] = data['matched_events'][:2]
            data_copy['matched_events_shown'] = 2
            data_copy['matched_events_total'] = len(data['matched_events'])
            print(json.dumps(data_copy, indent=2))
        else:
            print(json.dumps(data, indent=2))
    except json.JSONDecodeError:
        print(response.text)
    print()


def test_health_check():
    """Test 1: Health Check"""
    print_test_header(1, "Health Check (GET /)")
    response = requests.get(f"{API_URL}/")
    print_response(response)


def test_count_events_default():
    """Test 2: Count Events - Default Folder"""
    print_test_header(2, "Count Events - Default Folder (GET /events/count)")
    response = requests.get(f"{API_URL}/events/count")
    print_response(response)


def test_count_events_custom():
    """Test 3: Count Events - Custom Folder"""
    print_test_header(3, "Count Events - Custom Folder (GET /events/count)")
    response = requests.get(
        f"{API_URL}/events/count",
        params={"folder_path": "./data/res"}
    )
    print_response(response)


def test_filter_by_tags_business_fed():
    """Test 4: Filter by Tags - Business & Fed"""
    print_test_header(4, "Filter by Tags - Business & Fed (POST /events/filter-by-tags)")
    response = requests.post(
        f"{API_URL}/events/filter-by-tags",
        json={"target_tags": ["Business", "Fed"]}
    )
    print_response(response, limit_results=True)


def test_filter_by_tags_economic_policy():
    """Test 5: Filter by Tags - Economic Policy"""
    print_test_header(5, "Filter by Tags - Economic Policy (POST /events/filter-by-tags)")
    response = requests.post(
        f"{API_URL}/events/filter-by-tags",
        json={
            "target_tags": ["Economic Policy"],
            "input_folder": "./data/res"
        }
    )
    # Print summary only
    if response.status_code == 200:
        data = response.json()
        summary = {
            "total_events_processed": data["total_events_processed"],
            "total_matched": data["total_matched"],
            "files_processed": data["files_processed"]
        }
        print(f"Status Code: {response.status_code}")
        print(json.dumps(summary, indent=2))
        print()
    else:
        print_response(response)


def test_filter_by_multiple_tags():
    """Test 6: Filter by Multiple Tags"""
    print_test_header(6, "Filter by Multiple Tags (POST /events/filter-by-tags)")
    response = requests.post(
        f"{API_URL}/events/filter-by-tags",
        json={"target_tags": ["Business", "Fed", "Economic Policy", "Politics"]}
    )
    # Print summary only
    if response.status_code == 200:
        data = response.json()
        summary = {
            "total_events_processed": data["total_events_processed"],
            "total_matched": data["total_matched"],
            "files_processed": data["files_processed"]
        }
        print(f"Status Code: {response.status_code}")
        print(json.dumps(summary, indent=2))
        print()
    else:
        print_response(response)


def test_error_empty_tags():
    """Test 7: Error Case - Empty Tags"""
    print_test_header(7, "Error Case - Empty Tags (POST /events/filter-by-tags)")
    response = requests.post(
        f"{API_URL}/events/filter-by-tags",
        json={"target_tags": []}
    )
    print_response(response)


def test_error_invalid_folder():
    """Test 8: Error Case - Invalid Folder"""
    print_test_header(8, "Error Case - Invalid Folder (GET /events/count)")
    response = requests.get(
        f"{API_URL}/events/count",
        params={"folder_path": "./invalid/path"}
    )
    print_response(response)


def main():
    """Run all tests"""
    print("="*60)
    print("Testing Polymarket API")
    print("="*60)

    try:
        # Test server connectivity
        response = requests.get(f"{API_URL}/", timeout=5)
        if response.status_code != 200:
            print(f"Warning: Server responded with status code {response.status_code}")
    except requests.exceptions.ConnectionError:
        print(f"\nError: Cannot connect to {API_URL}")
        print("Make sure the server is running: uvicorn app.main:app --reload")
        return
    except requests.exceptions.Timeout:
        print(f"\nError: Connection to {API_URL} timed out")
        return

    # Run all tests
    test_health_check()
    test_count_events_default()
    test_count_events_custom()
    test_filter_by_tags_business_fed()
    test_filter_by_tags_economic_policy()
    test_filter_by_multiple_tags()
    test_error_empty_tags()
    test_error_invalid_folder()

    print("="*60)
    print("Testing Complete")
    print("="*60)


if __name__ == "__main__":
    main()
