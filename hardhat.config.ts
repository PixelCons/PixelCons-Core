import { HardhatUserConfig } from 'hardhat/types'

import '@nomiclabs/hardhat-ethers'
import '@nomiclabs/hardhat-waffle'

const config: HardhatUserConfig = {
  solidity: {
    compilers: [{
      version: "0.4.24",
      settings: {
        optimizer: {
          enabled: true,
          runs: 200
        }
      }
	}, {
      version: "0.8.3",
      settings: {
        optimizer: {
          enabled: true,
          runs: 200
        }
      }
	}]
  },
  networks: {
    hardhat: {
      chainId: 1337
    },
	optimism_l1: {
      url: 'http://192.168.1.69:9545',
      accounts: {
        mnemonic: 'test test test test test test test test test test test junk'
      },
      gasPrice: 0, //temporary fix since L2 accounts are not initiated with eth
    },
	optimism_l2: {
      url: 'http://192.168.1.69:8545',
      accounts: {
        mnemonic: 'test test test test test test test test test test test junk'
      },
      gasPrice: 0, //temporary fix since L2 accounts are not initiated with eth
    }
  },
};

export default config
