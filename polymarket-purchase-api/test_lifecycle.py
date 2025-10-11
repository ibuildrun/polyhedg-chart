import requests
import json

# This script is pre-configured to test the full order lifecycle on the
# "Fed rate hike in 2025?" market.
# It will place one live order and then immediately cancel it.

# --- Configuration ---

# The domain of your running API server.
API_BASE_URL = 'http://127.0.0.1:8000' # Use this if running on the same machine

# This is the "Yes" token ID for the "Fed rate hike in 2025?" market.
# We will place a SELL order on this token to bet "No".
TEST_TOKEN_ID = '60487116984468020978247225474488676749601001829886755968952521846780452448915'


# --- Main Test Function ---

def run_place_and_cancel_test():
    """Runs the full place-and-cancel test sequence."""

    print(f'--- Step 1: Placing a single live order for token {TEST_TOKEN_ID[:15]}... ---')

    place_order_payload = {
        "orders": [
            {
                "token_id": TEST_TOKEN_ID,
                # The current "bestAsk" is ~0.027. We set our price higher (0.10)
                # to ensure the order does NOT get filled immediately.
                "price": 0.10,
                "size": 0.10   # A small 10-cent order
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