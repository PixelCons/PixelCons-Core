// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.38;

import {Test} from "forge-std/src/Test.sol";
import {Text} from "../src/libraries/Text.sol";

contract EncodingTest is Test {
    function testRFC4648Base64Vectors() public pure {
        assertEq(Text.base64(""), "");
        assertEq(Text.base64("f"), "Zg==");
        assertEq(Text.base64("fo"), "Zm8=");
        assertEq(Text.base64("foo"), "Zm9v");
        assertEq(Text.base64("foob"), "Zm9vYg==");
        assertEq(Text.base64("foobar"), "Zm9vYmFy");
    }

    function testFuzzBase64MatchesIndependentEncoder(bytes memory data) public pure {
        vm.assume(data.length <= 4096);
        assertEq(Text.base64(data), vm.toBase64(data));
    }

    function testJSONControlsUnicodeAndInvalidUTF8() public pure {
        assertEq(Text.escape(bytes("\"\\\n\x00")), '\\"\\\\\\u000a\\u0000');
        assertEq(Text.escape(bytes(unicode"é😀")), unicode"é😀");
        assertEq(Text.escape(hex"ffc080eda080f4908080"), unicode"����������");
        assertEq(Text.unpad(hex"4100420000000000"), hex"410042");
    }
}
