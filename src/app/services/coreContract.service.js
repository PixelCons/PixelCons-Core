(function () {
	angular.module('App')
		.service('coreContract', coreContract);

	coreContract.$inject = ['web3Service', '$q'];
	function coreContract(web3Service, $q) {
		const _contractPath = 'contracts/PixelCons.json';
		const _chainId = '1337';
		const _cacheNameFetch = true;
		const _maxNameFetch = 10000;
		const _maxFilterParamSize = 100;
		const _maxQueryParamSize = 100;
		const _maxCreateCollection = 60;
		const _defaultGasParameters = {};

		const _noAccountError = 'No Account';
		const _accountPrivateError = 'Account Not Connected';
		const _notEnabledError = 'No Network Connection';
		const _notConnectedError = 'Network Provider Not Connected';
		const _unknownError = 'Unknown Error';
		const _functionDisabledError = 'Function is Disabled';
		const _invalidIdError = 'Invalid ID';
		const _invalidIndexError = 'Invalid Index';
		const _invalidAddressError = 'Invalid Address';
		const _duplicateTransactionError = 'Duplicate Transaction Already Processing';
		const _verificationError = 'Something went wrong while verifying';
		const _overMaxError = 'Too many PixelCons selected';

		// Setup functions
		this.getTotalPixelcons = getTotalPixelcons;
		this.getAllNames = getAllNames;
		this.fetchPixelcon = fetchPixelcon;
		this.fetchCollection = fetchCollection;
		this.fetchPixelconsByAccount = fetchPixelconsByAccount;
		this.fetchPixelconsByCreator = fetchPixelconsByCreator;
		this.fetchPixelconsByIndexes = fetchPixelconsByIndexes;
		this.fetchPixelconsByIds = fetchPixelconsByIds;
		this.verifyCreatePixelcon = verifyCreatePixelcon;
		this.verifyUpdatePixelcon = verifyUpdatePixelcon;
		this.verifyCreateCollection = verifyCreateCollection;
		this.verifyUpdateCollection = verifyUpdateCollection;
		this.verifyClearCollection = verifyClearCollection;
		this.verifyTransferPixelcon = verifyTransferPixelcon;
		this.createPixelcon = createPixelcon;
		this.updatePixelcon = updatePixelcon;
		this.createCollection = createCollection;
		this.updateCollection = updateCollection;
		this.clearCollection = clearCollection;
		this.transferPixelcon = transferPixelcon;
		this.formatPixelconId = formatPixelconId;

		// Transaction type/description
		var _createTypeDescription = ["Create PixelCon", "Creating PixelCon..."];
		var _updateTypeDescription = ["Rename PixelCon", "Updating PixelCon..."];
		var _transferTypeDescription = ["Transfer PixelCon", "Sending PixelCon..."];
		var _createCollectionTypeDescription = ["Create PixelCon Collection", "Creating Collection..."];
		var _updateCollectionTypeDescription = ["Rename PixelCon Collection", "Updating Collection..."];
		var _clearCollectionTypeDescription = ["Clear PixelCon Collection", "Clearing Collection..."];

		// Init
		web3Service.addTransactionDataTransformer(addPixelconDataForTransaction);
		web3Service.registerContractService('coreContract', this);


		///////////
		// Query //
		///////////


		// Gets the names of all pixelcons in existence
		function getTotalPixelcons() {
			return $q(async function (resolve, reject) {
				let state = web3Service.getState();
				if (state == "not_enabled") reject(_notEnabledError);
				else if (state == "not_connected") reject(_notConnectedError);
				else if (state != "ready") reject(_unknownError);
				else {
					try {
						let contract = await web3Service.getContract(_contractPath, _chainId);
						let total = await contract.totalSupply();
						resolve(total.toNumber());
					} catch (err) {
						console.log(err);
						reject(err.name == 'UserActionNeededError' ? err.actionNeeded : 'Something went wrong while fetching count');
					}
				}
			});
		}

		// Gets the names of all pixelcons in existence
		var pixelconNames = [];
		var pixelconNamesPromises = [];
		function getAllNames() {
			return $q(async function (resolve, reject) {
				let state = web3Service.getState();
				if (state == "not_enabled") reject(_notEnabledError);
				else if (state == "not_connected") reject(_notConnectedError);
				else if (state != "ready") reject(_unknownError);
				else {
					let othersFetching = pixelconNamesPromises.length > 0;
					pixelconNamesPromises.push({resolve:resolve, reject:reject});
					if(!othersFetching) {
						try {
							let contract = await web3Service.getContract(_contractPath, _chainId);
							let total = (await contract.totalSupply()).toNumber();
							if (!_cacheNameFetch || pixelconNames.length != total) {
								pixelconNames = new Array(total);
								if(total > 0) {
									if (!_maxNameFetch || total <= _maxNameFetch) {

										//get all at once
										let names = await contract.getAllNames();
										for (let i = 0; i < names.length; i++) pixelconNames[i] = web3Service.toUtf8(names[i]);
									} else {

										//get in pages
										let index = 0;
										let pixelconNamesIndex = 0;
										while (index < total) {
											let rangeEnd = index + _maxNameFetch;
											if (rangeEnd > total) rangeEnd = total;
											let names = await contract.getNamesInRange(index, rangeEnd);
											for (let i = 0; i < names.length; i++) pixelconNames[pixelconNamesIndex++] = web3Service.toUtf8(names[i]);
											index = rangeEnd;
										}
									}
								}
							}
								
							//resolve for all waiting promises
							for(let i=0; i<pixelconNamesPromises.length; i++) pixelconNamesPromises[i].resolve(pixelconNames);
							pixelconNamesPromises = [];
							
						} catch (err) {
							console.log(err);
							for(let i=0; i<pixelconNamesPromises.length; i++) pixelconNamesPromises[i].reject(err.name == 'UserActionNeededError' ? err.actionNeeded : 'Something went wrong while fetching names');
							pixelconNamesPromises = [];
						}
					}
				}
			});
		}

		// Gets the details for the given pixelcon id
		function fetchPixelcon(id) {
			let index = Number.isInteger(id) ? id : null;
			id = formatPixelconId(id);
			return $q(async function (resolve, reject) {
				let state = web3Service.getState();
				if (state == "not_enabled") reject(_notEnabledError);
				else if (state == "not_connected") reject(_notConnectedError);
				else if (state != "ready") reject(_unknownError);
				else if (id === null && index === null) reject(_invalidIdError);
				else {
					try {
						let contract = await web3Service.getContract(_contractPath, _chainId);
						let pixelconRaw = null;
						if(index !== null) {
							let total = (await contract.totalSupply()).toNumber();
							if (total < index) {

								//not found
								resolve(null);
							} else {

								//get details
								pixelconRaw = await contract.getTokenDataByIndex(index);
							}
							
						} else if(id !== null) {
							let exists = await contract.exists(id);
							if (!exists) {

								//not found
								resolve(null);
							} else {

								//get details
								pixelconRaw = await contract.getTokenData(id);
							}
						}
						
						//get details
						//uint256 _tknId, uint64 _tknIdx, uint64 _collection, address _owner, address _creator, bytes8 _name, uint32 _dateCreated
						if(pixelconRaw) {
							let pixelcon = {
								id: web3Service.to256Hex(pixelconRaw[0].toHexString()),
								index: pixelconRaw[1].toNumber(),
								name: web3Service.toUtf8(pixelconRaw[5]),
								owner: web3Service.formatAddress(pixelconRaw[3]),
								creator: web3Service.formatAddress(pixelconRaw[4]),
								date: pixelconRaw[6] * 1000,
								collection: pixelconRaw[2].toNumber() ? pixelconRaw[2].toNumber() : null
							};
							resolve(pixelcon);
						}
					} catch (err) {
						console.log(err);
						reject(err.name == 'UserActionNeededError' ? err.actionNeeded : 'Something went wrong while fetching details');
					}
				}
			});
		}

		// Gets the details for the given pixelcon collection index
		function fetchCollection(index) {
			return $q(async function (resolve, reject) {
				index = formatCollectionIndex(index);
				let state = web3Service.getState();
				if (state == "not_enabled") reject(_notEnabledError);
				else if (state == "not_connected") reject(_notConnectedError);
				else if (state != "ready") reject(_unknownError);
				else if (index == null) reject(_invalidIndexError);
				else {
					try {
						let contract = await web3Service.getContract(_contractPath, _chainId);
						let exists = await contract.collectionExists(index);
						if (!exists) {

							//not found
							reject('PixelCon collection does not exist');
						} else {

							//get collection
							let collection = await getCollectionByIndex(contract, index);
							collection.pixelcons = await getPixelconsByIds(contract, collection.pixelconIds);
							resolve(collection);
						}
					} catch (err) {
						console.log(err);
						reject(err.name == 'UserActionNeededError' ? err.actionNeeded : 'Something went wrong while fetching collection details');
					}
				}
			});
		}

		// Gets all pixelcons owned by the given address
		function fetchPixelconsByAccount(address) {
			return $q(async function (resolve, reject) {
				let state = web3Service.getState();
				if (state == "not_enabled") reject(_notEnabledError);
				else if (state == "not_connected") reject(_notConnectedError);
				else if (state != "ready") reject(_unknownError);
				else if (!web3Service.isAddress(address)) reject(_invalidAddressError);
				else {
					try {
						let contract = await web3Service.getContract(_contractPath, _chainId);

						//get all for owner
						let ownerPixelconIndexes = await contract.getForOwner(address);
						let pixelcons = await getPixelconsByIndexes(contract, ownerPixelconIndexes);
						resolve(pixelcons);
						
					} catch (err) {
						console.log(err);
						reject(err.name == 'UserActionNeededError' ? err.actionNeeded : 'Something went wrong while fetching account PixelCons');
					}
				}
			});
		}

		// Gets all pixelcons created by the given address
		function fetchPixelconsByCreator(address) {
			return $q(async function (resolve, reject) {
				let state = web3Service.getState();
				if (state == "not_enabled") reject(_notEnabledError);
				else if (state == "not_connected") reject(_notConnectedError);
				else if (state != "ready") reject(_unknownError);
				else if (!web3Service.isAddress(address)) reject(_invalidAddressError);
				else {
					try {
						let contract = await web3Service.getContract(_contractPath, _chainId);

						//get all for creator
						let creatorPixelconIndexes = await contract.getForCreator(address);
						let pixelcons = await getPixelconsByIndexes(contract, creatorPixelconIndexes);
						resolve(pixelcons);
						
					} catch (err) {
						console.log(err);
						reject(err.name == 'UserActionNeededError' ? err.actionNeeded : 'Something went wrong while fetching creator PixelCons');
					}
				}
			});
		}

		// Gets all pixelcons with the given indexes
		function fetchPixelconsByIndexes(indexes) {
			return $q(async function (resolve, reject) {
				let state = web3Service.getState();
				if (state == "not_enabled") reject(_notEnabledError);
				else if (state == "not_connected") reject(_notConnectedError);
				else if (state != "ready") reject(_unknownError);
				else if (!indexes || indexes.length == 0) resolve([]);
				else {
					try {
						let contract = await web3Service.getContract(_contractPath, _chainId);
						let pixelcons = await getPixelconsByIndexes(contract, indexes);
						resolve(pixelcons);

					} catch (err) {
						console.log(err);
						reject(err.name == 'UserActionNeededError' ? err.actionNeeded : 'Something went wrong while fetching PixelCons');
					}
				}
			});
		}

		// Gets all pixelcons with the given ids
		function fetchPixelconsByIds(ids) {
			ids = formatPixelconIds(ids);
			return $q(async function (resolve, reject) {
				let state = web3Service.getState();
				if (state == "not_enabled") reject(_notEnabledError);
				else if (state == "not_connected") reject(_notConnectedError);
				else if (state != "ready") reject(_unknownError);
				else if (!ids || ids.length == 0) resolve([]);
				else {
					try {
						let contract = await web3Service.getContract(_contractPath, _chainId);
						let pixelcons = await getPixelconsByIds(contract, ids);
						resolve(pixelcons);

					} catch (err) {
						console.log(err);
						reject(err.name == 'UserActionNeededError' ? err.actionNeeded : 'Something went wrong while fetching PixelCons');
					}
				}
			});
		}


		//////////////////
		// Verification //
		//////////////////


		// Verifies the pixelcon can be created
		function verifyCreatePixelcon(id) {
			id = formatPixelconId(id);
			return $q(async function (resolve, reject) {
				let state = web3Service.getState();
				if (state == "not_enabled") reject(_notEnabledError);
				else if (state == "not_connected") reject(_notConnectedError);
				else if (state != "ready") reject(_unknownError);
				else if (web3Service.isReadOnly()) reject(_noAccountError);
				else if (web3Service.isPrivacyMode()) reject(_accountPrivateError);
				else if (id == null) reject(_invalidIdError);
				else if (isDuplicateTransaction(_createTypeDescription[0], [id])) reject(_duplicateTransactionError);
				else {
					try {
						let contract = await web3Service.getContractWithSigner(_contractPath, _chainId);
						let exists = await contract.exists(id);
						if(exists) reject('PixelCon already exists');
						else resolve({ });
					} catch (err) {
						console.log(err);
						reject(err.name == 'UserActionNeededError' ? err.actionNeeded : _verificationError);
					}
				}
			});
		}

		// Verifies the pixelcon can be updated
		function verifyUpdatePixelcon(id) {
			id = formatPixelconId(id);
			return $q(async function (resolve, reject) {
				let state = web3Service.getState();
				if (state == "not_enabled") reject(_notEnabledError);
				else if (state == "not_connected") reject(_notConnectedError);
				else if (state != "ready") reject(_unknownError);
				else if (web3Service.isReadOnly()) reject(_noAccountError);
				else if (web3Service.isPrivacyMode()) reject(_accountPrivateError);
				else if (id == null) reject(_invalidIdError);
				else if (isDuplicateTransaction(_updateTypeDescription[0], [id])) reject(_duplicateTransactionError);
				else {
					try {
						let address = web3Service.getActiveAccount();
						let contract = await web3Service.getContractWithSigner(_contractPath, _chainId);
						let owner = web3Service.formatAddress(await contract.ownerOf(id));
						if (owner == address) resolve({ owner: owner });
						else reject('Account does not own this PixelCon');
					} catch (err) {
						console.log(err);
						reject(err.name == 'UserActionNeededError' ? err.actionNeeded : _verificationError);
					}
				}
			});
		}

		// Verifies the collection can be created
		function verifyCreateCollection(pixelconIds) {
			pixelconIds = formatPixelconIds(pixelconIds);
			return $q(async function (resolve, reject) {
				let state = web3Service.getState();
				if (state == "not_enabled") reject(_notEnabledError);
				else if (state == "not_connected") reject(_notConnectedError);
				else if (state != "ready") reject(_unknownError);
				else if (web3Service.isReadOnly()) reject(_noAccountError);
				else if (web3Service.isPrivacyMode()) reject(_accountPrivateError);
				else if (pixelconIds == null) reject(_invalidIdError);
				else if (pixelconIds.length > _maxCreateCollection) reject(_overMaxError + '<br/>(maximum of ' + _maxCreateCollection + ')');
				else if (isDuplicateTransaction(_createCollectionTypeDescription[0], pixelconIds)) reject(_duplicateTransactionError);
				else {
					try {
						let address = web3Service.getActiveAccount();
						let contract = await web3Service.getContractWithSigner(_contractPath, _chainId);
						
						//get pixelcon data
						let pixelcons = await getPixelconsByIds(contract, pixelconIds);
						let creatorPixelconIndexes = await contract.getForCreator(address);
						for(let i=0; i<creatorPixelconIndexes.length; i++) creatorPixelconIndexes[i] = creatorPixelconIndexes[i].toNumber();
						
						//verify that the user is the owner of all pixelcons
						//and that the user is the creator of all pixelcons
						//and that the pixelcons are not already in a collection
						let verified = true;
						for (let i = 0; i < pixelcons.length; i++) {
							if (pixelcons[i].owner != address) {
								reject('Account does not own all PixelCons');
								verified = false;
								break;
							} else if (creatorPixelconIndexes.indexOf(pixelcons[i].index) < 0) { 
								reject('Account did not create all PixelCons');
								verified = false;
								break;
							} else if (pixelcons[i].collection !== null) {
								reject('PixelCon is already in a collection');
								verified = false;
								break;
							}
						}
						if (verified) {
							resolve({ owner: address, creator: address });
						}
					} catch (err) {
						console.log(err);
						reject(err.name == 'UserActionNeededError' ? err.actionNeeded : _verificationError);
					}
				}
			});
		}

		// Verifies the collection can be updated
		function verifyUpdateCollection(index, pixelconIds) {
			index = formatCollectionIndex(index);
			pixelconIds = formatPixelconIds(pixelconIds);
			return $q(async function (resolve, reject) {
				let state = web3Service.getState();
				if (state == "not_enabled") reject(_notEnabledError);
				else if (state == "not_connected") reject(_notConnectedError);
				else if (state != "ready") reject(_unknownError);
				else if (web3Service.isReadOnly()) reject(_noAccountError);
				else if (web3Service.isPrivacyMode()) reject(_accountPrivateError);
				else if (pixelconIds == null) reject(_invalidIdError);
				else if (index == null) reject(_invalidIndexError);
				else if (isDuplicateTransaction(_updateCollectionTypeDescription[0], pixelconIds)) reject(_duplicateTransactionError);
				else {
					try {
						let address = web3Service.getActiveAccount();
						let contract = await web3Service.getContractWithSigner(_contractPath, _chainId);
						
						//get pixelcon data
						let pixelcons = await getPixelconsByIds(contract, pixelconIds);
						let creatorPixelconIndexes = await contract.getForCreator(address);
						for(let i=0; i<creatorPixelconIndexes.length; i++) creatorPixelconIndexes[i] = creatorPixelconIndexes[i].toNumber();
						
						//verify that the user is the owner of all pixelcons
						//and that the user is the creator of all pixelcons
						//and that the pixelcons are not already in a collection
						let verified = true;
						for (let i = 0; i < pixelcons.length; i++) {
							if (pixelcons[i].owner != address) {
								reject('Account does not own all PixelCons');
								verified = false;
								break;
							} else if (creatorPixelconIndexes.indexOf(pixelcons[i].index) < 0) { 
								reject('Account did not create all PixelCons');
								verified = false;
								break;
							} else if (pixelcons[i].collection !== index) {
								reject('PixelCon is not part of collection');
								verified = false;
								break;
							}
						}
						if (verified) {
							resolve({ owner: address, creator: address });
						}
					} catch (err) {
						console.log(err);
						reject(err.name == 'UserActionNeededError' ? err.actionNeeded : _verificationError);
					}
				}
			});
		}

		// Verifies the collection can be cleared
		function verifyClearCollection(index, pixelconIds) {
			index = formatCollectionIndex(index);
			pixelconIds = formatPixelconIds(pixelconIds);
			return $q(async function (resolve, reject) {
				let state = web3Service.getState();
				if (state == "not_enabled") reject(_notEnabledError);
				else if (state == "not_connected") reject(_notConnectedError);
				else if (state != "ready") reject(_unknownError);
				else if (web3Service.isReadOnly()) reject(_noAccountError);
				else if (web3Service.isPrivacyMode()) reject(_accountPrivateError);
				else if (pixelconIds == null) reject(_invalidIdError);
				else if (index == null) reject(_invalidIndexError);
				else if (isDuplicateTransaction(_clearCollectionTypeDescription[0], pixelconIds)) reject(_duplicateTransactionError);
				else {
					try {
						let address = web3Service.getActiveAccount();
						let contract = await web3Service.getContractWithSigner(_contractPath, _chainId);
						
						//get pixelcon data
						let pixelcons = await getPixelconsByIds(contract, pixelconIds);
						let creatorPixelconIndexes = await contract.getForCreator(address);
						for(let i=0; i<creatorPixelconIndexes.length; i++) creatorPixelconIndexes[i] = creatorPixelconIndexes[i].toNumber();
						
						//verify that the user is the owner of all pixelcons
						//and that the user is the creator of all pixelcons
						//and that the pixelcons are not already in a collection
						let verified = true;
						for (let i = 0; i < pixelcons.length; i++) {
							if (pixelcons[i].owner != address) {
								reject('Account does not own all PixelCons');
								verified = false;
								break;
							} else if (creatorPixelconIndexes.indexOf(pixelcons[i].index) < 0) { 
								reject('Account did not create all PixelCons');
								verified = false;
								break;
							} else if (pixelcons[i].collection !== index) {
								reject('PixelCon is not part of collection');
								verified = false;
								break;
							}
						}
						if (verified) {
							resolve({ owner: address, creator: address });
						}
					} catch (err) {
						console.log(err);
						reject(err.name == 'UserActionNeededError' ? err.actionNeeded : _verificationError);
					}
				}
			});
		}

		// Verifies the pixelcon can be transfered
		function verifyTransferPixelcon(id) {
			id = formatPixelconId(id);
			return $q(async function (resolve, reject) {
				let state = web3Service.getState();
				if (state == "not_enabled") reject(_notEnabledError);
				else if (state == "not_connected") reject(_notConnectedError);
				else if (state != "ready") reject(_unknownError);
				else if (web3Service.isReadOnly()) reject(_noAccountError);
				else if (web3Service.isPrivacyMode()) reject(_accountPrivateError);
				else if (id == null) reject(_invalidIdError);
				else if (isDuplicateTransaction(_transferTypeDescription[0], [id])) reject(_duplicateTransactionError);
				else {
					try {
						let address = web3Service.getActiveAccount();
						let contract = await web3Service.getContractWithSigner(_contractPath, _chainId);
						let owner = web3Service.formatAddress(await contract.ownerOf(id));
						if (owner == address) resolve({ owner: owner });
						else reject('Account does not own this PixelCon');
					} catch (err) {
						console.log(err);
						reject(err.name == 'UserActionNeededError' ? err.actionNeeded : _verificationError);
					}
				}
			});
		}


		//////////////////////////
		// Create/Update/Delete //
		//////////////////////////


		// Creates a new pixelcon
		function createPixelcon(id, name) {
			id = formatPixelconId(id);
			name = web3Service.fromUtf8(name, 8);
			return $q(async function (resolve, reject) {
				let state = web3Service.getState();
				if (state == "not_enabled") reject(_notEnabledError);
				else if (state == "not_connected") reject(_notConnectedError);
				else if (state != "ready") reject(_unknownError);
				else if (web3Service.isReadOnly()) reject(_noAccountError);
				else if (web3Service.isPrivacyMode()) reject(_accountPrivateError);
				else if (id == null) reject(_invalidIdError);
				else {
					try {
						let to = web3Service.getActiveAccount();

						//do transaction
						let contractWithSigner = await web3Service.getContractWithSigner(_contractPath, _chainId);
						let tx = await contractWithSigner.create(to, id, name, _defaultGasParameters);

						//add the waiting transaction to web3Service list
						let transactionParams = { pixelconIds: [id], data: {id:id, name:name} };
						resolve(web3Service.addWaitingTransaction(tx.hash, transactionParams, _createTypeDescription[0], _createTypeDescription[1]));
					} catch (err) {
						console.log(err);
						reject(err.name == 'UserActionNeededError' ? err.actionNeeded : 'Something went wrong while creating PixelCon');
					}
				}
			});
		}
		
		// Updates pixelcon name
		function updatePixelcon(id, name) {
			id = formatPixelconId(id);
			name = web3Service.fromUtf8(name, 8);
			return $q(async function (resolve, reject) {
				let state = web3Service.getState();
				if (state == "not_enabled") reject(_notEnabledError);
				else if (state == "not_connected") reject(_notConnectedError);
				else if (state != "ready") reject(_unknownError);
				else if (web3Service.isReadOnly()) reject(_noAccountError);
				else if (web3Service.isPrivacyMode()) reject(_accountPrivateError);
				else if (id == null) reject(_invalidIdError);
				else {
					try {
						//do transaction
						let contractWithSigner = await web3Service.getContractWithSigner(_contractPath, _chainId);
						let tx = await contractWithSigner.rename(id, name, _defaultGasParameters);

						//add the waiting transaction to web3Service list
						let transactionParams = { pixelconIds: [id], data: {id:id, name:name} };
						resolve(web3Service.addWaitingTransaction(tx.hash, transactionParams, _updateTypeDescription[0], _updateTypeDescription[1]));
					} catch (err) {
						console.log(err);
						reject(err.name == 'UserActionNeededError' ? err.actionNeeded : 'Something went wrong while updating PixelCon');
					}
				}
			});
		}

		// Creates a new pixelcon collection
		function createCollection(pixelconIds, name) {
			pixelconIds = formatPixelconIds(pixelconIds);
			name = web3Service.fromUtf8(name, 8);
			return $q(async function (resolve, reject) {
				let state = web3Service.getState();
				if (state == "not_enabled") reject(_notEnabledError);
				else if (state == "not_connected") reject(_notConnectedError);
				else if (state != "ready") reject(_unknownError);
				else if (web3Service.isReadOnly()) reject(_noAccountError);
				else if (web3Service.isPrivacyMode()) reject(_accountPrivateError);
				else if (pixelconIds == null) reject(_invalidIdError);
				else if (pixelconIds.length > _maxCreateCollection) reject(_overMaxError + '<br/>(maximum of ' + _maxCreateCollection + ')');
				else {
					try {
						//do transaction
						let contractWithSigner = await web3Service.getContractWithSigner(_contractPath, _chainId);
						let pixelconIdexes = await getPixelconIndexesByIds(contractWithSigner, pixelconIds);
						let tx = await contractWithSigner.createCollection(pixelconIdexes, name, _defaultGasParameters);

						//add the waiting transaction to web3Service list
						let transactionParams = { pixelconIds: pixelconIds, data: {pixelconIds:pixelconIds, name:name} };
						resolve(web3Service.addWaitingTransaction(tx.hash, transactionParams, _createCollectionTypeDescription[0], _createCollectionTypeDescription[1]));
					} catch (err) {
						console.log(err);
						reject(err.name == 'UserActionNeededError' ? err.actionNeeded : 'Something went wrong while creating PixelCon collection');
					}
				}
			});
		}

		// Update the pixelcon collection name
		function updateCollection(index, pixelconIds, name) {
			index = formatCollectionIndex(index);
			pixelconIds = formatPixelconIds(pixelconIds);
			name = web3Service.fromUtf8(name, 8);
			return $q(async function (resolve, reject) {
				let state = web3Service.getState();
				if (state == "not_enabled") reject(_notEnabledError);
				else if (state == "not_connected") reject(_notConnectedError);
				else if (state != "ready") reject(_unknownError);
				else if (web3Service.isReadOnly()) reject(_noAccountError);
				else if (web3Service.isPrivacyMode()) reject(_accountPrivateError);
				else if (pixelconIds == null) reject(_invalidIdError);
				else if (index == null) reject(_invalidIndexError);
				else {
					try {
						//do transaction
						let contractWithSigner = await web3Service.getContractWithSigner(_contractPath, _chainId);
						let tx = await contractWithSigner.renameCollection(index, name, _defaultGasParameters);

						//add the waiting transaction to web3Service list
						let transactionParams = { pixelconIds: pixelconIds, data: {index:index, pixelconIds:pixelconIds, name:name} };
						resolve(web3Service.addWaitingTransaction(tx.hash, transactionParams, _updateCollectionTypeDescription[0], _updateCollectionTypeDescription[1]));
					} catch (err) {
						console.log(err);
						reject(err.name == 'UserActionNeededError' ? err.actionNeeded : 'Something went wrong while updating PixelCon collection');
					}
				}
			});
		}

		// Clears the pixelcon collection
		function clearCollection(index, pixelconIds) {
			index = formatCollectionIndex(index);
			pixelconIds = formatPixelconIds(pixelconIds);
			return $q(async function (resolve, reject) {
				let state = web3Service.getState();
				if (state == "not_enabled") reject(_notEnabledError);
				else if (state == "not_connected") reject(_notConnectedError);
				else if (state != "ready") reject(_unknownError);
				else if (web3Service.isReadOnly()) reject(_noAccountError);
				else if (web3Service.isPrivacyMode()) reject(_accountPrivateError);
				else if (pixelconIds == null) reject(_invalidIdError);
				else if (index == null) reject(_invalidIndexError);
				else {
					try {
						//do transaction
						let contractWithSigner = await web3Service.getContractWithSigner(_contractPath, _chainId);
						let tx = await contractWithSigner.clearCollection(index, _defaultGasParameters);

						//add the waiting transaction to web3Service list
						let transactionParams = { pixelconIds: pixelconIds, data: {index:index, pixelconIds:pixelconIds} };
						resolve(web3Service.addWaitingTransaction(tx.hash, transactionParams, _clearCollectionTypeDescription[0], _clearCollectionTypeDescription[1]));
					} catch (err) {
						console.log(err);
						reject(err.name == 'UserActionNeededError' ? err.actionNeeded : 'Something went wrong while clearing PixelCon collection');
					}
				}
			});
		}

		// Transfers pixelcon
		function transferPixelcon(id, address) {
			id = formatPixelconId(id);
			return $q(async function (resolve, reject) {
				let state = web3Service.getState();
				if (state == "not_enabled") reject(_notEnabledError);
				else if (state == "not_connected") reject(_notConnectedError);
				else if (state != "ready") reject(_unknownError);
				else if (web3Service.isReadOnly()) reject(_noAccountError);
				else if (web3Service.isPrivacyMode()) reject(_accountPrivateError);
				else if (!web3Service.isAddress(address)) reject(_invalidAddressError);
				else if (id == null) reject(_invalidIdError);
				else {
					try {
						let owner = web3Service.getActiveAccount();

						//do transaction
						let contractWithSigner = await web3Service.getContractWithSigner(_contractPath, _chainId);
						let tx = await contractWithSigner.transferFrom(owner, address, id, _defaultGasParameters);

						//add the waiting transaction to web3Service list
						let transactionParams = { pixelconIds: [id], data: {id:id, address:address} };
						resolve(web3Service.addWaitingTransaction(tx.hash, transactionParams, _transferTypeDescription[0], _transferTypeDescription[1]));
					} catch (err) {
						console.log(err);
						reject(err.name == 'UserActionNeededError' ? err.actionNeeded : 'Something went wrong while sending PixelCon');
					}
				}
			});
		}


		///////////
		// Utils //
		///////////


		// Converts to standard format of a given pixelcon id (or null if invalid)
		function formatPixelconId(id) {
			if (!id) return null;
			id = (' ' + id).slice(1);
			if (id.indexOf('0x') != 0) id = '0x' + id;
			if (id.length != 66) id = null;
			else {
				id = id.toLowerCase();
				for (let i = 2; i < 66; i++) {
					let v = id.charCodeAt(i);
					if (!(v >= 48 && v <= 57) && !(v >= 97 && v <= 102)) {
						id = null;
						break;
					}
				}
			}

			if (id == '0x0000000000000000000000000000000000000000000000000000000000000000') return null;
			return id;
		}
		
		// Converts to standard format of given pixelcon ids (or null if invalid)
		function formatPixelconIds(ids) {
			let formattedIds = [];
			for(let i = 0; i < ids.length; i++) {
				let id = formatPixelconId(ids[i]);
				if (id == null) return null;
				formattedIds.push(id);
			}
			return formattedIds;
		}
		
		// Converts to standard format of a given collection index (or null if invalid)
		function formatCollectionIndex(index) {
			index = parseInt(index);
			if(isNaN(index) || index == 0) return null;
			return index;
		}
		
		// Gets the list of Ids for the given pixelcons
		function getPixelConIds(pixelcons) {
			let ids = [];
			if(pixelcons && pixelcons.length) {
				for(let i=0; i<pixelcons.length; i++) ids.push(pixelcons[i].id);
			}
			return ids;
		}
		
		// Breaks up the given list to query for data in chunks
		async function breakUpQuery(list, querySubset, max) {
			if(list && !Array.isArray(list)) list = [list];
			if(!max) max = 1000;
			
			let subList = [];
			let results = [];
			for(let i=0; i<list.length; i++) {
				if(subList.length >= max) {
					results = results.concat(await querySubset(subList));
					subList = [];
				}
				subList.push(list[i]);
			}
			if(subList.length > 0) results = results.concat(await querySubset(subList));
			
			return results;
		}
		
		// Gets pixelcon indexes from the given ids
		async function getPixelconIndexesByIds(contract, ids) {
			if(!ids || !ids.length) return [];
			
			let createEvents = await breakUpQuery(ids, async function(ids_subset) {
				return await contract.queryFilter(contract.filters.Create(ids_subset, null, null));
			}, _maxFilterParamSize);
			
			//sort into the same order as given indexes
			let sortedIndexes = [];
			for(let i=0; i<ids.length; i++) {
				for(let j=0; j<createEvents.length; j++) {
					let createEventId = web3Service.to256Hex(createEvents[j].args["_tokenId"]);
					let createEventsIndex = createEvents[j].args["_tokenIndex"].toNumber();
					if(createEventId == ids[i]) {
						sortedIndexes.push(createEventsIndex);
						break;
					}
				}
			}
			return sortedIndexes;
		}
		
		// Gets pixelcon ids from the given indexes
		async function getPixelconIdsByIndexes(contract, indexes) {
			if(!indexes || !indexes.length) return [];
			
			let basicDataRaw = await breakUpQuery(indexes, async function(indexes_subset) {
				let tokenData = await contract.getBasicData(indexes_subset);
				let dataByToken = [];
				for(let i=0; i<tokenData[0].length; i++) dataByToken.push([tokenData[0][i], tokenData[1][i], tokenData[2][i], tokenData[3][i]]);
				return dataByToken;
			}, _maxQueryParamSize);
			
			let ids = [];
			for (let i = 0; i < basicDataRaw.length; i++) ids.push(web3Service.to256Hex(basicDataRaw[i][0]));
			return ids;
		}
		
		// Gets pixelcons from the given indexes
		async function getPixelconsByIndexes(contract, indexes) {
			if(!indexes || !indexes.length) return [];
			
			let basicDataRaw = await breakUpQuery(indexes, async function(indexes_subset) {
				let tokenData = await contract.getBasicData(indexes_subset);
				let dataByToken = [];
				for(let i=0; i<tokenData[0].length; i++) dataByToken.push([tokenData[0][i], tokenData[1][i], tokenData[2][i], tokenData[3][i]]);
				return dataByToken;
			}, _maxQueryParamSize);
				
			let pixelcons = [];
			for (let i = 0; i < basicDataRaw.length; i++) {
				pixelcons.push({
					id: web3Service.to256Hex(basicDataRaw[i][0]),
					index: indexes[i],
					name: web3Service.toUtf8(basicDataRaw[i][1]),
					owner: web3Service.formatAddress(basicDataRaw[i][2].toString()),
					collection: basicDataRaw[i][3].toNumber() ? basicDataRaw[i][3].toNumber() : null
				});
			}
			
			//fill in collection data
			await addCollectionData(contract, pixelcons);
			
			return pixelcons;
		}
		
		// Gets pixelcons from the given indexes
		async function getPixelconsByIds(contract, ids) {
			if(!ids || !ids.length) return [];
			
			let indexes = await getPixelconIndexesByIds(contract, ids);
			return await getPixelconsByIndexes(contract, indexes);
		}
		
		// Gets collection from the given index
		async function getCollectionByIndex(contract, index) {
			let collectionRaw = await contract.getCollectionData(index);
			let collectionName = web3Service.toUtf8(collectionRaw[0]);
			let collectionPixelconIds = await getPixelconIdsByIndexes(contract, collectionRaw[1]);
			let createCollectionEvent = await contract.queryFilter(contract.filters.CreateCollection(null, index));
			let collectionCreator = web3Service.formatAddress(createCollectionEvent[0].args["_creator"]);
			
			return {
				index: index,
				name: collectionName,
				creator: collectionCreator,
				pixelconIds: collectionPixelconIds
			}
		}
		
		// Adds collection details to the given pixelcons
		async function addCollectionData(contract, pixelcons) {
			let isArray = true;
			if (pixelcons.length === undefined && pixelcons.id) {
				isArray = false;
				pixelcons = [pixelcons];
			}
			try {
				let cache = {};
				for (let i = 0; i < pixelcons.length; i++) {
					if (pixelcons[i].collection && !isNaN(pixelcons[i].collection)) {
						
						//fetch collection details (possible already in cache)
						let collectionIndex = pixelcons[i].collection;
						let collection = cache[collectionIndex] ? cache[collectionIndex] : (await getCollectionByIndex(contract, collectionIndex));
						pixelcons[i].collection = collection;
						cache[collectionIndex] = collection;
					}
				}
			} catch (err) {
				console.log(err);
			}
			return isArray ? pixelcons : pixelcons[0];
		}
		
		// Checks if the given data looks like a currently processing transaction
		function isDuplicateTransaction(transactionType, pixelconIds) {
			let transactions = web3Service.getWaitingTransactions();
			for (let i = 0; i < transactions.length; i++) {
				if (transactions[i].type == transactionType && transactions[i].params) {
					if (transactions[i].params.pixelconIds && transactions[i].params.pixelconIds.length == pixelconIds.length) {
						let containsAll = true;
						for (let x = 0; x < pixelconIds.length; x++) {
							let found = false;
							for (let y = 0; y < transactions[i].params.pixelconIds.length; y++) {
								if (pixelconIds[x] == transactions[i].params.pixelconIds[y]) {
									found = true;
									break;
								}
							}
							if (!found) {
								containsAll = false;
								break;
							}
						}
						if (containsAll) return true;
					}
				}
			}
			return false;
		}


		///////////////////////////////////////////
		// Utils (transaction data transformers) //
		///////////////////////////////////////////


		// Adds data to return for create transaction
		async function addPixelconDataForCreate(params, data) {
			//scan event logs for data
			let pixelcon = {};
			let contractInterface = await web3Service.getContractInterface(_contractPath);
			for (let i = 0; i < data.logs.length; i++) {
				let event = contractInterface.parseLog(data.logs[i]);
				if (event.name == "Create") {
					pixelcon.id = web3Service.to256Hex(event.args["_tokenId"].toHexString())
					pixelcon.index = event.args["_tokenIndex"].toNumber();
					pixelcon.name = web3Service.toUtf8(params.data.name),
					pixelcon.creator = web3Service.formatAddress(event.args["_creator"]);
					pixelcon.owner = web3Service.formatAddress(event.args["_to"]);
					pixelcon.collection = null;
				}
			}
			debugger;
			
			//set pixelcon data
			data.pixelcons = [pixelcon];
			return data;
		}

		// Adds data to return for update transaction
		async function addPixelconDataForUpdate(params, data) {
			//fetch pixelcon
			let pixelcon = await fetchPixelcon(params.pixelconIds[0]);
			
			//scan event logs for data
			let contractInterface = await web3Service.getContractInterface(_contractPath);
			for (let i = 0; i < data.logs.length; i++) {
				let event = contractInterface.parseLog(data.logs[i]);
				if (event.name == "Rename") {
					pixelcon.name = web3Service.toUtf8(event.args["_newName"]);
				}
			}
			debugger;

			//set pixelcon data
			data.pixelcons = [pixelcon];
			return data;
		}

		// Adds data to return for transfer transaction
		async function addPixelconDataForTransfer(params, data) {
			//fetch pixelcon
			let pixelcon = await fetchPixelcon(params.pixelconIds[0]);
			
			//scan event logs for data
			let contractInterface = await web3Service.getContractInterface(_contractPath);
			for (let i = 0; i < data.logs.length; i++) {
				let event = contractInterface.parseLog(data.logs[i]);
				if (event.name == "Transfer") {
					pixelcon.owner = web3Service.formatAddress(event.args["_to"]);
				}
			}
			debugger;

			//set pixelcon data
			data.pixelcons = [pixelcon];
			return data;
		}

		// Adds data to return for create collection transaction
		async function addPixelconDataForCreateCollection(params, data) {
			//scan event logs for data
			let collection = null;
			let contractInterface = await web3Service.getContractInterface(_contractPath);
			for (let i = 0; i < data.logs.length; i++) {
				let event = contractInterface.parseLog(data.logs[i]);
				if (event.name == "CreateCollection") {
					collection = {
						index: event.args["_collectionIndex"].toNumber(),
						name: web3Service.toUtf8(params.data.name),
						creator: web3Service.formatAddress(event.args["_creator"]),
						pixelconIds: params.pixelconIds
					};
					break;
				}
			}

			//fetch additional data
			let contract = await web3Service.getContract(_contractPath, _chainId);
			let pixelcons = await getPixelconsByIds(contract, params.pixelconIds);

			//set collection data
			for (let i = 0; i < pixelcons.length; i++) pixelcons[i].collection = collection;
			debugger;
			
			//set pixelcon data
			data.pixelcons = pixelcons;
			return data;
		}
		
		// Adds data to return for update collection transaction
		async function addPixelconDataForUpdateCollection(params, data) {
			//scan event logs for data
			let collectionName = null;
			let contractInterface = await web3Service.getContractInterface(_contractPath);
			for (let i = 0; i < data.logs.length; i++) {
				let event = contractInterface.parseLog(data.logs[i]);
				if (event.name == "RenameCollection") {
					collectionName = web3Service.toUtf8(event.args["_newName"]);
				}
			}
			
			//fetch pixelcon
			let contract = await web3Service.getContract(_contractPath, _chainId);
			let pixelcons = await getPixelconsByIds(contract, params.pixelconIds);
			
			//update collection data
			for (let i = 0; i < pixelcons.length; i++) pixelcons[i].collection.name = collectionName;
			debugger;
			
			//set pixelcon data
			data.pixelcons = pixelcons;
			return data;
		}

		// Adds data to return for clear collection transaction
		async function addPixelconDataForClearCollection(params, data) {
			//fetch pixelcon
			let contract = await web3Service.getContract(_contractPath, _chainId);
			let pixelcons = await getPixelconsByIds(contract, params.pixelconIds);
			
			//clear collection data
			for (let i = 0; i < pixelcons.length; i++) pixelcons[i].collection = null;
			debugger;
			
			//set pixelcon data
			data.pixelcons = pixelcons;
			return data;
		}

		// Adds data to return for the given transaction
		async function addPixelconDataForTransaction(transaction, returnData) {
			if (transaction.type == _createTypeDescription[0]) return await addPixelconDataForCreate(transaction.params, returnData);
			if (transaction.type == _updateTypeDescription[0]) return await addPixelconDataForUpdate(transaction.params, returnData);
			if (transaction.type == _transferTypeDescription[0]) return await addPixelconDataForTransfer(transaction.params, returnData);
			if (transaction.type == _createCollectionTypeDescription[0]) return await addPixelconDataForCreateCollection(transaction.params, returnData);
			if (transaction.type == _updateCollectionTypeDescription[0]) return await addPixelconDataForUpdateCollection(transaction.params, returnData);
			if (transaction.type == _clearCollectionTypeDescription[0]) return await addPixelconDataForClearCollection(transaction.params, returnData);
			return returnData;
		}
	}
}());
