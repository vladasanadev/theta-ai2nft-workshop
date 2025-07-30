import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import Message from './Message';
import { NFT, ChatMessage, NFTHandlerProps } from '../types';
import { API_CONFIG } from '../constants';

/**
 * Chatbot component that handles the conversation interface between users and the AI
 * Manages message history, user input, and communication with the backend API
 * 
 * Features:
 * - Real-time chat with AI assistant
 * - Image generation and display
 * - NFT creation workflow
 * - Auto-scroll to latest messages
 * - Loading states with typing indicator
 */
const Chatbot: React.FC<NFTHandlerProps> = ({ nft, onNFTChange }) => {
  // Chat state management
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Ref for auto-scrolling to bottom of messages
  const messagesEndRef = useRef<HTMLDivElement>(null);

  /**
   * Scrolls the message container to the bottom to show the latest message
   * Uses smooth scrolling for better user experience
   */
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  /**
   * Auto-scroll to bottom whenever messages change
   * Ensures users always see the latest message
   */
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  /**
   * Extracts text content from API response with fallback handling
   * Handles various response formats from the backend
   * @param responseOutput - The output from the API response
   * @returns Extracted string content or fallback message
   */
  const extractResponseContent = (responseOutput: any): string => {
    if (!responseOutput) return 'No response content';
    
    // Handle direct string response
    if (typeof responseOutput === 'string') {
      return responseOutput;
    }
    
    // Handle object responses with message or content properties
    if (typeof responseOutput === 'object') {
      if (responseOutput.message && typeof responseOutput.message === 'string') {
        return responseOutput.message;
      }
      if (responseOutput.content && typeof responseOutput.content === 'string') {
        return responseOutput.content;
      }
    }
    
    // Fallback to JSON stringification
    return JSON.stringify(responseOutput);
  };

  /**
   * Sends a message to the backend API and handles the response
   * Manages loading states and error handling
   */
  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    // Create user message and add to chat
    const userMessage: ChatMessage = {
      role: 'user',
      content: inputValue
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Prepare conversation history for API
      const conversationHistory = [
        ...messages.map(msg => ({ role: msg.role, content: msg.content })),
        { role: 'user', content: inputValue }
      ];

      // Send request to backend
      const response = await axios.post(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CHAT}`, {
        messages: conversationHistory,
        nft: nft
      });

      // Extract and process response content
      const content = extractResponseContent(response.data.result.output);

      // Create assistant message
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: content,
        nft: response.data.result.output?.nft || undefined
      };

      // Update NFT state if new NFT data is available
      if (response.data.latestNFT) {
        onNFTChange(response.data.latestNFT);
      }

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Add error message to chat
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handles keyboard events in the input field
   * Allows sending messages with Enter key (without Shift)
   * @param e - Keyboard event
   */
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  /**
   * Updates NFT hash in a specific message after successful minting
   * Also adds a success message to the chat
   * @param messageIndex - Index of the message to update
   * @param hash - Transaction hash from successful mint
   */
  const updateNFT = (messageIndex: number, hash: string) => {
    const newMessages = [...messages];
    const message = newMessages[messageIndex];
    
    if (message && message.nft) {
      message.nft.hash = hash;
      setMessages(newMessages);
      
      // Add success message after updating the NFT
      addMintSuccessMessage(hash);
    }
  };

  /**
   * Adds a success message to the chat after NFT minting
   * @param hash - Transaction hash of the minted NFT
   */
  const addMintSuccessMessage = (hash: string) => {
    const mintSuccessMessage: ChatMessage = {
      role: 'assistant',
      content: `NFT minted into your wallet with hash: ${hash}`,
    };
    setMessages(prev => [...prev, mintSuccessMessage]);
  };

  return (
    <div className="chatbot">
      <div className="chat-messages">
        {/* Welcome message shown when no messages exist */}
        {messages.length === 0 && (
          <div className="welcome-message">
            <h2>Welcome to AI to NFT Workshop!</h2>
            <p>Start a conversation and when an image is generated, you can mint it as an NFT.</p>
          </div>
        )}
        
        {/* Render all chat messages */}
        {messages.map((message, index) => (
          <Message
            key={`${message.role}-${index}`}
            message={message}
            latestWallet={nft.wallet}
            updateNFT={updateNFT}
            messageIndex={index}
          />
        ))}
        
        {/* Loading indicator */}
        {isLoading && (
          <div className="loading-message">
            <div className="typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}
        
        {/* Auto-scroll target */}
        <div ref={messagesEndRef} />
      </div>

      {/* Message input area */}
      <div className="chat-input-container">
        <div className="chat-input-wrapper">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            className="chat-input"
            rows={1}
            disabled={isLoading}
          />
          <button
            onClick={sendMessage}
            disabled={!inputValue.trim() || isLoading}
            className="send-button"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chatbot; 