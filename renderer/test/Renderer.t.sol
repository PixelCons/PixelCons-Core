// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.38;

import {Test} from "forge-std/src/Test.sol";
import {stdJson} from "forge-std/src/StdJson.sol";
import {PixelConsRenderer} from "../src/PixelConsRenderer.sol";
import {IPixelCons} from "../src/interfaces/IPixelCons.sol";
import {Text} from "../src/libraries/Text.sol";
import {MockPixelCons} from "./MockPixelCons.sol";

contract RendererTest is Test {
    using stdJson for string;
    MockPixelCons internal core;
    PixelConsRenderer internal renderer;
    bytes32 internal constant SMILE = 0x9a999999990990999909909999999999907777099400004999477499999aa999;

    function setUp() public {
        core = new MockPixelCons();
        renderer = new PixelConsRenderer(core, "https://pixelcons.io/");
        core.set(SMILE, 0, 1, address(0x123), bytes8("Smile"), 1543779001, bytes8("Faces"));
    }

    function testManualMetadataPathMatchesDirectCall() public view {
        assertEq(renderer.resolveMode(), bytes32("manual"));
        (bool ok, bytes memory response) =
            address(renderer).staticcall(abi.encodePacked("/", vm.toString(SMILE), ".json"));
        assertTrue(ok);
        assertEq(string(abi.decode(response, (bytes))), renderer.metadata(SMILE));
    }

    function testManualImagePathAndUnmintedPreview() public view {
        bytes32 id = bytes32(type(uint256).max);
        (bool ok, bytes memory response) =
            address(renderer).staticcall(abi.encodePacked("/image/", vm.toString(id), ".svg"));
        assertTrue(ok);
        assertEq(string(abi.decode(response, (bytes))), renderer.image(id));
        assertTrue(bytes(renderer.image(bytes32(0))).length > 100);
    }

    function testUnknownResourcesFail() public view {
        bytes[6] memory paths = [
            bytes("/"),
            bytes("/details/1"),
            bytes("/1.json"),
            bytes("/0xgg.json"),
            bytes("/image/0x1.svg"),
            bytes("/../site/index.html")
        ];
        for (uint256 i; i < paths.length; ++i) {
            (bool ok,) = address(renderer).staticcall(paths[i]);
            assertFalse(ok);
        }
    }

    function testMissingMetadataReverts() public {
        vm.expectRevert("not minted");
        renderer.metadata(bytes32(uint256(999)));
    }

    function testConstructorsRejectInvalidConfiguration() public {
        vm.expectRevert(PixelConsRenderer.InvalidCollection.selector);
        new PixelConsRenderer(IPixelCons(address(0)), "https://pixelcons.io");
        string[6] memory urls =
            ["javascript:foo", "https://", "http://", "https://host?x=1", "https://host/#x", "https://host/\"oops"];
        for (uint256 i; i < urls.length; ++i) {
            vm.expectRevert(PixelConsRenderer.InvalidWebsite.selector);
            new PixelConsRenderer(core, urls[i]);
        }
    }

    function testSVGBackgroundAndAllColors() public view {
        string memory black = renderer.image(bytes32(0));
        assertEq(
            black,
            '<svg xmlns="http://www.w3.org/2000/svg" width="530" height="350" viewBox="0 0 530 350" shape-rendering="crispEdges"><rect width="530" height="350" fill="#000000"/></svg>'
        );
        string memory svg = renderer.image(bytes32(uint256(1)));
        assertTrue(_contains(svg, '<rect x="355" y="265" width="30" height="30" fill="#1d2b53"/>'));
        assertTrue(_contains(renderer.image(bytes32(type(uint256).max)), 'fill="#ffccaa"'));
    }

    function testMetadataReflectsCurrentNamesAndCollections() public {
        core.set(SMILE, 10000, 0, address(0x123), bytes8("Changed"), 1543779001, bytes8(0));
        string memory json = renderer.metadata(SMILE);
        assertEq(json.readString(".name"), unicode"#10000 Changed");
        assertEq(
            json.readString(".description"), "PixelCon #10000 - Creator 0x0000000000000000000000000000000000000123"
        );
        assertFalse(vm.keyExistsJson(json, ".attributes"));
        assertTrue(_contains(json.readString(".external_url"), "?index=10000&date=1543779001&name=4368616e67656400"));
    }

    function testTokenTemplateUsesActualChainAndAddress() public view {
        bytes memory uri = bytes(renderer.tokenURITemplate());
        assertEq(bytes7(uri), bytes7("web3://"));
        bytes memory addressText = new bytes(42);
        for (uint256 i; i < 42; ++i) {
            addressText[i] = uri[7 + i];
        }
        assertEq(vm.parseAddress(string(addressText)), address(renderer));
        assertTrue(_contains(string(uri), string.concat(":", vm.toString(block.chainid), "/<tokenId>.json")));
    }

    function testDeploymentBytecodeFitsMainnetLimit() public view {
        assertLt(address(renderer).code.length, 24576);
    }

    function testFrozenHTMLChecksum() public view {
        assertEq(
            sha256(vm.readFileBinary("../site/index.html")),
            hex"37700f83397058f7b7c5a2bcf0f1c060a5c7201c6d0006a3752493228837586c"
        );
    }

    function testFuzzMetadataIsValidAndPreservesRawName(
        bytes32 id,
        uint64 index,
        bytes8 name,
        uint32 date,
        bytes8 groupName
    ) public {
        core.set(id, index, 1, address(0x123), name, date, groupName);
        string memory json = renderer.metadata(id);
        vm.parseJson(json);
        assertFalse(vm.keyExistsJson(json, ".attributes"));
        string memory url = json.readString(".external_url");
        assertEq(url, renderer.externalURL(id));
        string memory prefix = string.concat(
            "https://pixelcons.io/#", vm.toString(id), "?index=", vm.toString(index), "&date=", vm.toString(date)
        );
        assertTrue(_contains(url, string.concat(prefix, "&name=")));
        bytes memory tail = new bytes(18);
        tail[0] = "0";
        tail[1] = "x";
        bytes memory data = bytes(url);
        for (uint256 i; i < 16; ++i) {
            tail[i + 2] = data[data.length - 16 + i];
        }
        assertEq(vm.parseBytes(string(tail)), abi.encodePacked(name));
        assertEq(json.readString(".image"), json.readString(".image_url"));
    }

    function testFuzzMalformedPathsNeverSucceed(bytes calldata path) public view {
        vm.assume(path.length < 71);
        // A short arbitrary path can happen to be a valid ABI call. Restrict to URL paths.
        (bool ok,) = address(renderer).staticcall(bytes.concat("/", path));
        assertFalse(ok);
    }

    function testWorstCaseRenderGas() public {
        bytes32 id = 0x123456789abcdef1123456789abcdef1123456789abcdef1123456789abcdef1;
        core.set(id, 100, 1, address(0x123), bytes8("Worst"), type(uint32).max, bytes8("Colors"));
        uint256 start = gasleft();
        string memory json = renderer.metadata(id);
        uint256 used = start - gasleft();
        assertGt(bytes(json).length, 1000);
        assertLt(used, 8_000_000);
        emit log_named_uint("Worst-case metadata gas", used);
    }

    function _contains(string memory value, string memory part) internal pure returns (bool) {
        bytes memory haystack = bytes(value);
        bytes memory needle = bytes(part);
        if (needle.length > haystack.length) return false;
        for (uint256 i; i + needle.length <= haystack.length; ++i) {
            bool equal = true;
            for (uint256 j; j < needle.length; ++j) {
                if (haystack[i + j] != needle[j]) {
                    equal = false;
                    break;
                }
            }
            if (equal) return true;
        }
        return false;
    }
}
