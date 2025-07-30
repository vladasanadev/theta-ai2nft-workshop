import { ethers } from 'ethers';
import fs from 'fs';
import { Message, NFTInterface, PartialNFT, LLMResponse } from '../types';
import { handleCompletionCustomPrompt } from './llmHandler';
import { BLOCKCHAIN_CONFIG, VALIDATION_REGEX, API_RESPONSES, PROMPTS } from '../constants';

/**
 * NFT Handler for AI to NFT Workshop
 * Handles NFT minting operations, wallet management, and blockchain interactions
 * Provides utilities for NFT validation and metadata generation
 */

/**
 * Loads wallet from encrypted keystore file
 * Used for signing NFT minting transactions
 * @returns Promise resolving to the wallet instance or null if loading fails
 */
async function loadWalletFromKeystore(): Promise<ethers.HDNodeWallet | ethers.Wallet | null> {
  try {
    if (!BLOCKCHAIN_CONFIG.WALLET_PATH || !BLOCKCHAIN_CONFIG.WALLET_PASSWORD) {
      throw new Error('Wallet configuration is incomplete');
    }

    const keystore = fs.readFileSync(BLOCKCHAIN_CONFIG.WALLET_PATH, 'utf8');
    const wallet = await ethers.Wallet.fromEncryptedJson(keystore, BLOCKCHAIN_CONFIG.WALLET_PASSWORD);
    
    return wallet;
  } catch (error) {
    console.error('Error loading wallet from keystore:', error);
    return null;
  }
}

/**
 * Generates base64-encoded metadata for NFT
 * Creates a data URI containing JSON metadata compatible with OpenSea and other marketplaces
 * @param nft - NFT data containing image and prompt
 * @returns Base64-encoded token URI string
 */
function generateMetadata(nft: NFTInterface): string {
  const metadata = {
    name: nft.prompt,
    image: nft.image,
    description: `AI-generated NFT created from prompt: "${nft.prompt}"`,
  };

  const encoded = Buffer.from(JSON.stringify(metadata)).toString("base64");
  return `data:application/json;base64,${encoded}`;
}

/**
 * Validates if NFT data is complete and ready for minting
 * Checks for required fields and validates wallet address format
 * @param nft - Partial NFT data to validate
 * @returns True if the NFT data is complete and valid for minting
 */
export function isMintable(nft?: PartialNFT): boolean {
  if (!nft?.image || !nft?.prompt || !nft?.wallet) {
    return false;
  }
  
  // Validate Ethereum address format
  return ethers.isAddress(nft.wallet);
}

/**
 * Validates blockchain configuration
 * @throws {Error} If required blockchain configuration is missing
 */
function validateBlockchainConfig(): void {
  if (!BLOCKCHAIN_CONFIG.RPC_URL) {
    throw new Error('RPC_URL environment variable is not set');
  }
  
  if (!BLOCKCHAIN_CONFIG.NFT_CONTRACT) {
    throw new Error('NFT_CONTRACT environment variable is not set');
  }
  
  if (!BLOCKCHAIN_CONFIG.CONTRACT_ABI) {
    throw new Error('CONTRACT_ABI environment variable is not set');
  }
}

/**
 * Parses contract ABI from environment variable
 * @returns Parsed contract ABI
 * @throws {Error} If ABI parsing fails
 */
function parseContractABI(): any[] {
  try {
    return JSON.parse(BLOCKCHAIN_CONFIG.CONTRACT_ABI || '[]');
  } catch (error) {
    console.error('Error parsing contract ABI:', error);
    throw new Error(API_RESPONSES.ERRORS.INVALID_CONTRACT_ABI);
  }
}

/**
 * Mints an NFT to the specified wallet address
 * Handles the complete minting workflow including wallet loading, balance checking, and transaction execution
 * @param nft - Complete NFT data including image, prompt, and wallet address
 * @returns Promise resolving to the transaction hash
 * @throws {Error} If minting fails due to configuration, balance, or transaction issues
 */
export async function mintNFT(nft: NFTInterface): Promise<string> {
  validateBlockchainConfig();
  
  // Load wallet from keystore
  const wallet = await loadWalletFromKeystore();
  if (!wallet) {
    throw new Error(API_RESPONSES.ERRORS.WALLET_NOT_FOUND);
  }

  // Create provider and connect wallet
  const provider = new ethers.JsonRpcProvider(BLOCKCHAIN_CONFIG.RPC_URL);
  const connectedWallet = wallet.connect(provider);
  
  // Check wallet balance for gas fees
  const balance = await provider.getBalance(connectedWallet.address);
  
  if (balance === 0n) {
    throw new Error(API_RESPONSES.ERRORS.INSUFFICIENT_BALANCE);
  }

  // Generate metadata and create contract instance
  const metadata = generateMetadata(nft);
  const contractABI = parseContractABI();
  
  const contract = new ethers.Contract(
    BLOCKCHAIN_CONFIG.NFT_CONTRACT!, 
    contractABI, 
    connectedWallet
  );
  
  // Execute minting transaction
  const tx = await contract.safeMint(nft.wallet, metadata);
  
  // Wait for transaction confirmation
  await tx.wait();
  
  return tx.hash;
}

/**
 * Handles LLM completion with NFT context for minting assistance
 * Provides contextual help based on the current NFT data completeness
 * @param messages - Array of conversation messages
 * @param nft - Current NFT data
 * @returns Promise resolving to LLM completion result with NFT context
 */
export async function handleCompletionWithNFT(messages: Message[], nft: NFTInterface): Promise<LLMResponse> {
  const prompt = PROMPTS.NFT_MINTING_ASSISTANT(nft, isMintable(nft));
  return await handleCompletionCustomPrompt(messages, prompt);
}

/**
 * Extracts and validates Ethereum wallet address from the last message
 * Searches for wallet address patterns in user messages
 * @param messages - Array of conversation messages
 * @returns Valid Ethereum address if found, null otherwise
 */
export async function filterWalletAddress(messages: Message[]): Promise<string | null> {
  if (messages.length === 0) {
    return null;
  }

  const lastMessage = messages[messages.length - 1];
  const matches = lastMessage.content.match(VALIDATION_REGEX.ETHEREUM_ADDRESS);
  
  if (matches && matches.length > 0) {
    // Get the last matched address and validate it
    const address = matches[matches.length - 1];
    if (ethers.isAddress(address)) {
      return address;
    }
  }
  
  return null;
}