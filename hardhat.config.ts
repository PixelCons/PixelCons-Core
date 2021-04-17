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
      url: 'http://http://192.168.1.104:9545',
      accounts: {
        mnemonic: 'test test test test test test test test test test test junk'
      }
    }
  },
};

export default config
