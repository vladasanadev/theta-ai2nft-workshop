/**
 * Application constants and configuration
 */

/**
 * Backend API configuration
 */
export const API_CONFIG = {
  BASE_URL: process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001',
  ENDPOINTS: {
    CHAT: '/chat',
    MINT: '/mint',
  },
} as const;

/**
 * Feature flags
 */
export const FEATURES = {
  IS_MINTING_ACTIVE: process.env.REACT_APP_IS_MINTING_ACTIVE === 'true',
} as const;

/**
 * Blockchain explorer configuration
 */
export const BLOCKCHAIN = {
  THETA_TESTNET_EXPLORER: 'https://testnet-explorer.thetatoken.org/txs',
} as const;

/**
 * UI Configuration
 */
export const UI_CONFIG = {
  MAX_MESSAGE_WIDTH: '70%',
  MAX_IMAGE_WIDTH: 400,
  CHAT_HEIGHT: '70vh',
  MOBILE_CHAT_HEIGHT: '60vh',
  MOBILE_BREAKPOINT: 768,
} as const;

/**
 * Storage keys for localStorage
 */
export const STORAGE_KEYS = {
  WALLET_ADDRESS: 'walletAddress',
} as const;

/**
 * Regular expressions for validation
 */
export const REGEX = {
  IMAGE_URL: /https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp)/i,
  WALLET_ADDRESS: /^0x[a-fA-F0-9]{40}$/,
} as const; 