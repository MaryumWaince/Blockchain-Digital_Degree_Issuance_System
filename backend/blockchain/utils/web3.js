require('dotenv').config({ path: './blockchain/.env' });

const Web3 = require('web3').default || require('web3');
const contractABI = require('../build/contracts/DegreeSystem.json').abi;
const contractAddress = '0x7A53E9b93C6A4C4c0a923F3BC3465A377FDB6AaF';

// Validate RPC URL
const providerURL = process.env.SEPOLIA_RPC;
if (!providerURL) throw new Error('Missing SEPOLIA_RPC in .env');

// Setup web3 instance
const web3 = new Web3(providerURL);

// Validate and load private key
let rawPrivateKey = process.env.SEPOLIA_PRIVATE_KEY || '';
rawPrivateKey = rawPrivateKey.trim();
if (!rawPrivateKey) throw new Error('Missing SEPOLIA_PRIVATE_KEY in .env');
const privateKey = rawPrivateKey.startsWith('0x') ? rawPrivateKey : '0x' + rawPrivateKey;
if (privateKey.length !== 66) throw new Error('Invalid private key length. Must be 66 chars including 0x.');

const account = web3.eth.accounts.privateKeyToAccount(privateKey);
web3.eth.accounts.wallet.add(account);
web3.eth.defaultAccount = account.address;

const contract = new web3.eth.Contract(contractABI, contractAddress);

module.exports = {
  web3,
  contract,
  account, // already includes address and private key
};
