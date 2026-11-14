// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.38;

import {IPixelCons} from "./interfaces/IPixelCons.sol";
import {Artwork} from "./libraries/Artwork.sol";
import {Text} from "./libraries/Text.sol";

/// @notice On-chain metadata and exact artwork for the existing PixelCons collection.
/// @dev ERC-6860 manual mode: /0x<64 hex digits>.json and /image/0x<64 hex digits>.svg.
contract PixelConsRenderer {
    error InvalidCollection();
    error InvalidWebsite();
    error InvalidToken();
    error ResourceNotFound();

    IPixelCons public immutable collection;
    string public siteBaseURL;

    struct Token {
        uint64 index;
        uint64 collectionIndex;
        address owner;
        address creator;
        bytes8 name;
        uint32 date;
    }

    constructor(IPixelCons collection_, string memory siteBaseURL_) {
        if (address(collection_).code.length == 0) revert InvalidCollection();
        bytes memory base = bytes(siteBaseURL_);
        bool https = base.length > 8 && keccak256(_prefix(base, 8)) == keccak256("https://");
        bool http = base.length > 7 && keccak256(_prefix(base, 7)) == keccak256("http://");
        if (!https && !http) revert InvalidWebsite();
        for (uint256 i; i < base.length; ++i) {
            uint8 c = uint8(base[i]);
            if (c <= 32 || c >= 127 || c == 34 || c == 92 || c == 35 || c == 63 || c == 60 || c == 62) {
                revert InvalidWebsite();
            }
        }
        uint256 length = base.length;
        while (base[length - 1] == "/") --length;
        if (length <= (https ? 8 : 7)) revert InvalidWebsite();
        assembly ("memory-safe") { mstore(base, length) }
        siteBaseURL = string(base);
        collection = collection_;
    }

    function resolveMode() external pure returns (bytes32) {
        return bytes32("manual");
    }

    /// @notice Suggested template for the existing collection's adminSetTokenURITemplate.
    /// @dev Reporting this value does not change the original collection.
    function tokenURITemplate() external view returns (string memory) {
        return string.concat(
            "web3://",
            Text.hexValue(uint160(address(this)), 20, true),
            ":",
            Text.decimal(block.chainid),
            "/<tokenId>.json"
        );
    }

    /// @notice Artwork can be previewed for any 256-bit ID, independently of minting.
    function image(bytes32 tokenId) public pure returns (string memory) {
        return Artwork.svg(tokenId);
    }

    /// @notice Metadata always reads the current minted token's data from the original collection.
    function metadata(bytes32 tokenId) public view returns (string memory) {
        Token memory token = _token(tokenId);
        string memory number = Text.decimal(token.index);
        string memory title = token.name == bytes8(0)
            ? string.concat("#", number)
            : string.concat("#", number, unicode" ", Text.escape(Text.unpad(token.name)));
        string memory description = string.concat("PixelCon #", number);
        if (token.collectionIndex != 0) {
            description = string.concat(description, " - Collection ", Text.decimal(token.collectionIndex));
            bytes memory name = Text.unpad(collection.getCollectionName(token.collectionIndex));
            if (name.length != 0) description = string.concat(description, " [", Text.escape(name), "]");
        }
        description = string.concat(description, " - Creator ", Text.hexValue(uint160(token.creator), 20, true));
        string memory picture = string.concat("data:image/svg+xml;base64,", Text.base64(bytes(image(tokenId))));
        string memory url = _externalURL(tokenId, token);
        return string.concat(
            '{"name":"',
            title,
            '","description":"',
            description,
            '","image":"',
            picture,
            '","image_url":"',
            picture,
            '","external_url":"',
            url,
            '","home_url":"',
            url,
            '","background_color":"000000","color":"000000"}'
        );
    }

    function externalURL(bytes32 tokenId) external view returns (string memory) {
        return _externalURL(tokenId, _token(tokenId));
    }

    // Solidity's bytes-returning fallback returns raw returndata. Encode the bytes
    // explicitly, as required by ERC-6860 manual-mode clients.
    fallback(bytes calldata resource) external returns (bytes memory) {
        if (resource.length == 72 && resource[0] == "/" && keccak256(resource[67:]) == keccak256(".json")) {
            return abi.encode(bytes(metadata(_parseId(resource, 1))));
        }
        if (
            resource.length == 77 && keccak256(resource[:7]) == keccak256("/image/")
                && keccak256(resource[73:]) == keccak256(".svg")
        ) {
            return abi.encode(bytes(image(_parseId(resource, 7))));
        }
        revert ResourceNotFound();
    }

    function _token(bytes32 tokenId) private view returns (Token memory token) {
        uint256 returned;
        (returned, token.index, token.collectionIndex, token.owner, token.creator, token.name, token.date) =
            collection.getTokenData(uint256(tokenId));
        if (returned != uint256(tokenId) || token.owner == address(0)) revert InvalidToken();
    }

    function _externalURL(bytes32 tokenId, Token memory token) private view returns (string memory) {
        string memory url = string.concat(
            siteBaseURL,
            "/#",
            Text.hexValue(uint256(tokenId), 32, true),
            "?index=",
            Text.decimal(token.index),
            "&date=",
            Text.decimal(token.date)
        );
        // Explicit zero bytes override a previously named token in the frozen archive.
        return string.concat(url, "&name=", Text.hexValue(uint64(token.name), 8, false));
    }

    function _parseId(bytes calldata resource, uint256 start) private pure returns (bytes32) {
        if (resource[start] != "0" || (resource[start + 1] != "x" && resource[start + 1] != "X")) {
            revert ResourceNotFound();
        }
        uint256 id;
        for (uint256 i = start + 2; i < start + 66; ++i) {
            uint256 c = uint8(resource[i]);
            uint256 nibble;
            if (c >= 48 && c <= 57) nibble = c - 48;
            else if (c >= 97 && c <= 102) nibble = c - 87;
            else if (c >= 65 && c <= 70) nibble = c - 55;
            else revert ResourceNotFound();
            id = (id << 4) | nibble;
        }
        return bytes32(id);
    }

    function _prefix(bytes memory data, uint256 length) private pure returns (bytes memory out) {
        out = new bytes(length);
        for (uint256 i; i < length; ++i) {
            out[i] = data[i];
        }
    }
}
