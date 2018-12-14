pragma solidity ^0.4.24;


/**
 * @title ERC721 Non-Fungible Token Standard Basic Interface
 * @dev Based on openzepplin open source ERC721 examples.
 * See (https://github.com/OpenZeppelin/openzeppelin-solidity)
 */
contract ERC721 {

	/**
	 * @dev 0x01ffc9a7 === 
	 *   bytes4(keccak256('supportsInterface(bytes4)'))
	 */
	bytes4 public constant InterfaceId_ERC165 = 0x01ffc9a7;

	/**
	 * @dev 0x80ac58cd ===
	 *   bytes4(keccak256('balanceOf(address)')) ^
	 *   bytes4(keccak256('ownerOf(uint256)')) ^
	 *   bytes4(keccak256('approve(address,uint256)')) ^
	 *   bytes4(keccak256('getApproved(uint256)')) ^
	 *   bytes4(keccak256('setApprovalForAll(address,bool)')) ^
	 *   bytes4(keccak256('isApprovedForAll(address,address)')) ^
	 *   bytes4(keccak256('transferFrom(address,address,uint256)')) ^
	 *   bytes4(keccak256('safeTransferFrom(address,address,uint256)')) ^
	 *   bytes4(keccak256('safeTransferFrom(address,address,uint256,bytes)'))
	 */
	bytes4 internal constant InterfaceId_ERC721 = 0x80ac58cd;

	/**
	 * @dev 0x780e9d63 ===
	 *   bytes4(keccak256('totalSupply()')) ^
	 *   bytes4(keccak256('tokenOfOwnerByIndex(address,uint256)')) ^
	 *   bytes4(keccak256('tokenByIndex(uint256)'))
	 */
	bytes4 internal constant InterfaceId_ERC721Enumerable = 0x780e9d63;

	/**
	 * @dev 0x5b5e139f ===
	 *   bytes4(keccak256('name()')) ^
	 *   bytes4(keccak256('symbol()')) ^
	 *   bytes4(keccak256('tokenURI(uint256)'))
	 */
	bytes4 internal constant InterfaceId_ERC721Metadata = 0x5b5e139f;

	/** @dev A mapping of interface id to whether or not it is supported */
	mapping(bytes4 => bool) internal supportedInterfaces;

	/** @dev Token events */
	event Transfer(address indexed _from, address indexed _to, uint256 indexed _tokenId);
	event Approval(address indexed _owner, address indexed _approved, uint256 indexed _tokenId);
	event ApprovalForAll(address indexed _owner, address indexed _operator, bool _approved);

	/** @dev Registers ERC-165, ERC-721, ERC-721 Enumerable and ERC-721 Metadata as supported interfaces */
	constructor() public
	{
		registerInterface(InterfaceId_ERC165);
		registerInterface(InterfaceId_ERC721);
		registerInterface(InterfaceId_ERC721Enumerable);
		registerInterface(InterfaceId_ERC721Metadata);
	}

	/** @dev Internal function for registering an interface */
	function registerInterface(bytes4 _interfaceId) internal
	{
		require(_interfaceId != 0xffffffff);
		supportedInterfaces[_interfaceId] = true;
	}

	/** @dev ERC-165 interface implementation */
	function supportsInterface(bytes4 _interfaceId) external view returns(bool)
	{
		return supportedInterfaces[_interfaceId];
	}

	/** @dev ERC-721 interface */
	function balanceOf(address _owner) public view returns(uint256 _balance);
	function ownerOf(uint256 _tokenId) public view returns(address _owner);
	function approve(address _to, uint256 _tokenId) public;
	function getApproved(uint256 _tokenId) public view returns(address _operator);
	function setApprovalForAll(address _operator, bool _approved) public;
	function isApprovedForAll(address _owner, address _operator) public view returns(bool);
	function transferFrom(address _from, address _to, uint256 _tokenId) public;
	function safeTransferFrom(address _from, address _to, uint256 _tokenId) public;
	function safeTransferFrom(address _from, address _to, uint256 _tokenId, bytes _data) public;

	/** @dev ERC-721 Enumerable interface */
	function totalSupply() public view returns(uint256 _total);
	function tokenByIndex(uint256 _index) public view returns(uint256 _tokenId);
	function tokenOfOwnerByIndex(address _owner, uint256 _index) public view returns(uint256 _tokenId);

	/** @dev ERC-721 Metadata interface */
	function name() public view returns(string _name);
	function symbol() public view returns(string _symbol);
	function tokenURI(uint256 _tokenId) public view returns(string);
}
