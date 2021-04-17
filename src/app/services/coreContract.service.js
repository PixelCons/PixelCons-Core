(function () {
	angular.module('App')
		.service('coreContract', coreContract);

	coreContract.$inject = ['web3Service', '$q'];
	function coreContract(web3Service, $q) {
		var _contractPath = 'contracts/PixelCons.json';
		var _maxNameFetch = 10000;
		var _cacheNameFetch = true;

		var _noAccountError = 'No Ethereum Account';
		var _accountPrivateError = 'Ethereum Account Not Connected';
		var _notEnabledError = 'No Ethereum Connection';
		var _notConnectedError = 'Ethereum Provider Not Connected';
		var _unknownError = 'Unknown Error';
		var _functionDisabledError = 'Function is Disabled';
		var _invalidIdError = 'Invalid ID';
		var _invalidIndexError = 'Invalid Index';
		var _invalidAddressError = 'Invalid Address';
		var _duplicateTransactionError = 'Already Processing';
		var _verificationError = 'Something went wrong while verifying';

		// Setup functions
		this.getTotalPixelcons = getTotalPixelcons;
		this.getAllNames = getAllNames;
		this.getAllCollectionNames = getAllCollectionNames;
		this.fetchPixelcon = fetchPixelcon;
		this.fetchCollection = fetchCollection;
		this.fetchPixelconsByAccount = fetchPixelconsByAccount;
		this.fetchPixelconsByCreator = fetchPixelconsByCreator;
		this.fetchPixelconsByIndexes = fetchPixelconsByIndexes;
		this.verifyPixelcon = verifyPixelcon;
		this.verifyPixelconEdit = verifyPixelconEdit;
		this.verifyPixelconCollection = verifyPixelconCollection;
		this.verifyPixelconCollectionEdit = verifyPixelconCollectionEdit;
		this.verifyPixelconCollectionClear = verifyPixelconCollectionClear;
		this.verifyTransferPixelcon = verifyTransferPixelcon;
		this.createPixelcon = createPixelcon;
		this.updatePixelcon = updatePixelcon;
		this.transferPixelcon = transferPixelcon;
		this.createPixelconCollection = createPixelconCollection;
		this.updatePixelconCollection = updatePixelconCollection;
		this.clearPixelconCollection = clearPixelconCollection;
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
						let contract = await web3Service.getContract(_contractPath);
						let total = await contract.totalSupply();
						resolve(total.toNumber());
					} catch (err) {
						console.log(err);
						reject('Something went wrong while fetching count');
					}
				}
			});
		}

		// Gets the names of all pixelcons in existence
		var pixelconNames = [];
		function getAllNames() {
			return $q(async function (resolve, reject) {
				let state = web3Service.getState();
				if (state == "not_enabled") reject(_notEnabledError);
				else if (state == "not_connected") reject(_notConnectedError);
				else if (state != "ready") reject(_unknownError);
				else {
					try {
						let contract = await web3Service.getContract(_contractPath);
						let total = (await contract.totalSupply()).toNumber();
						if (total == 0) resolve([]);
						else if (_cacheNameFetch && pixelconNames.length == total) resolve(pixelconNames);
						else if (!_maxNameFetch || total <= _maxNameFetch) {

							//get all at once
							let names = await contract.getAllNames();
							pixelconNames = new Array(total);
							for (let i = 0; i < names.length; i++) pixelconNames[i] = web3Service.toUtf8(names[i]);
							resolve(pixelconNames);
						} else {

							//get in pages
							let index = 0;
							let pixelconNamesIndex = 0;
							pixelconNames = new Array(total);
							while (index < total) {
								let rangeEnd = index + _maxNameFetch;
								if (rangeEnd > total) rangeEnd = total;
								let names = await contract.getNamesInRange(index, rangeEnd);
								for (let i = 0; i < names.length; i++) pixelconNames[pixelconNamesIndex++] = web3Service.toUtf8(names[i]);
								index = rangeEnd;
							}
							resolve(pixelconNames);
						}
					} catch (err) {
						console.log(err);
						reject('Something went wrong while fetching names');
					}
				}
			});
		}

		// Gets the names of all pixelcons in existence
		var collectionNames = [];
		function getAllCollectionNames() {
			return $q(async function (resolve, reject) {
				let state = web3Service.getState();
				if (state == "not_enabled") reject(_notEnabledError);
				else if (state == "not_connected") reject(_notConnectedError);
				else if (state != "ready") reject(_unknownError);
				else {
					try {
						let contract = await web3Service.getContract(_contractPath);
						let total = (await contract.totalCollections()).toNumber();
						if (total == 0) resolve([]);
						else if (_cacheNameFetch && collectionNames.length == total) resolve(collectionNames);
						else if (!_maxNameFetch || total <= _maxNameFetch) {

							//get all at once
							let names = await contract.getAllCollectionNames();
							collectionNames = new Array(total);
							for (let i = 0; i < names.length; i++) collectionNames[i] = web3Service.toUtf8(names[i]);
							resolve(collectionNames);
						} else {

							//get in pages
							let index = 0;
							let collectionNamesIndex = 0;
							collectionNames = new Array(total);
							while (index < total) {
								let rangeEnd = index + _maxNameFetch;
								if (rangeEnd > total) rangeEnd = total;
								let names = await contract.getCollectionNamesInRange(index, rangeEnd);
								for (let i = 0; i < names.length; i++) collectionNames[collectionNamesIndex++] = web3Service.toUtf8(names[i]);
								index = rangeEnd;
							}
							resolve(collectionNames);
						}
					} catch (err) {
						console.log(err);
						reject('Something went wrong while fetching collection names');
					}
				}
			});
		}

		// Gets the details for the given pixelcon id
		function fetchPixelcon(id) {
			id = formatPixelconId(id);
			return $q(async function (resolve, reject) {
				let state = web3Service.getState();
				if (state == "not_enabled") reject(_notEnabledError);
				else if (state == "not_connected") reject(_notConnectedError);
				else if (state != "ready") reject(_unknownError);
				else if (id == null) reject(_invalidIdError);
				else {
					try {
						let contract = await web3Service.getContract(_contractPath);
						let exists = await contract.exists(id);
						if (!exists) {

							//not found
							resolve(null);
						} else {

							//get details
							//uint256 _tknId, uint64 _tknIdx, uint64 _collection, address _owner, address _creator, bytes8 _name, uint32 _dateCreated
							let pixelconRaw = await contract.getTokenData(id);
							let pixelcon = {
								id: id,
								index: pixelconRaw[1].toNumber(),
								name: web3Service.toUtf8(pixelconRaw[5]),
								owner: web3Service.formatAddress(pixelconRaw[3]),
								creator: web3Service.formatAddress(pixelconRaw[4]),
								date: pixelconRaw[6] * 1000,
								collection: pixelconRaw[2].toNumber() ? pixelconRaw[2].toNumber() : null
							};

							//add collection details
							pixelcon = await fillCollectionData(pixelcon);
							resolve(pixelcon);
						}
					} catch (err) {
						console.log(err);
						reject('Something went wrong while fetching details');
					}
				}
			});
		}

		// Gets the details for the given pixelcon collection index
		function fetchCollection(index) {
			return $q(async function (resolve, reject) {
				let state = web3Service.getState();
				if (state == "not_enabled") reject(_notEnabledError);
				else if (state == "not_connected") reject(_notConnectedError);
				else if (state != "ready") reject(_unknownError);
				else if (index == 0) reject(_invalidIndexError);
				else {
					try {
						let contract = await web3Service.getContract(_contractPath);
						let exists = await contract.collectionExists(index);
						if (!exists) {

							//not found
							reject('PixelCon collection does not exist');
						} else {

							//get collection
							let collection = await getCollection(index, undefined);
							resolve(collection);
						}
					} catch (err) {
						console.log(err);
						reject('Something went wrong while fetching collection details');
					}
				}
			});
		}

		// Gets all pixelcons either created or owned by the given address
		function fetchPixelconsByAccount(address) {
			return $q(async function (resolve, reject) {
				let state = web3Service.getState();
				if (state == "not_enabled") reject(_notEnabledError);
				else if (state == "not_connected") reject(_notConnectedError);
				else if (state != "ready") reject(_unknownError);
				else if (!web3Service.isAddress(address)) reject(_invalidAddressError);
				else {
					try {
						let contract = await web3Service.getContract(_contractPath);
						let createdRaw = await contract.getForCreator(address);
						let ownedRaw = await contract.getForOwner(address);

						//combine owned and created
						let owned = [];
						let created = [];
						for (let i = 0; i < ownedRaw.length; i++) owned.push(ownedRaw[i].toNumber());
						for (let i = 0; i < createdRaw.length; i++) created.push(createdRaw[i].toNumber());
						let combinedIndexes = [];
						for (let i = 0; i < owned.length; i++) if (combinedIndexes.indexOf(owned[i]) == -1) combinedIndexes.push(owned[i]);
						for (let i = 0; i < created.length; i++) if (combinedIndexes.indexOf(created[i]) == -1) combinedIndexes.push(created[i]);
						combinedIndexes.sort(function (a, b) { return a - b; });

						//get basic details
						if (combinedIndexes.length > 0) {
							let basicDataRaw = await contract.getBasicData(combinedIndexes);
							let pixelcons = [];
							for (let i = 0; i < basicDataRaw[0].length; i++) {
								pixelcons.push({
									id: web3Service.to256Hex(basicDataRaw[0][i]),
									index: combinedIndexes[i],
									name: web3Service.toUtf8(basicDataRaw[1][i]),
									owner: web3Service.formatAddress(basicDataRaw[2][i].toString()),
									created: created.indexOf(combinedIndexes[i]) > -1,
									owned: owned.indexOf(combinedIndexes[i]) > -1,
									collection: basicDataRaw[3][i].toNumber() ? basicDataRaw[3][i].toNumber() : null
								});
							}

							//add collection details
							pixelcons = await fillCollectionData(pixelcons);

							//add additional flags to pixelcon objects in the collection objects
							for (let i = 0; i < pixelcons.length; i++) {
								if (pixelcons[i].collection) {
									for (let j = 0; j < pixelcons[i].collection.pixelcons.length; j++) {
										pixelcons[i].collection.pixelcons[j].created = created.indexOf(pixelcons[i].collection.pixelcons[j].index) > -1;
										pixelcons[i].collection.pixelcons[j].owned = owned.indexOf(pixelcons[i].collection.pixelcons[j].index) > -1;
									}
								}
							}
							resolve(pixelcons);
						} else {

							//no pixelcons
							resolve([]);
						}
					} catch (err) {
						console.log(err);
						reject('Something went wrong while fetching account details');
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
						let contract = await web3Service.getContract(_contractPath);

						//get all tokens for creator
						let creatorPixelconIndexes = await contract.getForCreator(address);

						//get details for pixelcons
						if (creatorPixelconIndexes.length > 0) {
							let basicDataRaw = await contract.getBasicData(creatorPixelconIndexes);
							let pixelcons = [];
							for (let i = 0; i < basicDataRaw[0].length; i++) {
								pixelcons.push({
									id: web3Service.to256Hex(basicDataRaw[0][i]),
									index: creatorPixelconIndexes[i].toNumber(),
									name: web3Service.toUtf8(basicDataRaw[1][i]),
									owner: web3Service.formatAddress(basicDataRaw[2][i].toString()),
									collection: basicDataRaw[3][i].toNumber() ? basicDataRaw[3][i].toNumber() : null
								});
							}

							//add collection details
							pixelcons = await fillCollectionData(pixelcons);
							resolve(pixelcons);
						} else {

							//no pixelcons
							resolve([]);
						}
					} catch (err) {
						console.log(err);
						reject('Something went wrong while fetching creator details');
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
						let contract = await web3Service.getContract(_contractPath);
						let basicDataRaw = await contract.getBasicData(indexes);
						let pixelcons = [];
						for (let i = 0; i < basicDataRaw[0].length; i++) {
							pixelcons.push({
								id: web3Service.to256Hex(basicDataRaw[0][i]),
								index: indexes[i],
								name: web3Service.toUtf8(basicDataRaw[1][i]),
								owner: web3Service.formatAddress(basicDataRaw[2][i].toString()),
								collection: basicDataRaw[3][i].toNumber() ? basicDataRaw[3][i].toNumber() : null
							});
						}

						//add collection details
						pixelcons = await fillCollectionData(pixelcons);
						resolve(pixelcons);

					} catch (err) {
						console.log(err);
						reject('Something went wrong while fetching pixelcons details');
					}
				}
			});
		}


		//////////////////
		// Verification //
		//////////////////


		// Verifies the status of a given pixelcon id
		function verifyPixelcon(id) {
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
						let contract = await web3Service.getContract(_contractPath);
						let exists = await contract.exists(id);
						resolve({ exists: exists });
					} catch (err) {
						console.log(err);
						reject(_verificationError);
					}
				}
			});
		}

		// Verifies the status for edit of a given pixelcon
		function verifyPixelconEdit(id) {
			let address = web3Service.getActiveAccount();
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
						let contract = await web3Service.getContract(_contractPath);
						let owner = web3Service.formatAddress(await contract.ownerOf(id));
						if (owner == address) resolve({ owner: owner });
						else reject('Account does not own this PixelCon');
					} catch (err) {
						console.log(err);
						reject(_verificationError);
					}
				}
			});
		}

		// Verifies the pixelcon transfer
		function verifyTransferPixelcon(id) {
			let address = web3Service.getActiveAccount();
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
						let contract = await web3Service.getContract(_contractPath);
						let owner = web3Service.formatAddress(await contract.ownerOf(id));
						if (owner == address) resolve({ owner: owner });
						else reject('Account does not own this PixelCon');
					} catch (err) {
						console.log(err);
						reject(_verificationError);
					}
				}
			});
		}

		// Verifies the pixelcon collection
		function verifyPixelconCollection(indexes, pixelconIds) {
			let address = web3Service.getActiveAccount();
			return $q(async function (resolve, reject) {
				let state = web3Service.getState();
				if (state == "not_enabled") reject(_notEnabledError);
				else if (state == "not_connected") reject(_notConnectedError);
				else if (state != "ready") reject(_unknownError);
				else if (web3Service.isReadOnly()) reject(_noAccountError);
				else if (web3Service.isPrivacyMode()) reject(_accountPrivateError);
				else if (isDuplicateTransaction(_createCollectionTypeDescription[0], pixelconIds)) reject(_duplicateTransactionError);
				else {
					try {
						let contract = await web3Service.getContract(_contractPath);
						let createdRaw = await contract.getForCreator(address);
						let basicDataRaw = await contract.getBasicData(indexes);
						let created = [];
						for (let i = 0; i < createdRaw.length; i++)created.push(createdRaw[i].toNumber());
						let pixelcons = [];
						for (let i = 0; i < basicDataRaw[0].length; i++) {
							pixelcons.push({
								id: web3Service.to256Hex(basicDataRaw[0][i]),
								index: indexes[i],
								owner: web3Service.formatAddress(basicDataRaw[2][i].toString()),
								collection: basicDataRaw[3][i].toNumber() ? basicDataRaw[3][i].toNumber() : null
							});
						}

						//verify that the user is the owner of all pixelcons
						//and that the user is the creator of all pixelcons
						//and that the pixelcons are not already in a collection
						let verified = true;
						for (let i = 0; i < pixelcons.length; i++) {
							if (pixelcons[i].owner != address) {
								reject('Account does not own all PixelCons');
								verified = false;
								break;
							} else if (pixelcons[i].collection !== null) {
								reject('PixelCon is already in a collection');
								verified = false;
								break;
							} else if (created.indexOf(pixelcons[i].index) == -1) {
								reject('Account did not create all PixelCons');
								verified = false;
								break;
							}
						}
						if (verified) {
							resolve({ owner: address, creator: address });
						}
					} catch (err) {
						console.log(err);
						reject(_verificationError);
					}
				}
			});
		}

		// Verifies the pixelcon collection for edit
		function verifyPixelconCollectionEdit(index, pixelconIds) {
			let address = web3Service.getActiveAccount();
			return $q(async function (resolve, reject) {
				let state = web3Service.getState();
				if (state == "not_enabled") reject(_notEnabledError);
				else if (state == "not_connected") reject(_notConnectedError);
				else if (state != "ready") reject(_unknownError);
				else if (web3Service.isReadOnly()) reject(_noAccountError);
				else if (web3Service.isPrivacyMode()) reject(_accountPrivateError);
				else if (index == 0) reject(_invalidIndexError);
				else if (isDuplicateTransaction(_updateCollectionTypeDescription[0], pixelconIds)) reject(_duplicateTransactionError);
				else {
					try {
						let collection = await getCollection(index, false);

						//verify that the user is the creator of the collection and owner of all pixelcons
						let verified = true;
						if (collection.creator != address) {
							reject('Account is not the creator of the collection');
							verified = false;
						} else {
							for (let i = 0; i < collection.pixelcons.length; i++) {
								if (collection.pixelcons[i].owner != address) {
									reject('Account does not own all PixelCons');
									verified = false;
									break;
								}
							}
						}
						if (verified) {
							resolve({ owner: address, creator: address });
						}
					} catch (err) {
						console.log(err);
						reject(_verificationError);
					}
				}
			});
		}

		// Verifies the pixelcon collection for clearing
		function verifyPixelconCollectionClear(index, pixelconIds) {
			let address = web3Service.getActiveAccount();
			return $q(async function (resolve, reject) {
				let state = web3Service.getState();
				if (state == "not_enabled") reject(_notEnabledError);
				else if (state == "not_connected") reject(_notConnectedError);
				else if (state != "ready") reject(_unknownError);
				else if (web3Service.isReadOnly()) reject(_noAccountError);
				else if (web3Service.isPrivacyMode()) reject(_accountPrivateError);
				else if (index == 0) reject(_invalidIndexError);
				else if (isDuplicateTransaction(_clearCollectionTypeDescription[0], pixelconIds)) reject(_duplicateTransactionError);
				else {
					try {
						let collection = await getCollection(index, false);

						//verify that the user is the creator of the collection and owner of all pixelcons
						let verified = true;
						if (collection.creator != address) {
							reject('Account is not the creator of the collection');
							verified = false;
						} else {
							for (let i = 0; i < collection.pixelcons.length; i++) {
								if (collection.pixelcons[i].owner != address) {
									reject('Account does not own all PixelCons');
									verified = false;
									break;
								}
							}
						}
						if (verified) {
							resolve({ owner: address, creator: address });
						}
					} catch (err) {
						console.log(err);
						reject(_verificationError);
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
						let contractWithSigner = await web3Service.getContractWithSigner(_contractPath);
						let tx = await contractWithSigner.create(to, id, name);

						//add the waiting transaction to web3Service list
						let transactionParams = { pixelconId: id, name: name, creator: to };
						resolve(web3Service.addWaitingTransaction(tx.hash, transactionParams, _createTypeDescription[0], _createTypeDescription[1]));
					} catch (err) {
						console.log(err);
						reject('Something went wrong while creating PixelCon');
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
						let contractWithSigner = await web3Service.getContractWithSigner(_contractPath);
						let tx = await contractWithSigner.rename(id, name);

						//add the waiting transaction to web3Service list
						let transactionParams = { pixelconId: id, name: name };
						resolve(web3Service.addWaitingTransaction(tx.hash, transactionParams, _updateTypeDescription[0], _updateTypeDescription[1]));
					} catch (err) {
						console.log(err);
						reject('Something went wrong while updating PixelCon');
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
						let contractWithSigner = await web3Service.getContractWithSigner(_contractPath);
						let tx = await contractWithSigner['safeTransferFrom(address,address,uint256)'](owner, address, id);

						//add the waiting transaction to web3Service list
						let transactionParams = { pixelconId: id, address: address };
						resolve(web3Service.addWaitingTransaction(tx.hash, transactionParams, _transferTypeDescription[0], _transferTypeDescription[1]));
					} catch (err) {
						console.log(err);
						reject('Something went wrong while sending PixelCon');
					}
				}
			});
		}

		// Creates a new pixelcon collection
		function createPixelconCollection(indexes, name) {
			name = web3Service.fromUtf8(name, 8);
			return $q(async function (resolve, reject) {
				let state = web3Service.getState();
				if (state == "not_enabled") reject(_notEnabledError);
				else if (state == "not_connected") reject(_notConnectedError);
				else if (state != "ready") reject(_unknownError);
				else if (web3Service.isReadOnly()) reject(_noAccountError);
				else if (web3Service.isPrivacyMode()) reject(_accountPrivateError);
				else {
					try {
						let contract = await web3Service.getContractWithSigner(_contractPath);
						let basicDataRaw = await contract.getBasicData(indexes);
						let pixelconIds = [];
						for (let i = 0; i < basicDataRaw[0].length; i++) pixelconIds.push(web3Service.to256Hex(basicDataRaw[0][i]));
						let creator = web3Service.getActiveAccount();

						//do transaction
						let contractWithSigner = await web3Service.getContractWithSigner(_contractPath);
						let tx = await contractWithSigner.createCollection(indexes, name);

						//add the waiting transaction to web3Service list
						let transactionParams = { pixelconIds: pixelconIds, pixelconIndexes: indexes, name: name, creator: creator };
						resolve(web3Service.addWaitingTransaction(tx.hash, transactionParams, _createCollectionTypeDescription[0], _createCollectionTypeDescription[1]));
					} catch (err) {
						console.log(err);
						reject('Something went wrong while creating PixelCon collection');
					}
				}
			});
		}

		// Update the pixelcon collection name
		function updatePixelconCollection(index, name) {
			name = web3Service.fromUtf8(name, 8);
			return $q(async function (resolve, reject) {
				let state = web3Service.getState();
				if (state == "not_enabled") reject(_notEnabledError);
				else if (state == "not_connected") reject(_notConnectedError);
				else if (state != "ready") reject(_unknownError);
				else if (web3Service.isReadOnly()) reject(_noAccountError);
				else if (web3Service.isPrivacyMode()) reject(_accountPrivateError);
				else if (index == 0) reject(_invalidIndexError);
				else {
					try {
						let collection = await getCollection(index, true);
						let pixelconIds = [];
						for (let i = 0; i < collection.pixelcons.length; i++) pixelconIds.push(collection.pixelcons[i].id);

						//do transaction
						let contractWithSigner = await web3Service.getContractWithSigner(_contractPath);
						let tx = await contractWithSigner.renameCollection(index, name);

						//add the waiting transaction to web3Service list
						let transactionParams = { pixelconIds: pixelconIds, collectionIndex: index, name: name };
						resolve(web3Service.addWaitingTransaction(tx.hash, transactionParams, _updateCollectionTypeDescription[0], _updateCollectionTypeDescription[1]));
					} catch (err) {
						console.log(err);
						reject('Something went wrong while updating PixelCon collection');
					}
				}
			});
		}

		// Clears the pixelcon collection
		function clearPixelconCollection(index) {
			return $q(async function (resolve, reject) {
				let state = web3Service.getState();
				if (state == "not_enabled") reject(_notEnabledError);
				else if (state == "not_connected") reject(_notConnectedError);
				else if (state != "ready") reject(_unknownError);
				else if (web3Service.isReadOnly()) reject(_noAccountError);
				else if (web3Service.isPrivacyMode()) reject(_accountPrivateError);
				else if (index == 0) reject(_invalidIndexError);
				else {
					try {
						let collection = await getCollection(index, true);
						let pixelconIds = [];
						let pixelconIndexes = [];
						for (let i = 0; i < collection.pixelcons.length; i++) {
							pixelconIds.push(collection.pixelcons[i].id);
							pixelconIndexes.push(collection.pixelcons[i].index);
						}

						//do transaction
						let contractWithSigner = await web3Service.getContractWithSigner(_contractPath);
						let tx = await contractWithSigner.clearCollection(index);

						//add the waiting transaction to web3Service list
						let transactionParams = { pixelconIds: pixelconIds, collectionIndex: index, pixelconIndexes: pixelconIndexes };
						resolve(web3Service.addWaitingTransaction(tx.hash, transactionParams, _clearCollectionTypeDescription[0], _clearCollectionTypeDescription[1]));
					} catch (err) {
						console.log(err);
						reject('Something went wrong while clearing PixelCon collection');
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

		// Gets the details for the given pixelcon collection index
		function getCollection(index, skipCreator) {
			return $q(async function (resolve, reject) {
				try {
					let contract = await web3Service.getContract(_contractPath);
					let collectionRaw = await contract.getCollectionData(index);
					let collectionPixelcons = [];
					let collectionName = web3Service.toUtf8(collectionRaw[0]);
					let collectionPixelconIndexes = collectionRaw[1];
					let basicDataRaw = await contract.getBasicData(collectionPixelconIndexes);
					if (basicDataRaw) {
						for (let i = 0; i < basicDataRaw[0].length; i++) {
							collectionPixelcons.push({
								id: web3Service.to256Hex(basicDataRaw[0][i]),
								index: collectionPixelconIndexes[i].toNumber(),
								name: web3Service.toUtf8(basicDataRaw[1][i]),
								owner: web3Service.formatAddress(basicDataRaw[2][i].toString()),
								collection: basicDataRaw[3][i].toNumber() ? basicDataRaw[3][i].toNumber() : null
							});
						}
					}

					// get creator
					let creator = null;
					if (!skipCreator && collectionPixelcons[0]) {
						creator = web3Service.formatAddress(await contract.creatorOf(collectionPixelcons[0].id));
					}

					// return collection object
					resolve({
						index: index,
						creator: creator,
						name: collectionName,
						pixelcons: collectionPixelcons
					});

				} catch (err) {
					reject(err);
				}
			});
		}

		// Fills in collection data for the given pixelcons
		function fillCollectionData(pixelcons) {
			let isArray = true;
			if (pixelcons.length === undefined && pixelcons.id) {
				isArray = false;
				pixelcons = [pixelcons];
			}
			return $q(async function (resolve, reject) {
				try {
					let cachedGroups = {};
					for (let i = 0; i < pixelcons.length; i++) {
						if (pixelcons[i].collection !== null) {
							if (cachedGroups[pixelcons[i].collection]) {
								//group data already fetched
								pixelcons[i].collection = cachedGroups[pixelcons[i].collection];

							} else {
								let collection = await getCollection(pixelcons[i].collection, true);

								//replace group pixelcon data, with more detailed versions
								for (let j = 0; j < collection.pixelcons.length; j++) {
									for (let k = 0; k < pixelcons.length; k++) {
										if (collection.pixelcons[j].id == pixelcons[k].id) {
											collection.pixelcons[j] = pixelcons[k];
											break;
										}
									}
								}

								//set collection and cache results
								if (pixelcons[i].creator) collection.creator = pixelcons[i].creator;
								cachedGroups[pixelcons[i].collection] = collection;
								pixelcons[i].collection = collection;
							}
						}
					}
					resolve(isArray ? pixelcons : pixelcons[0]);

				} catch (err) {
					reject(err);
				}
			});
		}

		// Checks if the given data looks like a currently processing transaction
		function isDuplicateTransaction(transactionType, pixelconIds) {
			let transactions = web3Service.getWaitingTransactions();
			for (let i = 0; i < transactions.length; i++) {
				if (transactions[i].type == transactionType && transactions[i].params) {
					if (pixelconIds.length == 1) {
						if (transactions[i].params.pixelconId == pixelconIds[0]) return true;
					} else {
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
			}
			return false;
		}


		///////////////////////////////////////////
		// Utils (transaction data transformers) //
		///////////////////////////////////////////


		// Adds data to return for create transaction
		async function addPixelconDataForCreate(params, data) {
			//params.pixelconId
			//params.name
			//params.creator

			//scan event logs for data
			let pixelconIndex = null;
			let contractInterface = await web3Service.getContractInterface(_contractPath);
			for (var i = 0; i < data.logs.length; i++) {
				let event = contractInterface.parseLog(data.logs[i]);
				if (event.name == "Create") {
					pixelconIndex = event.args["_tokenIndex"].toNumber();
					break;
				}
			}

			//set pixelcon data
			data.pixelcons = [{
				id: params.pixelconId,
				index: pixelconIndex,
				name: web3Service.toUtf8("" + params.name),
				owner: params.creator,
				creator: params.creator,
				date: (new Date()).getTime(),
				collection: null
			}];
			return data;
		}

		// Adds data to return for update transaction
		async function addPixelconDataForUpdate(params, data) {
			//params.pixelconId
			//params.name

			//fetch additional data
			let pixelcon = await fetchPixelcon(params.pixelconId);

			//update the name cache
			if (_cacheNameFetch && pixelconNames.length > pixelcon.index) pixelconNames[pixelcon.index] = pixelcon.name;

			//set pixelcon data
			pixelcon.name = web3Service.toUtf8("" + params.name);
			data.pixelcons = [pixelcon];
			return data;
		}

		// Adds data to return for transfer transaction
		async function addPixelconDataForTransfer(params, data) {
			//params.pixelconId
			//params.address

			//fetch additional data
			let pixelcon = await fetchPixelcon(params.pixelconId);

			//set pixelcon data
			pixelcon.owner = params.address;
			data.pixelcons = [pixelcon];
			return data;
		}

		// Adds data to return for create collection transaction
		async function addPixelconDataForCreateCollection(params, data) {
			//params.pixelconIds
			//params.pixelconIndexes
			//params.name
			//params.creator

			//scan event logs for data
			let collectionIndex = null;
			let contractInterface = await web3Service.getContractInterface(_contractPath);
			for (var i = 0; i < data.logs.length; i++) {
				let event = contractInterface.parseLog(data.logs[i]);
				if (event.name == "CreateCollection") {
					collectionIndex = event.args["_collectionIndex"].toNumber();
					break;
				}
			}

			//fetch additional data
			let pixelcons = await fetchPixelconsByIndexes(params.pixelconIndexes);

			//set pixelcon data
			let collectionPixelcons = [];
			for (let i = 0; i < pixelcons.length; i++) {
				collectionPixelcons.push({
					id: pixelcons[i].id,
					index: pixelcons[i].index,
					name: pixelcons[i].name,
					owner: pixelcons[i].owner,
					collection: collectionIndex
				});
			}
			let collection = {
				index: collectionIndex,
				creator: params.creator,
				name: web3Service.toUtf8("" + params.name),
				pixelcons: collectionPixelcons
			}
			for (let i = 0; i < pixelcons.length; i++) pixelcons[i].collection = collection;
			data.pixelcons = pixelcons;
			return data;
		}

		// Adds data to return for update collection transaction
		async function addPixelconDataForUpdateCollection(params, data) {
			//params.pixelconIds
			//params.collectionIndex
			//params.name

			//fetch additional data
			let collection = await getCollection(params.collectionIndex);

			//update the name cache
			if (_cacheNameFetch && collectionNames.length > collection.index) collectionNames[collection.index] = collection.name;

			//set pixelcon data
			collection.name = web3Service.toUtf8("" + params.name);
			let pixelcons = [];
			for (let i = 0; i < collection.pixelcons.length; i++) {
				pixelcons.push({
					id: collection.pixelcons[i].id,
					index: collection.pixelcons[i].index,
					name: collection.pixelcons[i].name,
					owner: collection.pixelcons[i].owner,
					collection: collection
				});
			}
			data.pixelcons = pixelcons;
			return data;
		}

		// Adds data to return for clear collection transaction
		async function addPixelconDataForClearCollection(params, data) {
			//params.pixelconIds
			//params.collectionIndex
			//params.pixelconIndexes

			//fetch additional data
			let collectionPixelcons = await fetchPixelconsByIndexes(params.pixelconIndexes);

			//set pixelcon data
			let pixelcons = [];
			for (let i = 0; i < collectionPixelcons.length; i++) {
				pixelcons.push({
					id: collectionPixelcons[i].id,
					index: collectionPixelcons[i].index,
					name: collectionPixelcons[i].name,
					owner: collectionPixelcons[i].owner,
					collection: null
				});
			}
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
