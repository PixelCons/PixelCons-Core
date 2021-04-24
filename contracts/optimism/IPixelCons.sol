// SPDX-License-Identifier: MIT

pragma solidity ^0.8.3;


/**
 * @dev PixelCons Core Interface
 * @author PixelCons
 */
interface IPixelCons {

	////////////////// PixelCon Admin //////////////////

	/**
	 * @notice Get the current admin
	 */
	function getAdmin() external view returns(address);

	/**
	 * @notice Withdraw all volunteered funds to `(_to)`
	 */
	function adminWithdraw(address to) external;

	/**
	 * @notice Change the admin to `(_to)`
	 */
	function adminChange(address newAdmin) external;

	/**
	 * @notice Change the token URI template
	 */
	function adminSetTokenURITemplate(string memory newTokenURITemplate) external;

	////////////////// PixelCon Tokens //////////////////

	/**
	 * @notice Create PixelCon `(_tokenId)`
	 */
	function create(address to, uint256 tokenId, bytes8 _name) external payable returns(uint64);

	/**
	 * @notice Rename PixelCon `(_tokenId)`
	 */
	function rename(uint256 tokenId, bytes8 _name) external returns(uint64);

	/**
	 * @notice Check if PixelCon `(_tokenId)` exists
	 */
	function exists(uint256 tokenId) external view returns(bool);

	/**
	 * @notice Get the creator of PixelCon `(_tokenId)`
	 */
	function creatorOf(uint256 tokenId) external view returns(address);

	/**
	 * @notice Get the total number of PixelCons created by `(_creator)`
	 */
	function creatorTotal(address creator) external view returns(uint256);

	/**
	 * @notice Enumerate PixelCon created by `(_creator)`
	 */
	function tokenOfCreatorByIndex(address creator, uint256 index) external view returns(uint256);

	/**
	 * @notice Get all details of PixelCon `(_tokenId)`
	 */
	function getTokenData(uint256 tokenId) external view
		returns(uint256 tknId, uint64 tknIdx, uint64 collectionIdx, address owner, address creator, bytes8 _name, uint32 dateCreated);

	/**
	 * @notice Get all details of PixelCon #`(_tokenIndex)`
	 */
	function getTokenDataByIndex(uint64 tokenIndex) external view
		returns(uint256 tknId, uint64 tknIdx, uint64 collectionIdx, address owner, address creator, bytes8 _name, uint32 dateCreated);

	/**
	 * @notice Get the index of PixelCon `(_tokenId)`
	 */
	function getTokenIndex(uint256 tokenId) external view returns(uint64);

	////////////////// Collections //////////////////

	/**
	 * @notice Create PixelCon collection
	 */
	function createCollection(uint64[] memory tokenIndexes, bytes8 _name) external returns(uint64);

	/**
	 * @notice Rename collection #`(_collectionIndex)`
	 */
	function renameCollection(uint64 collectionIndex, bytes8 _name) external returns(uint64);

	/**
	 * @notice Clear collection #`(_collectionIndex)`
	 */
	function clearCollection(uint64 collectionIndex) external returns(uint64);

	/**
	 * @notice Check if collection #`(_collectionIndex)` exists
	 */
	function collectionExists(uint64 collectionIndex) external view returns(bool);

	/**
	 * @notice Check if collection #`(_collectionIndex)` has been cleared
	 */
	function collectionCleared(uint64 collectionIndex) external view returns(bool);

	/**
	 * @notice Get the total number of collections
	 */
	function totalCollections() external view returns(uint256);

	/**
	 * @notice Get the collection index of PixelCon `(_tokenId)`
	 */
	function collectionOf(uint256 tokenId) external view returns(uint256);

	/**
	 * @notice Get the total number of PixelCons in collection #`(_collectionIndex)`
	 */
	function collectionTotal(uint64 collectionIndex) external view returns(uint256);

	/**
	 * @notice Get the name of collection #`(_collectionIndex)`
	 */
	function getCollectionName(uint64 collectionIndex) external view returns(bytes8);

	/**
	 * @notice Enumerate PixelCon in collection #`(_collectionIndex)`
	 */
	function tokenOfCollectionByIndex(uint64 collectionIndex, uint256 index) external view returns(uint256);

	////////////////// ERC-165 //////////////////
	
    /**
     * @dev Returns true if this contract implements the interface defined
     */
    function supportsInterface(bytes4 interfaceId) external view returns (bool);

	////////////////// ERC-721 //////////////////
	
    /**
     * @dev Returns the number of tokens in ``owner``'s account
     */
    function balanceOf(address owner) external view returns (uint256 balance);

    /**
     * @dev Returns the owner of the `tokenId` token
     */
    function ownerOf(uint256 tokenId) external view returns (address owner);

    /**
     * @dev Safely transfers `tokenId` token from `from` to `to`, checking first that contract recipients
     */
    function safeTransferFrom(address from, address to, uint256 tokenId) external;

    /**
     * @dev Transfers `tokenId` token from `from` to `to`
     */
    function transferFrom(address from, address to, uint256 tokenId) external;

    /**
     * @dev Gives permission to `to` to transfer `tokenId` token to another account
     */
    function approve(address to, uint256 tokenId) external;

    /**
     * @dev Returns the account approved for `tokenId` token
     */
    function getApproved(uint256 tokenId) external view returns (address operator);

    /**
     * @dev Approve or remove `operator` as an operator for the caller
     */
    function setApprovalForAll(address operator, bool approved) external;

    /**
     * @dev Returns if the `operator` is allowed to manage all of the assets of `owner`
     */
    function isApprovedForAll(address owner, address operator) external view returns (bool);

    /**
      * @dev Safely transfers `tokenId` token from `from` to `to`
      */
    function safeTransferFrom(address from, address to, uint256 tokenId, bytes calldata data) external;
	
	////////////////// ERC-721 Metadata //////////////////
	
    /**
     * @dev Returns the token collection name.
     */
    function name() external view returns (string memory);

    /**
     * @dev Returns the token collection symbol.
     */
    function symbol() external view returns (string memory);

    /**
     * @dev Returns the Uniform Resource Identifier (URI) for `tokenId` token.
     */
    function tokenURI(uint256 tokenId) external view returns (string memory);
	
	////////////////// ERC-721 Enumeration //////////////////
	
    /**
     * @dev Returns the total amount of tokens stored by the contract.
     */
    function totalSupply() external view returns (uint256);

    /**
     * @dev Returns a token ID owned by `owner` at a given `index` of its token list.
     * Use along with {balanceOf} to enumerate all of ``owner``'s tokens.
     */
    function tokenOfOwnerByIndex(address owner, uint256 index) external view returns (uint256 tokenId);

    /**
     * @dev Returns a token ID at a given `index` of all the tokens stored by the contract.
     * Use along with {totalSupply} to enumerate all tokens.
     */
    function tokenByIndex(uint256 index) external view returns (uint256);
	
}
