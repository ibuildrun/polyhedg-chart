# Polymarket Python CLOB Client Documentation

This document contains the documentation for the Polymarket Python CLOB (Central Limit Order Book) client, obtained from the Context7 `get_library_docs` tool.

## Installation

Installs the py-clob-client library using pip. This is the primary method for adding the client to your Python environment.

```bash
pip install py-clob-client
```

## Development

### Development Dependencies and Tests

Installs development dependencies and runs code formatting and tests using make commands.

```bash
make init
make fmt test
```

### Publishing a Package

Commands for publishing the Python package to PyPI, including installing necessary libraries, compiling the code, checking the distribution, and uploading.

```bash
pip install twine setuptools
python setup.py sdist
twine check dist/*
twine upload dist/*
```

## API Reference

This section provides a reference to the Polymarket CLOB API, outlining key functionalities and how to interact with them. It covers API endpoint details, request parameters, and response formats. For comprehensive details, refer to the official API documentation linked in the project description.

**Base URL:** `https://clob.polymarket.com`

**Authentication:**
API credentials are required for most operations. Use `client.set_api_creds(client.create_or_derive_api_creds())` to set them.

### Endpoints:

#### 1. Markets API
-   **Description**: Retrieves information about available markets on the CLOB.
-   **Endpoint**: `/markets`
-   **Method**: GET
-   **Parameters**: Query parameters may include filters for market status, type, etc.
-   **Response**: Returns a list of market objects, each containing details like `tokenID`, `name`, `status`, etc.
-   **Usage**: Refer to the Markets API documentation for specific query parameters and response structure.

#### 2. Order Placement
-   **Description**: Creates and posts a signed order to the CLOB.
-   **Endpoint**: `/order`
-   **Method**: POST
-   **Request Body**: Requires a signed order object created using `client.create_order()` and an `OrderType` (e.g., `OrderType.GTC`).
-   **Parameters**:
    -   `signed_order`: The order object signed by the client.
    -   `order_type`: The type of order (e.g., `OrderType.GTC`).
-   **Response**: Confirmation of order placement or error details.

#### 3. Order Creation (Signing)
-   **Description**: Creates a signed order object from provided arguments.
-   **Method**: `client.create_order(order_args: OrderArgs)`
-   **Parameters**:
    -   `order_args`: An `OrderArgs` object containing order details:
        -   `price` (float): The price of the order.
        -   `size` (float): The quantity of the token.
        -   `side` (str): The order side ('BUY' or 'SELL').
        -   `token_id` (str): The ID of the token to trade.
-   **Returns**: A signed order object ready for posting.

#### 4. API Credential Management
-   **Method**: `client.create_or_derive_api_creds()`
-   **Description**: Creates or derives API credentials necessary for authenticated requests.
-   **Returns**: API credentials.
-   **Method**: `client.set_api_creds(creds)`
-   **Description**: Sets the derived API credentials for the client instance.

### Initialization Options:
-   **Email/Magic Login**: `signature_type=1`, requires `funder` (POLYMARKET_PROXY_ADDRESS).
-   **Browser Wallet Login**: `signature_type=2`, requires `funder` (POLYMARKET_PROXY_ADDRESS).
-   **Direct EOA Trading**: No `funder` required.

### Error Handling:
-   Ensure correct token allowances are set for EOA or browser wallet interactions.
-   Refer to specific API responses for detailed error messages and codes.

## Client Initialization

### Initialize ClobClient (Email/Magic Login)

Initializes the ClobClient for users who log in with an email or Magic link. This method uses signature_type=1 and requires the POLYMARKET_PROXY_ADDRESS.

```python
from py_clob_client.client import ClobClient

host: str = "https://clob.polymarket.com"
key: str = "" #This is your Private Key. Export from reveal.polymarket.com or from your Web3 Application
chain_id: int = 137 #No need to adjust this
POLYMARKET_PROXY_ADDRESS: str = '' #This is the address you deposit/send USDC to to FUND your Polymarket account.

client = ClobClient(host, key=key, chain_id=chain_id, signature_type=1, funder=POLYMARKET_PROXY_ADDRESS)
```

### Initialize ClobClient (Browser Wallet Login)

Initializes the ClobClient for users who log in with a browser wallet like MetaMask or Coinbase Wallet. This method uses signature_type=2 and requires the POLYMARKET_PROXY_ADDRESS.

```python
from py_clob_client.client import ClobClient

host: str = "https://clob.polymarket.com"
key: str = "" #This is your Private Key. Export from reveal.polymarket.com or from your Web3 Application
chain_id: int = 137 #No need to adjust this
POLYMARKET_PROXY_ADDRESS: str = '' #This is the address you deposit/send USDC to to FUND your Polymarket account.

client = ClobClient(host, key=key, chain_id=chain_id, signature_type=2, funder=POLYMARKET_PROXY_ADDRESS)
```

### Initialize ClobClient (Direct EOA Trading)

Initializes the ClobClient for direct trading from an Externally Owned Account (EOA). This method does not require a POLYMARKET_PROXY_ADDRESS.

```python
from py_clob_client.client import ClobClient

host: str = "https://clob.polymarket.com"
key: str = "" #This is your Private Key. Export from reveal.polymarket.com or from your Web3 Application
chain_id: int = 137 #No need to adjust this

client = ClobClient(host, key=key, chain_id=chain_id)
```

## Creating and Posting Orders

### Create and Post a Limit Order

Creates and signs a limit order to buy a specified size of a token at a given price. The signed order is then posted to the CLOB as a Good-Till-Cancelled (GTC) order.

```python
from py_clob_client.client import ClobClient
from py_clob_client.clob_types import OrderArgs, OrderType
from py_clob_client.order_builder.constants import BUY

host: str = "https://clob.polymarket.com"
key: str = "" #This is your Private Key. Export from reveal.polymarket.com or from your Web3 Application
chain_id: int = 137 #No need to adjust this
POLYMARKET_PROXY_ADDRESS: str = '' #This is the address you deposit/send USDC to to FUND your Polymarket account.

# Initialize client (choose one of the methods above)
client = ClobClient(host, key=key, chain_id=chain_id, signature_type=1, funder=POLYMARKET_PROXY_ADDRESS)

client.set_api_creds(client.create_or_derive_api_creds())

order_args = OrderArgs(
    price=0.01,
    size=5.0,
    side=BUY,
    token_id="", #Token ID you want to purchase goes here.
)
signed_order = client.create_order(order_args)

resp = client.post_order(signed_order, OrderType.GTC)
print(resp)
```

## Project Dependencies

Lists the Python packages and their versions required for the py-clob-client project. This includes core libraries like 'requests' and 'websockets', development tools like 'pytest', and specific packages like 'eth-account' and 'py_order_utils'.

```
black==24.4.2
eth-account===0.13.0
eth-utils===4.1.1
poly_eip712_structs==0.0.1
py_order_utils==0.3.2
pytest==8.2.2
python-dotenv==0.19.2
requests==2.32.3
websockets==12.0
```
