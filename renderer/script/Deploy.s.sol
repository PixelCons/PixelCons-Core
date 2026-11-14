// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.38;

import {Script} from "forge-std/src/Script.sol";
import {console2} from "forge-std/src/console2.sol";
import {PixelConsRenderer} from "../src/PixelConsRenderer.sol";
import {IPixelCons} from "../src/interfaces/IPixelCons.sol";

contract Deploy is Script {
    function run() external returns (PixelConsRenderer renderer) {
        address source = vm.envOr("PIXELCONS_ADDRESS", address(0x5536B6aAdd29eAf0DB112Bb28046A5FaD3761bD4));
        string memory website = vm.envOr("PIXELCONS_SITE", string("https://pixelcons.io"));
        require(source.code.length != 0, "Collection has no code on this chain");
        vm.startBroadcast();
        renderer = new PixelConsRenderer(IPixelCons(source), website);
        vm.stopBroadcast();
        console2.log("Renderer:", address(renderer));
        console2.log("Suggested token URI template:");
        console2.log(renderer.tokenURITemplate());
    }
}
