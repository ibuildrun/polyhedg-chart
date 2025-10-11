# PolyMarket Order Proxy API

http://5.75.136.89:8000/docs#/

This project is a secure, self-hosted API that acts as a proxy to the Polymarket CLOB (Central Limit Order Book). It allows a frontend application to request the placement of batch limit sell orders without exposing any private keys to the client.

## Features

- **Secure:** Your private key and funder address are stored securely on the server as environment variables, never exposed to the frontend.
- **Batch Processing:** Accepts a list of orders in a single API call and processes them sequentially.
- **Dry Run Mode:** Allows for generating cryptographically signed order "contracts" without posting them to the live order book, useful for testing and validation.
- **Live Mode:** Posts orders to the live Polymarket exchange and returns a confirmation for each successful order.
- **Well-Documented:** Built with FastAPI, which provides automatic interactive documentation (via Swagger UI).

---

## Setup and Deployment

Follow these steps to deploy and run the API on your server.

### 1. Clone or Copy Files

Place the files (`main.py`, `requirements.txt`, `README.md`) in a directory on your server.

### 2. Install Dependencies

Navigate to the project directory and install the required Python libraries using pip.

```bash
pip install -r requirements.txt
```

### 3. Set Environment Variables

This is a critical security step. The API reads your Polymarket credentials from environment variables. Set them in your terminal before running the application.

```bash
# Replace with your actual credentials
export POLYMARKET_PRIVATE_KEY="0x123...your...private...key...abc"
export POLYMARKET_FUNDER="0xabc...your...funder...address...123"
```

**Note:** To make these permanent, add these lines to your shell's startup file (e.g., `~/.bashrc` or `~/.zshrc`).

### 4. Run the API Server

Use `uvicorn`, a high-performance ASGI server, to run the application.

```bash
uvicorn main:app --host 0.0.0.0 --port 8000
```

- `main`: The name of the Python file (`main.py`).
- `app`: The name of the FastAPI object created in `main.py`.
- `--host 0.0.0.0`: Allows the server to be accessible from outside its local machine.
- `--port 8000`: The port the server will listen on.

Your API is now live and ready to accept requests.

---

## API Usage

Once the server is running, you can access the automatic interactive documentation by navigating to `http://your-server-ip:8000/docs` in your browser.

### Endpoint: `/place-batch-orders`

- **Method:** `POST`
- **Description:** Places a batch of limit sell orders.

#### Request Body

The body of the request must be a JSON object containing a list of orders and an optional `dry_run` flag.

**Example `curl` command:**

```bash
curl -X 'POST' \
  'http://your-server-ip:8000/place-batch-orders' \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{
  "orders": [
    {
      "token_id": "0x1a52157a5443b2b324a47083d89f2934a8372a4c06023f2a3c55a10a2d18a715",
      "price": 0.98,
      "size": 0.50
    },
    {
      "token_id": "0x2b45ac321a43b2b324a47083d89f2934a8372a4c06023f2a3c55a10a2d18b824",
      "price": 0.95,
      "size": 0.75
    }
  ],
  "dry_run": false
}'
```

#### Success Response (`dry_run: false`)

The API will return a JSON object with a `batch_results` list. Each item in the list corresponds to an order and contains the status and the direct response from Polymarket, which serves as your proof of fulfillment.

```json
{
  "batch_results": [
    {
      "status": "live_run_success",
      "input_order": {
        "token_id": "0x1a52...",
        "price": 0.98,
        "size": 0.5
      },
      "polymarket_response": {
        "orderId": "12345678-abcd-..."
      }
    }
  ]
}
```

