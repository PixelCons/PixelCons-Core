// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.38;

import {IPixelCons} from "../src/interfaces/IPixelCons.sol";

contract MockPixelCons is IPixelCons {
    struct Token {
        uint64 index;
        uint64 group;
        address creator;
        bytes8 name;
        uint32 created;
        bool exists;
    }
    mapping(uint256 => Token) internal tokens;
    mapping(uint64 => bytes8) internal names;
    uint256 public totalSupply;

    function set(bytes32 id, uint64 index, uint64 group, address creator, bytes8 name, uint32 created, bytes8 groupName)
        external
    {
        if (!tokens[uint256(id)].exists) ++totalSupply;
        tokens[uint256(id)] = Token(index, group, creator, name, created, true);
        names[group] = groupName;
    }

    function getTokenData(uint256 id)
        external
        view
        returns (uint256, uint64, uint64, address, address, bytes8, uint32)
    {
        Token memory token = tokens[id];
        require(token.exists, "not minted");
        return (id, token.index, token.group, address(this), token.creator, token.name, token.created);
    }

    function getCollectionName(uint64 group) external view returns (bytes8) {
        return names[group];
    }

    function tokenURI(uint256) external pure returns (string memory) {
        return "";
    }
}
