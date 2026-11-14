// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.38;

/// @notice ABI of the deployed Solidity 0.4.24 collection. No legacy compiler is needed to call it.
interface IPixelCons {
    function getTokenData(uint256 tokenId)
        external
        view
        returns (
            uint256 id,
            uint64 index,
            uint64 collectionIndex,
            address owner,
            address creator,
            bytes8 name,
            uint32 dateCreated
        );
    function getCollectionName(uint64 collectionIndex) external view returns (bytes8);
    function totalSupply() external view returns (uint256);
    function tokenURI(uint256 tokenId) external view returns (string memory);
}
