pragma solidity ^0.4.24;


/**
 * @title Ownable
 * @dev This contract gives special permissions to the contract creator
 * @author PixelCons
 */
contract Ownable {

	/** @dev Owner user */
	address public owner;

	/** @dev Requires caller be the owner */
	modifier onlyOwner {
		require(msg.sender == owner, "Only owner can call this function.");
		_;
	}

	/** @dev The Ownable constructor sets the 'owner' to 'msg.sender' */
	constructor() public
	{
		owner = msg.sender;
	}

	/** @dev Calls 'selfdestruct' and transfers any funds to the owner */
	function close() public onlyOwner
	{
		selfdestruct(owner);
	}
}
