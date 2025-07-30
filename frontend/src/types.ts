/**
 * Shared TypeScript interfaces for the AI to NFT Workshop frontend application
 */

/**
 * Represents an NFT with its associated metadata
 */
export interface NFT {
  /** URL of the generated image */
  image: string;
  /** Text prompt used to generate the image */
  prompt: string;
  /** Wallet address for minting the NFT */
  wallet: string;
  /** Transaction hash after successful minting (optional) */
  hash?: string;
}

/**
 * Represents a chat message in the conversation
 */
export interface ChatMessage {
  /** Role of the message sender */
  role: 'user' | 'assistant';
  /** Content of the message */
  content: string;
  /** NFT data associated with the message (optional) */
  nft?: {
    image: string;
    prompt: string;
    hash?: string;
  };
}

/**
 * Status types for various operations
 */
export type OperationStatus = 'idle' | 'loading' | 'success' | 'error';

/**
 * Props for components that handle NFT operations
 */
export interface NFTHandlerProps {
  nft: NFT;
  onNFTChange: (nft: NFT) => void;
}

/**
 * Props for components that display wallet information
 */
export interface WalletProps {
  walletAddress: string;
  onWalletChange: (address: string) => void;
}

/**
 * Props for message components
 */
export interface MessageProps {
  message: ChatMessage;
  latestWallet: string;
  updateNFT: (messageIndex: number, hash: string) => void;
  messageIndex: number;
} 