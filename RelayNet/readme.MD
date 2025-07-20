# 🔁 RelayNet

RelayNet is an intent-based execution protocol that connects on-chain users with off-chain relayers.  
It enables decentralized trade intent creation and automated execution across trading platforms such as **Hyperliquid** and **Drift**.

---

## ✨ Features

- ✅ **On-chain `IntentStorage` contract** written in Solidity
  Located at `RelayNet/solidity/contracts/IntentStorage.sol`

  - Stores user trade instructions using a `struct Intent`
  - Fields: `platform`, `coin`, `side`, `size`, `minPrice`, `timestamp`, `status`
  - Uses typed `enum` structures for platform, side, and status to reduce ambiguity and improve auditability
  - Deploy this contract to **Arbitrum mainnet**

- 🌀 **Full intent lifecycle** with following Solidity functions:

  - `createIntent()` – submit a new trade intent
  - `updateIntent()` – modify active intent
  - `clearIntent()` – cancel and remove intent

- 🔄 **Off-chain relayer** written in Python

  - Listens for on-chain events:  
    `IntentCreated`, `IntentUpdated`, `IntentCancelled`
  - Executes trades and cancellations on **Hyperliquid** based on the on-chain intent state
  - Actions performed:
    - Market buys and sells
    - Order cancellation
    - Order updates (cancel + replace)

- 🌉 **Cross-chain-ready architecture**

  - Easily extendable to support additional trading platforms like Drift, Vertex, or cross-chain messaging layers

- 🔐 **Trust-minimized by design**

  - On-chain state is fully transparent and queryable by users
  - The off-chain relayer performs stateless execution: no privileged access or off-chain storage
  - Compact and auditable storage format using Solidity `enum` and `bytes32`

## 🚀 How to Run

Follow these steps to set up and execute RelayNet:

1. **Create a Hyperliquid Account**

   - Connect your wallet on [https://app.hyperliquid.xyz](https://app.hyperliquid.xyz)
   - Deposit **USDC** and transfer it to your **Perps** balance

2. **Deploy the Solidity Contract**

   - Deploy `RelayNet/solidity/contracts/IntentStorage.sol` to **Arbitrum mainnet**
   - Verify and publish the contract on Arbiscan (optional but recommended)

3. **Run the Relayer**

   - The relayer listens to on-chain events and automatically executes or cancels trades
   - Start the relayer:
     ```bash
     python src/relayer.py
     ```

4. **Create or Modify an Intent**

   - Make sure your `.env` file is configured with the following keys:

     ```
     RPC_URL=
     PRIVATE_KEY=
     CONTRACT_ADDRESS=
     USER=
     ```

   - Then run:

     ```bash
     # Create a new intent (if none active)
     python src/createIntent.py create

     # Update existing intent (must be active)
     python src/createIntent.py update

     # Cancel current intent (if active)
     python src/createIntent.py delete

     # View current intent details
     python src/createIntent.py check
     ```
