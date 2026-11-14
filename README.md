# PixelCons: frozen site and on-chain renderer

This branch contains the finished static website and a separate Foundry project.
There is no website build pipeline, archiver, Hardhat, Node.js, or npm dependency
in the active project.

```text
site/index.html              Frozen, self-contained website
site.sha256                  Checksum of the exact frozen bytes
renderer/foundry.toml        Pinned compiler and test configuration
renderer/src/                Renderer, original collection interface, encoding helpers
renderer/test/               Unit, fuzz, metadata, calendar, and integration tests
renderer/fixtures/           Saved metadata and reference artwork
renderer/script/Deploy.s.sol Deployment script
renderer/lib/forge-std/      Vendored testing helpers, with licenses and provenance
```

## Frozen website

Upload **only `site/index.html`** to the static host. It is 384,969 bytes and
includes its gallery data, artwork, styles, and JavaScript. It needs no supporting
files or Node.js server. Serve it as UTF-8 without rewriting the packed payload.
Keep the existing NFT metadata/image endpoints available until the renderer is
deployed and the collection administrator installs the new token URI template.
Freezing this HTML does not change the live collection's current URI template.

Verify the frozen file from the repository root:

```sh
sha256sum -c site.sha256
```

Its SHA-256 is:

```text
3332aef5e7b7da661cd76a28aaa7585ee7053b974855aa1b7b8c1ef091f92d2a
```

The gallery is the original snapshot of indexes 0–9,999. Other IDs can still be
drawn using `#<id>?index=<number>&date=<unix-seconds>&name=<16-name-hex-digits>`.
Creator and collection data inside the frozen gallery remain a snapshot; the
renderer reads current names and collections from the original contract.

For a local preview, Python's standard library is sufficient:

```sh
python3 -m http.server 3000 --bind 127.0.0.1 --directory site
```

## Renderer development

The project uses Foundry 1.9.0, Solidity 0.8.38, the Cancun EVM target, and
forge-std v1.17.0. Foundry is installed separately from this repository; the
vendored test library requires no package installation or submodule setup.

```sh
cd renderer
forge build
forge test
forge fmt --check
forge snapshot
forge test --gas-report
```

The default suite needs no RPC and skips the optional mainnet fork. It includes:

- Metadata parity with 108 saved cases covering the remaining traits, names,
  collections, calendar boundaries, and indexes beyond the frozen gallery.
- Fuzz tests for arbitrary token IDs, raw names, JSON validity, URL parameters,
  malformed resource paths, and Base64 against an independent encoder.
- Calendar comparisons with 1,458 IANA New York reference timestamps.
- Integration with the original Solidity 0.4.24 collection implementation using
  its saved creation bytecode, without a legacy compiler or JavaScript at test time.
- A checksum test that fails if the frozen HTML changes.

Run the pinned fork test with an Ethereum RPC that serves block **26,413,732**:

```sh
MAINNET_RPC_URL="$RPC_URL" forge test --match-contract MainnetIntegrationTest -vv
```

The test deploys a renderer and changes the token URI template **inside the local
fork only**. It sends no transaction to Ethereum.

## Renderer behavior

The original Ethereum collection is
`0x5536b6aadd29eaf0db112bb28046a5fad3761bd4`. Its compiler version does not constrain
the new renderer: `IPixelCons.sol` calls the existing ABI.

The renderer implements [ERC-6860 manual resolution](https://eips.ethereum.org/EIPS/eip-6860).
The supported paths are:

```text
web3://<renderer-address>:1/<0x-prefixed-64-digit-token-id>.json
web3://<renderer-address>:1/image/<0x-prefixed-64-digit-token-id>.svg
```

The JSON endpoint verifies the token exists by reading the collection's
`getTokenData`. It works for every minted token, including indexes above 9,999.
The SVG endpoint and `image(bytes32)` also support previews of arbitrary IDs.

Metadata preserves the existing name, description, collection/creator values,
background colors, and attribute order, with these intentional changes:

- `Unique` and derivative/similarity warnings are omitted.
- `First 100`, `2018 Genesis` (indexes below 651), and `Collectible` remain.
- `external_url` and `home_url` use the frozen site's hash route, with parameters
  in **index, date, name** order. Names are their original bytes8 as 16 hex digits,
  including all zeros when a name is cleared. This overrides an old name saved
  inside the frozen gallery.
- `image` and `image_url` contain the same self-contained Base64 SVG. Its 530×350
  canvas, centered 240×240 artwork, black padding, and exact 16-color palette match
  the original PNG output.

Descriptions retain **America/New_York calendar dates**, matching the existing
metadata. URL timestamps remain the original Unix seconds. Valid UTF-8 names are
preserved, JSON controls are escaped, and invalid UTF-8 bytes display as U+FFFD;
the URL always preserves the original name bytes exactly.
The frozen page retains its existing invalid-name notice for bytes that cannot
be decoded as UTF-8.

The collection address and website base are fixed when the renderer is deployed.
There are no renderer administrators, upgrade mechanisms, or setters.

## Deployment preparation

`Deploy.s.sol` defaults to the existing Ethereum collection and
`https://pixelcons.io`. Set `PIXELCONS_ADDRESS` or `PIXELCONS_SITE` for other
deployments. The website value is a directory/root URL, without a query or fragment.

Start with a simulation:

```sh
cd renderer
forge script script/Deploy.s.sol:Deploy --rpc-url "$RPC_URL"
```

An approved deployment can add `--broadcast` and the deployer's Foundry wallet
options. The script prints the deployed address and a suggested token URI template:

```text
web3://<renderer-address>:<chain-id>/<tokenId>.json
```

Installing that template on the original collection is a separate action by its
administrator. The deployment script does not call `adminSetTokenURITemplate`.
The original collection's live template has not been changed by this work.

## Independent artwork verification

`renderer/test/verify_artwork.py` uses only Python's standard library plus Cast.
It calls the actual renderer, decodes its metadata and SVG, and compares every
pixel with 11 original reference PNGs, including tokens #9,999, #10,000, and #11,751.
It also verifies the metadata aliases, embedded Base64 image, and frozen HTML hash.

```sh
cd renderer
python3 test/verify_artwork.py --rpc-url "$RPC_URL" --renderer "$RENDERER"
```

For a local Anvil deployment using `MockPixelCons`, `--mock "$MOCK"` loads the
saved fixture values. Fixture writes are restricted to a loopback RPC endpoint.

## Preserved source

Local Git checkpoint **`f81175b1`** preserves the complete website build sources
and archiver before this restructure. The previous working tree, including
generated artifacts and dependencies, was moved intact to
`../PixelCons-Core-legacy-2026-11-14/`. It is outside the active project.
