import { keccak256 } from "@ethersproject/keccak256";
import { getRandomBytes } from "ethereum-cryptography/random";
import { bytesToHex, hexToBytes } from "@ethereumjs/util";
import * as secp256k1 from "@noble/secp256k1";
import { ethers } from "ethers";

// Function to generate a new wallet
async function generateWallet() {
  try {
    // 1. Generate a random 32-byte private key
    const privateKey = await getRandomBytes(32);

    //const privateKeyHex =
    //  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
    //const privateKey = hexToBytes(privateKeyHex); // Convert hex to bytes

    // 2. Generate the public key (uncompressed, 65 bytes with 0x04 prefix)
    const publicKey = secp256k1.getPublicKey(privateKey, false); // Uint8Array

    // 3. Hash the public key with keccak256, skipping the first byte (0x04 prefix)
    const publicKeyHash = keccak256(publicKey.slice(1)); // Returns Uint8Array

    // 4. Take the last 20 bytes of the hash and convert to hex string
    const address = "0x" + publicKeyHash.slice(-40);

    // 5. Convert the private key and public key to hex format
    const privateKeyHex = bytesToHex(privateKey);
    const publicKeyHex = bytesToHex(publicKey);

    console.log("Private Key:", privateKey);
    console.log("Private Key Hex:", privateKeyHex);
    console.log("Public Key:", publicKey);
    console.log("Public Key Hex:", publicKeyHex);
    console.log("Public Key Hash:", publicKeyHash);
    console.log("Address:", address);

    return {
      privateKey: privateKeyHex,
      publicKey: publicKeyHex,
      address: address,
    };
  } catch (error) {
    console.error("Error generating wallet:", error);
    throw new Error("Error generating wallet: " + error.message);
  }
}

// DOM Event Listener for generating wallet
document
  .getElementById("generateWalletBtn")
  .addEventListener("click", async () => {
    const wallet = await generateWallet();
    document.getElementById("output").textContent = wallet
      ? `Address: ${wallet.address}\nPublic Key: ${wallet.publicKey}\nPrivate Key: ${wallet.privateKey}`
      : "Error generating wallet!";

    // Save the generated wallet to Chrome storage
    if (wallet) {
      saveWallet(wallet, function () {
        // Reload the wallets in the dropdown only after saving the wallet
        loadWallets();
      });
    }
  });

// Handle the wallet selection from the dropdown
document.getElementById("walletSelect").addEventListener("change", function () {
  const selectedIndex = this.value;
  if (selectedIndex === "") return; // No wallet selected

  chrome.storage.local.get("wallets", function (result) {
    const wallets = result.wallets || [];
    const selectedWallet = wallets[selectedIndex];

    // Display the selected wallet details
    document.getElementById(
      "output"
    ).textContent = `Address: ${selectedWallet.address}\nPublic Key: ${selectedWallet.publicKey}\nPrivate Key: ${selectedWallet.privateKey}`;

    // Optionally, store the index of the selected wallet for persistence
    chrome.storage.local.set({ selectedWalletIndex: selectedIndex });
  });

  // Get the selected chain from storage
  chrome.storage.local.get("selectedChain", async function (result) {
    const selectedChain = result.selectedChain || "137"; // Default to Polygon if not set
    const provider = getProvider(selectedChain); // Get the provider for the selected chain

    // Get the balance of the selected wallet
    const balance = await provider.getBalance(selectedWallet.address);
    const formattedBalance = ethers.utils.formatEther(balance); // Convert balance from Wei to Ether (or token decimals if applicable)

    // Display the balance
    document.getElementById(
      "balance"
    ).textContent = `Balance: ${formattedBalance} ETH`; // Change ETH if on other chains (MATIC, BNB, etc.)
  });
});

// Save a new wallet to the list of wallets in chrome storage
function saveWallet(wallet, callback) {
  chrome.storage.local.get("wallets", function (result) {
    const wallets = result.wallets || []; // If no wallets exist, start with an empty array
    wallets.push(wallet); // Add the new wallet
    chrome.storage.local.set({ wallets }, function () {
      console.log("Wallet has been added to storage");
      if (callback) callback(); // Call the callback after saving
    });
  });
}

// Load wallets into the dropdown list and handle wallet selection
async function loadWallets() {
  chrome.storage.local.get("wallets", async function (result) {
    const wallets = result.wallets || [];
    const walletSelect = document.getElementById("walletSelect");

    // Clear any existing options (except for the first one)
    walletSelect.innerHTML = '<option value="">Select a Wallet</option>';

    // Add each wallet to the dropdown
    wallets.forEach((wallet, index) => {
      const option = document.createElement("option");
      option.value = index; // Use the index as the value
      option.textContent = `Wallet ${index + 1} (${wallet.address})`; // Display wallet number and address
      walletSelect.appendChild(option);
    });

    // If there are wallets, check if there is a previously selected wallet
    if (wallets.length > 0) {
      chrome.storage.local.get("selectedWalletIndex", async function (result) {
        const selectedWalletIndex = result.selectedWalletIndex || 0; // Default to the first wallet

        // Set the dropdown to the selected wallet index
        walletSelect.value = selectedWalletIndex;

        // Display the selected wallet's details
        const selectedWallet = wallets[selectedWalletIndex];
        document.getElementById(
          "output"
        ).textContent = `Address: ${selectedWallet.address}\nPublic Key: ${selectedWallet.publicKey}\nPrivate Key: ${selectedWallet.privateKey}`;

        // Get the selected chain from storage
        chrome.storage.local.get("selectedChain", async function (result) {
          const selectedChain = result.selectedChain || "137"; // Default to Polygon if not set
          const provider = getProvider(selectedChain); // Get the provider for the selected chain

          // Initialize the signer using the selected wallet's private key (for simplicity)
          const signer = new ethers.Wallet(selectedWallet.privateKey, provider);

          // Display the balance of the selected wallet using the signer
          const balance = await provider.getBalance(selectedWallet.address);
          const formattedBalance = ethers.utils.formatEther(balance); // Convert balance from Wei to Ether (or token decimals if applicable)

          // Display the balance
          document.getElementById(
            "balance"
          ).textContent = `Balance: ${formattedBalance} ETH`; // Change ETH if on other chains (MATIC, BNB, etc.)

          // Optional: Store the provider and signer for future use
          chrome.storage.local.set({ provider, signer });
        });
      });
    }
  });
}

