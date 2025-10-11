import os
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional

# Make sure to install this via pip: pip install py-clob-client
from py_clob_client.client import ClobClient
from py_clob_client.clob_types import OrderArgs, OrderType
from py_clob_client.order_builder.constants import SELL

# For programmatic deposits
from web3 import Web3
from eth_account import Account

# --- Environment Variables ---
PRIVATE_KEY = os.environ.get("POLYMARKET_PRIVATE_KEY")
FUNDER = os.environ.get("POLYMARKET_FUNDER")

# --- Polygon/Web3 Setup ---
POLYGON_RPC = "https://polygon-rpc.com"
USDC_ADDRESS = "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359"  # USDC on Polygon (native)
# Backup RPC: "https://polygon-mainnet.g.alchemy.com/v2/demo"

# Standard ERC20 ABI (only the functions we need)
ERC20_ABI = [
    {
        "constant": True,
        "inputs": [{"name": "_owner", "type": "address"}],
        "name": "balanceOf",
        "outputs": [{"name": "balance", "type": "uint256"}],
        "type": "function"
    },
    {
        "constant": False,
        "inputs": [
            {"name": "_to", "type": "address"},
            {"name": "_value", "type": "uint256"}
        ],
        "name": "transfer",
        "outputs": [{"name": "", "type": "bool"}],
        "type": "function"
    },
    {
        "constant": True,
        "inputs": [],
        "name": "decimals",
        "outputs": [{"name": "", "type": "uint8"}],
        "type": "function"
    }
]


# --- FastAPI Application Setup ---
app = FastAPI(
    title="PolyMarket Order Proxy API",
    description="A secure proxy to place and cancel orders on the Polymarket CLOB.",
    version="1.1.0",
)


# --- API Data Models ---
class OrderRequest(BaseModel):
    token_id: str = Field(..., description="The unique ID of the market outcome to bet against.")
    price: float = Field(..., gt=0, lt=1, description="The limit price for the sell order.")
    size: float = Field(..., gt=0, description="The amount in USDC for the bet.")

class BatchOrderRequest(BaseModel):
    orders: List[OrderRequest]
    dry_run: Optional[bool] = Field(False, description="If true, only generates signed orders without posting.")

# ADDED: Model for the cancellation request
class CancelRequest(BaseModel):
    order_id: str = Field(..., description="The unique ID of the order to be canceled, returned by Polymarket on creation.")


# --- API Endpoints ---

@app.get("/", tags=["Health Check"])
def read_root():
    return {"status": "PolyMarket Order Proxy is running"}

