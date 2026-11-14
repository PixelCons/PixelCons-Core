// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.38;

import {Text} from "./Text.sol";

library Artwork {
    // Exact values from the frozen image generator, including palette entries 6, A and B.
    bytes internal constant PALETTE =
        hex"0000001d2b537e2553008751ab52365f574fc2c3c3fff1e8ff004dffa300ffff2700e75629adff83769cff77a8ffccaa";

    function svg(bytes32 tokenId) internal pure returns (string memory) {
        bytes memory palette = PALETTE;
        bytes memory out = abi.encodePacked(
            '<svg xmlns="http://www.w3.org/2000/svg" width="530" height="350" viewBox="0 0 530 350" shape-rendering="crispEdges">',
            '<rect width="530" height="350" fill="#000000"/>'
        );
        // Each nibble is a pixel, most significant first. Merge equal horizontal pixels.
        for (uint256 row; row < 8; ++row) {
            uint256 column;
            while (column < 8) {
                uint256 color = _pixel(tokenId, row * 8 + column);
                uint256 end = column + 1;
                while (end < 8 && _pixel(tokenId, row * 8 + end) == color) ++end;
                if (color != 0) {
                    uint256 rgb = uint256(uint8(palette[color * 3])) << 16 | uint256(uint8(palette[color * 3 + 1])) << 8
                        | uint8(palette[color * 3 + 2]);
                    out = bytes.concat(
                        out,
                        abi.encodePacked(
                            '<rect x="',
                            Text.decimal(145 + column * 30),
                            '" y="',
                            Text.decimal(55 + row * 30),
                            '" width="',
                            Text.decimal((end - column) * 30),
                            '" height="30" fill="#',
                            Text.hexValue(rgb, 3, false),
                            '"/>'
                        )
                    );
                }
                column = end;
            }
        }
        return string(bytes.concat(out, "</svg>"));
    }

    function _pixel(bytes32 id, uint256 position) private pure returns (uint256) {
        return uint256(id) >> ((63 - position) * 4) & 15;
    }
}
