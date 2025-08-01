# 6. NFT Minting Integration Guide

Welcome to **Guide 6** of the Theta AI2NFT Workshop! 🪙⛓️

This is where everything comes together! You'll connect your AI-powered backend to your deployed smart contract, enabling automatic NFT minting from AI-generated images. By the end of this guide, you'll have a complete AI-to-NFT pipeline that can create, process, and mint digital artwork on the Theta blockchain.

## 🎯 What You'll Accomplish

By the end of this guide, you'll have:
- ✅ **Blockchain Integration** - Connect backend to your smart contract
- ✅ **Wallet Detection** - Automatically detect and validate wallet addresses
- ✅ **NFT Metadata Creation** - Generate proper JSON metadata for NFTs
- ✅ **Automated Minting** - Mint NFTs programmatically with ethers.js
- ✅ **Transaction Handling** - Manage blockchain transactions and confirmations
- ✅ **Complete AI2NFT Pipeline** - Full workflow from chat to minted NFT

---

## 🧠 Step 1: Understanding the NFT Minting Workflow

### **1.1 The Complete Pipeline**

```
User Request → AI Image → Wallet Input → Metadata Creation → Blockchain Minting
      ↓           ↓           ↓              ↓                   ↓
"Draw a cat"  Generated   "0x123..."    JSON metadata      NFT on Theta
             cat image                   with image URL      blockchain
```

### **1.2 Three-Phase Integration**

#### **Phase 1: Environment Setup**
- **Frontend**: Enable minting UI components
- **Backend**: Configure blockchain connection parameters
- **Security**: Set up wallet keystore and credentials

#### **Phase 2: Wallet Management**
- **Detection**: Automatically identify wallet addresses in chat
- **Validation**: Ensure addresses are properly formatted

#### **Phase 3: Blockchain Operations**
- **Metadata**: Create compliant JSON metadata for NFTs
- **Contract Interaction**: Connect to deployed smart contract
- **Minting**: Execute blockchain transactions
- **Confirmation**: Wait for transaction success

### **1.3 Key Components Overview**

| Component | Purpose | Technology |
|-----------|---------|------------|
| **Frontend State** | Enable minting UI | React environment variables |
| **Wallet Detection** | Find addresses in chat | Regex + ethers.js validation |
| **Metadata Generation** | Create NFT JSON data | Base64 encoding |
| **Blockchain Connection** | Interface with Theta | ethers.js + JSON-RPC |
| **Smart Contract** | Execute minting | Your deployed AINFT contract |

---

## ⚙️ Step 2: Environment Configuration

### **2.1 Frontend Configuration**

#### **Step 2.1.1: Enable Minting UI**

Create or update `frontend/.env`:

```env
# Enable NFT minting functionality in the UI
REACT_APP_IS_MINTING_ACTIVE=true

# Backend API endpoint (should already be set)
REACT_APP_BACKEND_URL=http://localhost:4000
```

#### **Understanding Frontend Variables**
- **`REACT_APP_IS_MINTING_ACTIVE`**: Controls whether minting buttons appear
- **Security Note**: React env vars are public - never put secrets here!

### **2.2 Backend Configuration**

#### **Step 2.2.1: Blockchain Connection Setup**

Add to your `backend/.env`:

```env
# Your deployed NFT contract address from Guide 5
NFT_CONTRACT=0x742d35Cc6aB...your-contract-address

# Theta testnet RPC endpoint
THETA_RPC_URL=https://eth-rpc-api-testnet.thetatoken.org/rpc

# Wallet keystore file path (relative to backend folder)
WALLET_PATH=./wallet-keystore.json

# Wallet password used when creating the keystore
WALLET_PASSWORD=your-secure-password
```

#### **Step 2.2.2: Setting Up Your Wallet Keystore**

**Critical**: You must use the same wallet that deployed the contract!

1. **Download your keystore** from Theta Web Wallet:
   - Go to wallet.thetatoken.org
   - Unlock your wallet
   - Click "Settings" → "Export Keystore"
   - Save as `wallet-keystore.json` in your `backend/` folder

2. **Verify file structure**:
```json
{
  "version": 3,
  "id": "...",
  "address": "your-wallet-address",
  "crypto": {
    // Encrypted wallet data
  }
}
```

