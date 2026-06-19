import hardhatEthers from '@nomicfoundation/hardhat-ethers';
import hardhatNodeTestRunner from '@nomicfoundation/hardhat-node-test-runner';
import {defineConfig} from 'hardhat/config';

const config = defineConfig({
  plugins: [hardhatEthers, hardhatNodeTestRunner],
  solidity: {
    version: '0.4.24',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
});

export default config;
