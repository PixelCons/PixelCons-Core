(function () {
	angular.module('App')
		.service('web3Service', web3Service);

	web3Service.$inject = ['$interval', '$timeout', '$q'];
	function web3Service($interval, $timeout, $q) {
		var _expectedNetwork = null; //Options: Mainnet, Morden, Ropsten, Rinkeby, Goerli, Kovan (set to 'null' if you wish to support all of them)
		var _backupWeb3Provider = 'https://mainnet.infura.io/v3/05a3d97e27434acc998cdfdd6d418bfc';
		var _transactionWaitConfirmations = 1;
		var _transactionWaitTimeout = 2 * 60 * 60 * 1000;
		let _transactionWaitPoll = 1 * 1000;
		var _transactionLookupUrl = 'https://etherscan.io/tx/<txHash>';
		var _accountLookupUrl = 'https://etherscan.io/address/<address>';

		var _state = "not_enabled";
		var _network = null;
		var _account = null;
		var _isReadOnly = false;
		var _isPrivacyEnabled = false;
		var _waitingTransactions = [];
		var _waitingTransactionsAccount = null;
		var _transactionDataTransformers = [];
		var _noAccountError = 'No Ethereum Account';
		var _notEnabledError = 'No Ethereum Connection';
		var _notConnectedError = 'Ethereum Provider Not Connected';
		var _undeterminedNetworkError = 'No Ethereum Network Specified';
		var _unknownError = 'Unknown Error';
		var _invalidAddressError = 'Invalid Address';
		var _localStorage = window.localStorage;

		var _web3Provider = null;
		if (window.ethereum) {
			_web3Provider = new ethers.providers.Web3Provider(window.ethereum);
			_state = "ready";
			_isPrivacyEnabled = true;

		} else if (window.web3) {
			//legacy web3
			_web3Provider = new ethers.providers.Web3Provider(window.web3);
			_state = "ready";

		} else {
			//read-only mode
			_web3Provider = new ethers.providers.JsonRpcProvider(_backupWeb3Provider);
			_state = "ready";
			_isReadOnly = true;
		}

		// Poll for state changes
		var _onAccountChangeFunctions = [];
		var _onStateChangeFunctions = [];
		var _onNetworkChangeFunctions = [];
		var _onWaitingTransactionsChangeFunctions = [];
		async function checkForWeb3Changes() {
			let [newState, newNetwork] = await queryNetworkState();
			let stateChanged = (_state != newState);
			let networkChanged = (_network != newNetwork);
			_network = newNetwork;
			_state = newState;

			let newAccount = await queryAccount();
			let accountChanged = (_account != newAccount);
			_account = newAccount;

			if (stateChanged) {
				executeCallbackFunctions(_onStateChangeFunctions, _state);
			}
			if (networkChanged) {
				executeCallbackFunctions(_onNetworkChangeFunctions, _network);
				checkWaitingTransactionsForAccount();
			}
			if (accountChanged) {
				executeCallbackFunctions(_onAccountChangeFunctions, _account);
				checkWaitingTransactionsForAccount();
			}
		}
		if (!_isReadOnly) {
			$interval(checkForWeb3Changes, 1000);
			checkForWeb3Changes();
		}

		// Setup functions
		this.getState = getState;
		this.isReadOnly = isReadOnly;
		this.isPrivacyMode = isPrivacyMode;
		this.getExpectedNetwork = getExpectedNetwork;
		this.getCurrentNetwork = getCurrentNetwork;
		this.isWrongNetwork = isWrongNetwork;
		this.getTransactionLookupUrl = getTransactionLookupUrl;
		this.getProviderName = getProviderName;
		this.requestAccess = requestAccess;
		this.onStateChange = onStateChange;
		this.onNetworkChange = onNetworkChange;
		this.getActiveAccount = getActiveAccount;
		this.onAccountDataChange = onAccountDataChange;
		this.getWaitingTransactions = getWaitingTransactions;
		this.addWaitingTransaction = addWaitingTransaction;
		this.addTransactionDataTransformer = addTransactionDataTransformer;
		this.onWaitingTransactionsChange = onWaitingTransactionsChange;
		this.getContractWithSigner = getContractWithSigner;
		this.getContractInterface = getContractInterface;
		this.getContract = getContract;
		this.verifySendEth = verifySendEth;
		this.sendEth = sendEth;
		this.isAddress = isAddress;
		this.to256Hex = to256Hex;
		this.fromUtf8 = fromUtf8;
		this.toUtf8 = toUtf8;
		this.hexToInt = hexToInt;
		this.formatAddress = formatAddress;


		///////////
		// State //
		///////////


		// Gets the state of the web3 service
		function getState() {
			return _state;
		}

		// Gets if web3Provider is read only
		function isReadOnly() {
			return _isReadOnly;
		}

		// Gets if web3Provider has privacy mode enable
		function isPrivacyMode() {
			return _isPrivacyEnabled && !_account;
		}

		// Gets the desired network
		function getExpectedNetwork() {
			if (_expectedNetwork) return _expectedNetwork;
			return getCurrentNetwork();
		}

		// Gets the current connected network
		function getCurrentNetwork() {
			if (_state != "ready") return null;
			return _network;
		}

		// Gets if connected to the wrong network
		function isWrongNetwork() {
			if (_state != "ready" || !_expectedNetwork || !_network) return false;
			return _expectedNetwork != _network;
		}

		// Gets url for displaying more details about a transaction
		function getTransactionLookupUrl(txHash) {
			if (txHash) return _transactionLookupUrl.replace('<txHash>', txHash);
			return _accountLookupUrl.replace('<address>', getActiveAccount());
		}

		// Register callback for state data change
		function onStateChange(callback, scope) {
			if (scope) scope.$on('$destroy', cleanSubscriptions);
			_onStateChangeFunctions.push({ func: callback, scope: scope });
		}

		// Register callback for network data change
		function onNetworkChange(callback, scope) {
			if (scope) scope.$on('$destroy', cleanSubscriptions);
			_onNetworkChangeFunctions.push({ func: callback, scope: scope });
		}

		// Gets the provider name
		function getProviderName() {
			if (_state != "ready") return null;

			if (window.ethereum && window.ethereum.isMetaMask) return 'MetaMask';
			return 'your Ethereum Account';
		}

		// Requests for access to the accounts
		function requestAccess() {
			if (_isPrivacyEnabled) {
				window.ethereum.enable().then(checkForWeb3Changes, function () {
					console.log("User denied access to Ethereum account");
				});
			}
		}


		//////////////
		// Account //
		//////////////


		// Gets the active account
		function getActiveAccount() {
			return _account;
		}

		// Register callback for account data change
		function onAccountDataChange(callback, scope) {
			if (scope) scope.$on('$destroy', cleanSubscriptions);
			_onAccountChangeFunctions.push({ func: callback, scope: scope });
		}


		//////////////////
		// Transactions //
		//////////////////


		// Gets waiting transactions
		function getWaitingTransactions() {
			let network = getCurrentNetwork();
			let transactionsForNetwork = [];
			for (let i = 0; i < _waitingTransactions.length; i++) {
				if (_waitingTransactions[i].network == network) {
					transactionsForNetwork.push(_waitingTransactions[i]);
				}
			}
			return transactionsForNetwork;
		}

		// Adds a new transaction to the wait list
		function addWaitingTransaction(txHash, params, type, description) {
			let network = getCurrentNetwork();
			let transaction = {
				txHash: txHash,
				network: network,
				params: params,
				type: type,
				description: description,
				timestamp: (new Date()).getTime()
			}
			_waitingTransactions.push(transaction);

			//update store and run callbacks
			storeWaitingTransactions();
			executeCallbackFunctions(_onWaitingTransactionsChangeFunctions, null);

			//return promise of transaction end
			return transactionWaitTransformRemove(transaction);
		}

		// Adds a function to be run on a transaction result promise to transform data
		function addTransactionDataTransformer(transactionDataTransformer) {
			_transactionDataTransformers.push(transactionDataTransformer);
		}

		// Register callback for waiting transactions change
		function onWaitingTransactionsChange(callback, scope) {
			if (scope) scope.$on('$destroy', cleanSubscriptions);
			_onWaitingTransactionsChangeFunctions.push({ func: callback, scope: scope });
		}


		///////////////
		// Contracts //
		///////////////

		// Gets contract object based on given path to ABI with the current account as signer
		async function getContractWithSigner(contractPath) {
			let contract = await getContract(contractPath);
			return contract.connect(_web3Provider.getSigner(0));
		}

		// Gets contract interface object based on given path to ABI
		async function getContractInterface(contractPath) {
			let contractData = await getJSON(contractPath);
			return new ethers.utils.Interface(contractData.abi);
		}

		// Gets contract object based on given path to ABI
		async function getContract(contractPath) {
			let network = getCurrentNetwork();
			if (network == null) {
				let [stat, net] = await queryNetworkState();
				network = net;
			}

			if (network == null) throw new Error(_undeterminedNetworkError);
			else {
				let deploymentData = await getJSON('contracts/deployments.json');
				let contractData = await getJSON(contractPath);
				let contractName = contractData.contractName;

				for (let i = 0; i < deploymentData.length; i++) {
					if (deploymentData[i].name == network) {
						for (let j = 0; j < deploymentData[i].contracts.length; j++) {
							if (deploymentData[i].contracts[j].name == contractName) {
								let contractAddress = deploymentData[i].contracts[j].address;
								return new ethers.Contract(contractAddress, contractData.abi, _web3Provider);
							}
						}
					}
				}

				throw new Error("Failed to find contract deployed location");
			}
		}

		// Gets the contract deployment data
		var _loadedJSON = {};
		var _loadedJSONWaiting = {};
		function getJSON(path) {
			return $q(async function (resolve, reject) {
				//check if JSON is already fetched
				if (_loadedJSON[path]) {
					resolve(_loadedJSON[path]);
				}

				//check if JSON is already being fetched
				if (_loadedJSONWaiting[path]) {
					//add resolve/reject to array for when fetch returns
					_loadedJSONWaiting[path].push({ resolve: resolve, reject: reject });

				} else {
					//add resolve/reject to array for when fetch returns
					_loadedJSONWaiting[path] = [{ resolve: resolve, reject: reject }];

					try {
						//fetch
						let jsonData = await $.getJSON(path);
						_loadedJSON[path] = jsonData;

						//finish promises for anything that was waiting
						if (_loadedJSONWaiting[path]) {
							for (let i = 0; i < _loadedJSONWaiting[path].length; i++) _loadedJSONWaiting[path][i].resolve(jsonData);
						}

					} catch (err) {
						//fail promises for anything that was waiting
						if (_loadedJSONWaiting[path]) {
							for (let i = 0; i < _loadedJSONWaiting[path].length; i++) _loadedJSONWaiting[path][i].reject(new Error("Failed to load JSON data"));
						}
					}
				}
			});
		}


		//////////
		// Send //
		//////////


		// Get estimated send gas price
		function verifySendEth(address, amount) {
			return $q(function (resolve, reject) {
				if (_state == "not_enabled") reject(_notEnabledError);
				else if (_state == "not_connected") reject(_notConnectedError);
				else if (_state != "ready") reject(_unknownError);
				else if (isReadOnly()) reject(_noAccountError);
				else if (!isAddress(address)) reject(_invalidAddressError);
				else resolve({});
			});
		}

		// Send amount of eth to the given address
		function sendEth(address, amount) {
			return $q(async function (resolve, reject) {
				if (_state == "not_enabled") reject(_notEnabledError);
				else if (_state == "not_connected") reject(_notConnectedError);
				else if (_state != "ready") reject(_unknownError);
				else if (isReadOnly()) reject(_noAccountError);
				else if (!isAddress(address)) reject(_invalidAddressError);
				else {
					try {
						let signer = _web3Provider.getSigner(0);
						let transactionResponse = await signer.sendTransaction({ to: address, value: ethers.utils.parseEther(amount) });
						resolve(transactionResponse.hash);
					} catch (err) {
						reject('Something went wrong while sending eth');
					}
				}
			});
		}


		///////////
		// Utils //
		///////////


		// Verifies if the given address is valid
		function isAddress(address) {
			return ethers.utils.isAddress(address);
		}

		// Converts given number into 256 bit hex code
		function to256Hex(number) {
			try {
				let hex = ethers.utils.hexlify(number);
				while (hex.length < 66) hex = hex.slice(0, 2) + '0' + hex.slice(2);
				return hex;
			} catch (err) { }
			return "0x".padEnd(66, "0");
		}

		// Converts given utf8 text into hex code
		function fromUtf8(text, byteSize) {
			try {
				if (byteSize) {
					let bytes = new Uint8Array(byteSize);
					let textBytes = ethers.utils.toUtf8Bytes(text);
					for (let i = 0; i < 8 && i < textBytes.length; i++) {
						bytes[i] = textBytes[i];
					}
					return ethers.utils.hexlify(bytes);
				} else {
					return ethers.utils.hexlify(ethers.utils.toUtf8Bytes(text));
				}
			} catch (err) { }
			return (byteSize) ? ethers.utils.hexlify(new Uint8Array(byteSize)) : "0x00";
		}

		// Converts hex code into a full string
		function toUtf8(hex) {
			try {
				while (hex[hex.length - 1] == '0' && hex[hex.length - 2] == '0') hex = hex.slice(0, hex.length - 2);
				return ethers.utils.toUtf8String(hex);
			} catch (err) { }
			return "";
		}

		// Convert a hex string into an integer string
		function hexToInt(hex) {
			try {
				return ethers.BigNumber.from(hex).toString();
			} catch (err) { }
			return "0";
		}

		// Formats the given hex address
		function formatAddress(address) {
			try {
				if (address) return address.toLowerCase();
			} catch (err) { }
			return null;
		}


		//////////////////////
		// Helper Functions //
		//////////////////////


		// Helper function to get the current network state
		async function queryNetworkState() {
			if (_web3Provider != null) {
				try {
					let network = await _web3Provider.getNetwork();
					let networkStr = null;
					if (network.chainId) {
						if (network.chainId == "1") networkStr = "Mainnet";
						else if (network.chainId == "2") networkStr = "Morden";
						else if (network.chainId == "3") networkStr = "Ropsten";
						else if (network.chainId == "4") networkStr = "Rinkeby";
						else if (network.chainId == "5") networkStr = "Goerli";
						else if (network.chainId == "42") networkStr = "Kovan";
						else networkStr = "unknown_" + network.chainId;
					}

					return ["ready", networkStr];
				} catch (err) {
					if (err.reason == "underlying network changed") {
						_web3Provider = new ethers.providers.Web3Provider(_web3Provider.provider);
						return queryNetworkState();
					}
					return ["not_connected", null];
				}
			}
			return ["not_enabled", null];
		}

		// Helper function to get the current web3 account
		async function queryAccount() {
			if (_web3Provider != null) {
				try {
					let signer = _web3Provider.getSigner(0);
					let signerAddress = await signer.getAddress();
					return formatAddress(signerAddress);
				} catch (err) {
					if (err.reason.indexOf('unknown account') > -1) {
						return null;
					}
					throw err;
				}
			}
			return null;
		}

		// Helper function to clean up any subscriptions during destroy events
		function cleanSubscriptions(ev) {
			for (let i = 0; i < _onStateChangeFunctions.length;) {
				if (_onStateChangeFunctions[i].scope.$id === ev.currentScope.$id) _onStateChangeFunctions.splice(i, 1);
				else i++;
			}
			for (let i = 0; i < _onNetworkChangeFunctions.length;) {
				if (_onNetworkChangeFunctions[i].scope.$id === ev.currentScope.$id) _onNetworkChangeFunctions.splice(i, 1);
				else i++;
			}
			for (let i = 0; i < _onAccountChangeFunctions.length;) {
				if (_onAccountChangeFunctions[i].scope.$id === ev.currentScope.$id) _onAccountChangeFunctions.splice(i, 1);
				else i++;
			}
			for (let i = 0; i < _onWaitingTransactionsChangeFunctions.length;) {
				if (_onWaitingTransactionsChangeFunctions[i].scope.$id === ev.currentScope.$id) _onWaitingTransactionsChangeFunctions.splice(i, 1);
				else i++;
			}
		}

		// Helper function to execute the given list of functions with the given data
		function executeCallbackFunctions(functions, data) {
			for (let i in functions) {
				let func = functions[i].func;
				let scope = functions[i].scope;

				func(data);
				if (scope && scope.$root.$$phase != '$apply' && scope.$root.$$phase != '$digest') {
					scope.$apply();
				}
			}
		}


		/////////////////////////////////////
		// Helper Functions (transactions) //
		/////////////////////////////////////


		// Helper function to get transaction status
		async function getTransactionStatus(txHash) {
			if (_state == "ready") {
				try {
					let receipt = await _web3Provider.getTransactionReceipt(txHash);
					if (receipt != null) {
						return {
							txHash: txHash,
							status: receipt.status,
							confirmations: receipt.confirmations,
							logs: receipt.logs
						};
					}
				} catch (err) { }
				return {
					txHash: txHash
				};
			} else {
				throw new Error("no web3");
			}
		}

		// Helper function to watch for transaction completion
		function transactionWait(transaction) {
			return $q(function (resolve, reject) {
				let start = (new Date).getTime();
				let check_transaction = async function () {
					try {
						if (transaction.network == getCurrentNetwork()) {
							let result = await getTransactionStatus(transaction.txHash);
							if (result.status === 1 && result.confirmations >= _transactionWaitConfirmations) {
								resolve(result);
								return;
							} else if (result.status === 0) {
								reject(new Error("Transaction " + transaction.txHash + " failed"));
								return;
							} else if (_transactionWaitTimeout > 0 && (new Date).getTime() - start > _transactionWaitTimeout) {
								reject(new Error("Transaction " + transaction.txHash + " wasn't processed within " + _transactionWaitTimeout / 1000 + " seconds"));
								return;
							}
						}
						$timeout(check_transaction, _transactionWaitPoll);
					} catch (err) {
						reject(err);
					}
				};
				check_transaction();
			});
		}

		// Helper function to wait for a transaction to finish, transform its return data and remove it from waiting list
		async function transactionWaitTransformRemove(transaction) {
			let returnData = null;
			try {
				//wait on transaction to finish
				let result = await transactionWait(transaction);
				returnData = {
					txHash: result.txHash,
					success: true,
					type: transaction.type,
					description: transaction.description,
					logs: result.logs
				};

				//transform transaction data
				for (let i = 0; i < _transactionDataTransformers.length; i++) {
					returnData = await _transactionDataTransformers[i](transaction, returnData);
				}
			} catch (err) {
				console.log(err);

				//transaction failed or timed out
				returnData = {
					txHash: result.txHash,
					success: false,
				};
			}

			//remove transaction from waiting list
			for (let i = 0; i < _waitingTransactions.length; i++) {
				if (_waitingTransactions[i].txHash === transaction.txHash) {
					_waitingTransactions.splice(i, 1)[0];
					storeWaitingTransactions();
					executeCallbackFunctions(_onWaitingTransactionsChangeFunctions, returnData);
					break;
				}
			}

			return returnData;
		}

		// Helper function to check if waiting transactions should be reloaded for account
		function checkWaitingTransactionsForAccount() {
			let account = getActiveAccount();
			if (_waitingTransactionsAccount != account) {
				_waitingTransactionsAccount = account;
				loadWaitingTransactions();

			} else {
				//run callbacks anyway in case transactions changed
				executeCallbackFunctions(_onWaitingTransactionsChangeFunctions, getWaitingTransactions());
			}
		}

		// Helper function to update transactions to the current active account
		async function loadWaitingTransactions() {
			let account = getActiveAccount();
			_waitingTransactions = [];
			if (account && _localStorage && _state == "ready") {
				try {
					let accountHash = ethers.utils.keccak256(account);
					let storageLocation = ethers.utils.keccak256(accountHash);
					let storedWaitingTransactions = _localStorage['pixelcons_' + storageLocation];
					if (storedWaitingTransactions) {
						storedWaitingTransactions = CryptoJS.AES.decrypt(storedWaitingTransactions, accountHash).toString(CryptoJS.enc.Utf8);
						storedWaitingTransactions = JSON.parse(storedWaitingTransactions);

						//check the state of each transaction
						let now = (new Date()).getTime();
						for (let i = 0; i < storedWaitingTransactions.length; i++) {
							let timeElapsed = now - storedWaitingTransactions[i].timestamp;
							if (_transactionWaitTimeout <= 0 || timeElapsed < _transactionWaitTimeout) {
								let result = await getTransactionStatus(storedWaitingTransactions[i].txHash);
								let failed = (result.status === 0);
								let confirmed = (result.status === 1 && result.confirmations >= _transactionWaitConfirmations);
								if (!failed && !confirmed) {
									//transaction still waiting
									_waitingTransactions.push(storedWaitingTransactions[i]);
								}
							}
						}

						//setup promises to wait for transaction finish
						for (let i = 0; i < _waitingTransactions.length; i++) {
							transactionWaitTransformRemove(_waitingTransactions[i]);
						}

						//save the new updated transaction list
						storeWaitingTransactions();
					}
				} catch (err) {
					console.log("Something went wrong trying to recover transaction history...");
				}
			}
			executeCallbackFunctions(_onWaitingTransactionsChangeFunctions, null);
		}

		// Helper function to store currently waiting transactions for later recovery
		async function storeWaitingTransactions() {
			let account = getActiveAccount();
			if (account && _localStorage && _state == "ready") {
				try {
					let accountHash = ethers.utils.keccak256(account);
					let storageLocation = ethers.utils.keccak256(accountHash);
					let data = JSON.stringify(_waitingTransactions);
					data = CryptoJS.AES.encrypt(data, accountHash).toString();

					_localStorage['pixelcons_' + storageLocation] = data;
				} catch (err) {
					console.log("Something went wrong trying to store transaction history...");
				}
			}
		}
	}
}());
