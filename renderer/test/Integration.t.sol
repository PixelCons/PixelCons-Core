// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.38;

import {Test} from "forge-std/Test.sol";
import {stdJson} from "forge-std/StdJson.sol";
import {PixelConsRenderer} from "../src/PixelConsRenderer.sol";
import {IPixelCons} from "../src/interfaces/IPixelCons.sol";
import {Text} from "../src/libraries/Text.sol";

interface ILegacyPixelCons is IPixelCons {
    function create(address to, uint256 id, bytes8 name) external payable returns (uint64);
    function rename(uint256 id, bytes8 name) external returns (uint64);
    function createCollection(uint64[] calldata indexes, bytes8 name) external returns (uint64);
    function adminSetTokenURITemplate(string calldata template) external;
    function getAdmin() external view returns (address);
}

contract IntegrationTest is Test {
    using stdJson for string;
    ILegacyPixelCons internal core;
    PixelConsRenderer internal renderer;
    bytes32 internal constant SMILE = 0x9a999999990990999909909999999999907777099400004999477499999aa999;

    function setUp() public {
        bytes memory creation = vm.parseBytes(vm.readFile("fixtures/PixelCons.creation.hex"));
        address deployed;
        assembly ("memory-safe") { deployed := create(0, add(creation, 32), mload(creation)) }
        require(deployed != address(0), "Legacy collection deployment failed");
        core = ILegacyPixelCons(deployed);
        renderer = new PixelConsRenderer(core, "https://pixelcons.io");
        vm.warp(1543779001);
        core.create(address(this), uint256(SMILE), bytes8("Smile"));
    }

    function testExistingSolidity0424CollectionABI() public {
        core.create(address(this), 1, bytes8("Second"));
        uint64[] memory indexes = new uint64[](2);
        indexes[0] = 0;
        indexes[1] = 1;
        core.createCollection(indexes, bytes8("Faces"));
        string memory output = renderer.metadata(SMILE);
        assertEq(output.readString(".name"), unicode"#0 Smile");
        assertEq(
            output.readString(".description"),
            string.concat(
                "PixelCon #0 - 02 Dec 2018 - Collection 1 [Faces] - Creator ",
                Text.hexValue(uint160(address(this)), 20, true)
            )
        );
        assertEq(vm.parseJsonArrayLength(output, ".attributes"), 3);
        assertEq(output.readString(".attributes[2].value"), "Collectible");
    }

    function testExistingTemplateExpandsIntoWeb3MetadataPath() public {
        core.adminSetTokenURITemplate(renderer.tokenURITemplate());
        string memory uri = core.tokenURI(uint256(SMILE));
        string memory prefix = string.concat(
            "web3://", Text.hexValue(uint160(address(renderer)), 20, true), ":", vm.toString(block.chainid)
        );
        assertEq(uri, string.concat(prefix, "/", vm.toString(SMILE), ".json"));
        (bool ok, bytes memory result) =
            address(renderer).staticcall(abi.encodePacked("/", vm.toString(SMILE), ".json"));
        assertTrue(ok);
        assertEq(string(abi.decode(result, (bytes))), renderer.metadata(SMILE));
    }

    function testRenamesOnExistingCollectionChangeMetadataAndURL() public {
        core.rename(uint256(SMILE), bytes8("NewName"));
        string memory output = renderer.metadata(SMILE);
        assertEq(output.readString(".name"), unicode"#0 NewName");
        assertEq(
            output.readString(".external_url"),
            string.concat(
                "https://pixelcons.io/#", vm.toString(SMILE), "?index=0&date=1543779001&name=4e65774e616d6500"
            )
        );
    }

    function testCollectionIsNotLimitedToFrozenGallery() public {
        // Indexes beyond 9,999 must render too. The deployed collection's public
        // index is storage-derived; the separate unit/parity suites cover 10,000+.
        bytes32 other = bytes32(type(uint256).max);
        core.create(address(this), uint256(other), bytes8("Other"));
        assertEq(renderer.metadata(other).readString(".name"), unicode"#1 Other");
    }

    function testClearedNameOverridesFrozenArchivedName() public {
        core.rename(uint256(SMILE), bytes8(0));
        string memory output = renderer.metadata(SMILE);
        assertEq(output.readString(".name"), "#0");
        assertEq(
            output.readString(".external_url"),
            string.concat(
                "https://pixelcons.io/#", vm.toString(SMILE), "?index=0&date=1543779001&name=0000000000000000"
            )
        );
    }

    function testUnmintedMetadataCannotBeInvented() public {
        vm.expectRevert();
        renderer.metadata(bytes32(uint256(17)));
    }
}

contract MainnetIntegrationTest is Test {
    using stdJson for string;

    function testPinnedMainnetCollectionAndTokenURITemplate() public {
        string memory rpc = vm.envOr("MAINNET_RPC_URL", string(""));
        vm.skip(bytes(rpc).length == 0, "Set MAINNET_RPC_URL to run the pinned fork integration");
        vm.createSelectFork(rpc, vm.envOr("MAINNET_FORK_BLOCK", uint256(26413732)));
        ILegacyPixelCons core = ILegacyPixelCons(0x5536B6aAdd29eAf0DB112Bb28046A5FaD3761bD4);
        PixelConsRenderer renderer = new PixelConsRenderer(core, "https://pixelcons.io");
        bytes32 id = 0x9a999999990990999909909999999999907777099400004999477499999aa999;
        string memory output = renderer.metadata(id);
        assertEq(output.readString(".name"), unicode"#0 Smile");
        assertEq(
            output.readString(".external_url"),
            string.concat("https://pixelcons.io/#", vm.toString(id), "?index=0&date=1543779001&name=536d696c65000000")
        );
        // This call changes only the local fork, never the live collection.
        string memory template = renderer.tokenURITemplate();
        address admin = core.getAdmin();
        vm.prank(admin);
        core.adminSetTokenURITemplate(template);
        assertEq(
            core.tokenURI(uint256(id)),
            string.concat(
                "web3://", Text.hexValue(uint160(address(renderer)), 20, true), ":1/", vm.toString(id), ".json"
            )
        );
        (bool ok, bytes memory response) = address(renderer).staticcall(abi.encodePacked("/", vm.toString(id), ".json"));
        assertTrue(ok);
        assertEq(string(abi.decode(response, (bytes))), output);
    }
}
