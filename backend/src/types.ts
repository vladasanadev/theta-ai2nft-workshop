/**
 * TypeScript type definitions for the AI to NFT Workshop backend
 * Contains interfaces and types used throughout the application
 */

/**
 * Represents a chat message in the conversation
 * Supports both user and assistant messages with optional NFT data
 */
export interface Message {
  /** Role of the message sender */
  role: 'system' | 'user' | 'assistant';
  
  /** Content of the message */
  content: string;
  
  /** Optional NFT data associated with the message */
  nft?: {
    /** URL of the generated image */
    image: string;
    /** Text prompt used to generate the image */
    prompt: string;
    /** Transaction hash after successful minting (optional) */
    hash?: string;
  };
}

/**
 * Input structure for LLM completion requests
 * Contains conversation history and current NFT state
 */
export interface CompletionInput {
  /** Array of messages representing the conversation history */
  messages: Message[];
  
  /** Current NFT data if available */
  nft?: NFTInterface;
}

/**
 * Represents an NFT with its associated metadata and wallet information
 * Used for minting operations and state management
 */
export interface NFTInterface {
  /** URL of the generated image */
  image: string;
  
  /** Text prompt used to generate the image */
  prompt: string;
  
  /** Ethereum wallet address for minting the NFT */
  wallet: string;
  
  /** Transaction hash after successful minting (optional) */
  hash?: string;
}

/**
 * Response structure from LLM API calls
 */
export interface LLMResponse {
  /** The generated output from the LLM */
  output: {
    /** The generated message content */
    message: string;
    /** Additional metadata from the LLM response */
    [key: string]: any;
  };
  
  /** The input that was sent to the LLM */
  input: {
    /** The messages that were processed */
    messages: Omit<Message, 'nft'>[];
    /** LLM configuration parameters */
    [key: string]: any;
  };
}

/**
 * Image generation request result
 */
export interface ImageGenerationResult {
  /** Generated image URL if successful, null otherwise */
  image: string | null;
  
  /** The prompt used for image generation, null if no generation occurred */
  prompt: string | null;
}

/**
 * Image generation check response from LLM
 */
export interface ImageGenerationCheck {
  /** Whether the user is requesting image generation */
  generate: boolean;
  
  /** The prompt to use for image generation (only present if generate is true) */
  prompt?: string;
}

/**
 * API error response structure
 */
export interface APIError {
  /** Error message */
  error: string;
  
  /** HTTP status code */
  status?: number;
  
  /** Additional error details */
  details?: string;
}

/**
 * Successful API response structure
 */
export interface APISuccess<T = any> {
  /** Success indicator */
  success: true;
  
  /** Response data */
  result?: T;
  
  /** Latest NFT data if applicable */
  latestNFT?: NFTInterface;
  
  /** Transaction hash for minting operations */
  txHash?: string;
}

/**
 * Utility type for partial NFT data (used in validation)
 */
export type PartialNFT = Partial<NFTInterface>;

/**
 * Type for messages without NFT data (used in LLM requests)
 */
export type CleanMessage = Omit<Message, 'nft'>;

/**
 * Environment variable validation type
 */
export interface EnvironmentConfig {
  LLM_URL?: string;
  ON_DEMAND_API_ACCESS_TOKEN?: string;
  RPC_URL?: string;
  NFT_CONTRACT?: string;
  CONTRACT_ABI?: string;
  WALLET_PATH?: string;
  WALLET_PASSWORD?: string;
}
  