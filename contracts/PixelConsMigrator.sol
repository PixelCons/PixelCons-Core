// SPDX-License-Identifier: MIT

pragma solidity ^0.8.3;

import "./optimism/IPixelCons.sol";
import "./optimism/IERC721Receiver.sol";
import "./optimism/OVM_CrossDomainEnabled.sol";


/**
 * @title Contract That Handles PixelCon Migrations to Optimistic Ethereum
 * @dev Includes batch operations for the existing PixelCons contract
 * @author PixelCons
 */
contract PixelConsMigrator is IERC721Receiver, OVM_CrossDomainEnabled {
	address public _pixelconsContract;
	address public _pixelconsV2Contract;
	
	uint32 constant MERGE_TO_L2_GAS = 6200000;
	
	event L2Merge(uint256[] tokenIds);
	event L2Withdraw(uint256[] tokenIds);

    /**
     * @dev Contract constructor.
     */
    constructor(address pixelconsContract, address pixelconsV2Contract, address l1CrossDomainMessenger) OVM_CrossDomainEnabled(l1CrossDomainMessenger) {
		_pixelconsContract = pixelconsContract;
		_pixelconsV2Contract = pixelconsV2Contract;
    }
	
    /**
     * @dev Helps create PixelCons in batch and migrate them all in one step
     */
	function createBatch(uint256[] calldata tokenIds) public returns (uint256) {
		//create all tokens to this contract and merge them to L2
		for (uint i = 0; i < tokenIds.length; i++)	{
			IPixelCons(_pixelconsContract).create(address(this), tokenIds[i], 0x0000000000000000);
		}
		_mergeToL2(tokenIds);
		
		//return the new total supply
		return IPixelCons(_pixelconsContract).totalSupply();
	}
	
    /**
     * @dev Helps transfer PixelCons in batch and migrate them all in one step
     */
	function transferBatch(uint256[] calldata tokenIds) public {
		//transfer all tokens to this contract and merge them to L2
		for (uint i = 0; i < tokenIds.length; i++)	{
			IPixelCons(_pixelconsContract).transferFrom(msg.sender, address(this), tokenIds[i]);
		}
		_mergeToL2(tokenIds);
	}
	
    /**
     * @dev Withdraw PixelCons
     */
	function withdrawFromL2(uint256[] calldata tokenIds, address to) external onlyFromCrossDomainAccount(_pixelconsV2Contract) {
		//transfer all tokens from this contract to destination address
		for (uint i = 0; i < tokenIds.length; i++)	{
			IPixelCons(_pixelconsContract).transferFrom(address(this), to, tokenIds[i]);
		}
		emit L2Withdraw(tokenIds);
	}
	
	//TODO: function to resend message for anything sent via unsafe transfer
	//function rescue(uint256[] memory tokenIds) public

    /**
     * @dev See {IERC721Receiver-onERC721Received}.
     *
     * Always returns `IERC721Receiver.onERC721Received.selector`.
     */
    function onERC721Received(address, address, uint256 tokenId, bytes memory) public override returns (bytes4) {
		require(msg.sender == _pixelconsContract, "Can only receive from PixelCons");
		
		//construct calldata for L2 merge function
		uint256[] memory tokenIds = new uint256[](1);
		tokenIds[0] = tokenId;
		bytes memory data = abi.encodeWithSignature("mergeFromL1(uint256[])", tokenIds);

		//send calldata to L2
		sendCrossDomainMessage(_pixelconsV2Contract, data, MERGE_TO_L2_GAS);
		emit L2Merge(tokenIds);
		
        return this.onERC721Received.selector;
    }
	
    /**
     * @dev Common merge function
     */
	function _mergeToL2(uint256[] calldata tokenIds) private {
		//construct calldata for L2 merge function
		bytes memory data = abi.encodeWithSignature("mergeFromL1(uint256[])", tokenIds);

		//send calldata to L2
		sendCrossDomainMessage(_pixelconsV2Contract, data, MERGE_TO_L2_GAS);
		emit L2Merge(tokenIds);
	}
}