#### **Step 2.2.3: Security Best Practices**

- **Never commit keystore files** - Add to `.gitignore`
- **Use strong passwords** - Your wallet security depends on it
- **Backup everything** - Store copies securely
- **Test with small amounts** - Always verify before production

---

## 🔍 Step 3: Wallet Detection Implementation

### **3.1 Understanding Wallet Detection**

Instead of using AI to detect wallet addresses, we use **regex pattern matching** because:
- **More reliable** - No LLM interpretation needed
- **Faster processing** - Instant validation
- **Cost effective** - No additional API calls
- **Precise matching** - Exact format validation

### **3.2 The Detection Process**

#### **How It Works**
```
User Input: "My wallet is 0x742d35Cc6aB41d9D942eC07c8805b5eeF87DFb70"
           ↓
Regex Match: Finds "0x" followed by 40 hex characters
           ↓
Ethers Validation: Confirms it's a valid Ethereum address
           ↓
Result: Returns validated address or null
```

### **3.3 Implementation Details**

The wallet detection happens in your existing `nftHandler.ts`:

```javascript
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
```

#### **Line-by-Line Breakdown**
1. **Empty check**: Return null if no messages
2. **Get last message**: Only check the most recent user input
3. **Regex matching**: Find potential Ethereum addresses
4. **Multiple addresses**: Take the last one if multiple found
5. **Validation**: Use ethers.js to confirm it's a valid address
6. **Return result**: Valid address or null

### **3.4 Integration with Chat Flow**

In your `server.ts`, this integrates into the existing flow:

```javascript
// Check if user wants to generate an image
const imageData = await handleGernarateImageCheck(body.messages);

if (imageData.image) {
  // Image generation path...
} else {
  // No image - check for wallet address
  const walletAddress = await filterWalletAddress(body.messages);
  
  if (walletAddress && typeof walletAddress === 'string') {
    // Wallet address detected - update NFT data
    oldNFT.wallet = walletAddress;
    completionResult = {
      output: {
        message: API_RESPONSES.WALLET_UPDATE_SUCCESS(walletAddress)
      },
      input: body.messages
    };
  } else {
    // Regular conversation
    completionResult = await handleCompletion(body.messages);
  }
}
```

---

## 📄 Step 4: NFT Metadata Creation

### **4.1 Understanding NFT Metadata**

**NFT Metadata** is a JSON file that describes your NFT:
- **Required for marketplaces** - How platforms display your NFT
- **Standard format** - Compatible across all NFT platforms
- **Immutable reference** - Stored permanently with the NFT

#### **Standard Metadata Structure**
```json
{
  "name": "Friendly name for the NFT",
  "image": "URL to the image file", 
  "description": "Detailed description of the NFT",
  "attributes": [
    {
      "trait_type": "Category",
      "value": "AI Generated"
    }
  ]
}
```

### **4.2 Our Metadata Strategy**

For this workshop, we use **on-chain metadata** storage:

#### **Advantages**
- ✅ **No external hosting** - Everything on blockchain
- ✅ **Permanent storage** - Can't disappear or break
- ✅ **Decentralized** - No single point of failure

#### **Trade-offs**
- ⚠️ **Higher gas costs** - More expensive to mint
- ⚠️ **Size limitations** - Large metadata increases costs
- ⚠️ **Image URLs** - Still need external hosting for images

#### **Production Considerations**
In production, you should:
- **Download images** - Store permanently on IPFS/Arweave
- **Host metadata** - Use decentralized storage
- **Optimize costs** - Balance permanence vs. expenses

### **4.3 Metadata Generation Implementation**

#### **Our Enhanced Metadata Function**
```javascript
function generateMetadata(nft: NFTInterface): string {
  const metadata = {
    name: `${nft.prompt}`,
    image: nft.image,
    description: `AI-generated NFT created from prompt: "${nft.prompt}"`,
    ]
  };

  // Encode as base64 for on-chain storage
  const encoded = Buffer.from(JSON.stringify(metadata)).toString("base64");
  return `data:application/json;base64,${encoded}`;
}
```

