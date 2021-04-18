// SPDX-License-Identifier: MIT

pragma solidity ^0.8.3;

import "./bridge/IPixelCons.sol";
import "./bridge/IERC721Receiver.sol";


//"OVM_L1CrossDomainMessenger": "0xbB5DD9c9e25497B4fED31337b150bdAfB50cc215",
//On L2, the OVM_L2CrossDomainMessenger is always at 0x4200000000000000000000000000000000000007 or resolve("OVM_L2CrossDomainMessenger")?




/**
 * @title Contract That Handles PixelCon Migrations to Optimistic Ethereum
 * @dev Includes batch operations for the existing PixelCons contract
 * @author PixelCons
 */
contract PixelConsMigrator is IERC721Receiver {
	address public _pixelconsContract;
	address public _pixelconsV2Contract;
	address public _l2CrossDomainMessenger;

    /**
     * @dev Contract constructor.
     */
    constructor(address pixelconsContract) {
		_pixelconsContract = pixelconsContract;
    }
	
    /**
     * @dev Helps create PixelCons in batch and migrate them all in one step
     */
	function createBatch(uint256[] calldata tokenIds) public returns (uint256) {
		uint256 startIndex = IPixelCons(_pixelconsContract).totalSupply();
		for (uint i = 0; i < tokenIds.length; i++)	{
			IPixelCons(_pixelconsContract).create(address(this), tokenIds[i], 0x0000000000000000);
		}
		//TODO: Do migration steps
		
		return startIndex;
	}
	
    /**
     * @dev Helps transfer PixelCons in batch and migrate them all in one step
     */
	function transferBatch(uint256[] memory tokenIds) public {
		for (uint i = 0; i < tokenIds.length; i++)	{
			IPixelCons(_pixelconsContract).transferFrom(msg.sender, address(this), tokenIds[i]);
		}
		//TODO: Do migration steps
		
	}
	
	//TODO: function to resend message for anything sent via unsafe transfer
	//function rescue(uint256[] memory tokenIds) public

    /**
     * @dev See {IERC721Receiver-onERC721Received}.
     *
     * Always returns `IERC721Receiver.onERC721Received.selector`.
     */
    function onERC721Received(address, address, uint256, bytes memory) public override returns (bytes4) {
		require(msg.sender == _pixelconsContract, "Can only receive from PixelCons");
		//TODO: Do migration steps
		
        return this.onERC721Received.selector;
    }
}
