# PixelCons Ultra-Lite

A frozen, single-file website and an on-chain metadata renderer for PixelCons.

## Project

```text
site/index.html       Self-contained website
site.sha256           Frozen website checksum
renderer/src/         Solidity contracts
renderer/test/        Foundry tests
renderer/fixtures/    Reference metadata and artwork
renderer/script/      Deployment script
```

## Frozen website

The gallery contains PixelCons #0–#9,999 with creator and collection filters.
Detail pages support any 256-bit PixelCon ID, with optional index, date, and name.

## Renderer behavior

The renderer reads the Ethereum collection at
`0x5536b6aadd29eaf0db112bb28046a5fad3761bd4`.

- Metadata for minted tokens and artwork previews for any ID.
- Embedded SVG images with the original 16-color palette and 530×350 canvas.
- First 100, 2018 Genesis, and Collectible attributes.
- New York calendar dates and frozen-site links containing index, Unix timestamp,
  and the raw eight-byte name.

```text
web3://<renderer>:1/<token-id>.json
web3://<renderer>:1/image/<token-id>.svg
```
