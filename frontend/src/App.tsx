import React, { useState, useEffect } from 'react';
import './App.css';
import './components/components.css';
import Chatbot from './components/Chatbot';
import WalletDisplay from './components/WalletDisplay';
import { NFT } from './types';
import { STORAGE_KEYS } from './constants';

/**
 * Main application component that manages global state and renders the chat interface
 * Handles wallet persistence and NFT state management across components
 */
function App() {
  // Initialize NFT state with empty values
  const [nft, setNft] = useState<NFT>({
    image: '',
    prompt: '',
    wallet: ''
  });

  /**
   * Load persisted wallet address from localStorage on component mount
   * This ensures user doesn't lose their wallet connection on page refresh
   */
  useEffect(() => {
    const savedWallet = localStorage.getItem(STORAGE_KEYS.WALLET_ADDRESS);
    if (savedWallet) {
      setNft((prevNft) => ({
        ...prevNft,
        wallet: savedWallet
      }));
    }
  }, []);

  /**
   * Handles wallet address changes from the WalletDisplay component
   * Updates local state and persists to localStorage
   * @param address - The new wallet address
   */
  const handleWalletChange = (address: string) => {
    setNft((prevNft) => ({
      ...prevNft,
      wallet: address
    }));
    localStorage.setItem(STORAGE_KEYS.WALLET_ADDRESS, address);
  };

  /**
   * Handles NFT updates from the Chatbot component
   * Updates the entire NFT object and persists wallet address
   * @param nftData - The updated NFT data
   */
  const handleNFTChange = (nftData: NFT) => {
    setNft(nftData);
    // Persist wallet address to localStorage for future sessions
    localStorage.setItem(STORAGE_KEYS.WALLET_ADDRESS, nftData.wallet);
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>AI to NFT Workshop</h1>
        <WalletDisplay 
          walletAddress={nft.wallet} 
          onWalletChange={handleWalletChange} 
        />
      </header>
      <main className="App-main">
        <Chatbot nft={nft} onNFTChange={handleNFTChange} />
      </main>
    </div>
  );
}

export default App; 