// Load wallets when the popup is opened
document.addEventListener("DOMContentLoaded", function () {
  loadWallets(); // Ensure the wallets are loaded and displayed
});

// Remove the selected wallet from chrome storage
function removeWallet(index) {
  chrome.storage.local.get("wallets", function (result) {
    let wallets = result.wallets || [];

    // Remove the selected wallet by index
    wallets.splice(index, 1);

    // Save the updated wallets array to storage
    chrome.storage.local.set({ wallets }, function () {
      console.log("Wallet has been removed from storage");

      // Reload the wallets in the dropdown
      loadWallets();

      // Clear the output if no wallet is selected
      document.getElementById("output").textContent = "Wallet removed.";
    });
  });
}

// Add Event Listener for Remove Wallet Button
document
  .getElementById("removeWalletBtn")
  .addEventListener("click", function () {
    const selectedIndex = document.getElementById("walletSelect").value;
    if (selectedIndex === "") return; // No wallet selected

    // Remove the selected wallet
    removeWallet(selectedIndex);
  });

// DOM Event Listener for chain selection
document.getElementById("chain-select").addEventListener("change", function () {
  const selectedChain = this.value; // Get the selected chain value
  if (selectedChain === "") return; // No chain selected

  // Display the selected chain
  const chainName = getChainNameById(selectedChain);
  document.getElementById("chain").textContent = `Connected to ${chainName}`;

  // Save the selected chain to Chrome storage
  chrome.storage.local.set({ selectedChain: selectedChain }, function () {
    console.log("Chain selection saved to storage");
  });
});

// Function to get the name of the chain by ID
function getChainNameById(chainId) {
  switch (chainId) {
    case "137":
      return "Polygon";
    case "56":
      return "Binance Smart Chain";
    case "1":
      return "Ethereum";
    default:
      return "Unknown Chain";
  }
}

// Function to return the provider based on the selected chain
function getProvider(chainId) {
  const ethApiKey = process.env.API_KEY_ETH;
  const polyApiKey = process.env.API_KEY_POLY;

  switch (chainId) {
    case "137": // Polygon
      return new ethers.providers.JsonRpcProvider(polyApiKey);
    case "56": // Binance Smart Chain (BSC)
      return new ethers.providers.JsonRpcProvider(
        "https://bsc-dataseed.binance.org/"
      );
    case "1": // Ethereum (Mainnet)
      return new ethers.providers.JsonRpcProvider(ethApiKey);
    default:
      throw new Error("Unsupported chain");
  }
}

// Event listener for sending a transaction
document
  .getElementById("sendTransactionBtn")
  .addEventListener("click", async () => {
    const amount = document.getElementById("amountToSend").value; // Get amount to send
    const recipient = document.getElementById("recipientAddress").value; // Get recipient address

    if (!amount || !recipient) {
      document.getElementById("transactionResult").textContent =
        "Please provide both amount and recipient address.";
      return;
    }

    // Get the selected wallet
    chrome.storage.local.get("wallets", async function (result) {
      const wallets = result.wallets || [];
      const selectedIndex = document.getElementById("walletSelect").value;
      const selectedWallet = wallets[selectedIndex];

      if (!selectedWallet) {
        document.getElementById("transactionResult").textContent =
          "No wallet selected.";
        return;
      }

      // Get the selected chain and provider
      chrome.storage.local.get("selectedChain", async function (result) {
        const selectedChain = result.selectedChain || "137"; // Default to Polygon if not set
        const provider = getProvider(selectedChain); // Get the provider for the selected chain

        // Create the signer
        const signer = new ethers.Wallet(selectedWallet.privateKey, provider);

        // Create and send the transaction
        try {
          const tx = {
            to: recipient, // The recipient's address
            value: ethers.utils.parseEther(amount), // Convert the amount to Wei
            gasLimit: 21000, // Standard gas limit for a simple ETH transfer
          };

          // Send the transaction
          const transactionResponse = await signer.sendTransaction(tx);
          document.getElementById(
            "transactionResult"
          ).textContent = `Transaction sent! Hash: ${transactionResponse.hash}`;

          // Optionally, wait for the transaction to be mined
          const receipt = await transactionResponse.wait();
          document.getElementById(
            "transactionResult"
          ).textContent = `Transaction confirmed! Block Number: ${receipt.blockNumber}`;
        } catch (error) {
          document.getElementById(
            "transactionResult"
          ).textContent = `Error sending transaction: ${error.message}`;
        }
      });
    });
  });

// Load the chain selection when the popup is opened
document.addEventListener("DOMContentLoaded", function () {
  chrome.storage.local.get("selectedChain", function (result) {
    const selectedChain = result.selectedChain || "137"; // Default to Polygon if no chain is selected

    // Set the dropdown to the previously selected chain
    document.getElementById("chain-select").value = selectedChain;

    // Display the selected chain details
    const chainName = getChainNameById(selectedChain);
    document.getElementById("chain").textContent = `Connected to ${chainName}`;
  });
});
