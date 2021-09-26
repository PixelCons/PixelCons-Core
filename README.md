# PixelCons-Core
Collectible Minimalist Pixel Art Tokens Secured on the Ethereum Blockchain! This is the whole source code including the website/app, solidity contracts, 
and test scripts. The app is currently being hosted on the web at https://pixelcons.io/

For a breakdown of the contract code, check out the flattened contract repo [here](https://github.com/PixelCons/PixelCons-Contracts)

## Setup/Run
Please follow these steps if you wish to run the PixelCons app locally or wish to run the tests

#### 1. Clone the core repo
Clone the PixelCons-Core repo by downloading the zip from GitHub and extracting it or by running the following GIT command
```
git clone https://github.com/PixelCons/PixelCons-Core.git
```

#### 2. Run install and compile
Run the following commands at the cloned PixelCons-Core directory to install dependencies and build the app (Make sure you have [Node.js](https://nodejs.org) and [Yarn](https://classic.yarnpkg.com/en/docs/install#windows-stable) installed). Once the build is complete, all data for the app can be found under the *build* folder
```
yarn install
yarn compile
yarn web_build
```

#### 3. Start web server
By default, the app is already configured to point to mainnet. Start the webapp by running the following command which will host it at http://localhost:8080
```
npm web_start
```

## Configuration
Please review the following configuration pieces

#### web3.service.js (\src\app\services)
The beginning of this service declares the *networkConfig* constant. The first network object in this list is considered the default target for the rest of the app. Additional helpful data pieces can be added to each network in the list (ex. fallback JSON RPCs)
```
const _networkConfig = [{ ... }];
```

#### market.service.js (\src\app\services)
By default, the openSea integration is disabled. This can be enabled and configured at the top of this service
```
const _enabled = false;
```

#### settings.js (\functions)
The app supports a few web functions, which help perform tasks for retrieving metadata and dynamically adding tag data for better web integration. The more advanced features are disabled by default, but can be enabled and configured from this settings file

## Run the Tests
The PixelCons core project contains test scripts for verifying application integrity. Please follow these steps if you wish to run the tests yourself...

#### 1. Run install and compile
MAke sure you have all the dependancies installed and have compiled the contracts by running the following commands (Make sure you have [Node.js](https://nodejs.org) and [Yarn](https://classic.yarnpkg.com/en/docs/install#windows-stable) installed)
```
yarn install
yarn compile
```

#### 2. Run the test script
Run the following command to start running the tests (uses hardhat in the background)
```
yarn test
```

## Debug the Application
If you wish to run the app in a debuggable environment on a different network other than mainnet, please refer to the following notes

#### Run local ethereum testnet
You can use the deploy script to deploy the contract to a *local* network. The local network to deploy to is configured in the *hardhat.config.ts* file
```
yarn deploy
```

#### Run web app in debug mode
You can run the web app in a debug mode (non minified) by running the following command. Refer to the *Configuration* section above for how to configure the app to target your new local network instead of mainnet
```
yarn web_debug
```
