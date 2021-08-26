// SPDX-License-Identifier: MIT

pragma solidity ^0.8.3;

import "./optimism/IPixelCons.sol";
import "./optimism/IERC721Receiver.sol";
import "./optimism/Ownable.sol";
import "./optimism/OVM_CrossDomainEnabled.sol";

//TODO
//add ability to rename?

/**
 * @title Contract That Handles PixelCon Migrations to Optimistic Ethereum
 * @dev Includes batch operations for the existing PixelCons contract
 * @author PixelCons
 */
contract PixelConsMigrator is Ownable, IERC721Receiver, OVM_CrossDomainEnabled {

	/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////// Structs/Constants /////////////////////////////////////////////////////////////////
	/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	
	// Constants
	uint32 constant MERGE_L2_GAS_DEFAULT = 6200000;


	/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////// Storage ///////////////////////////////////////////////////////////////////////
	/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	
	// Address of the original PixelCons contract
	address internal _pixelconsContract;
	
	// Address of the L2 PixelCons contract
	address internal _pixelconsV2Contract;
	
	// Gas amount declared when merging to L2
	uint32 internal _l2MergeGas;


	/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////// Events ////////////////////////////////////////////////////////////////////////
	/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	
	// PixelCon migration events
	event L2Merge(uint256[] tokenIds);
	event L2Withdraw(uint256[] tokenIds);


	/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	//////////////////////////////////////////////////////// PixelCons Migrator /////////////////////////////////////////////////////////////////
	/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	
    /**
     * @dev Contract constructor
	 * @param pixelconsContract -Address of the original L1 PixelCons contract
	 * @param pixelconsV2Contract -Address of the L2 PixelConsV2 contract
	 * @param l1CrossDomainMessenger -Address of the L1CrossDomainMessanger to L2
     */
    constructor(address pixelconsContract, address pixelconsV2Contract, address l1CrossDomainMessenger) OVM_CrossDomainEnabled(l1CrossDomainMessenger) Ownable() {
		_pixelconsContract = pixelconsContract;
		_pixelconsV2Contract = pixelconsV2Contract;
		_l2MergeGas = MERGE_L2_GAS_DEFAULT;
    }

	/**
     * @dev Sets the merge function gas amount
	 * @param gasAmount -New gas amount
	 */
	function setL2MergeGas(uint32 gasAmount) public onlyOwner {
		_l2MergeGas = gasAmount;
	}
	
	////////////////// Main Functions //////////////////
	
	/**
     * @dev Creates PixelCons in batch and migrates them all in one step
	 * @param tokenIds -IDs of tokens
     * @return Index of the last created pixelcon
	 */
	function createBatch(uint256[] calldata tokenIds) public returns (uint256) {
		return createBatch_gas(tokenIds, _l2MergeGas);
	}
	
    /**
     * @dev Creates PixelCons in batch and migrates them all in one step
	 * @param tokenIds -IDs of tokens
	 * @param gasAmount -Amount of gas for messenger
     * @return Index of the last created pixelcon
	 */
	function createBatch_gas(uint256[] calldata tokenIds, uint32 gasAmount) public returns (uint256) {
		//create all tokens to this contract and merge them to L2
		for (uint i = 0; i < tokenIds.length; i++)	{
			IPixelCons(_pixelconsContract).create(address(this), tokenIds[i], 0x0000000000000000);
		}
		_mergeToL2(tokenIds, gasAmount);
		
		//return the new total supply
		return IPixelCons(_pixelconsContract).totalSupply();
	}
	
	/**
     * @dev Migrates the PixelCons in batch all in one step
	 * @param tokenIds -IDs of tokens
	 */
	function transferBatch(uint256[] calldata tokenIds) public {
		transferBatch_gas(tokenIds, _l2MergeGas);
	}
	
    /**
     * @dev Migrates the PixelCons in batch all in one step
	 * @param tokenIds -IDs of tokens
	 * @param gasAmount -Amount of gas for messenger
	 */
	function transferBatch_gas(uint256[] calldata tokenIds, uint32 gasAmount) public {
		//transfer all tokens to this contract and merge them to L2
		for (uint i = 0; i < tokenIds.length; i++)	{
			IPixelCons(_pixelconsContract).transferFrom(msg.sender, address(this), tokenIds[i]);
		}
		_mergeToL2(tokenIds, gasAmount);
	}
	
    /**
     * @dev Withdraws the custodied PixelCons (callable only by the L2 messenger)
	 * @param tokenIds -IDs of tokens
	 * @param to -New owner address
	 */
	function withdrawFromL2(uint256[] calldata tokenIds, address to) external onlyFromCrossDomainAccount(_pixelconsV2Contract) {
		//transfer all tokens from this contract to destination address
		for (uint i = 0; i < tokenIds.length; i++)	{
			IPixelCons(_pixelconsContract).transferFrom(address(this), to, tokenIds[i]);
		}
		emit L2Withdraw(tokenIds);
	}
	
	/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	//////////////////////////////////////////////////////// ERC-721 Receiver ///////////////////////////////////////////////////////////////////
	/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    /**
     * @dev See {IERC721Receiver-onERC721Received}.
     *
     * Always returns `IERC721Receiver.onERC721Received.selector`.
     */
    function onERC721Received(address, address, uint256 tokenId, bytes memory) public override returns (bytes4) {
		require(msg.sender == _pixelconsContract, "Can only receive PixelCons");
		
		//construct calldata for L2 merge function
		uint256[] memory tokenIds = new uint256[](1);
		tokenIds[0] = tokenId;
		bytes memory data = abi.encodeWithSignature("mergeFromL1(uint256[])", tokenIds);

		//send calldata to L2
		sendCrossDomainMessage(_pixelconsV2Contract, data, _l2MergeGas);
		emit L2Merge(tokenIds);
		
        return this.onERC721Received.selector;
    }
	
	/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	////////////////////////////////////////////////////////////// Utils ////////////////////////////////////////////////////////////////////////
	/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	
	/**
     * @dev Merges the PixelCons over to L2
	 * @param tokenIds -IDs of tokens
	 * @param gasAmount -Amount of gas for messenger
	 */
	function _mergeToL2(uint256[] calldata tokenIds, uint32 gasAmount) private {
		//construct calldata for L2 merge function
		bytes memory data = abi.encodeWithSignature("mergeFromL1(uint256[])", tokenIds);

		//send calldata to L2
		sendCrossDomainMessage(_pixelconsV2Contract, data, gasAmount);
		emit L2Merge(tokenIds);
	}
}
