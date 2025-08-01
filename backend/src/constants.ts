import dotenv from 'dotenv';

// Load environment variables first, before anything else
dotenv.config();

/**
 * Backend configuration constants for the AI to NFT Workshop
 * Centralizes all environment variables and configuration values
 */

/**
 * Server configuration
 */
export const SERVER_CONFIG = {
  get PORT() { return process.env.PORT || 4000; },
  DEFAULT_TIMEOUT: 30000, // 30 seconds
} as const;

/**
 * LLM (Language Model) API configuration
 */
export const LLM_CONFIG = {
  get URL() { return process.env.LLM_URL; },
  get API_KEY() { return process.env.ON_DEMAND_API_ACCESS_TOKEN; },
  get TEMPERATURE() { return parseFloat(process.env.TEMPERATURE || '0.7'); },
  get TOP_P() { return parseFloat(process.env.TOP_P || '0.9'); },
  get MAX_TOKENS() { return parseInt(process.env.MAX_TOKENS || '1000'); },
  STREAM: false,
} as const;

/**
 * Image generation API configuration
 */
export const IMAGE_CONFIG = {
  get URL() { return process.env.IMAGE_URL || 'https://ondemand.thetaedgecloud.com/infer_request/flux'; },
  get API_TOKEN() { return process.env.ON_DEMAND_API_ACCESS_TOKEN; },
  get GUIDANCE() { return parseFloat(process.env.IMAGE_GUIDANCE || '3.5'); },
  get HEIGHT() { return parseInt(process.env.IMAGE_HEIGHT || '512'); },
  get WIDTH() { return parseInt(process.env.IMAGE_WIDTH || '512'); },
  get IMAGE2IMAGE_STRENGTH() { return parseFloat(process.env.IMAGE2IMAGE_STRENGTH || '0.8'); },
  get NUM_STEPS() { return parseInt(process.env.IMAGE_NUM_STEPS || '4'); },
  get MAX_ATTEMPTS() { return parseInt(process.env.IMAGE_MAX_ATTEMPTS || '30'); },
  get POLL_INTERVAL() { return parseInt(process.env.IMAGE_POLL_INTERVAL || '2000'); }, // 2 seconds
  STATUS_URL_BASE: 'https://ondemand.thetaedgecloud.com/infer_request',
} as const;

/**
 * Blockchain and NFT configuration
 */
export const BLOCKCHAIN_CONFIG = {
  get RPC_URL() { return process.env.RPC_URL; },
  get NFT_CONTRACT() { return process.env.NFT_CONTRACT; },
  get CONTRACT_ABI() { return process.env.CONTRACT_ABI; },
  get WALLET_PATH() { return process.env.WALLET_PATH; },
  get WALLET_PASSWORD() { return process.env.WALLET_PASSWORD; },
} as const;

/**
 * Regular expressions for validation
 */
export const VALIDATION_REGEX = {
  ETHEREUM_ADDRESS: /0x[a-fA-F0-9]{40}/g,
} as const;

/**
 * API response constants
 */
export const API_RESPONSES = {
  WALLET_UPDATE_SUCCESS: (address: string) => 
    `We updated your wallet address to: ${address}. You can now mint NFTs to this wallet.`,
  ERRORS: {
    SERVER_ERROR: 'Server error',
    INCOMPLETE_NFT_DATA: 'Incomplete NFT data',
    MINTING_FAILED: 'Minting failed',
    LLM_URL_MISSING: 'LLM_URL environment variable is not set',
    ON_DEMAND_API_ACCESS_TOKEN_MISSING: 'ON_DEMAND_API_ACCESS_TOKEN environment variable is not set',
    IMAGE_API_TOKEN_MISSING: 'ON_DEMAND_API_ACCESS_TOKEN environment variable is not set',
    WALLET_NOT_FOUND: 'Wallet not found',
    INSUFFICIENT_BALANCE: 'Insufficient balance for gas fees',
    INVALID_CONTRACT_ABI: 'Invalid contract ABI format',
  },
} as const;

/**
 * Prompts used throughout the application
 */
export const PROMPTS = {
  IMAGE_GENERATION_CHECK: JSON.stringify(`
Your task is to determine whether the user is asking for an image to be generated in his latest message.

If the user is requesting or implying that they want an image (e.g., "draw me", "generate an image", "show me a picture", "can you make an image of..."), return:

{
  "generate": true,
  "prompt": "<short clear prompt to generate the image>"
}

If the message does NOT request or imply image generation, return:

{
  "generate": false
}
`),
  
  NFT_MINTING_ASSISTANT: (nft: any, isMintable: boolean) => `
You are a helpful assistant that can help the user mint an NFT.
To mint the NFT, you need to use the following information:
- Image: Link to the image
- Prompt: The prompt used to generate the image
- Wallet: The wallet address of the user (valid Ethereum address)
-> isMintable: ${isMintable} should return true if the image, prompt and wallet are valid.

The user has provided the following information:
- Image: ${nft.image} -> if provided the image will be shown to the user.
- Prompt: ${nft.prompt}
- Wallet: ${nft.wallet}

If the user hasn't provided all the information, please let him know which information is missing. Additionally, tell the user that we generated the image for him, the prompt is: ${nft.prompt} and that he can mint it. Do not show him the image link.
`,
} as const; 