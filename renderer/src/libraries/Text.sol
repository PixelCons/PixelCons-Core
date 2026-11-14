// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.38;

library Text {
    bytes16 internal constant HEX = "0123456789abcdef";
    bytes internal constant BASE64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

    function decimal(uint256 value) internal pure returns (string memory) {
        if (value == 0) return "0";
        uint256 remaining = value;
        uint256 digits;
        while (remaining != 0) {
            ++digits;
            remaining /= 10;
        }
        bytes memory out = new bytes(digits);
        while (value != 0) {
            out[--digits] = bytes1(uint8(48 + value % 10));
            value /= 10;
        }
        return string(out);
    }

    function hexValue(uint256 value, uint256 byteLength, bool prefix) internal pure returns (string memory) {
        uint256 start = prefix ? 2 : 0;
        bytes memory out = new bytes(start + byteLength * 2);
        if (prefix) {
            out[0] = "0";
            out[1] = "x";
        }
        for (uint256 i = out.length; i > start;) {
            out[--i] = HEX[value & 15];
            value >>= 4;
        }
        return string(out);
    }

    function unpad(bytes8 value) internal pure returns (bytes memory out) {
        uint256 length = 8;
        while (length != 0 && value[length - 1] == 0) --length;
        out = new bytes(length);
        for (uint256 i; i < length; ++i) {
            out[i] = value[i];
        }
    }

    /// @dev Escape JSON controls, preserve valid UTF-8, replace malformed sequences with U+FFFD.
    function escape(bytes memory data) internal pure returns (string memory) {
        bytes memory out = new bytes(data.length * 6);
        uint256 cursor;
        for (uint256 i; i < data.length;) {
            uint8 c = uint8(data[i]);
            if (c == 34 || c == 92) {
                out[cursor++] = "\\";
                out[cursor++] = data[i++];
            } else if (c < 32) {
                out[cursor++] = "\\";
                out[cursor++] = "u";
                out[cursor++] = "0";
                out[cursor++] = "0";
                out[cursor++] = HEX[c >> 4];
                out[cursor++] = HEX[c & 15];
                ++i;
            } else if (c < 128) {
                out[cursor++] = data[i++];
            } else {
                uint256 length = _utf8Length(data, i);
                if (length == 0) {
                    out[cursor++] = 0xef;
                    out[cursor++] = 0xbf;
                    out[cursor++] = 0xbd;
                    ++i;
                } else {
                    for (uint256 end = i + length; i < end; ++i) {
                        out[cursor++] = data[i];
                    }
                }
            }
        }
        assembly ("memory-safe") { mstore(out, cursor) }
        return string(out);
    }

    function _utf8Length(bytes memory data, uint256 i) private pure returns (uint256 length) {
        uint8 c = uint8(data[i]);
        if (c >= 0xc2 && c <= 0xdf) length = 2;
        else if (c >= 0xe0 && c <= 0xef) length = 3;
        else if (c >= 0xf0 && c <= 0xf4) length = 4;
        else return 0;
        if (i + length > data.length) return 0;
        uint8 second = uint8(data[i + 1]);
        if (
            c == 0xe0 && second < 0xa0 || c == 0xed && second >= 0xa0 || c == 0xf0 && second < 0x90 || c == 0xf4
                && second >= 0x90
        ) return 0;
        for (uint256 j = 1; j < length; ++j) {
            uint8 next = uint8(data[i + j]);
            if (next < 0x80 || next > 0xbf) return 0;
        }
    }

    function base64(bytes memory data) internal pure returns (string memory) {
        bytes memory table = BASE64;
        bytes memory out = new bytes(4 * ((data.length + 2) / 3));
        uint256 cursor;
        for (uint256 i; i < data.length; i += 3) {
            uint256 word = uint256(uint8(data[i])) << 16;
            if (i + 1 < data.length) word |= uint256(uint8(data[i + 1])) << 8;
            if (i + 2 < data.length) word |= uint8(data[i + 2]);
            out[cursor++] = table[(word >> 18) & 63];
            out[cursor++] = table[(word >> 12) & 63];
            out[cursor++] = i + 1 < data.length ? table[(word >> 6) & 63] : bytes1("=");
            out[cursor++] = i + 2 < data.length ? table[word & 63] : bytes1("=");
        }
        return string(out);
    }
}
