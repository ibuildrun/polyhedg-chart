import express, { Request, Response } from 'express';
import { mnemonicToAccount } from 'viem/accounts';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '80');

// Middleware
app.use(express.json());

// Sign event endpoint - creates wallet and signs event data
app.post('/sign', async (req: Request, res: Response) => {
  const mnemonic = process.env.MNEMONIC;
  
  if (!mnemonic) {
    return res.status(500).json({ 
      error: 'MNEMONIC environment variable is not set' 
    });
  }
  
  const { event } = req.body;
  
  if (!event) {
    return res.status(400).json({ 
      error: 'Event data is required in request body' 
    });
  }
  
  try {
    // Create wallet from mnemonic (deterministic)
    const wallet = mnemonicToAccount(mnemonic);
    
    // Sign the event
    const signature = await wallet.signMessage({
      message: JSON.stringify(event)
    });
    
    res.json({ 
      wallet: wallet.address,
      event,
      signature,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error signing event:', error);
    res.status(500).json({ 
      error: 'Failed to sign event',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Endpoint: POST http://localhost:${PORT}/sign`);
  console.log(`   Send: {"event": {...your event data...}}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down...');
  process.exit(0);
});
