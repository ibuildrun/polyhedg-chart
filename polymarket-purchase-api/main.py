import os
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional

# Make sure to install this via pip: pip install py-clob-client
from py_clob_client.client import ClobClient
from py_clob_client.clob_types import OrderArgs, OrderType
from py_clob_client.order_builder.constants import SELL

# --- Environment Variables ---
PRIVATE_KEY = os.environ.get("POLYMARKET_PRIVATE_KEY")
FUNDER = os.environ.get("POLYMARKET_FUNDER")


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

@app.post("/place-batch-orders", tags=["Orders"])
async def create_batch_polymarket_orders(request: BatchOrderRequest):
    # (This endpoint's code remains the same as before)
    print(f"Received request for {len(request.orders)} orders. Dry Run: {request.dry_run}")
    if not all([PRIVATE_KEY, FUNDER]):
        raise HTTPException(status_code=500, detail="Server configuration error: Credentials not set.")
            try:
                client = ClobClient("https://clob.polymarket.com", key=PRIVATE_KEY, chain_id=137, signature_type=2, funder=FUNDER)        client.set_api_creds(client.create_or_derive_api_creds())
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
        client = ClobClient("https://clob.polymarket.com", key=PRIVATE_KEY, chain_id=137, signature_type=2, funder=FUNDER)
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