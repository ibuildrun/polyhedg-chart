

// This script tests the full order lifecycle: it places one live order and then immediately cancels it.
// To run this script, you need Node.js installed.
// Run from your terminal: node test_order_lifecycle.js

// --- Configuration ---
// IMPORTANT: Change these values before running.

// 1. The domain of your running API server.
const API_BASE_URL = 'http://127.0.0.1:8000'; // Use http://127.0.0.1:8000 if running on the same machine

// 2. A valid Token ID from Polymarket for the market you want to test.
const TEST_TOKEN_ID = '<A_REAL_TOKEN_ID>';

// --- Main Test Function ---

async function runPlaceAndCancelTest() {

    if (TEST_TOKEN_ID === '<A_REAL_TOKEN_ID>') {
        console.error('❌ Please update the TEST_TOKEN_ID variable in this script before running.');
        return;
    }

    console.log('--- Step 1: Placing a single live order... ---');

    const placeOrderPayload = {
        orders: [
            {
                token_id: TEST_TOKEN_ID,
                price: 0.98, // High price = low collateral
                size: 0.10   // Small size = low collateral
            }
        ],
        dry_run: false
    };

    let orderIdToCancel = null;

    // --- Place the Order ---
    try {
        const placeResponse = await fetch(`${API_BASE_URL}/place-batch-orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(placeOrderPayload),
        });

        const placeResult = await placeResponse.json();

        if (!placeResponse.ok || placeResult.batch_results[0].status !== 'live_run_success') {
            console.error('❌ Failed to place order. Server response:');
            console.error(JSON.stringify(placeResult, null, 2));
            return; // Stop the test if placement fails
        }

        // Extract the orderId from the successful response
        orderIdToCancel = placeResult.batch_results[0].polymarket_response.orderId;
        console.log(`✅ Successfully placed order. Order ID: ${orderIdToCancel}`);

    } catch (error) {
        console.error('❌ An error occurred during order placement:', error.message);
        return;
    }


    // --- Cancel the Order ---
    if (orderIdToCancel) {
        console.log('\n--- Step 2: Canceling the order... ---');

        const cancelPayload = {
            order_id: orderIdToCancel
        };

        try {
            const cancelResponse = await fetch(`${API_BASE_URL}/cancel-order`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(cancelPayload),
            });

            const cancelResult = await cancelResponse.json();

            if (!cancelResponse.ok) {
                console.error('❌ Failed to cancel order. Server response:');
                console.error(JSON.stringify(cancelResult, null, 2));
                return;
            }
            
            console.log('✅ Successfully sent cancellation request.');
            console.log('Server Response:', JSON.stringify(cancelResult, null, 2));
            console.log('\n🎉 Test complete! The full order lifecycle works.');

        } catch (error) {
            console.error('❌ An error occurred during order cancellation:', error.message);
        }
    }
}

// --- Run the Test ---
runPlaceAndCancelTest();
