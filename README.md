# PixelCons-Core
Collectible Minimalist Pixel Art Tokens Secured on the Ethereum Blockchain! This is the whole source code including the website/app, solidity contracts, 
and test scripts. The app is currently being hosted on the web at https://pixelcons.io/

For a breakdown of the contract code, check out the flattened contract repo [here](https://github.com/PixelCons/PixelCons-Contracts)

## Setup/Installation
Please follow these steps if you wish to run the PixelCons app locally or wish to run the tests..

#### 1. Install Node.js
Make sure you have [Node.js](https://nodejs.org) installed before continuing

#### 2. Install Truffle/Ganache
If you want to use a local Ethereum blockchain instead either a public test net or the main net, please install [Truffle](https://truffleframework.com/truffle) and [Ganache](https://truffleframework.com/ganache)

#### 3. Clone the Core Repo
Clone the PixelCons-Core repo by downloading the zip from GitHub and extracting it or by running the following GIT command
```
git clone https://github.com/PixelCons/PixelCons-Core.git
```

#### 4. Run npm Install
Finally, run the following command at the cloned PixelCons-Core directory to finish setting up your environment
```
npm install
```

## Configuration
Before running the PixelCons app, please review the following configuration pieces

#### web3.service.js (\src\app\services)
The beginning of this service has some declared variables that should be changed to match your desired preferences
```
var _expectedNetwork = null; //Options: Main, Morden, Ropsten, Rinkeby, Kovan (set to 'null' if you wish to support all of them)
var _backupWeb3Provider = 'https://mainnet.infura.io/v3/07d72fe8b8b74534a05d2091e108e26e';
var _transactionLookupUrl = 'https://etherscan.io/tx/<txHash>';
var _accountLookupUrl = 'https://etherscan.io/address/<address>';
```

#### 3_data_load.js (\migrations)
The beginning of this migration script has a declared variable that allows you to disabled loading test data on truffle migration as well as 
setting up different accounts you wish to be loaded with Eth on truffle migration
```
var enabled = false;

var primaryAddress = '0xfE643f001caC62a5f513Af517765146d331261C8';
var secondaryAddress = '0x9f2fedFfF291314E5a86661e5ED5E6f12e36dd37';
```

#### coreContract.service.js and marketContract.service.js (\src\app\services)
There are a few additional options to configure at the beginning of these two files pertaining to the two deployed contracts on the Ethereum blockchain

## Run the Application
PixelCons is a single page app for web browsers. To run the app, you simply need to host the website data (located at \src) 
and the contract json files (located at \build\contracts). This project includes a node.js script to host these files for you at 
http://localhost:8080 which can be run by following these steps...

#### 1. Start Local Ethereum Blockchain (optional)
If you want to run the app with a local Ethereum blockchain instead of relying on a public test net or the main net, please start up Ganache and run 
the following command to publish the contracts to it
```
truffle migrate --reset
```

#### 2. Run the Server Script
Run the following command to start hosting the app at http://localhost:8080
```
node server.js
```

#### 3. Make Sure You Are Connected to the Desired Network
Finally, when using the app, make sure your browser has a connected Ethereum wallet and that it is pointing to your desired Ethereum network

## Run the Tests
The PixelCons core project contains test scripts for verifying application integrity. It is not recommended to try and run the tests on any of
the public Ethereum test nets and especially not the Ethereum main net. Please follow these steps if you wish to run the tests yourself...

#### 1. Start Local Ethereum Blockchain
If you want to run the app with a local Ethereum blockchain instead of relying on a public test net or the main net, please start up Ganache and run 
the following command to publish the contracts to it
```
truffle migrate --reset
```
Note: please make sure Ganache is set up to 'automine', otherwise some of the test transactions may run over each other. Also, make sure to disable
the migration data load (see **Configuration** for 3_data_load.js)

#### 2. Run the Test Script
Run the following command to start running the tests
```
truffle test
```

