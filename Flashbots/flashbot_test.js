import { ethers } from "ethers";
import {
  FlashbotsBundleProvider,
  FlashbotsBundleResolution,
} from "@flashbots/ethers-provider-bundle";

import { config } from "dotenv";
// Initialize the environment variables
config();

const CHAIN_ID = 11155111; // sepolia
const FLASHBOTS_ENDPOINT = "https://relay-sepolia.flashbots.net";

const privateKey = process.env.PRIVATE_KEY;
const apiKey = process.env.API_KEY;

// Create a new Ethereum provider using the API key for a JSON RPC provider
const provider = new ethers.providers.JsonRpcProvider(apiKey);

// Example wallet address for checking balance
const walletAddress = "0xBBe2ded2c9E0C8B6f0D36ab8e533509f98Ce05aF";
const recipientAddress = "0x7C03A3238C4A53bC87673e093Ffc0185866909Dd";

// Create a wallet instance using the private key and provider
const wallet = new ethers.Wallet(privateKey, provider);

// Set a gas limit for the transaction
const setGasLimit = 300000;

// Fetch the current gas price from the provider and increase it by 50% to prioritize the transaction
const gasPrice = await provider.getGasPrice();
const increasedGasPrice = gasPrice.mul(600).div(100); // Add premium

async function main() {
  //   const signer = Wallet.createRandom();
  const flashbot = await FlashbotsBundleProvider.create(
    provider,
    wallet,
    //"https://relay.flashbots.net", // URL for the mainnet Flashbots relay
    //"mainnet" // Network type (mainnet or goerli)
    // You could also use the Sepolia or Goerli networks:
    "https://relay-sepolia.flashbots.net",
    "sepolia"
  );
  provider.on("block", async (block) => {
    console.log(`block: ${block}`);

    const signedTx = await flashbot.signBundle([
      {
        signer: wallet,
        transaction: {
          chainId: CHAIN_ID,
          // EIP 1559 transaction
          //type: 2,
          value: 0,
          data: "0x",
          gasLimit: setGasLimit, // Gas limit for the transaction
          gasPrice: increasedGasPrice, // Gas price with added premium
          to: "0x7C03A3238C4A53bC87673e093Ffc0185866909Dd",
        },
      },
    ]);

    const targetBlock = block + 1;
    const sim = await flashbot.simulate(signedTx, targetBlock);

    if ("error" in sim) {
      console.log(`simulation error: ${sim.error.message}`);
    } else {
      // console.log(`simulation success: ${JSON.stringify(sim, null, 2)}`);
      console.log(`simulation success`);
    }

    const res = await flashbot.sendRawBundle(signedTx, targetBlock);
    if ("error" in res) {
      throw new Error(res.error.message);
    }

    const bundleResolution = await res.wait();
    if (bundleResolution === FlashbotsBundleResolution.BundleIncluded) {
      console.log(`Congrats, included in ${targetBlock}`);
      console.log(JSON.stringify(sim, null, 2));
      process.exit(0);
    } else if (
      bundleResolution === FlashbotsBundleResolution.BlockPassedWithoutInclusion
    ) {
      console.log(`Not included in ${targetBlock}`);
    } else if (
      bundleResolution === FlashbotsBundleResolution.AccountNonceTooHigh
    ) {
      console.log("Nonce too high, bailing");
      process.exit(1);
    }
  });
}

main();
