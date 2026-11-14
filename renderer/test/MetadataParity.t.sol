// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.38;

import {Test} from "forge-std/src/Test.sol";
import {stdJson} from "forge-std/src/StdJson.sol";
import {PixelConsRenderer} from "../src/PixelConsRenderer.sol";
import {MockPixelCons} from "./MockPixelCons.sol";

contract MetadataParityTest is Test {
    using stdJson for string;

    function testArchivedMetadataValues() public {
        string memory fixtures = vm.readFile("fixtures/metadata.json");
        MockPixelCons core = new MockPixelCons();
        PixelConsRenderer renderer = new PixelConsRenderer(core, "https://pixelcons.io");
        uint256 count = vm.parseJsonArrayLength(fixtures, ".cases");
        for (uint256 i; i < count; ++i) {
            string memory key = string.concat(".cases[", vm.toString(i), "]");
            bytes32 id = fixtures.readBytes32(string.concat(key, ".id"));
            core.set(
                id,
                uint64(fixtures.readUint(string.concat(key, ".index"))),
                uint64(fixtures.readUint(string.concat(key, ".collection"))),
                fixtures.readAddress(string.concat(key, ".creator")),
                bytes8(fixtures.readBytes(string.concat(key, ".rawName"))),
                uint32(fixtures.readUint(string.concat(key, ".date"))),
                bytes8(fixtures.readBytes(string.concat(key, ".collectionName")))
            );
            string memory output = renderer.metadata(id);
            string[6] memory fields = ["name", "description", "external_url", "home_url", "background_color", "color"];
            for (uint256 f; f < fields.length; ++f) {
                assertEq(
                    output.readString(string.concat(".", fields[f])),
                    fixtures.readString(string.concat(key, ".expected.", fields[f])),
                    string.concat(key, ".", fields[f])
                );
            }
            assertFalse(vm.keyExistsJson(output, ".attributes"), key);
        }
    }
}
