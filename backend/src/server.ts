import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { generateImage, handleGernarateImageCheck } from './handlers/imageHandler';
import { handleCompletion, handleCompletionCustomPrompt } from './handlers/llmHandler';
import { mintNFT, isMintable, handleCompletionWithNFT, filterWalletAddress } from './handlers/nftHandler';
import { CompletionInput, NFTInterface, APISuccess, APIError } from './types';
import { SERVER_CONFIG, API_RESPONSES } from './constants';

/**
 * AI to NFT Workshop Backend Server
 * 
 * Provides RESTful API endpoints for:
 * - Chat completion with AI assistant
 * - Image generation detection and execution
 * - NFT minting operations
 * - Wallet address management
 */

// Load environment variables
dotenv.config();

// Initialize Express application
const app = express();

// Configure middleware
app.use(cors());
app.use(express.json());

/**
 * Chat endpoint - handles conversation with AI assistant
 * Supports image generation, wallet management, and NFT assistance
 * 
 * POST /chat
 * Body: { messages: Message[], nft?: NFTInterface }
 * Response: { success: true, result: CompletionResult, latestNFT?: NFTInterface }
 */
app.post('/chat', async (req, res) => {
  try { 
    const body: CompletionInput = req.body;

    // Validate request body
    if (!body.messages || !Array.isArray(body.messages)) {
      return res.status(400).json({ 
        error: 'Invalid request: messages array is required' 
      } as APIError);
    }

    // Check if user wants to generate an image
    const imageData = await handleGernarateImageCheck(body.messages);
    let newNFT: NFTInterface | undefined;
    let oldNFT: NFTInterface = body.nft || {image: '', prompt: '', wallet: ''};
    let completionResult;

    if (imageData.image) {
      // Image was generated - create NFT and provide minting assistance
      newNFT = {
        image: imageData.image,
        prompt: imageData.prompt!,
        wallet: body.nft?.wallet || ''
      };

      completionResult = await handleCompletionWithNFT(body.messages, newNFT);
    } else {
      // No image generation - check for wallet address or handle general chat
      const walletAddress = await filterWalletAddress(body.messages);
      
      if (walletAddress && typeof walletAddress === 'string') {
        oldNFT.wallet = walletAddress;
        // Wallet address detected - acknowledge and update
        completionResult = {
          output: {
            message: API_RESPONSES.WALLET_UPDATE_SUCCESS(walletAddress)
          },
          input: body.messages
        };
      } else {
        // General conversation
        completionResult = await handleCompletion(body.messages);
      }
    }

    // Prepare response with NFT data if available
    const response: APISuccess = {
      success: true,
      result: {
        output: {
          ...completionResult.output,
          ...(newNFT ? { nft: { image: newNFT.image, prompt: newNFT.prompt } } : {})
        },
        input: completionResult.input
      },
      latestNFT: newNFT || oldNFT
    };

    res.json(response);
  } catch (error) {
    console.error('Chat endpoint error:', error);
    res.status(500).json({ 
      error: API_RESPONSES.ERRORS.SERVER_ERROR,
      details: error instanceof Error ? error.message : 'Unknown error'
    } as APIError);
  }
});

/**
 * Mint endpoint - handles NFT minting operations
 * Validates NFT data and executes blockchain minting transaction
 * 
 * POST /mint
 * Body: { image: string, prompt: string, wallet: string }
 * Response: { success: true, txHash: string }
 */
app.post('/mint', async (req, res) => {
  try {
    const nftData: NFTInterface = req.body;

    // Validate NFT data completeness
    if (!isMintable(nftData)) {
      return res.status(400).json({ 
        error: API_RESPONSES.ERRORS.INCOMPLETE_NFT_DATA,
        details: 'Missing required fields: image, prompt, or valid wallet address'
      } as APIError);
    }

    // Execute minting transaction
    const txHash = await mintNFT(nftData);
    
    const response: APISuccess = {
      success: true,
      txHash
    };

    res.json(response);
  } catch (error) {
    console.error('Mint endpoint error:', error);
    res.status(500).json({ 
      error: API_RESPONSES.ERRORS.MINTING_FAILED,
      details: error instanceof Error ? error.message : 'Unknown error'
    } as APIError);
  }
});

/**
 * Health check endpoint
 * Provides basic server status information
 * 
 * GET /health
 * Response: { status: 'ok', timestamp: string }
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'AI to NFT Workshop Backend'
  });
});

/**
 * Start the server
 */
const PORT = SERVER_CONFIG.PORT;
app.listen(PORT, () => {
  console.log(`🚀 AI to NFT Workshop Backend running on http://localhost:${PORT}`);
  console.log(`📊 Health check available at http://localhost:${PORT}/health`);
});