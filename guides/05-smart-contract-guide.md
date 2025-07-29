# Smart Contract Guide

In this guide, we’ll walk you through the NFT Smart Contract and explain how to deploy it on the Theta Blockchain!


## Smart Contract

### Introduction

A smart contract is a program that runs on a blockchain. It automatically enforces rules and logic when specific conditions are met, removing the need for intermediaries. On Theta (an Ethereum-compatible chain), smart contracts are written in Solidity and deployed to the Theta EVM.


## NFT Contract

### Overview

The NFT contract used in this project follows a standardized template to ensure interoperability and ease of integration. The standard is called ERC721 on Ethereum and TNT721 on Theta. These are functionally identical — the only difference is the name used on Theta.

We extend this standard using battle-tested libraries from OpenZeppelin (adapted for Theta), making our contract more powerful and secure.


### Libraries Used

The contract inherits from the following components:
	•	TNT721 – The base NFT standard (non-fungible token logic)
	•	TNT721Enumerable – Adds the ability to enumerate all tokens and those owned by each account
	•	TNT721URIStorage – Allows each NFT to have a unique metadata URI
	•	Ownable – Restricts certain functions to the contract owner (e.g. minting)

These extensions are commonly used to make NFT contracts feature-rich, maintainable, and secure.


### Flattened Contract

The contract is flattened, meaning all imported code is bundled into a single Solidity file. This is done for convenience and compatibility when deploying on block explorers or when working without dependency managers like Hardhat or Foundry.

In this guide, we will focus only on the custom logic of the contract.


### Contract Code
```solidity
// AINFT is a contract for creating and managing AI NFTs
contract AINFT is TNT721, TNT721Enumerable, TNT721URIStorage, Ownable {

    constructor() TNT721("AI NFT", "AINFT") Ownable() {}

    // Mint a new NFT
    // to: the address of the recipient
    // uri: the URI of the NFT
    function safeMint(address to, string memory uri) external onlyOwner {
        uint tokenId = totalSupply() + 1;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
    }

    // The following functions are overrides required by Solidity.
    function _beforeTokenTransfer(address from, address to, uint256 tokenId)
        internal
        override(TNT721, TNT721Enumerable)
    {
        super._beforeTokenTransfer(from, to, tokenId);
    }

    function _burn(uint256 tokenId)
        internal
        override(TNT721, TNT721URIStorage)
    {
        super._burn(tokenId);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(TNT721, TNT721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(TNT721, TNT721Enumerable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
```


### Minting Logic

We’ve added a key function: safeMint.
```solidity
function safeMint(address to, string memory uri) external onlyOwner
```
This function allows the owner of the contract to mint a new NFT and assign a token URI, which typically points to metadata hosted on IPFS or a centralized server.

Using onlyOwner ensures that only the deployer or designated admin can mint NFTs — preventing unauthorized minting.

## Contract Deployment
In this section, we’ll walk you through deploying your NFT smart contract to the Theta Testnet using the following tools:
- [Remix](https://remix.ethereum.org/):  For compiling the smart contract
- [Theta Web Wallet](https://wallet.thetatoken.org): To create a wallet, receive testnet TFuel, and deploy the contract
- [Theta Explorer (Testnet)](https://testnet-explorer.thetatoken.org): To verify your contract and inspect its status on-chain

### Step 1: Compile in Remix
1. Open [Remix](https://remix.ethereum.org/) in your browser.
2. In the left sidebar, click on “Contracts” → “Create New File”

    <img src="./images/remix-newfile.png" alt="Remix create new file" width="500"/>

3. Name the file: AINFT.sol
4. Copy and paste the full [contract code](./../contracts/nft-contract.sol) into the file
5. Go to the Solidity Compiler tab
    - Set the compiler version to 0.8.19
    - Click “Compile AINFT.sol”

        <img src="./images/remix-compiler.png" alt="Remix compile file" width="500"/>

✅ After compiling, make sure the AINFT contract is selected under the “Contract” dropdown.

📋 You’ll need the ABI and Bytecode from the compiler output later — you will find them below the contract selction.


### Step 2: Deploy with Theta Wallet
1. Open the [Theta Web Wallet](https://wallet.thetatoken.org)
2. Click “Create Wallet” and follow the setup process
    - Download the keystore file and save your mnemonic phrase
3. Unlock your wallet using the keystore file
4. Switch to the Testnet:
    Click on the chain name at the top left (Mainnet | Main Chain) and select Testnet | Main Chain

    <img src="./images/wallet-select-chain.png" alt="Theta Wallet select testnet" width="500"/>   

5. Click “Receive”, then “Faucet” to get free testnet TFuel
6. In the top bar, go to the “Contract” tab
7. Paste the ABI and Bytecode from Remix into the respective fields

    <img src="./images/deploy-contract.png" alt="Theta Wallet deploy contract" width="500"/> 

8. Click “Deploy Contract”

🚀 Your smart contract is now deployed!

You’ll see a Contract Address (0x…) at the top. Save this address — you’ll need it in the next steps.

🧪 You can test your deployment by selecting a read-only function (e.g. owner) and clicking “Read”. It should return your wallet address.

### Step 3: Verify in Theta Explorer
1. Go to [Theta Explorer (Testnet)](https://testnet-explorer.thetatoken.org)
2. Search for your contract address
2. Click the “Contract” tab
3. Fill in the fields
    - Compiler version: v0.8.19
    - Optimization: No
    - Solidity Source Code: Copy [this file](./../contracts/nft-contract.sol)
    - Leave the other fields as-is

        <img src="./images/verify-contract.png" alt="Explorer verify contract" width="500"/> 

4. Click “Verify and Publish”

✅ That’s it! You’ve successfully deployed and verified your NFT smart contract on the Theta Testnet.

## What’s Next
In the next section, you’ll learn:
- How to connect your backend to your smart contract
- How to mint an NFT using JavaScript
- How to create and host metadata for your NFTs

👉 Continue to [NFT Minting Guide](./06-nft-minting-guide.md)
