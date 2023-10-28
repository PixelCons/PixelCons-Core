# PixelCons-Core
Collectible Minimalist Pixel Art Tokens Secured on the Ethereum Blockchain! This is the whole source code including the website/app, solidity contracts, 
and test scripts. The app is currently being hosted on the web at https://pixelcons.io/

For a breakdown of the contract code, check out the flattened contract repo [here](https://github.com/PixelCons/PixelCons-Contracts)

## Setup and run
Please follow these steps if you wish to run the PixelCons app locally or wish to run the tests

#### 1. Clone the core repo
Clone the PixelCons-Core repo by downloading the zip from GitHub and extracting it or by running the following GIT command
```
git clone https://github.com/PixelCons/PixelCons-Core.git
```

#### 2. Set environment variables
By default, the app will attempt to use the ethers default mainnet provider which is often slow and unreliable. To improve performance you can provide your own JSON RPC endpoint via an environment variable. This JSON RPC endpoint is used by the archiver, server backend, and wrapped for ocasionally fetching pixelcon specific data to the frontend. You can set the `JSON_RPC` environment variable directly or create a `.env` file like below 
```
JSON_RPC=https://mainnet.infura.io/v3/[api_key]
```

#### 3. Run install and build
Run the following commands at the cloned PixelCons-Core directory to install dependencies and build the app (Make sure you have [Node.js](https://nodejs.org) installed)
```
npm install
npm run archive
npm run build
```

#### 4. Start web server
By default, the app is already configured to point to mainnet. Start the webapp by running the following command which will host it at [http://localhost:3000](http://localhost:3000)
```
npm run start
```

## Run the Tests
The PixelCons core project contains test scripts for verifying application integrity. Please follow these steps if you wish to run the tests yourself

#### 1. Run install and compile
Make sure you have all the dependancies installed and have compiled the contracts by running the following commands (Make sure you have [Node.js](https://nodejs.org) installed)
```
npm install
npm run compile
```

#### 2. Run the test script
Run the following command to start running the tests (uses hardhat in the background)
```
npm run test
```

## Run with testnet
The PixelCons core project can be configured to point to networks other than Ethereum mainnet for testing

#### Run local ethereum testnet
You can optionally spin up your own node as a test environment with the following command
```
npm run node
```

#### Deploy the contracts
You can use the deploy script to deploy the PixelCons contract to your local testnet by default
```
npm run deploy
```
You can reference the npm `deploy` script command to learn how to use the deploy script for other testnets

#### Configuration
There are a few optional build configuration settings that can be used to tweak the app found at the bottom of [src/build.config.ts](/src/build.config.ts). The main items that need to be configured to point to a custom network are
```
OVERRIDE_JSON_RPC - set to "http://localhost:8545/" for local network
OVERRIDE_CHAIN_ID - set to "31337" for local network
OVERRIDE_PIXELCONS_CONTRACT_ADDRESS - set to deployed contract address reported in the deploy script
```
