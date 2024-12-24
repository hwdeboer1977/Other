const { secp256k1 } = require("ethereum-cryptography/secp256k1");
const { hexToBytes, bytesToHex } = require("ethereum-cryptography/utils");
const { keccak256 } = require("ethereum-cryptography/keccak");
const { randomBytes } = require("crypto");
const { getRandomBytes } = require("ethereum-cryptography/random");

// OLD CODE: USE EXISTING PRIVATE KEY FROM HARDHAT TEST ACCOUNTS
// Take the private key from hardhat node account 0: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
// Wallet address account 0: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
// 2. Convert Private Key to Bytes
// The private key is initially in hexadecimal format. It's converted into bytes so it can be used in cryptographic functions.
// const privateKeyHex =
//   "ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
// const privateKey = hexToBytes(privateKeyHex); // Convert hex to bytes

// 9-12 UPDATE: create new random private key

// // Step 1: Generate a random 32-byte private key (256 bits)
// const privateKey = randomBytes(32); // 32 bytes (256 bits)
// const privateKeyHex = bytesToHex(privateKey);
// console.log("Random Private Key (Hex):", privateKeyHex);

// console.log("privateKey bytes:" + privateKey);
// console.log("privateKey length in bytes:" + privateKey.length);

// // 2. Generate the Public Key from the private key
// // The public key is derived using Elliptic Curve Cryptography (ECC) based on the secp256k1 curve.
// const publicKey = secp256k1.getPublicKey(privateKey, false); // Uncompressed public key

// // The getPublicKey function creates an uncompressed public key:
// // It starts with a 0x04 prefix.
// // Followed by 64 bytes: 32 bytes for the x coordinate and 32 bytes for the y coordinate.
// console.log("Public Key:", publicKey);

// // 3. Convert Public Key to Hexadecimal
// const publicKeyHex = bytesToHex(publicKey);

// // The 04 prefix indicates that this is an uncompressed public key.
// console.log("Public Key (Hex):", publicKeyHex);

// // 4. Extract x and y coordinates from the uncompressed public key
// // Public keys are points on the secp256k1 elliptic curve.
// const x = publicKey.slice(1, 33); // First 32 bytes after the prefix
// const y = publicKey.slice(33); // Next 32 bytes

// // The uncompressed format includes:
// // 04 prefix (indicating it’s uncompressed).
// // 32 bytes for x and 32 bytes for y.
// // The next 64 bytes are the X and Y coordinates concatenated, or separated:
// console.log("Public Key X (Hex):", bytesToHex(x));
// console.log("Public Key Y (Hex):", bytesToHex(y));

// // 5. Hash the Public Key (Keccak-256)
// // Ethereum addresses are derived from the Keccak-256 hash of the public key, excluding the 04 prefix.
// // Public Key (without the '04' prefix)
// const publicKeyHex2 = bytesToHex(x) + bytesToHex(y);
// const publicKeyBytes = hexToBytes(publicKeyHex2);

// // Hash the public key using keccak256
// const hash = keccak256(publicKeyBytes);

// // Take the last 20 bytes for the Ethereum address
// const ethereumAddress = bytesToHex(hash.slice(-20));

// console.log("Ethereum Address: 0x" + ethereumAddress);

// Generate Ethereum wallet (private key, public key, address)
async function generateWallet() {
  try {
    // 1. Generate a random private key
    const privateKey = await getRandomBytes(32);

    // 2. Generate the public key (uncompressed)
    const publicKey = secp256k1.getPublicKey(privateKey, false);

    // 3. Hash the public key using keccak256 (skip the first byte `0x04`)
    const hash = keccak256(publicKey.slice(1)); // Slice off the 0x04 prefix

    // 4. Take the last 20 bytes of the hash for the Ethereum address
    const address = "0x" + bytesToHex(hash.slice(-20));

    const privateKeyHex = bytesToHex(privateKey);
    console.log(privateKeyHex);
    console.log(address);

    // Return wallet details
    return {
      privateKey: bytesToHex(privateKey),
      publicKey: bytesToHex(publicKey), // Uncompressed public key
      address: address,
    };
  } catch (error) {
    console.error("Error generating wallet:", error);
    throw new Error("Error generating wallet: " + error.message);
  }
}
generateWallet();
