(function () {
	angular.module('App')
		.service('web3Service', web3Service);
		
	web3Service.$inject = ['$interval', '$q'];
	function web3Service($interval, $q) {
		var _expectedNetwork = null; //Options: Main, Morden, Ropsten, Rinkeby, Kovan (set to 'null' if you wish to support all of them)
		var _backupWeb3Provider = 'https://mainnet.infura.io/v3/07d72fe8b8b74534a05d2091e108e26e';
		var _transactionLookupUrl = 'https://etherscan.io/tx/<txHash>';
		var _accountLookupUrl = 'https://etherscan.io/address/<address>';
		
		var _state = "not_enabled";
		var _currNetwork = null;
		var _isReadOnly = false;
		var _accounts = [];
		var _contracts = {};
		var _waitingTransactions = [];
		var _waitingTransactionsWithCallbacks = [];
		var _waitingTransactionsBeingChecked = [];
		var _waitingTransactionsAccount = null;
		var _recoveryTransactionDataInjectors = [];
		var _gasPrice = null;
		var _dummyAddress = '0x6f253C705A481dB2Ae4e5e251A0b1f19916DE2ed';
		var _noAccountError = 'No Ethereum Account';
		var _notEnabledError = 'No Ethereum Connection';
		var _notConnectedError = 'Ethereum Provider Not Connected';
		var _unknownError = 'Unknown Error';
		var _invalidAddressError = 'Invalid Address';
		var localStorage = window.localStorage;
		
		var web3Provider = null;
		if (typeof web3 !== 'undefined') {
			web3Provider = web3.currentProvider;
			web3 = new Web3(web3Provider);
			_state = queryState();
			_accounts = queryAccounts();
			_currNetwork = queryNetwork();
		} else {
			
			//read-only mode
			var web3js = require('web3');
			web3Provider = new web3js.providers.HttpProvider(_backupWeb3Provider);
			web3 = new web3js(web3Provider);
			_isReadOnly = true;
			_state = queryState();
			_accounts = queryAccounts();
			_currNetwork = queryNetwork();
		}
		checkWaitingTransactionsForAccount();
		
		// Poll for state changes
		var onAccountChangeFunctions = [];
		var onStateChangeFunctions = [];
		var onWaitingTransactionsChangeFunctions = [];
		$interval(function() {
			queryGasPrice();
			
			var newState = queryState();
			var stateChanged = (_state != newState);
			_state = newState;
			
			var newAccounts = queryAccounts();
			var accountsChanged = (_accounts.toString() != newAccounts.toString());
			_accounts = newAccounts;
			
			if(stateChanged) { 
				executeCallbackFunctions(onStateChangeFunctions, _state);
			}
			if(accountsChanged) { 
				executeCallbackFunctions(onAccountChangeFunctions, _accounts);
				checkWaitingTransactionsForAccount();
			}
		}, 1000);
		
		// Setup functions
		this.getState = getState;
		this.isReadOnly = isReadOnly;
		this.getExpectedNetwork = getExpectedNetwork;
		this.getCurrentNetwork = getCurrentNetwork;
		this.isWrongNetwork = isWrongNetwork;
		this.getTransactionLookupUrl = getTransactionLookupUrl;
		this.getProviderName = getProviderName;
		this.onStateChange = onStateChange;
		this.getAllAccounts = getAllAccounts;
		this.getActiveAccount = getActiveAccount;
		this.onAccountDataChange = onAccountDataChange;
		this.getWaitingTransactions = getWaitingTransactions;
		this.addWaitingTransaction = addWaitingTransaction;
		this.addRecoveryTransactionDataInjector = addRecoveryTransactionDataInjector;
		this.onWaitingTransactionsChange = onWaitingTransactionsChange;
		this.getContract = getContract;
		this.verifySendEth = verifySendEth;
		this.sendEth = sendEth;
		this.getDummyAddress = getDummyAddress;
		this.isAddress = isAddress;
		this.to256Hex = to256Hex;
		this.fromUtf8 = fromUtf8;
		this.toUtf8 = toUtf8;
		this.toWei = toWei;
		this.getGasPrice = getGasPrice;
		this.transactionWrapper = transactionWrapper;
		
		
		///////////
		// State //
		///////////
		
		
		// Gets the state of the web3 library 
		function getState() {
			return _state;
		}
		
		// Gets if web3 is read only
		function isReadOnly() {
			return _isReadOnly;
		}
		
		// Gets the desired network
		function getExpectedNetwork() {
			if(_expectedNetwork) return _expectedNetwork;
			return getCurrentNetwork();
		}
		
		// Gets the current connected network
		function getCurrentNetwork() {
			if(_state != "ready") return null;
			return _currNetwork;
		}
		
		// Gets if connected to the wrong network
		function isWrongNetwork() {
			if(_state != "ready" || !_expectedNetwork) return false;
			return _expectedNetwork != _currNetwork;
		}
		
		// Gets url for displaying more details about a transaction
		function getTransactionLookupUrl(txHash) {
			if(txHash) return _transactionLookupUrl.replace('<txHash>', txHash);
			return _accountLookupUrl.replace('<address>', getActiveAccount());
		}
		
		// Register callback for account data change
		function onStateChange(callback, scope) {
			if(scope) scope.$on('$destroy', cleanSubscriptions);
			onStateChangeFunctions.push({func:callback, scope:scope});
		}
		
		// Gets the provider name
		function getProviderName() {
			if(_state != "ready") return null;
			
			if(web3 && web3.currentProvider.isMetaMask) return 'MetaMask';
			return 'your Ethereum Account';
		}
		
		
		//////////////
		// Accounts //
		//////////////
		
		
		// Gets all accounts (note: account[0] is the active account)
		function getAllAccounts() {
			return _accounts;
		}
		
		// Gets the active account
		function getActiveAccount() {
			return _accounts[0];
		}
		
		// Register callback for account data change
		function onAccountDataChange(callback, scope) {
			if(scope) scope.$on('$destroy', cleanSubscriptions);
			onAccountChangeFunctions.push({func:callback, scope:scope});
		}
		
		
		//////////////////
		// Transactions //
		//////////////////
		
		
		// Gets waiting transactions
		function getWaitingTransactions() {
			return _waitingTransactions;
		}
		
		// Adds a new transaction to the wait list
		function addWaitingTransaction(transaction, txHash, params, type, description) {
			var transactionObject = {
				txHash: txHash,
				params: params,
				type: type,
				description: description,
				timestamp: (new Date()).getTime()
			}
			_waitingTransactions.push(transactionObject);
			storeWaitingTransactions();
			executeCallbackFunctions(onWaitingTransactionsChangeFunctions, null);
			
			//transaction finished callback
			if(_waitingTransactionsWithCallbacks.indexOf(txHash) == -1) {
				_waitingTransactionsWithCallbacks.push(txHash);
				var transactionFinished = function(data) { removeWaitingTransaction(txHash, data); }
				transaction.then(transactionFinished, transactionFinished);
			}
		}
		
		// Removes a transaction from the wait list
		function removeWaitingTransaction(txHash, data) {
			for(var i=0; i<_waitingTransactionsWithCallbacks.length; i++) { 
				if(_waitingTransactionsWithCallbacks[i] === txHash) {
					_waitingTransactionsWithCallbacks.splice(i, 1);
					break;
				}
			}
			var transactionObject = null;
			for(var i=0; i<_waitingTransactions.length; i++) {
				if(_waitingTransactions[i].txHash === txHash) {
					transactionObject = _waitingTransactions.splice(i,1)[0];
					storeWaitingTransactions();
					break;
				}
			}
			if(transactionObject != null) {
				data.success = (data.receipt !== undefined && parseInt(data.receipt.status) > 0);
				data.txHash = transactionObject.txHash;
				data.type = transactionObject.type;
				data.description = transactionObject.description;
				executeCallbackFunctions(onWaitingTransactionsChangeFunctions, data);
			}
		}
		
		// Adds a function to be run on a transaction result promise to inject additional data
		function addRecoveryTransactionDataInjector(transactionDataInjector) {
			_recoveryTransactionDataInjectors.push(transactionDataInjector);
		}
		
		// Register callback for waiting transactions change
		function onWaitingTransactionsChange(callback, scope) {
			if(scope) scope.$on('$destroy', cleanSubscriptions);
			onWaitingTransactionsChangeFunctions.push({func:callback, scope:scope});
		}
		
		
		///////////////
		// Contracts //
		///////////////
		
		
		// Gets contract object based on given ABI to load
		function getContract(contractABI) {
			return $q(function(resolve, reject) {
				
				//make sure web3 is ready
				if(_state == "not_enabled") reject(_notEnabledError);
				else if(_state == "not_connected") reject(_notConnectedError);
				else if(_state != "ready") reject(_unknownError);
				else {
					//check if contract is already being fetched
					if(_contracts[contractABI]) {
						if(Array.isArray(_contracts[contractABI])) {
							//add resolve/reject to array for when fetch returns
							_contracts[contractABI].push({resolve:resolve, reject:reject});
							
						} else {
							//contract already fetched
							resolve(_contracts[contractABI]);
							
						}
					} else {
						//add resolve/reject to array for when fetch returns
						_contracts[contractABI] = [{resolve:resolve, reject:reject}];
						
						//fetch
						$.getJSON(contractABI).then(function(artifact) {
							var contract = TruffleContract(artifact);
							contract.setProvider(web3Provider);
							contract.deployed().then(function(contractInstance) {
								var waiting = _contracts[contractABI];
								_contracts[contractABI] = contractInstance;
								
								//finish promises for anything that was waiting
								if(waiting) {
									for(var i=0; i<waiting.length; i++) waiting[i].resolve(contractInstance);
								}
								
							}, function(reason) {
								var waiting = _contracts[contractABI];
								_contracts[contractABI] = undefined;
								
								//finish promises for anything that was waiting
								if(waiting) {
									for(var i=0; i<waiting.length; i++) waiting[i].reject('Failed to get deployed contract');
								}
								
							});						
						}, function(reason) {
							var waiting = _contracts[contractABI];
							_contracts[contractABI] = undefined;
							
							//finish promises for anything that was waiting
							if(waiting) {
								for(var i=0; i<waiting.length; i++) waiting[i].reject('Failed to load contract ABI');
							}
						});
					}
				}
			});
		}
		
		
		//////////
		// Send //
		//////////
		
		
		// Get estimated send gas price
		function verifySendEth(address, amount) {
			if(address === undefined || address === null) address = _dummyAddress;
			if(amount === undefined || amount === null) amount = 0.00001;
			return $q(function(resolve, reject) {
				if(_state == "not_enabled") reject(_notEnabledError);
				else if(_state == "not_connected") reject(_notConnectedError);
				else if(_state != "ready") reject(_unknownError);
				else if(isReadOnly()) reject(_noAccountError);
				else if(!isAddress(address)) reject(_invalidAddressError);
				else {
					web3.eth.estimateGas({from: _accounts[0], to:address, value:web3.toWei(amount, 'ether')}, function(data, price) {
						if(!price) reject('Something went wrong while verifying send');
						else {
							var estCost = getGasPrice(price);
							resolve({
								estCost: estCost
							});
						}
					});
				}
			});
		}
		
		// Send amount of eth to the given address
		function sendEth(address, amount) {
			return $q(function(resolve, reject) {
				if(_state == "not_enabled") reject(_notEnabledError);
				else if(_state == "not_connected") reject(_notConnectedError);
				else if(_state != "ready") reject(_unknownError);
				else if(isReadOnly()) reject(_noAccountError);
				else if(!isAddress(address)) reject(_invalidAddressError);
				else {
					web3.eth.estimateGas({from: _accounts[0], to:address, value:web3.toWei(amount, 'ether')}, function(data, price) {
						if(!price) reject('Something went wrong while sending eth');
						else {
							var transaction = web3.eth.sendTransaction({from: _accounts[0], to:address, value:web3.toWei(amount, 'ether'), gasLimit:price, gasPrice:_gasPrice}, function(err, hash) {
								if(!hash) resolve(hash);
								else reject('Something went wrong while sending eth');
							});
						}
					});
				}
			});
		}
		
		
		///////////
		// Utils //
		///////////
		
		
		// Gets an example valid address
		function getDummyAddress() {
			return _dummyAddress;
		}
		
		// Verifies if the given address is valid
		function isAddress(address) {
			if(_state != "ready") return null;
			
			return web3.isAddress(address);
		}
		
		// Converts given number into 256 bit hex code
		function to256Hex(number) {
			if(_state != "ready") return null;
			
			var hex = web3.toHex(number);
			while(hex.length < 66) hex = hex.slice(0, 2) + '0' + hex.slice(2);
			return hex;
		}
		
		// Converts given utf8 text into hex code
		function fromUtf8(text) {
			if(_state != "ready") return null;
			var val = web3.fromUtf8(text);
			if(val == '0x') val = 0;
			
			return val;
		}
		
		// Converts hex code into a full string
		function toUtf8(hex) {
			if(_state != "ready") return null;
			
			return web3.toUtf8(hex);
		}
		
		// converts the given Ether amount into Wei
		function toWei(ether) {
			if(_state != "ready") return null;
			
			return web3.toBigNumber(web3.toWei(ether));
		}
		
		// Gets the current gas price (or the ether price is gas amount is provided)
		function getGasPrice(gas) {
			if(_state != "ready") return null;
			if(!gas) return _gasPrice;
			
			return web3.fromWei((gas * _gasPrice), 'ether');
		}
		
		// Wraps contract transactions to intercept the transaction hash
		function transactionWrapper() {
			var args = Array.prototype.slice.call(arguments);
			var contract = args.splice(0,1)[0];
			var fn = args.splice(0,1)[0];
			return $q(function(resolve, reject) {
				var callback = function(error, tx) {
					if (error != null) return reject(error);
					resolve({
						txHash: tx, 
						transactionPromise: onTransactionComplete(tx)
					});
				};
				args.push(callback);
				contract.contract[fn].apply(null, args);
			});
		}
		
		
		//////////////////////
		// Helper Functions //
		//////////////////////
		
		
		// Helper function to get the current web3 state
		function queryState() {
			if(web3Provider == null) return "not_enabled";
			if(!web3.isConnected()) return "not_connected";
			
			return "ready";
		}
		
		// Helper function to get the current list of web3 accounts
		function queryAccounts() {
			if(_state == "ready") {
				var activeAccount = web3.eth.defaultAccount;
				var web3Accounts = web3.eth.accounts || [];
				
				var allAccounts = [];
				if(activeAccount) allAccounts.push(activeAccount);
				for(var i in web3Accounts) {
					if(web3Accounts[i] != activeAccount) allAccounts.push(web3Accounts[i]);
				}
				return allAccounts;
			}
			return [];
		}
		
		// Helper function to query for the current gas price
		function queryGasPrice() {
			if(_state == "ready") {
				web3.eth.getGasPrice(function(error, result) {
					if(!error && result) {
						_gasPrice = result;
					}
				});
			}
			return null;
		}
		
		// Helper function to query for the current network
		function queryNetwork() {
			if(_state == "ready") {
				if(web3.version.network == "1") return "Main";
				if(web3.version.network == "2") return "Morden";
				if(web3.version.network == "3") return "Ropsten";
				if(web3.version.network == "4") return "Rinkeby";
				if(web3.version.network == "42") return "Kovan";
				return "Unknown";
			}
			return null;
		}
		
		// Helper function to clean up any subscriptions during destroy events
		function cleanSubscriptions(ev) {
			for(var i=0; i<onStateChangeFunctions.length;) {
				if(onStateChangeFunctions[i].scope.$id === ev.currentScope.$id) onStateChangeFunctions.splice(i,1);
				else i++;
			}
			for(var i=0; i<onAccountChangeFunctions.length;) {
				if(onAccountChangeFunctions[i].scope.$id === ev.currentScope.$id) onAccountChangeFunctions.splice(i,1);
				else i++;
			}
			for(var i=0; i<onWaitingTransactionsChangeFunctions.length;) {
				if(onWaitingTransactionsChangeFunctions[i].scope.$id === ev.currentScope.$id) onWaitingTransactionsChangeFunctions.splice(i,1);
				else i++;
			}
		}
		
		// Helper function to execute the given list of functions with the given data
		function executeCallbackFunctions(functions, data) {
			for(var i in functions) {
				var func = functions[i].func;
				var scope = functions[i].scope;
				
				func(data);
				if(scope && scope.$root.$$phase != '$apply' && scope.$root.$$phase != '$digest') {
					scope.$apply();
				}
			}
		}
		
		
		/////////////////////////////////////
		// Helper Functions (transactions) //
		/////////////////////////////////////
		
		
		// Helper function to get transaction status
		function getTransactionStatus(txHash, callback) {
			if(_state != "ready") callback(new Error("no web3"), null);
			else {
				web3.eth.getTransactionReceipt(txHash, function(err, receipt) {
					if (err && !err.toString().includes("unknown transaction")) {
						return callback(err, null);
					}
					if (receipt != null) {
						if (parseInt(receipt.status, 16) == 0) {
							return callback(new Error("Transaction failed!"), null);
						} else {
							return callback(null, {
								tx: txHash,
								receipt: receipt,
								logs: receipt.logs
							});
						}
					}
					return callback(null, null);
				});
			}
		}
		
		// Helper function to watch for transaction completion
		function onTransactionComplete(txHash) {
			var timeout = 30*60*1000;
			var interval = 1*1000;
			
			return $q(function(resolve, reject) {
				var start = (new Date).getTime();
				var make_attempt = function() {
					getTransactionStatus(txHash, function(err, data) {
						if(err != null) return reject(err);
						if(data != null) return resolve(data);
						if (timeout > 0 && (new Date).getTime() - start > timeout) {
							return reject(new Error("Transaction " + txHash + " wasn't processed in " + timeout / 1000 + " seconds!"));
						}
						setTimeout(make_attempt, interval);
					});
				};
				make_attempt();
			});
		}
		
		// Helper function to check if waiting transactions should be reloaded for account
		function checkWaitingTransactionsForAccount() {
			var acct = getActiveAccount();
			if(_waitingTransactionsAccount != acct) {
				_waitingTransactionsAccount = acct;
				recoverWaitingTransactions();
			}
		}
		
		// Helper function to check up on a transaction
		function checkUpOnTransactions(oldTransactions) {
			_waitingTransactionsBeingChecked = oldTransactions;
			
			var numChecked = 0;
			var transactionsToAdd = [];
			var checkTransaction = function(transaction) {
				getTransactionStatus(transaction.txHash, function(err, data) {
					if(err == null && data == null) transactionsToAdd.push(transaction);
					if((++numChecked) >= oldTransactions.length) {
						_waitingTransactionsBeingChecked = [];
						addRecoveredWaitingTransactions(transactionsToAdd);
					}
				});
			}
			for(var i=0; i<oldTransactions.length; i++) checkTransaction(oldTransactions[i]);
		}
		
		// Helper function to wait for a transaction to complete
		function waitForTransactionFinish(oldTransaction) {
			var transactionFinished = function(data) {
				var dataInjectors = [];
				for(var j=0; j<_recoveryTransactionDataInjectors.length; j++) {
					dataInjectors.push(_recoveryTransactionDataInjectors[j](oldTransaction, data));
				}
				Promise.all(dataInjectors).then(function() { 
					removeWaitingTransaction(oldTransaction.txHash, data); 
				});
			}
			var transaction = onTransactionComplete(oldTransaction.txHash);
			transaction.then(transactionFinished, transactionFinished);
		}
		
		// Helper function to add multiple existing transactions to the waiting list
		function addRecoveredWaitingTransactions(oldTransactions) {
			for(var i=0; i<oldTransactions.length; i++) {
				_waitingTransactions.push(oldTransactions[i]);
				var txHash = oldTransactions[i].txHash;
				if(_waitingTransactionsWithCallbacks.indexOf(txHash) == -1) {
					_waitingTransactionsWithCallbacks.push(txHash);
					
					//transaction finished callback
					waitForTransactionFinish(oldTransactions[i]);
				}
			}
			if(oldTransactions.length > 0) {
				storeWaitingTransactions();
				executeCallbackFunctions(onWaitingTransactionsChangeFunctions, null);
			}
		}
		
		// Helper function to recover unfinished transactions
		function recoverWaitingTransactions() {
			var assumedNotFinished = 15*1000;
			var assumedDead = 24*60*60*1000;
			
			var acct = getActiveAccount();
			if(acct && _state == "ready") {
				var oldWaitingTransactionCount = _waitingTransactions.length;
				_waitingTransactions = [];
				if(localStorage && acct && _state == "ready") {
					var accountHash = web3.sha3(acct);
					var storageLocation = web3.sha3(accountHash);
					var oldWaitingTransactions = localStorage['pixelcons' + queryNetwork() + '_' + storageLocation];
					if(oldWaitingTransactions) {
						try {
							oldWaitingTransactions = CryptoJS.AES.decrypt(oldWaitingTransactions, accountHash).toString(CryptoJS.enc.Utf8);
							oldWaitingTransactions = JSON.parse(oldWaitingTransactions);
						} catch(err) {
							console.log("Something went wrong trying to recover transaction history...");
						}
						
						// re add the stored transactions to the waiting list
						var transactionsToCheck = [];
						var transactionsToAdd = [];
						var now = (new Date()).getTime();
						for(var i=0; i<oldWaitingTransactions.length; i++) {
							if(now < oldWaitingTransactions[i].timestamp + assumedNotFinished) transactionsToAdd.push(oldWaitingTransactions[i]);
							else if(now < oldWaitingTransactions[i].timestamp + assumedDead) transactionsToCheck.push(oldWaitingTransactions[i]);
						}
						checkUpOnTransactions(transactionsToCheck);
						addRecoveredWaitingTransactions(transactionsToAdd);
					}
				}
				if(oldWaitingTransactionCount > 0 && _waitingTransactions.length == 0) {
					storeWaitingTransactions();
					executeCallbackFunctions(onWaitingTransactionsChangeFunctions, null);
				}
			}
		}
		
		// Helper function to store currently waiting transactions for later recovery
		function storeWaitingTransactions() {
			var acct = getActiveAccount();
			if(localStorage && acct && _state == "ready") {
				var accountHash = web3.sha3(acct);
				var storageLocation = web3.sha3(accountHash);
				try {
					var totalTransactionsToStore = [];
					for(var i=0; i<_waitingTransactions.length; i++) totalTransactionsToStore.push(_waitingTransactions[i]);
					for(var i=0; i<_waitingTransactionsBeingChecked.length; i++) totalTransactionsToStore.push(_waitingTransactionsBeingChecked[i]);
					
					var data = JSON.stringify(totalTransactionsToStore);
					data = CryptoJS.AES.encrypt(data, accountHash).toString();
					localStorage['pixelcons' + queryNetwork() + '_' + storageLocation] = data;
				} catch(err) {
					console.log("Something went wrong trying to store transaction history...");
				}
			}
		}
	}
}());