#### **Metadata Breakdown**
- **Name**: Descriptive title including the prompt
- **Image**: Direct URL from Flux.1-schnell (temporary)
- **Description**: Rich description including generation details

#### **Base64 Encoding**
- **Purpose**: Store JSON data directly in smart contract
- **Format**: `data:application/json;base64,{encoded-data}`
- **Decoding**: Any application can decode and read the JSON

---

## ⛓️ Step 5: Blockchain Integration with ethers.js

### **5.1 Understanding ethers.js**

**ethers.js** is the standard library for Ethereum interaction:
- **Wallet management** - Load and use private keys securely
- **Provider connection** - Connect to blockchain networks
- **Contract interaction** - Call smart contract functions
- **Transaction handling** - Send and monitor blockchain transactions

### **5.2 The Minting Process Architecture**

#### **Six-Step Minting Process**
```
1. Load Wallet → 2. Create Provider → 3. Connect Wallet → 4. Create Contract → 5. Execute Mint → 6. Wait for Confirmation
       ↓                    ↓                  ↓                  ↓                ↓                    ↓
   From keystore      Theta RPC URL     Wallet + Provider    ABI + Address    safeMint() call    Transaction hash
```

### **5.3 Complete Minting Implementation**

#### **The Core Minting Function**
```javascript
export async function mintNFT(nft: NFTInterface): Promise<string> {
  // Step 1: Validate configuration
  validateBlockchainConfig();
  
  // Step 2: Load wallet from keystore
  const wallet = await loadWalletFromKeystore();
  if (!wallet) {
    throw new Error(API_RESPONSES.ERRORS.WALLET_NOT_FOUND);
  }

  // Step 3: Create provider and connect wallet
  const provider = new ethers.JsonRpcProvider(BLOCKCHAIN_CONFIG.RPC_URL);
  const connectedWallet = wallet.connect(provider);
  
  // Step 4: Check wallet balance for gas fees
  const balance = await provider.getBalance(connectedWallet.address);
  
  if (balance === 0n) {
    throw new Error(API_RESPONSES.ERRORS.INSUFFICIENT_BALANCE);
  }

  // Step 5: Generate metadata and create contract instance
  const metadata = generateMetadata(nft);
  const contractABI = parseContractABI();
  
  const contract = new ethers.Contract(
    BLOCKCHAIN_CONFIG.NFT_CONTRACT!, 
    contractABI, 
    connectedWallet
  );
  
  // Step 6: Execute minting transaction
  const tx = await contract.safeMint(nft.wallet, metadata);
  
  // Step 7: Wait for transaction confirmation
  await tx.wait();
  
  return tx.hash;
}
```

### **5.4 Understanding Each Step**

#### **Step 1: Configuration Validation**
```javascript
function validateBlockchainConfig(): void {
  if (!BLOCKCHAIN_CONFIG.NFT_CONTRACT) {
    throw new Error('NFT contract address is not configured');
  }
  if (!BLOCKCHAIN_CONFIG.RPC_URL) {
    throw new Error('Theta RPC URL is not configured');
  }
  // ... other validations
}
```

#### **Step 2: Wallet Loading**
```javascript
async function loadWalletFromKeystore(): Promise<ethers.HDNodeWallet | ethers.Wallet | null> {
  try {
    const keystore = fs.readFileSync(BLOCKCHAIN_CONFIG.WALLET_PATH, 'utf8');
    const wallet = await ethers.Wallet.fromEncryptedJson(keystore, BLOCKCHAIN_CONFIG.WALLET_PASSWORD);
    return wallet;
  } catch (error) {
    console.error('Error loading wallet from keystore:', error);
    return null;
  }
}
```

#### **Step 3: Provider Connection**
- **JsonRpcProvider**: Connects to Theta blockchain
- **wallet.connect()**: Associates wallet with network

#### **Step 4: Balance Check**
- **Prevents failed transactions** - Ensure gas is available
- **Uses BigInt** - Ethereum uses 256-bit integers
- **Error early** - Fail fast if insufficient funds

#### **Step 5: Contract Setup**
- **ABI parsing** - Load contract interface
- **Contract instance** - Connect to deployed contract
- **Connected wallet** - Enables transaction signing

