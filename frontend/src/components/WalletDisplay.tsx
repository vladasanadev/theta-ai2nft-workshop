import React, { useState } from 'react';
import { WalletProps } from '../types';
import { FEATURES, REGEX } from '../constants';

/**
 * WalletDisplay component that manages wallet address display and editing
 * 
 * Features:
 * - Display current wallet address with truncation for readability
 * - Inline editing with validation
 * - Conditional rendering based on minting feature flag
 * - Save/cancel functionality with proper state management
 * - Wallet address format validation
 */
const WalletDisplay: React.FC<WalletProps> = ({ walletAddress, onWalletChange }) => {
  // Component state for editing mode
  const [isEditing, setIsEditing] = useState(false);
  const [tempAddress, setTempAddress] = useState(walletAddress);

  /**
   * Validates wallet address format
   * Checks if the address matches Ethereum wallet format (0x + 40 hex characters)
   * @param address - Wallet address to validate
   * @returns True if valid, false otherwise
   */
  const isValidWalletAddress = (address: string): boolean => {
    return REGEX.WALLET_ADDRESS.test(address.trim());
  };

  /**
   * Handles saving the wallet address
   * Validates the address before saving and exits edit mode
   */
  const handleSave = () => {
    const trimmedAddress = tempAddress.trim();
    
    if (trimmedAddress && isValidWalletAddress(trimmedAddress)) {
      onWalletChange(trimmedAddress);
      setIsEditing(false);
    } else if (trimmedAddress) {
      // Show error for invalid format
      alert('Please enter a valid wallet address (0x followed by 40 hex characters)');
    } else {
      // Allow empty address (user wants to clear it)
      onWalletChange('');
      setIsEditing(false);
    }
  };

  /**
   * Handles canceling the edit operation
   * Resets temporary address to current wallet address and exits edit mode
   */
  const handleCancel = () => {
    setTempAddress(walletAddress);
    setIsEditing(false);
  };

  /**
   * Starts the editing process
   * Sets temporary address and enters edit mode
   */
  const handleStartEdit = () => {
    setTempAddress(walletAddress);
    setIsEditing(true);
  };

  /**
   * Formats wallet address for display
   * Truncates long addresses to show first 6 and last 4 characters
   * @param address - Full wallet address
   * @returns Formatted address for display
   */
  const formatWalletAddress = (address: string): string => {
    if (address.length <= 10) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Only show wallet display if minting feature is active
  if (!FEATURES.IS_MINTING_ACTIVE) {
    return null;
  }

  return (
    <div className="wallet-display">
      {/* Display mode - show current wallet or prompt to add one */}
      {!isEditing && (
        <>
          {walletAddress ? (
            <div className="wallet-info">
              <span className="wallet-label">Wallet Address:</span>
              <span 
                className="wallet-address" 
                title={walletAddress} // Show full address on hover
              >
                {formatWalletAddress(walletAddress)}
              </span>
              <button 
                className="edit-wallet-btn"
                onClick={handleStartEdit}
                aria-label="Change wallet address"
              >
                Change
              </button>
            </div>
          ) : (
            <div className="no-wallet">
              <span>No wallet address set</span>
              <button 
                className="add-wallet-btn"
                onClick={handleStartEdit}
                aria-label="Add wallet address"
              >
                Add Wallet
              </button>
            </div>
          )}
        </>
      )}

      {/* Edit mode - input field with save/cancel buttons */}
      {isEditing && (
        <div className="wallet-edit">
          <input
            type="text"
            placeholder="Enter wallet address (0x...)"
            value={tempAddress}
            onChange={(e) => setTempAddress(e.target.value)}
            className="wallet-input"
            autoFocus
            aria-label="Wallet address input"
          />
          <div className="wallet-edit-buttons">
            <button 
              onClick={handleSave} 
              className="save-btn"
              aria-label="Save wallet address"
            >
              Save
            </button>
            <button 
              onClick={handleCancel} 
              className="cancel-btn"
              aria-label="Cancel editing"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WalletDisplay; 