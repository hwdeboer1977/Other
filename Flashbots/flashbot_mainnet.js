// Importing the ethers library to interact with Ethereum blockchain
import { ethers } from "ethers";
// Importing the FlashbotsBundleProvider from the Flashbots library for sending bundled transactions
import { FlashbotsBundleProvider } from "@flashbots/ethers-provider-bundle";

// Load environment variables from the .env file
// Import the 'config' function from dotenv to read variables like private keys and API keys
import { config } from "dotenv";
// Initialize the environment variables
config();

// Access environment variables that are stored in the .env file
// PRIVATE_KEY is the wallet private key and API_MAINNET is the RPC endpoint for the Ethereum mainnet
const privateKey = process.env.PRIVATE_KEY;
const apiKey = process.env.API_MAINNET;

// Create a new Ethereum provider using the API key for a JSON RPC provider
const provider = new ethers.providers.JsonRpcProvider(apiKey);

// Example wallet address for checking balance
const walletAddress = "0xBBe2ded2c9E0C8B6f0D36ab8e533509f98Ce05aF";

// Create a wallet instance using the private key and provider
const wallet = new ethers.Wallet(privateKey, provider);

// Set initial nonce value to 0 (used for transaction counting)
let nonce = 0;

// Fetch the balance of the wallet address and log it in ETH format
provider.getBalance(walletAddress).then((balance) => {
  console.log("Wallet balance (ETH):", ethers.utils.formatEther(balance));
});

// Function to get a Flashbots provider for sending Flashbots transactions
async function getFlashbotsProvider() {
  // Create a Flashbots provider that allows bundling of transactions
  const flashbotsProvider = await FlashbotsBundleProvider.create(
    provider, // The Ethereum provider for network interaction
    wallet, // The wallet that will sign the Flashbots transactions
    "https://relay.flashbots.net", // URL for the mainnet Flashbots relay
    "mainnet" // Network type (mainnet or goerli)
    // You could also use the Sepolia or Goerli networks:
    // "https://relay-sepolia.flashbots.net",
    // "sepolia"
  );

  return flashbotsProvider;
}

// Connect to Flashbots relay and confirm connection
getFlashbotsProvider().then((flashbotsProvider) => {
  console.log("Connected to Flashbots relay!");
});

// Function to send a bundle of transactions through Flashbots
async function sendBundle() {
  // Get the Flashbots provider instance
  const flashbotsProvider = await getFlashbotsProvider();
  const blockNumber = await provider.getBlockNumber(); // Get the current block number

  // Fetch the current nonce for the sender's address, used to prevent double-spending
  nonce = await provider.getTransactionCount(wallet.address, "pending");
  console.log("nonce: " + nonce);

  // Set a gas limit for the transaction
  const setGasLimit = 300000;

  // Fetch the current gas price from the provider and increase it by 50% to prioritize the transaction
  const gasPrice = await provider.getGasPrice();
  const increasedGasPrice = gasPrice.mul(300).div(100); // Add 50% premium

  // Prepare the main transaction object
  const transaction = {
    to: "0x7C03A3238C4A53bC87673e093Ffc0185866909Dd", // The recipient address
    value: ethers.utils.parseEther("0.001"), // Sending 0.001 ETH
    gasLimit: setGasLimit, // Gas limit for the transaction
    gasPrice: increasedGasPrice, // Gas price with added premium
    nonce: nonce, // Nonce to avoid transaction duplication
    data: "0x", // Empty data field for a simple transaction
  };

  // Example of adding a priority fee for a faster transaction
  /*
  const baseFee = await provider.getGasPrice(); // Current base fee for Ethereum
  const priorityFee = ethers.utils.parseUnits("10", "gwei"); // High priority fee
  const maxFeePerGas = baseFee.add(priorityFee); // Max fee calculation

  const transaction = {
    to: "0x7C03A3238C4A53bC87673e093Ffc0185866909Dd", // Example address
    value: ethers.utils.parseEther("0.1"), // 0.1 ETH
    gasLimit: gasLimit, // Estimated gas usage
    maxPriorityFeePerGas: priorityFee, // Priority fee to incentivize miners
    maxFeePerGas: maxFeePerGas, // Max fee based on base fee + priority fee
    type: 2 // EIP-1559 transaction type
  };
  */

  // Fetch the current nonce again after potentially changing it in the transaction
  nonce = await provider.getTransactionCount(wallet.address, "pending");
  console.log("nonce: " + nonce);

  // Sign the transaction using the wallet instance
  const signedTransaction = await wallet.signTransaction(transaction);

  // Get the block miner's address to send a miner tip (bribe for priority)
  const blockCoinbase = await provider
    .getBlock(blockNumber)
    .then((block) => block.miner);

  // Prepare the miner tip transaction
  const minerTipTransaction = {
    to: blockCoinbase, // Miner address
    value: ethers.utils.parseEther("0.02"), // Sending 0.02 ETH as tip
    gasLimit: setGasLimit, // Same gas limit as the main transaction
    nonce: nonce + 1, // Increment the nonce for the miner tip
    gasPrice: increasedGasPrice, // Same gas price premium for miner tip
  };

  // Sign the miner tip transaction
  const signedTipTransaction = await wallet.signTransaction(
    minerTipTransaction
  );

  // Bundle the main transaction and miner tip transaction into a Flashbots bundle
  const bundle = [
    { signedTransaction },
    { signedTransaction: signedTipTransaction }, // Include the tip transaction as well
  ];

  // Sign the entire bundle of transactions using the Flashbots provider
  const signedTransactions = await flashbotsProvider.signBundle(bundle);

  // Simulate the bundle before sending to ensure it will be successful
  const simulation = await flashbotsProvider.simulate(
    signedTransactions, // Signed bundle of transactions
    blockNumber + 1 // Target block number for the transaction inclusion
  );

  // Check if the simulation was successful or failed
  if ("error" in simulation) {
    console.error("Simulation failed:", simulation.error.message);
    return;
  } else {
    console.log("Simulation successful:", simulation);
  }

  // Send the bundle of transactions to Flashbots for inclusion in the next block(s)
  const bundlePromises = await flashbotsProvider.sendRawBundle(
    signedTransactions,
    blockNumber + 1, // Send the bundle to the next block
    blockNumber + 2, // Specify future blocks for execution
    blockNumber + 3,
    blockNumber + 4,
    blockNumber + 5,
    blockNumber + 6,
    blockNumber + 7,
    blockNumber + 8,
    blockNumber + 9
  );

  // If an error occurs during bundle sending, log it
  if ("error" in bundlePromises) {
    console.error("Error in bundlePromises:", bundlePromises.error.message);
    return;
  }

  /*
  // Optional: Check if the bundle was successfully included in the block
  const receipt = await bundlePromises.wait();
  if (receipt === 0) {
    console.log("Bundle successfully included in block");
  } else {
    console.log("Bundle not included in block");
  }
  */
}

// Invoke the sendBundle function to initiate the bundle sending process
sendBundle();
