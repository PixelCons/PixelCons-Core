(function () {
	angular.module('App')
		.service('coreContract', coreContract);

	coreContract.$inject = ['web3Service', '$q'];
	function coreContract(web3Service, $q) {
		var _contractABI = 'contracts/PixelCons.json';
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
		this.fetchCollection = fetchCollectionSimple;
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
		web3Service.addRecoveryTransactionDataInjector(addPixelconDataForTransaction);


		///////////
		// Query //
		///////////


		// Gets the names of all pixelcons in existence
		function getTotalPixelcons() {
			return $q(function (resolve, reject) {
				var state = web3Service.getState();
				if (state == "not_enabled") reject(_notEnabledError);
				else if (state == "not_connected") reject(_notConnectedError);
				else if (state != "ready") reject(_unknownError);
				else {
					web3Service.getContract(_contractABI).then(function (contract) {
						contract.totalSupply.call().then(function (total) {
							resolve(total.toNumber());
						}, generateErrorCallback(reject, 'Something went wrong while fetching count'));
					}, reject);
				}
			});
		}

		// Gets the names of all pixelcons in existence
		var pixelconNames = [];
		function getAllNames() {
			return $q(function (resolve, reject) {
				var state = web3Service.getState();
				if (state == "not_enabled") reject(_notEnabledError);
				else if (state == "not_connected") reject(_notConnectedError);
				else if (state != "ready") reject(_unknownError);
				else {
					web3Service.getContract(_contractABI).then(function (contract) {
						contract.totalSupply.call().then(function (total) {
							total = total.toNumber();
							if (total == 0) resolve([]);
							else if (_cacheNameFetch && pixelconNames.length == total) resolve(pixelconNames);
							else if (!_maxNameFetch || total <= _maxNameFetch) {

								//get all at once
								contract.getAllNames.call().then(function (names) {
									pixelconNames = new Array(total);
									for (var i = 0; i < names.length; i++) pixelconNames[i] = web3Service.toUtf8(names[i]);
									resolve(pixelconNames);
								}, generateErrorCallback(reject, 'Something went wrong while fetching names'));
							} else {

								//get in pages
								var index = 0;
								var pixelconNamesIndex = 0;
								pixelconNames = new Array(total);
								var fetchNext = function (names) {
									if (names) for (var i = 0; i < names.length; i++) pixelconNames[pixelconNamesIndex++] = web3Service.toUtf8(names[i]);
									if (index >= total) resolve(pixelconNames);
									else {
										var start = index;
										index += _maxNameFetch;
										if (index > total) index = total;
										contract.getNamesInRange.call(start, index).then(fetchNext, generateErrorCallback(reject, 'Something went wrong while fetching names'));
									}
								}
								fetchNext();
							}
						}, generateErrorCallback(reject, 'Something went wrong while fetching names'));
					}, reject);
				}
			});
		}

		// Gets the names of all pixelcons in existence
		var collectionNames = [];
		function getAllCollectionNames() {
			return $q(function (resolve, reject) {
				var state = web3Service.getState();
				if (state == "not_enabled") reject(_notEnabledError);
				else if (state == "not_connected") reject(_notConnectedError);
				else if (state != "ready") reject(_unknownError);
				else {
					web3Service.getContract(_contractABI).then(function (contract) {
						contract.totalCollections.call().then(function (total) {
							total = total.toNumber();
							if (total == 0) resolve([]);
							else if (_cacheNameFetch && collectionNames.length == total) resolve(collectionNames);
							else if (!_maxNameFetch || total <= _maxNameFetch) {

								//get all at once
								contract.getAllCollectionNames.call().then(function (names) {
									collectionNames = new Array(total);
									for (var i = 0; i < names.length; i++) collectionNames[i] = web3Service.toUtf8(names[i]);
									resolve(collectionNames);
								}, generateErrorCallback(reject, 'Something went wrong while fetching collection names'));
							} else {

								//get in pages
								var index = 0;
								var collectionNamesIndex = 0;
								collectionNames = new Array(total);
								var fetchNext = function (names) {
									if (names) for (var i = 0; i < names.length; i++) collectionNames[collectionNamesIndex++] = web3Service.toUtf8(names[i]);
									if (index >= total) resolve(collectionNames);
									else {
										var start = index;
										index += _maxNameFetch;
										if (index > total) index = total;
										contract.getCollectionNamesInRange.call(start, index).then(fetchNext, generateErrorCallback(reject, 'Something went wrong while fetching names'));
									}
								}
								fetchNext();
							}
						}, generateErrorCallback(reject, 'Something went wrong while fetching collection names'));
					}, reject);
				}
			});
		}

		// Gets the details for the given pixelcon id
		function fetchPixelcon(id) {
			id = formatPixelconId(id);
			return $q(function (resolve, reject) {
				var state = web3Service.getState();
				if (state == "not_enabled") reject(_notEnabledError);
				else if (state == "not_connected") reject(_notConnectedError);
				else if (state != "ready") reject(_unknownError);
				else if (id == null) reject(_invalidIdError);
				else {
					web3Service.getContract(_contractABI).then(function (contract) {
						contract.exists.call(id).then(function (exists) {
							if (!exists) {
								//not found
								resolve(null);
							} else {

								//get details
								contract.getTokenData.call(id).then(function (pixelconDetails) {
									//uint256 _tknId, uint64 _tknIdx, uint64 _collection, address _owner, address _creator, bytes8 _name, uint32 _dateCreated
									var pixelcon = {
										id: id,
										index: pixelconDetails[1].toNumber(),
										name: web3Service.toUtf8(pixelconDetails[5]),
										owner: pixelconDetails[3],
										creator: pixelconDetails[4],
										date: pixelconDetails[6].toNumber() * 1000,
										collection: pixelconDetails[2].toNumber() ? pixelconDetails[2].toNumber() : null
									};
									return pixelcon;
								}).then(function (pixelcon) {

									//add collection details
									return fillCollectionData(pixelcon);
								}).then(resolve, generateErrorCallback(reject, 'Something went wrong while fetching details'));
							}
						}, generateErrorCallback(reject, 'Something went wrong while fetching details'));
					}, reject);
				}
			});
		}

		// Gets the details for the given pixelcon collection index
		function fetchCollection(index, skipCreator) {
			return $q(function (resolve, reject) {
				var state = web3Service.getState();
				if (state == "not_enabled") reject(_notEnabledError);
				else if (state == "not_connected") reject(_notConnectedError);
				else if (state != "ready") reject(_unknownError);
				else if (index == 0) reject(_invalidIndexError);
				else {
					web3Service.getContract(_contractABI).then(function (contract) {
						contract.collectionExists.call(index).then(function (exists) {
							if (exists) {
								//found
								var collectionName;
								var collectionPixelconIndexes;
								var collectionPixelcons;

								//get collection data
								contract.getCollectionData.call(index).then(function (collectionData) {
									collectionName = web3Service.toUtf8(collectionData[0]);
									collectionPixelconIndexes = collectionData[1];

									// get details for pixelcons
									if (!collectionPixelconIndexes.length) return null;
									else return contract.getBasicData.call(collectionPixelconIndexes);
								}).then(function (basicDetails) {
									var pixelcons = [];
									if (basicDetails) {
										for (var i = 0; i < basicDetails[0].length; i++) {
											pixelcons.push({
												id: web3Service.to256Hex(basicDetails[0][i]),
												index: collectionPixelconIndexes[i].toNumber(),
												name: web3Service.toUtf8(basicDetails[1][i]),
												owner: basicDetails[2][i].toString(),
												collection: basicDetails[3][i].toNumber() ? basicDetails[3][i].toNumber() : null
											});
										}
									}
									collectionPixelcons = pixelcons;

									// get creator
									if (skipCreator || !collectionPixelcons[0]) return null;
									return contract.creatorOf.call(collectionPixelcons[0].id);
								}).then(function (creator) {

									// return collection object
									return {
										index: index,
										creator: creator,
										name: collectionName,
										pixelcons: collectionPixelcons
									};
								}).then(resolve, generateErrorCallback(reject, 'Something went wrong while fetching collection details'));
							} else {
								//not found
								reject('PixelCon collection does not exist');
							}
						}, generateErrorCallback(reject, 'Something went wrong while fetching details'));
					}, reject);
				}
			});
		}
		function fetchCollectionSimple(index) {
			return fetchCollection(index, undefined, undefined);
		}

		// Gets all pixelcons either created or owned by the given address
		function fetchPixelconsByAccount(address) {
			return $q(function (resolve, reject) {
				var state = web3Service.getState();
				if (state == "not_enabled") reject(_notEnabledError);
				else if (state == "not_connected") reject(_notConnectedError);
				else if (state != "ready") reject(_unknownError);
				else if (!web3Service.isAddress(address)) reject(_invalidAddressError);
				else {
					web3Service.getContract(_contractABI).then(function (contract) {
						var created = null;
						var owned = null;
						var alreadyFailed = false;
						function endAccountFetch(result) {
							if (result !== true && !alreadyFailed) {
								var errorCallback = generateErrorCallback(reject, 'Something went wrong while fetching account details');
								errorCallback(result);
								alreadyFailed = true;
							}
							else if (created && owned) {

								//combine owned and created
								var combinedIndexes = [];
								for (var i = 0; i < owned.length; i++) if (combinedIndexes.indexOf(owned[i]) == -1) combinedIndexes.push(owned[i]);
								for (var i = 0; i < created.length; i++) if (combinedIndexes.indexOf(created[i]) == -1) combinedIndexes.push(created[i]);
								combinedIndexes.sort(function (a, b) { return a - b; });

								//get basic details
								if (combinedIndexes.length > 0) {
									contract.getBasicData.call(combinedIndexes).then(function (basicDetails) {
										var pixelcons = [];
										for (var i = 0; i < basicDetails[0].length; i++) {
											pixelcons.push({
												id: web3Service.to256Hex(basicDetails[0][i]),
												index: combinedIndexes[i],
												name: web3Service.toUtf8(basicDetails[1][i]),
												owner: basicDetails[2][i].toString(),
												created: created.indexOf(combinedIndexes[i]) > -1,
												owned: owned.indexOf(combinedIndexes[i]) > -1,
												collection: basicDetails[3][i].toNumber() ? basicDetails[3][i].toNumber() : null
											});
										}

										//add collection details
										return fillCollectionData(pixelcons);
									}).then(function (pixelcons) {

										//add additional flags to pixelcon objects in the collection objects
										for (var i = 0; i < pixelcons.length; i++) {
											if (pixelcons[i].collection) {
												for (var j = 0; j < pixelcons[i].collection.pixelcons.length; j++) {
													pixelcons[i].collection.pixelcons[j].created = created.indexOf(pixelcons[i].collection.pixelcons[j].index) > -1;
													pixelcons[i].collection.pixelcons[j].owned = owned.indexOf(pixelcons[i].collection.pixelcons[j].index) > -1;
												}
											}
										}
										return pixelcons;
									}).then(resolve, generateErrorCallback(reject, 'Something went wrong while fetching account details'));
								} else {
									//no pixelcons
									resolve([]);
								}
							}
						}

						//query for tokens created by or owned by account
						contract.getForCreator.call(address).then(function (indexes) {
							created = [];
							for (var i = 0; i < indexes.length; i++) created.push(indexes[i].toNumber());
							endAccountFetch(true);
						}, endAccountFetch);
						contract.getForOwner.call(address).then(function (indexes) {
							owned = [];
							for (var i = 0; i < indexes.length; i++) owned.push(indexes[i].toNumber());
							endAccountFetch(true);
						}, endAccountFetch);
					}, reject);
				}
			});
		}

		// Gets all pixelcons created by the given address
		function fetchPixelconsByCreator(address) {
			return $q(function (resolve, reject) {
				var state = web3Service.getState();
				if (state == "not_enabled") reject(_notEnabledError);
				else if (state == "not_connected") reject(_notConnectedError);
				else if (state != "ready") reject(_unknownError);
				else if (!web3Service.isAddress(address)) reject(_invalidAddressError);
				else {
					web3Service.getContract(_contractABI).then(function (contract) {
						var creatorPixelconIndexes;

						//get all tokens for creator
						contract.getForCreator.call(address).then(function (indexes) {
							creatorPixelconIndexes = indexes;

							//get details for pixelcons
							if (!creatorPixelconIndexes.length) return null;
							else return contract.getBasicData.call(indexes);
						}).then(function (basicDetails) {
							var pixelcons = [];
							if (basicDetails) {
								for (var i = 0; i < basicDetails[0].length; i++) {
									pixelcons.push({
										id: web3Service.to256Hex(basicDetails[0][i]),
										index: creatorPixelconIndexes[i],
										name: web3Service.toUtf8(basicDetails[1][i]),
										owner: basicDetails[2][i].toString(),
										collection: basicDetails[3][i].toNumber() ? basicDetails[3][i].toNumber() : null
									});
								}
							}

							//add collection details
							return fillCollectionData(pixelcons);
						}).then(resolve, generateErrorCallback(reject, 'Something went wrong while fetching creator details'));
					}, reject);
				}
			});
		}

		// Gets all pixelcons with the given indexes
		function fetchPixelconsByIndexes(indexes) {
			return $q(function (resolve, reject) {
				var state = web3Service.getState();
				if (state == "not_enabled") reject(_notEnabledError);
				else if (state == "not_connected") reject(_notConnectedError);
				else if (state != "ready") reject(_unknownError);
				else if (!indexes || indexes.length == 0) resolve([]);
				else {
					web3Service.getContract(_contractABI).then(function (contract) {

						//get details
						contract.getBasicData.call(indexes).then(function (basicDetails) {
							var pixelcons = [];
							for (var i = 0; i < basicDetails[0].length; i++) {
								pixelcons.push({
									id: web3Service.to256Hex(basicDetails[0][i]),
									index: indexes[i],
									name: web3Service.toUtf8(basicDetails[1][i]),
									owner: basicDetails[2][i].toString(),
									collection: basicDetails[3][i].toNumber() ? basicDetails[3][i].toNumber() : null
								});
							}
							return pixelcons;
						}).then(function (pixelcons) {

							//add collection details
							return fillCollectionData(pixelcons);
						}).then(resolve, generateErrorCallback(reject, 'Something went wrong while fetching pixelcons details'));
					}, reject);
				}
			});
		}


		//////////////////
		// Verification //
		//////////////////


		// Verifies the status of a given pixelcon id
		function verifyPixelcon(id) {
			id = formatPixelconId(id);
			return $q(function (resolve, reject) {
				var state = web3Service.getState();
				if (state == "not_enabled") reject(_notEnabledError);
				else if (state == "not_connected") reject(_notConnectedError);
				else if (state != "ready") reject(_unknownError);
				else if (web3Service.isReadOnly()) reject(_noAccountError);
				else if (web3Service.isPrivacyMode()) reject(_accountPrivateError);
				else if (id == null) reject(_invalidIdError);
				else if (isDuplicate(_createTypeDescription[0], [id])) reject(_duplicateTransactionError);
				else {
					web3Service.getContract(_contractABI).then(function (contract) {
						contract.exists.call(id).then(function (exists) {
							resolve({ exists: exists });
						}, generateErrorCallback(reject, _verificationError));
					}, reject);
				}
			});
		}

		// Verifies the status for edit of a given pixelcon
		function verifyPixelconEdit(id) {
			var address = web3Service.getActiveAccount();
			id = formatPixelconId(id);
			return $q(function (resolve, reject) {
				var state = web3Service.getState();
				if (state == "not_enabled") reject(_notEnabledError);
				else if (state == "not_connected") reject(_notConnectedError);
				else if (state != "ready") reject(_unknownError);
				else if (web3Service.isReadOnly()) reject(_noAccountError);
				else if (web3Service.isPrivacyMode()) reject(_accountPrivateError);
				else if (id == null) reject(_invalidIdError);
				else if (isDuplicate(_updateTypeDescription[0], [id])) reject(_duplicateTransactionError);
				else {
					web3Service.getContract(_contractABI).then(function (contract) {
						contract.ownerOf.call(id).then(function (owner) {
							if (owner == address) {
								resolve({ owner: owner });
							} else {
								reject('Account does not own this PixelCon');
							}
						}, generateErrorCallback(reject, _verificationError));
					}, reject);
				}
			});
		}

		// Verifies the pixelcon transfer
		function verifyTransferPixelcon(id) {
			var address = web3Service.getActiveAccount();
			id = formatPixelconId(id);
			return $q(function (resolve, reject) {
				var state = web3Service.getState();
				if (state == "not_enabled") reject(_notEnabledError);
				else if (state == "not_connected") reject(_notConnectedError);
				else if (state != "ready") reject(_unknownError);
				else if (web3Service.isReadOnly()) reject(_noAccountError);
				else if (web3Service.isPrivacyMode()) reject(_accountPrivateError);
				else if (id == null) reject(_invalidIdError);
				else if (isDuplicate(_transferTypeDescription[0], [id])) reject(_duplicateTransactionError);
				else {
					web3Service.getContract(_contractABI).then(function (contract) {
						contract.ownerOf.call(id).then(function (owner) {
							if (owner == address) {
								resolve({ owner: owner });
							} else {
								reject('Account does not own this PixelCon');
							}
						}, generateErrorCallback(reject, _verificationError));
					}, reject);
				}
			});
		}

		// Verifies the pixelcon collection
		function verifyPixelconCollection(indexes, pixelconIds) {
			var address = web3Service.getActiveAccount();
			return $q(function (resolve, reject) {
				var state = web3Service.getState();
				if (state == "not_enabled") reject(_notEnabledError);
				else if (state == "not_connected") reject(_notConnectedError);
				else if (state != "ready") reject(_unknownError);
				else if (web3Service.isReadOnly()) reject(_noAccountError);
				else if (web3Service.isPrivacyMode()) reject(_accountPrivateError);
				else if (isDuplicate(_createCollectionTypeDescription[0], pixelconIds)) reject(_duplicateTransactionError);
				else {
					web3Service.getContract(_contractABI).then(function (contract) {
						getCollectionVerificationData(contract, indexes, address).then(function (data) {
							//verify that the user is the owner of all pixelcons
							//and that the user is the creator of all pixelcons
							//and that the pixelcons are not already in a collection
							var verified = true;
							for (var i = 0; i < data.pixelcons.length; i++) {
								if (data.pixelcons[i].owner != address) {
									reject('Account does not own all PixelCons');
									verified = false;
									break;
								} else if (data.pixelcons[i].collection !== null) {
									reject('PixelCon is already in a collection');
									verified = false;
									break;
								} else if (data.created.indexOf(data.pixelcons[i].index) == -1) {
									reject('Account did not create all PixelCons');
									verified = false;
									break;
								}
							}
							if (verified) {
								resolve({ owner: address, creator: address });
							}
						}, generateErrorCallback(reject, _verificationError));
					}, reject);
				}
			});
		}

		// Verifies the pixelcon collection for edit
		function verifyPixelconCollectionEdit(index, pixelconIds) {
			var address = web3Service.getActiveAccount();
			return $q(function (resolve, reject) {
				var state = web3Service.getState();
				if (state == "not_enabled") reject(_notEnabledError);
				else if (state == "not_connected") reject(_notConnectedError);
				else if (state != "ready") reject(_unknownError);
				else if (web3Service.isReadOnly()) reject(_noAccountError);
				else if (web3Service.isPrivacyMode()) reject(_accountPrivateError);
				else if (index == 0) reject(_invalidIndexError);
				else if (isDuplicate(_updateCollectionTypeDescription[0], pixelconIds)) reject(_duplicateTransactionError);
				else {
					fetchCollection(index, false, true).then(function (collection) {
						//verify that the user is the creator of the collection and owner of all pixelcons
						var verified = false;
						if (collection.creator != address) {
							reject('Account is not the creator of the collection');
						} else {
							verified = true;
							for (var i = 0; i < collection.pixelcons.length; i++) {
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
					});
				}
			});
		}

		// Verifies the pixelcon collection for clearing
		function verifyPixelconCollectionClear(index, pixelconIds) {
			var address = web3Service.getActiveAccount();
			return $q(function (resolve, reject) {
				var state = web3Service.getState();
				if (state == "not_enabled") reject(_notEnabledError);
				else if (state == "not_connected") reject(_notConnectedError);
				else if (state != "ready") reject(_unknownError);
				else if (web3Service.isReadOnly()) reject(_noAccountError);
				else if (web3Service.isPrivacyMode()) reject(_accountPrivateError);
				else if (index == 0) reject(_invalidIndexError);
				else if (isDuplicate(_clearCollectionTypeDescription[0], pixelconIds)) reject(_duplicateTransactionError);
				else {
					fetchCollection(index, false, true).then(function (collection) {
						//verify that the user is the creator of the collection and owner of all pixelcons
						var verified = false;
						if (collection.creator != address) {
							reject('Account is not the creator of the collection');
						} else {
							verified = true;
							for (var i = 0; i < collection.pixelcons.length; i++) {
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
					});
				}
			});
		}


		//////////////////////////
		// Create/Update/Delete //
		//////////////////////////


		// Creates a new pixelcon
		function createPixelcon(id, name) {
			id = formatPixelconId(id);
			name = web3Service.fromUtf8(name);
			return $q(function (resolve, reject) {
				var state = web3Service.getState();
				if (state == "not_enabled") reject(_notEnabledError);
				else if (state == "not_connected") reject(_notConnectedError);
				else if (state != "ready") reject(_unknownError);
				else if (web3Service.isReadOnly()) reject(_noAccountError);
				else if (web3Service.isPrivacyMode()) reject(_accountPrivateError);
				else if (id == null) reject(_invalidIdError);
				else {
					web3Service.getContract(_contractABI).then(function (contract) {
						var to = web3Service.getActiveAccount();
						var params = { from: to };
						return web3Service.transactionWrapper(contract, 'create', to, id, name, params).then(function (data) {

							//add pixelcon data for return
							var transactionParams = { pixelconId: id, name: name, creator: to };
							var transaction = data.transactionPromise.then(function (data) { return addPixelconDataForCreate(transactionParams, data) });

							web3Service.addWaitingTransaction(transaction, data.txHash, transactionParams, _createTypeDescription[0], _createTypeDescription[1]);
							return transaction;
						}).then(resolve, generateErrorCallback(reject, 'Something went wrong while creating PixelCon'));;
					}, reject);
				}
			});
		}


		// Updates pixelcon name
		function updatePixelcon(id, name) {
			id = formatPixelconId(id);
			name = web3Service.fromUtf8(name);
			return $q(function (resolve, reject) {
				var state = web3Service.getState();
				if (state == "not_enabled") reject(_notEnabledError);
				else if (state == "not_connected") reject(_notConnectedError);
				else if (state != "ready") reject(_unknownError);
				else if (web3Service.isReadOnly()) reject(_noAccountError);
				else if (web3Service.isPrivacyMode()) reject(_accountPrivateError);
				else if (id == null) reject(_invalidIdError);
				else {
					web3Service.getContract(_contractABI).then(function (contract) {
						var acct = web3Service.getActiveAccount();
						var params = { from: acct };
						return web3Service.transactionWrapper(contract, 'rename', id, name, params).then(function (data) {

							//add pixelcon data for return
							var transactionParams = { pixelconId: id, name: name };
							var transaction = data.transactionPromise.then(function (data) { return addPixelconDataForUpdate(transactionParams, data) });

							web3Service.addWaitingTransaction(transaction, data.txHash, transactionParams, _updateTypeDescription[0], _updateTypeDescription[1]);
							return transaction;
						}).then(resolve, generateErrorCallback(reject, 'Something went wrong while updating PixelCon'));;
					}, reject);
				}
			});
		}

		// Transfers pixelcon
		function transferPixelcon(id, address) {
			id = formatPixelconId(id);
			return $q(function (resolve, reject) {
				var state = web3Service.getState();
				if (state == "not_enabled") reject(_notEnabledError);
				else if (state == "not_connected") reject(_notConnectedError);
				else if (state != "ready") reject(_unknownError);
				else if (web3Service.isReadOnly()) reject(_noAccountError);
				else if (web3Service.isPrivacyMode()) reject(_accountPrivateError);
				else if (!web3Service.isAddress(address)) reject(_invalidAddressError);
				else if (id == null) reject(_invalidIdError);
				else {
					web3Service.getContract(_contractABI).then(function (contract) {
						var owner = web3Service.getActiveAccount();
						var params = { from: owner };
						return web3Service.transactionWrapper(contract, 'safeTransferFrom', owner, address, id, "", params).then(function (data) {

							//add pixelcon data for return
							var transactionParams = { pixelconId: id, address: address };
							var transaction = data.transactionPromise.then(function (data) { return addPixelconDataForTransfer(transactionParams, data) });

							web3Service.addWaitingTransaction(transaction, data.txHash, transactionParams, _transferTypeDescription[0], _transferTypeDescription[1]);
							return transaction;
						}).then(resolve, generateErrorCallback(reject, 'Something went wrong while sending PixelCon'));
					}, reject);
				}
			});
		}

		// Creates a new pixelcon collection
		function createPixelconCollection(indexes, name) {
			name = web3Service.fromUtf8(name);
			return $q(function (resolve, reject) {
				var state = web3Service.getState();
				if (state == "not_enabled") reject(_notEnabledError);
				else if (state == "not_connected") reject(_notConnectedError);
				else if (state != "ready") reject(_unknownError);
				else if (web3Service.isReadOnly()) reject(_noAccountError);
				else if (web3Service.isPrivacyMode()) reject(_accountPrivateError);
				else {
					web3Service.getContract(_contractABI).then(function (contract) {
						var pixelconIds = [];
						contract.getBasicData.call(indexes).then(function (basicDetails) {
							for (var i = 0; i < basicDetails[0].length; i++) pixelconIds.push(web3Service.to256Hex(basicDetails[0][i]));
							var acct = web3Service.getActiveAccount();
							var params = { from: acct };
							return web3Service.transactionWrapper(contract, 'createCollection', indexes, name, params).then(function (data) {

								//add pixelcon data for return
								var transactionParams = { pixelconIds: pixelconIds, pixelconIndexes: indexes, name: name, creator: acct };
								var transaction = data.transactionPromise.then(function (data) { return addPixelconDataForCreateCollection(transactionParams, data) });

								web3Service.addWaitingTransaction(transaction, data.txHash, transactionParams, _createCollectionTypeDescription[0], _createCollectionTypeDescription[1]);
								return transaction;
							});
						}).then(resolve, generateErrorCallback(reject, 'Something went wrong while creating PixelCon collection'));
					}, reject);
				}
			});
		}

		// Update the pixelcon collection name
		function updatePixelconCollection(index, name) {
			name = web3Service.fromUtf8(name);
			return $q(function (resolve, reject) {
				var state = web3Service.getState();
				if (state == "not_enabled") reject(_notEnabledError);
				else if (state == "not_connected") reject(_notConnectedError);
				else if (state != "ready") reject(_unknownError);
				else if (web3Service.isReadOnly()) reject(_noAccountError);
				else if (web3Service.isPrivacyMode()) reject(_accountPrivateError);
				else if (index == 0) reject(_invalidIndexError);
				else {
					web3Service.getContract(_contractABI).then(function (contract) {
						var pixelconIds = [];
						fetchCollection(index, true, true).then(function (collection) {
							for (var i = 0; i < collection.pixelcons.length; i++) pixelconIds.push(collection.pixelcons[i].id);
							var acct = web3Service.getActiveAccount();
							var params = { from: acct };
							return web3Service.transactionWrapper(contract, 'renameCollection', index, name, params).then(function (data) {

								//add pixelcon data for return
								var transactionParams = { pixelconIds: pixelconIds, collectionIndex: index, name: name };
								var transaction = data.transactionPromise.then(function (data) { return addPixelconDataForUpdateCollection(transactionParams, data) });

								web3Service.addWaitingTransaction(transaction, data.txHash, transactionParams, _updateCollectionTypeDescription[0], _updateCollectionTypeDescription[1]);
								return transaction;
							});
						}).then(resolve, generateErrorCallback(reject, 'Something went wrong while updating PixelCon collection'));
					}, reject);
				}
			});
		}

		// Clears the pixelcon collection
		function clearPixelconCollection(index) {
			return $q(function (resolve, reject) {
				var state = web3Service.getState();
				if (state == "not_enabled") reject(_notEnabledError);
				else if (state == "not_connected") reject(_notConnectedError);
				else if (state != "ready") reject(_unknownError);
				else if (web3Service.isReadOnly()) reject(_noAccountError);
				else if (web3Service.isPrivacyMode()) reject(_accountPrivateError);
				else if (index == 0) reject(_invalidIndexError);
				else {
					web3Service.getContract(_contractABI).then(function (contract) {
						var pixelconIds = [];
						var pixelconIndexes = [];
						fetchCollection(index, true, true).then(function (collection) {
							for (var i = 0; i < collection.pixelcons.length; i++) {
								pixelconIds.push(collection.pixelcons[i].id);
								pixelconIndexes.push(collection.pixelcons[i].index);
							}
							var acct = web3Service.getActiveAccount();
							var params = { from: acct };
							return web3Service.transactionWrapper(contract, 'clearCollection', index, params).then(function (data) {

								//add pixelcon data for return
								var transactionParams = { pixelconIds: pixelconIds, collectionIndex: index, pixelconIndexes: pixelconIndexes };
								var transaction = data.transactionPromise.then(function (data) { return addPixelconDataForClearCollection(transactionParams, data) });

								web3Service.addWaitingTransaction(transaction, data.txHash, transactionParams, _clearCollectionTypeDescription[0], _clearCollectionTypeDescription[1]);
								return transaction;
							});
						}).then(resolve, generateErrorCallback(reject, 'Something went wrong while clearing PixelCon collection'));
					}, reject);
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
				for (var i = 2; i < 66; i++) {
					var v = id.charCodeAt(i);
					if (!(v >= 48 && v <= 57) && !(v >= 97 && v <= 102)) {
						id = null;
						break;
					}
				}
			}

			if (id == '0x0000000000000000000000000000000000000000000000000000000000000000') return null;
			return id;
		}

		// Error reject wrapper
		function generateErrorCallback(reject, text) {
			return function (err) {
				console.log(err);
				reject(text);
			}
		}

		// Fills in collection data for the given pixelcons
		function fillCollectionData(pixelcons) {
			var isArray = true;
			if (pixelcons.length === undefined && pixelcons.id) {
				isArray = false;
				pixelcons = [pixelcons];
			}
			return $q(function (resolve, reject) {
				var cachedGroups = {};
				var fillData = function (index) {
					if (index >= pixelcons.length) resolve(isArray ? pixelcons : pixelcons[0]);
					else if (pixelcons[index].collection === null) fillData(index + 1);
					else if (cachedGroups[pixelcons[index].collection]) {
						pixelcons[index].collection = cachedGroups[pixelcons[index].collection];
						fillData(index + 1);
					} else {
						fetchCollection(pixelcons[index].collection, true, true).then(function (collection) {
							//replace group pixelcon data, with more detailed versions
							for (var i = 0; i < collection.pixelcons.length; i++) {
								for (var j = 0; j < pixelcons.length; j++) {
									if (collection.pixelcons[i].id == pixelcons[j].id) {
										collection.pixelcons[i] = pixelcons[j];
										break;
									}
								}
							}

							//set collection and query for the next one
							if (pixelcons[index].creator) collection.creator = pixelcons[index].creator;
							cachedGroups[pixelcons[index].collection] = collection;
							pixelcons[index].collection = collection;
							fillData(index + 1);
						}, reject);
					}
				}
				fillData(0);
			});
		}

		// Gets the pixelcon index of a Create event from the given receipt
		function getPixelconIndexFromCreateEvent(contract, receipt) {
			if (!receipt.logs) return null;

			var eventHash = contract.contract.Create().options.topics[0];
			for (var i = 0; i < receipt.logs.length; i++) {
				if (receipt.logs[i].topics && receipt.logs[i].topics[0] == eventHash) {
					return parseInt(receipt.logs[i].data.substr(2, 64), 16);
				}
			}
			return null;
		}

		// Gets the collection index of a CreateCollection event from the given receipt
		function getCollectionIndexFromCreateEvent(contract, receipt) {
			if (!receipt.logs) return null;

			var eventHash = contract.contract.CreateCollection().options.topics[0];
			for (var i = 0; i < receipt.logs.length; i++) {
				if (receipt.logs[i].topics && receipt.logs[i].topics[0] == eventHash) {
					return parseInt(receipt.logs[i].topics[2], 16);
				}
			}
			return null;
		}

		// Gets all data sets required to verify collection functions
		function getCollectionVerificationData(contract, indexes, address) {
			return $q(function (resolve, reject) {
				var pixelcons = null;
				var created = null;
				var alreadyFailed = false;
				function endDataFetchFail(result) {
					if (!alreadyFailed) {
						reject(result);
						alreadyFailed = true;
					}
				}
				function endDataFetch(result) {
					if (created && pixelcons) {
						resolve({ pixelcons: pixelcons, created: created });
					}
				}

				//query for tokens created by and basic data of the given indexes
				contract.getForCreator.call(address).then(function (indexes) {
					created = [];
					for (var i = 0; i < indexes.length; i++) created.push(indexes[i].toNumber());
					endDataFetch();
				}, endDataFetchFail);
				contract.getBasicData.call(indexes).then(function (basicDetails) {
					pixelcons = [];
					for (var i = 0; i < basicDetails[0].length; i++) {
						pixelcons.push({
							id: web3Service.to256Hex(basicDetails[0][i]),
							index: indexes[i],
							owner: basicDetails[2][i].toString(),
							collection: basicDetails[3][i].toNumber() ? basicDetails[3][i].toNumber() : null
						});
					}
					endDataFetch();
				}, endDataFetchFail);
			});
		}

		// Checks if the given data looks like a currently processing transaction
		function isDuplicate(transactionType, pixelconIds) {
			var transactions = web3Service.getWaitingTransactions();
			for (var i = 0; i < transactions.length; i++) {
				if (transactions[i].type == transactionType && transactions[i].params) {
					if (pixelconIds.length == 1) {
						if (transactions[i].params.pixelconId == pixelconIds[0]) return true;
					} else {
						if (transactions[i].params.pixelconIds && transactions[i].params.pixelconIds.length == pixelconIds.length) {
							var containsAll = true;
							for (var x = 0; x < pixelconIds.length; x++) {
								var found = false;
								for (var y = 0; y < transactions[i].params.pixelconIds.length; y++) {
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


		//////////////////////////////////
		// Utils (return data wrappers) //
		//////////////////////////////////


		// Adds data to return for create transaction
		function addPixelconDataForCreate(params, data) {
			//params.pixelconId
			//params.name
			//params.creator

			return web3Service.getContract(_contractABI).then(function (contract) {
				data.pixelcons = [{
					id: params.pixelconId,
					index: getPixelconIndexFromCreateEvent(contract, data.receipt),
					name: web3Service.toUtf8("" + params.name),
					owner: params.creator,
					creator: params.creator,
					date: (new Date()).getTime(),
					collection: null
				}];
				return data;
			});
		}

		// Adds data to return for update transaction
		function addPixelconDataForUpdate(params, data) {
			//params.pixelconId
			//params.name

			return fetchPixelcon(params.pixelconId).then(function (pixelcon) {
				pixelcon.name = web3Service.toUtf8("" + params.name);
				if (_cacheNameFetch && pixelconNames.length > pixelcon.index) pixelconNames[pixelcon.index] = pixelcon.name; //update the name cache
				data.pixelcons = [pixelcon];
				return data;
			});
		}

		// Adds data to return for transfer transaction
		function addPixelconDataForTransfer(params, data) {
			//params.pixelconId
			//params.address

			return fetchPixelcon(params.pixelconId).then(function (pixelcon) {
				pixelcon.owner = params.address;
				data.pixelcons = [pixelcon];
				return data;
			});
		}

		// Adds data to return for create collection transaction
		function addPixelconDataForCreateCollection(params, data) {
			//params.pixelconIds
			//params.pixelconIndexes
			//params.name
			//params.creator

			var collectionIndex;
			return web3Service.getContract(_contractABI).then(function (contract) {
				collectionIndex = getCollectionIndexFromCreateEvent(contract, data.receipt);
				return fetchPixelconsByIndexes(params.pixelconIndexes);
			}).then(function (pixelcons) {
				var collectionPixelcons = [];
				for (var i = 0; i < pixelcons.length; i++) {
					collectionPixelcons.push({
						id: pixelcons[i].id,
						index: pixelcons[i].index,
						name: pixelcons[i].name,
						owner: pixelcons[i].owner,
						collection: collectionIndex
					});
				}
				var collection = {
					index: collectionIndex,
					creator: params.creator,
					name: web3Service.toUtf8("" + params.name),
					pixelcons: collectionPixelcons
				}

				for (var i = 0; i < pixelcons.length; i++) pixelcons[i].collection = collection;
				data.pixelcons = pixelcons;
				return data;
			});
		}

		// Adds data to return for update collection transaction
		function addPixelconDataForUpdateCollection(params, data) {
			//params.pixelconIds
			//params.collectionIndex
			//params.name

			return fetchCollection(params.collectionIndex).then(function (collection) {
				collection.name = web3Service.toUtf8("" + params.name);
				if (_cacheNameFetch && collectionNames.length > collection.index) collectionNames[collection.index] = collection.name; //update the name cache
				var pixelcons = [];
				for (var i = 0; i < collection.pixelcons.length; i++) {
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
			});
		}

		// Adds data to return for clear collection transaction
		function addPixelconDataForClearCollection(params, data) {
			//params.pixelconIds
			//params.collectionIndex
			//params.pixelconIndexes

			return fetchPixelconsByIndexes(params.pixelconIndexes).then(function (collectionPixelcons) {
				var pixelcons = [];
				for (var i = 0; i < collectionPixelcons.length; i++) {
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
			});
		}

		// Adds data to return for the given transaction
		function addPixelconDataForTransaction(details, data) {
			if (details.type == _createTypeDescription[0]) return addPixelconDataForCreate(details.params, data);
			if (details.type == _updateTypeDescription[0]) return addPixelconDataForUpdate(details.params, data);
			if (details.type == _transferTypeDescription[0]) return addPixelconDataForTransfer(details.params, data);
			if (details.type == _createCollectionTypeDescription[0]) return addPixelconDataForCreateCollection(details.params, data);
			if (details.type == _updateCollectionTypeDescription[0]) return addPixelconDataForUpdateCollection(details.params, data);
			if (details.type == _clearCollectionTypeDescription[0]) return addPixelconDataForClearCollection(details.params, data);

			return data;
		}

	}
}());
