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
	local: {
      url: 'http://127.0.0.1:7545',
      accounts: {
        mnemonic: 'test test test test test test test test test test test junk'
      }
    }
  },
};

export default config
