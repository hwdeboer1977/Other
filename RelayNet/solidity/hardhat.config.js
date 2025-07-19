require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  networks: {
    arbitrum: {
      url: process.env.ARB_RPC_URL, // e.g. https://arb1.arbitrum.io/rpc
      accounts: [process.env.PRIVATE_KEY],
      chainId: 42161,
    },
  },
  etherscan: {
    apiKey: {
      arbitrumOne: process.env.ETHERSCAN_API_KEY,
    },
  },
  solidity: "0.8.28",
};