@app.get("/wallet-info", tags=["Account"])
async def get_wallet_info():
    """
    Returns wallet addresses for the configured account.
    The FUNDER address is where you need to deposit USDC.
    """
    if not all([PRIVATE_KEY, FUNDER]):
        raise HTTPException(status_code=500, detail="Server configuration error: Credentials not set.")

    try:
        client = ClobClient(
            "https://clob.polymarket.com",
            key=PRIVATE_KEY,
            chain_id=137,
            signature_type=1,
            funder=FUNDER
        )
        client.set_api_creds(client.create_or_derive_api_creds())

        return {
            "funder_address": FUNDER,
            "message": "Deposit USDC to the funder_address shown above. You can check your balance at https://polygonscan.com/address/" + FUNDER,
            "polygon_scan_url": f"https://polygonscan.com/address/{FUNDER}"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get wallet info: {e}")

@app.get("/check-balances", tags=["Account"])
async def check_balances():
    """
    Checks USDC balances for both your private key address and FUNDER address.
    """
    if not all([PRIVATE_KEY, FUNDER]):
        raise HTTPException(status_code=500, detail="Server configuration error: Credentials not set.")

    try:
        w3 = Web3(Web3.HTTPProvider(POLYGON_RPC))
        if not w3.is_connected():
            raise HTTPException(status_code=500, detail="Failed to connect to Polygon RPC")

        # Get account from private key
        account = Account.from_key(PRIVATE_KEY)
        wallet_address = account.address

        # Connect to USDC contract
        usdc_contract = w3.eth.contract(address=Web3.to_checksum_address(USDC_ADDRESS), abi=ERC20_ABI)

        # Get balances
        wallet_balance = usdc_contract.functions.balanceOf(wallet_address).call()
        funder_balance = usdc_contract.functions.balanceOf(Web3.to_checksum_address(FUNDER)).call()

        return {
            "wallet_address": wallet_address,
            "wallet_balance_usdc": float(wallet_balance) / 1e6,
            "funder_address": FUNDER,
            "funder_balance_usdc": float(funder_balance) / 1e6,
            "polygon_scan_wallet": f"https://polygonscan.com/address/{wallet_address}",
            "polygon_scan_funder": f"https://polygonscan.com/address/{FUNDER}"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to check balances: {e}")

@app.post("/deposit-to-polymarket", tags=["Account"])
async def deposit_to_polymarket(amount: float):
    """
    Transfers USDC from your private key wallet to your Polymarket FUNDER address.
    This deposits funds into your Polymarket trading account.
    """
    if not all([PRIVATE_KEY, FUNDER]):
        raise HTTPException(status_code=500, detail="Server configuration error: Credentials not set.")

    if amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be greater than 0")

    try:
        w3 = Web3(Web3.HTTPProvider(POLYGON_RPC))
        if not w3.is_connected():
            raise HTTPException(status_code=500, detail="Failed to connect to Polygon RPC")

        # Get account from private key
        account = Account.from_key(PRIVATE_KEY)
        wallet_address = account.address

        # Connect to USDC contract
        usdc_contract = w3.eth.contract(address=Web3.to_checksum_address(USDC_ADDRESS), abi=ERC20_ABI)

        # Check balance
        wallet_balance = usdc_contract.functions.balanceOf(wallet_address).call()
        wallet_balance_usdc = float(wallet_balance) / 1e6

        if wallet_balance_usdc < amount:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient balance. You have {wallet_balance_usdc} USDC but tried to deposit {amount} USDC"
            )

        # Build transfer transaction
        amount_in_wei = int(amount * 1e6)  # USDC has 6 decimals
        nonce = w3.eth.get_transaction_count(wallet_address)

        # Build transaction
        transfer_txn = usdc_contract.functions.transfer(
            Web3.to_checksum_address(FUNDER),
            amount_in_wei
        ).build_transaction({
            'chainId': 137,  # Polygon
            'gas': 100000,
            'gasPrice': w3.eth.gas_price,
            'nonce': nonce,
        })

        # Sign transaction
        signed_txn = w3.eth.account.sign_transaction(transfer_txn, private_key=PRIVATE_KEY)

        # Send transaction
        tx_hash = w3.eth.send_raw_transaction(signed_txn.raw_transaction)
        tx_hash_hex = tx_hash.hex()

        # Wait for transaction receipt (optional, with timeout)
        receipt = w3.eth.wait_for_transaction_receipt(tx_hash, timeout=120)

        return {
            "status": "success",
            "amount_deposited_usdc": amount,
            "from_address": wallet_address,
            "to_address": FUNDER,
            "transaction_hash": tx_hash_hex,
            "polygon_scan_url": f"https://polygonscan.com/tx/{tx_hash_hex}",
            "block_number": receipt['blockNumber'],
            "gas_used": receipt['gasUsed']
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to deposit: {str(e)}")

@app.post("/approve-allowance", tags=["Account"])
async def approve_allowance(amount: float = 1000.0):
    """
    Approves the Polymarket contract to spend USDC from your wallet.
    Default is 1000 USDC. This is required before placing orders.
    """
    if not all([PRIVATE_KEY, FUNDER]):
        raise HTTPException(status_code=500, detail="Server configuration error: Credentials not set.")

    try:
        client = ClobClient(
            "https://clob.polymarket.com",
            key=PRIVATE_KEY,
            chain_id=137,
            signature_type=1,
            funder=FUNDER
        )

        # Use the underlying web3 methods to approve allowance
        # This requires calling the USDC contract directly
        result = client.set_allowance(int(amount * 1e6))

        return {
            "status": "success",
            "approved_amount_usdc": amount,
            "result": result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to set allowance: {e}")

@app.post("/place-batch-orders", tags=["Orders"])
async def create_batch_polymarket_orders(request: BatchOrderRequest):
    # (This endpoint's code remains the same as before)
    print(f"Received request for {len(request.orders)} orders. Dry Run: {request.dry_run}")
    if not all([PRIVATE_KEY, FUNDER]):
        raise HTTPException(status_code=500, detail="Server configuration error: Credentials not set.")

    try:
        client = ClobClient(
            "https://clob.polymarket.com",
            key=PRIVATE_KEY,
            chain_id=137,
            signature_type=1,
            funder=FUNDER
        )
        client.set_api_creds(client.create_or_derive_api_creds())
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to connect to Polymarket: {e}")
    
    results = []
    for order in request.orders:
        try:
            order_args = OrderArgs(token_id=order.token_id, price=order.price, size=order.size, side=SELL)
            signed_order = client.create_order(order_args)
            if request.dry_run:
                results.append({"status": "dry_run_success", "input_order": order.dict(), "signed_order": signed_order})
            else:
                resp = client.post_order(signed_order, OrderType.GTC)
                results.append({"status": "live_run_success", "input_order": order.dict(), "polymarket_response": resp})
        except Exception as e:
            results.append({"status": "error", "input_order": order.dict(), "error_message": str(e)})
    
    return {"batch_results": results}

# ADDED: New endpoint for canceling an order
@app.post("/cancel-order", tags=["Orders"])
async def cancel_polymarket_order(request: CancelRequest):
    """
    Receives an orderId and attempts to cancel that order on Polymarket.
    """
    print(f"Received request to cancel order: {request.order_id}")

    if not all([PRIVATE_KEY, FUNDER]):
        raise HTTPException(status_code=500, detail="Server configuration error: Credentials not set.")

    try:
        # --- Initialize Client ---
        client = ClobClient(
            "https://clob.polymarket.com",
            key=PRIVATE_KEY,
            chain_id=137,
            signature_type=1,
            funder=FUNDER
        )
        client.set_api_creds(client.create_or_derive_api_creds())
        
        # --- Send Cancellation Request ---
        # The py-clob-client `cancel` method takes the order ID and the owner's address.
        # The client automatically knows the owner's address from the private key.
        # The library expects a list of IDs to cancel, so we provide a list with one ID.
        cancellation_response = client.cancel([request.order_id])
        
        print(f"Successfully sent cancellation request. Response: {cancellation_response}")
        return {"status": "cancellation_sent", "polymarket_response": cancellation_response}

    except Exception as e:
        print(f"Error during cancellation: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to cancel order: {e}")