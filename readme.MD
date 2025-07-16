# hwdeboer1977 / Other

This repository contains a collection of smaller or standalone projects related to decentralized applications, blockchain development, and browser extensions. Each folder represents a separate project that was created for learning, prototyping, or testing purposes.

## 📁 Projects

### 1. `Custom_wallet_extension`

A minimal browser extension (Chrome) that implements a custom Ethereum wallet. Key features:

- Generates Ethereum wallet from a private key
- Displays address, public key, and private key
- UI built with popup.html for Chrome Extension interaction
- Uses `ethers.js` for key management

### 2. `Flashbots`

A prototype interacting with Flashbots on testnet. Features:

- Simulates MEV protection by submitting private transactions
- Uses Flashbots RPC endpoint and bundle creation
- Basic setup for submitting bundles

### 3. `React_dapp_1`

A basic React-based decentralized application (dApp). Includes:

- Web3 wallet connection
- Interaction with smart contracts (e.g., read/write functions)
- Boilerplate for future expansion

## 📦 Tech Stack

- **Solidity**
- **JavaScript**
- **HTML**
- **React**
- **ethers.js**
- **Chrome Extension APIs**

## 🚀 Getting Started

Each folder is self-contained. To run a project:

```bash
cd <ProjectFolder>
# For React-based projects
npm install
npm start
```
