import { ethers } from "ethers";
import { FlashbotsBundleProvider } from "@flashbots/ethers-provider-bundle";

// Load environment variables from the .env file
// Import the 'config' function from dotenv
import { config } from "dotenv";
// Load environment variables from the .env file
config();

// Access environment variables
const privateKey = process.env.PRIVATE_KEY;
const apiKey = process.env.API_KEY;

const provider = new ethers.providers.JsonRpcProvider(apiKey);

// Example: Using ethers.js with the Alchemy provider to get the balance of an address
const walletAddress = "0xBBe2ded2c9E0C8B6f0D36ab8e533509f98Ce05aF";

const wallet = new ethers.Wallet(privateKey, provider);

let nonce = 0;

provider.getBalance(walletAddress).then((balance) => {
  console.log("Wallet balance (ETH):", ethers.utils.formatEther(balance));
});

async function getFlashbotsProvider() {
  const flashbotsProvider = await FlashbotsBundleProvider.create(
    provider, // The Ethereum provider
    wallet, // The wallet used to sign Flashbots requests
    //"https://relay.flashbots.net", // Flashbots relay URL
    //"mainnet" // Specify the network (mainnet or goerli)
    "https://relay-sepolia.flashbots.net",
    "sepolia" // Specify the network (mainnet or goerli)
  );

  return flashbotsProvider;
}

getFlashbotsProvider().then((flashbotsProvider) => {
  console.log("Connected to Flashbots relay!");
});

async function sendBundle() {
  const flashbotsProvider = await getFlashbotsProvider();
  const blockNumber = await provider.getBlockNumber();

  // Fetch the current nonce for the sender's address
  nonce = await provider.getTransactionCount(wallet.address, "pending");
  console.log("nonce: " + nonce);

  const transaction = {
    to: "0x7C03A3238C4A53bC87673e093Ffc0185866909Dd",
    value: ethers.utils.parseEther("0.1"),
    gasLimit: 210000,
    gasPrice: ethers.utils.parseUnits("500", "gwei"),
    nonce: nonce,
    data: "0x", // Ensure this is a valid transaction data field
  };

  // Fetch the current nonce for the sender's address
  nonce = await provider.getTransactionCount(wallet.address, "pending");
  console.log("nonce: " + nonce);

  const signedTransaction = await wallet.signTransaction(transaction);

  const blockCoinbase = await provider
    .getBlock(blockNumber)
    .then((block) => block.miner);
  const minerTipTransaction = {
    to: blockCoinbase,
    value: ethers.utils.parseEther("0.1"), // Tip 0.1 ETH
    gasLimit: 210000,
    nonce: nonce + 1,
    gasPrice: ethers.utils.parseUnits("500", "gwei"),
  };

  const signedTipTransaction = await wallet.signTransaction(
    minerTipTransaction
  );

  const bundle = [
    { signedTransaction },
    { signedTransaction: signedTipTransaction },
  ];

  //const bundle = [{ signedTransaction }];

  const signedTransactions = await flashbotsProvider.signBundle(bundle);
  const simulation = await flashbotsProvider.simulate(
    signedTransactions,
    //blockNumber,
    blockNumber + 1
    //blockNumber + 2
    //blockNumber + 3
  );
  //console.log(JSON.stringify(simulation, null, 2));

  if ("error" in simulation) {
    console.error("Simulation failed:", simulation.error.message);
    return;
  } else {
    console.log("Simulation successful:", simulation);
  }

  const bundlePromises = await flashbotsProvider.sendRawBundle(
    signedTransactions,
    blockNumber + 1,
    blockNumber + 2,
    blockNumber + 3,
    blockNumber + 4,
    blockNumber + 5,
    blockNumber + 6,
    blockNumber + 7,
    blockNumber + 8,
    blockNumber + 9
  );

  if ("error" in bundlePromises) {
    console.error("Error in bundlePromises:", bundlePromises.error.message);
    return;
  }

  /*
  const receipt = await bundlePromises.wait();
  if (receipt === 0) {
    console.log("Bundle successfully included in block");
  } else {
    console.log("Bundle not included in block");
  }
    */
}

sendBundle();
