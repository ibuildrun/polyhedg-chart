
import requests
import json

# This script tests the full order lifecycle using Python.
# It places one live order and then immediately cancels it.

# --- Configuration ---
# IMPORTANT: Change these values before running.

# 1. The domain of your running API server.
API_BASE_URL = 'http://127.0.0.1:8000' # Use this if running on the same machine

# 2. A valid Token ID from Polymarket for the market you want to test.
TEST_TOKEN_ID = '<A_REAL_TOKEN_ID>'


# --- Main Test Function ---

def run_place_and_cancel_test():
    """Runs the full place-and-cancel test sequence."""

    if TEST_TOKEN_ID == '<A_REAL_TOKEN_ID>':
        print('❌ Please update the TEST_TOKEN_ID variable in this script before running.')
        return

    print('--- Step 1: Placing a single live order... ---')

    place_order_payload = {
        "orders": [
            {
                "token_id": TEST_TOKEN_ID,
                "price": 0.98, # High price = low collateral
                "size": 0.10   # Small size = low collateral
            }
        ],
        "dry_run": False
    }

    order_id_to_cancel = None

    # --- Place the Order ---
    try:
        place_response = requests.post(f"{API_BASE_URL}/place-batch-orders", json=place_order_payload)
        place_response.raise_for_status()  # Raises an exception for bad status codes (4xx or 5xx)

        place_result = place_response.json()
        
        if place_result.get("batch_results", [])[0].get("status") != 'live_run_success':
            print('❌ Failed to place order. Server response:')
            print(json.dumps(place_result, indent=2))
            return

        # Extract the orderId from the successful response
        order_id_to_cancel = place_result["batch_results"][0]["polymarket_response"]["orderId"]
        print(f"✅ Successfully placed order. Order ID: {order_id_to_cancel}")

    except requests.exceptions.RequestException as e:
        print(f'❌ An error occurred during order placement: {e}')
        return

    # --- Cancel the Order ---
    if order_id_to_cancel:
        print('\n--- Step 2: Canceling the order... ---')

        cancel_payload = {
            "order_id": order_id_to_cancel
        }

        try:
            cancel_response = requests.post(f"{API_BASE_URL}/cancel-order", json=cancel_payload)
            cancel_response.raise_for_status()

            cancel_result = cancel_response.json()
            
            print('✅ Successfully sent cancellation request.')
            print('Server Response:', json.dumps(cancel_result, indent=2))
            print('\n🎉 Test complete! The full order lifecycle works.')

        except requests.exceptions.RequestException as e:
            print(f'❌ An error occurred during order cancellation: {e}')


# --- Run the Test ---
if __name__ == "__main__":
    run_place_and_cancel_test()
