// src/utils/web3.js
import Web3 from 'web3';

const web3 = new Web3(process.env.REACT_APP_RPC_URL);
export default web3;
