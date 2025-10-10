from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from eth_account import Account
from eth_account.messages import encode_defunct
import os
import json
from datetime import datetime

# Enable unaudited HD wallet features
Account.enable_unaudited_hdwallet_features()

app = FastAPI(title="EigenCompute Sign Service", version="1.0.0")

class SignRequest(BaseModel):
    event: dict

@app.post("/sign")
async def sign_event(request: SignRequest):
    """Sign event endpoint - creates wallet and signs event data"""
    mnemonic = os.getenv("MNEMONIC")
    
    if not mnemonic:
        raise HTTPException(status_code=500, detail="MNEMONIC environment variable is not set")
    
    if not request.event:
        raise HTTPException(status_code=400, detail="Event data is required in request body")
    
    try:
        # Create wallet from mnemonic (deterministic)
        account = Account.from_mnemonic(mnemonic)
        
        # Sign the event
        message = json.dumps(request.event)
        encoded_message = encode_defunct(text=message)
        signed_message = account.sign_message(encoded_message)
        
        return {
            "wallet": account.address,
            "event": request.event,
            "signature": signed_message.signature.hex(),
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }
    except Exception as error:
        print(f"Error signing event: {error}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to sign event: {str(error)}"
        )

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "80"))
    print(f"🚀 Server running on port {port}")
    print(f"📍 Endpoint: POST http://localhost:{port}/sign")
    print(f"   Send: {{'event': {{...your event data...}}}}")
    uvicorn.run(app, host="0.0.0.0", port=port)

