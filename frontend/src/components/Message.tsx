import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { MessageProps, OperationStatus } from '../types';
import { API_CONFIG, FEATURES, BLOCKCHAIN, REGEX } from '../constants';

/**
 * Message component that renders individual chat messages with support for:
 * - Text content with multi-line formatting
 * - Image display with NFT minting capabilities
 * - Minting workflow with wallet address management
 * - Transaction status tracking and explorer links
 * - Error handling and loading states
 */
const Message: React.FC<MessageProps> = ({ 
  message, 
  latestWallet, 
  updateNFT, 
  messageIndex 
}) => {
  // Minting state management
  const [showMintForm, setShowMintForm] = useState(false);
  const [mintWalletAddress, setMintWalletAddress] = useState(latestWallet);
  const [isMinting, setIsMinting] = useState(false);
  const [mintStatus, setMintStatus] = useState<OperationStatus>('idle');

  /**
   * Sync mintWalletAddress with latestWallet when it changes
   * This ensures that when the global wallet is updated, the minting wallet is also updated
   */
  useEffect(() => {
    setMintWalletAddress(latestWallet);
  }, [latestWallet]);

  /**
   * Extracts image URL from message content using regex pattern
   * Supports common image formats and handles both NFT object and content parsing
   * @param content - Message content to search for image URLs
   * @returns Image URL if found, null otherwise
   */
  const extractImageFromContent = (content: string): string | null => {
    if (!content || typeof content !== 'string') {
      return null;
    }
    
    const match = content.match(REGEX.IMAGE_URL);
    return match ? match[0] : null;
  };

  // Get image URL from NFT object or extract from content
  const imageUrl = message.nft?.image || extractImageFromContent(message.content);

  /**
   * Handles the NFT minting process
   * Sends mint request to backend with image, prompt, and wallet data
   * Updates message state and adds success notification
   */
  const handleMint = async () => {
    if (!imageUrl || !mintWalletAddress.trim()) return;

    setIsMinting(true);
    setMintStatus('idle');

    try {
      const response = await axios.post(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.MINT}`, {
        image: imageUrl,
        prompt: message.nft?.prompt || 'Generated image',
        wallet: mintWalletAddress.trim()
      });

      // Extract transaction hash from response
      const txHash = response.data.txHash || response.data.hash;
      
      // Update the NFT hash in the current message
      updateNFT(messageIndex, txHash);
      
      setMintStatus('success');
    } catch (error) {
      console.error('Error minting NFT:', error);
      setMintStatus('error');
    } finally {
      setIsMinting(false);
    }
  };

  /**
   * Handles mint button click with wallet validation
   * Either mints directly if wallet is set, or shows form for wallet input
   */
  const handleMintButtonClick = () => {
    if (latestWallet) {
      // If wallet is already set, mint directly
      handleMint();
    } else {
      // Show form to enter wallet address
      setShowMintForm(true);
    }
  };

  /**
   * Renders message content with proper line break handling
   * Supports both string and object content types
   */
  const renderMessageContent = () => {
    if (message.content && typeof message.content === 'string') {
      return message.content.split('\n').map((line, index) => (
        <p key={index}>{line}</p>
      ));
    } else if (message.content && typeof message.content !== 'string') {
      return <p>{JSON.stringify(message.content)}</p>;
    }
    return null;
  };

  /**
   * Renders the NFT minting interface
   * Shows mint button, form, or status messages based on current state
   */
  const renderMintingInterface = () => {
    if (!FEATURES.IS_MINTING_ACTIVE || !imageUrl) return null;

    return (
      <>
        {/* Mint button overlay - shown when no hash exists */}
        {!message.nft?.hash && (
          <div className="image-overlay">
            <button 
              className="mint-button"
              onClick={handleMintButtonClick}
              disabled={isMinting}
            >
              {isMinting ? 'Minting...' : 'Mint NFT'}
            </button>
          </div>
        )}

        {/* Wallet input form - shown when no wallet is set */}
        {showMintForm && !message.nft?.hash && !latestWallet && (
          <div className="mint-form">
            <input
              type="text"
              placeholder="Enter wallet address (0x...)"
              value={mintWalletAddress}
              onChange={(e) => setMintWalletAddress(e.target.value)}
              className="wallet-input"
            />
            <div className="mint-form-buttons">
              <button 
                onClick={handleMint}
                disabled={!mintWalletAddress.trim() || isMinting}
                className="mint-submit-btn"
              >
                {isMinting ? 'Minting...' : 'Mint'}
              </button>
              <button 
                onClick={() => setShowMintForm(false)}
                className="cancel-btn"
                disabled={isMinting}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Success message with explorer link */}
        {message.nft?.hash && mintStatus === 'success' && (
          <div className="mint-success">
            <span>✅ NFT minted successfully!</span>
            <a 
              href={`${BLOCKCHAIN.THETA_TESTNET_EXPLORER}/${message.nft?.hash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="explorer-link"
            >
              View on Theta Explorer
            </a>
          </div>
        )}

        {/* Error message */}
        {mintStatus === 'error' && (
          <div className="mint-error">
            <span>❌ Failed to mint NFT. Please try again.</span>
          </div>
        )}
      </>
    );
  };

  return (
    <div className={`message ${message.role}`}>
      <div className="message-content">
        {/* Message text content */}
        <div className="message-text">
          {renderMessageContent()}
        </div>

        {/* Image display with minting interface */}
        {imageUrl && (
          <div className="image-container">
            <img 
              src={imageUrl} 
              alt="Generated content" 
              className="message-image"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            
            {renderMintingInterface()}
          </div>
        )}
      </div>
    </div>
  );
};

export default Message; 