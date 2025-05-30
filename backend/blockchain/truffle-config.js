require('dotenv').config({ path: __dirname + '/.env' }); // load from blockchain/.env
const HDWalletProvider = require('@truffle/hdwallet-provider');

module.exports = {
  networks: {
    sepolia: {
      provider: () =>
        new HDWalletProvider({
          privateKeys: [process.env.SEPOLIA_PRIVATE_KEY],
          providerOrUrl: process.env.SEPOLIA_RPC,
        }),
      network_id: 11155111,
      gas: 5500000,
      confirmations: 2,
      timeoutBlocks: 200,
      skipDryRun: true,
    },
  },
  compilers: {
    solc: {
      version: '0.8.20',
    },
  },
};