#### **Step 6: Transaction Execution**
- **safeMint()** - Calls your contract's minting function
- **Parameters**: Recipient address and metadata URI
- **Returns**: Transaction object with hash

#### **Step 7: Confirmation**
- **tx.wait()** - Waits for blockchain confirmation
- **Network finality** - Ensures transaction is permanent
- **Returns**: Transaction receipt with details

---

## 🧪 Step 6: Testing Your Complete Pipeline

### **6.1 End-to-End Testing Workflow**

#### **Test Scenario: Complete AI2NFT Flow**

1. **Start your backend** (`npm run dev` in backend folder)
2. **Start your frontend** (`npm start` in frontend folder)
3. **Open frontend** at `http://localhost:3000`

#### **Step-by-Step Test**

**Phase 1: Generate an Image**
```
You: "Draw me a futuristic city"
Expected: AI generates image and displays it
```

**Phase 2: Add Wallet Address**
```
You: "My wallet is 0x742d35Cc6aB41d9D942eC07c8805b5eeF87DFb70"
Expected: AI confirms wallet address updated
```

**Phase 3: Mint the NFT**
```
Action: Click "Mint NFT" button on the generated image
Expected: Minting process starts, transaction hash appears
```

### **6.2 Monitoring the Process**

#### **Backend Logs to Watch**
```bash
# When wallet is detected:
Wallet address detected: 0x742d35Cc6aB41d9D942eC07c8805b5eeF87DFb70

# When minting starts:
Starting NFT mint process...
Contract address: 0x123...
Recipient: 0x742...
Metadata length: 856 characters

# When transaction is sent:
Transaction submitted, waiting for confirmation...

# When complete:
NFT minted successfully! Hash: 0xabc123...
```

#### **Frontend UI States**
- **Idle**: "Mint NFT" button visible
- **Processing**: "Minting..." with loading indicator
- **Success**: Transaction hash link to Theta Explorer
- **Error**: Error message with retry option

### **6.3 Verifying Your NFT**

#### **Step 6.3.1: Check Theta Explorer**
1. **Copy transaction hash** from frontend or backend logs
2. **Go to** [testnet-explorer.thetatoken.org](https://testnet-explorer.thetatoken.org)
3. **Search for your transaction hash**
4. **Verify transaction details**:
   - Status: Success ✅
   - To: Your contract address
   - Function: safeMint
   - Gas used: ~1-3 TFUEL

#### **Step 6.3.2: Check Contract State**
1. **Go to your contract** on Theta Explorer
2. **Click "Read Contract"** tab
3. **Call `totalSupply()`** - Should be 1 (or higher)
4. **Call `tokenURI(1)`** - Should return your metadata

#### **Step 6.3.3: Decode Metadata**
Your metadata is base64 encoded. To decode:
```javascript
// Copy the tokenURI result (starts with "data:application/json;base64,")
const base64Data = "eyJuYW1lIjoiQUkg..."; // Your base64 string
const decoded = Buffer.from(base64Data, 'base64').toString('utf8');
const metadata = JSON.parse(decoded);
console.log(metadata);
```

---

## 🔧 Step 7: Troubleshooting Common Issues

### **7.1 Environment Setup Issues**

#### **"Contract address is not configured"**
**Symptoms**: Backend throws error on mint attempt

**Solutions**:
- Verify `NFT_CONTRACT` is set in backend `.env`
- Ensure contract address starts with "0x"
- Double-check address from Guide 5 deployment

#### **"Wallet keystore not found"**
**Symptoms**: Cannot load wallet from keystore

**Solutions**:
- Verify `WALLET_PATH` points to correct file
- Check file exists in backend folder
- Ensure keystore file is valid JSON

#### **"Incorrect wallet password"**
**Symptoms**: Keystore decryption fails

**Solutions**:
- Verify `WALLET_PASSWORD` matches keystore creation
- Re-download keystore from Theta Web Wallet
- Try creating new keystore with known password

### **7.2 Wallet Detection Issues**

#### **"Wallet address not detected"**
**Symptoms**: Valid addresses not recognized

**Test with these formats**:
```
✅ "0x742d35Cc6aB41d9D942eC07c8805b5eeF87DFb70"
✅ "My address: 0x742d35Cc6aB41d9D942eC07c8805b5eeF87DFb70"
✅ "Send to 0x742d35Cc6aB41d9D942eC07c8805b5eeF87DFb70 please"
❌ "742d35Cc6aB41d9D942eC07c8805b5eeF87DFb70" (missing 0x)
❌ "0x742d35" (too short)
```

#### **"Invalid address format"**
**Solutions**:
- Ensure address starts with "0x"
- Verify address is exactly 42 characters
- Use addresses from Theta Web Wallet

### **7.3 Blockchain Transaction Issues**

#### **"Insufficient balance for gas"**
**Symptoms**: Transaction fails due to lack of TFUEL

**Solutions**:
- Get more testnet TFUEL from faucet
- Check wallet balance on Theta Explorer
- Ensure you're using the same wallet that deployed contract

#### **"Transaction reverted"**
**Symptoms**: Smart contract rejects transaction

**Common Causes**:
- **Not contract owner**: Only deployer can mint
- **Invalid recipient**: Check wallet address format
- **Contract paused**: Verify contract is operational

#### **"Transaction taking too long"**
**Symptoms**: `tx.wait()` never resolves

**Solutions**:
- Network congestion - wait longer
- Increase gas limit in transaction
- Check Theta network status

### **7.4 Metadata Issues**

#### **"Metadata too large"**
**Symptoms**: High gas costs or transaction failures

**Solutions**:
- Reduce description length
- Consider off-chain metadata storage

#### **"Image not displaying"**
**Symptoms**: NFT shows but no image in marketplaces

**Causes**:
- Flux.1-schnell URLs are temporary
- Image URL becomes invalid over time
- CORS issues with image hosting

**Production Solution**:
- Download and re-host images permanently
- Use IPFS or Arweave for decentralized storage

---

## ✅ Verification Checklist

- [ ] **Frontend configured** – `REACT_APP_IS_MINTING_ACTIVE=true`
- [ ] **Backend configured** – `NFT_CONTRACT`, `WALLET_PATH` & `WALLET_PASSWORD` set
- [ ] **Chat system works** – (Guide 3)
- [ ] **Image generation works** – (Guide 4)
- [ ] **Wallet address detection works**
- [ ] **Mint button appears** – On generated images
- [ ] **Minting completes** – Transaction hash returned
- [ ] **Transaction visible** – On Theta Explorer

---

## 🎯 What's Next?

🎉 **Congratulations!** You've built a complete AI2NFT pipeline! Your system can now:

- Generate images from text prompts using AI
- Detect wallet addresses in natural conversation
- Create proper NFT metadata
- Mint NFTs on the Theta blockchain
- Handle the complete workflow from chat to blockchain

### **Ready for Advanced AI Features?**

In the final guide, you'll explore advanced AI capabilities:

- **Prompt Optimization & Styling** - Master advanced prompt engineering techniques for better image generation
- **RAG Chat API** - Implement knowledge-based LLMs with Retrieval-Augmented Generation
- **Community Node Hosting** - Host your own LLM (Deepseek) on Theta EdgeCloud Community Nodes

**Ready to unlock advanced AI capabilities?** Let's move on to [**Guide 7: Advanced Features & Customization**](./07-advanced-features-customization.md)!

---

## 🏆 Achievement Unlocked

You've successfully built and deployed:
- ✅ **AI Chat Integration** - Llama 3.1 70B conversation
- ✅ **Image Generation** - Flux.1-schnell artwork creation  
- ✅ **Smart Contract** - Custom NFT contract on Theta
- ✅ **Blockchain Minting** - Automated NFT creation
- ✅ **Full-Stack Application** - Complete web3 platform

> 💡 **Pro Tip**: Try different artistic prompts and see how they translate to NFTs. Each generation is unique and permanent on the blockchain!

> 🎨 **Creative Challenge**: Your AI2NFT system is now live! Try creating a series of themed NFTs - landscapes, portraits, abstract art, or anything you can imagine. Each one is a unique digital asset!

> 🚀 **Developer Achievement**: You've built a production-ready Web3 application that combines AI, blockchain, and full-stack development. This is the foundation for countless creative and commercial possibilities!