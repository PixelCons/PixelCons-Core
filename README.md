# PixelCons-Core
Collectible Minimalist Pixel Art Tokens Secured on the Ethereum Blockchain! This is the whole source code including the website/app, solidity contracts, 
and test scripts. The app is currently being hosted on the web at https://pixelcons.io/

For a breakdown of the contract code, check out the flattened contract repo [here](https://github.com/PixelCons/PixelCons-Contracts)

## Ultra-lite: one-file website

On `ultra-lite`, the default website build is a self-contained **`out/index.html`**.
It includes the CSS, JavaScript, images, and browsing data. Upload just that file
to any static web host, or open it directly from disk. There are no runtime RPC
calls, image endpoints, CDN dependencies, or supporting files to host.

Use Node.js 22 or later and install the build dependencies once:

```sh
npm ci
npm run build
npm run test:static
npm start
```

The preview runs at http://127.0.0.1:3000. `npm run dev` builds and starts the
same preview; after changing the source, rebuild and refresh it. Set `PORT` to
use another port.

- The gallery includes exactly #0–#9,999, with the original collection and
  creator filters and a link to the full collection on OpenSea. Filters are
  opened from detail-page links and displayed as individually removable chips;
  no filter controls are shown when browsing without an active filter.
  The “View the rest on OpenSea” link is shown for the unfiltered gallery and
  creator-only filters, and omitted whenever a collection filter is active.
- Any full 256-bit PixelCon ID can be rendered, including IDs outside the
  bundled gallery. The 8×8 artwork uses the existing app's exact palette.
- About and the existing Terms of Use are included in the HTML as hash routes.
- Detail URLs use
  `#<0x-prefixed-token-id>?index=<token-number>&date=<unix-seconds>&name=<16-hex-digit-bytes8>`.
  `name` is optional; an optional `0x` prefix on the name bytes is accepted.
  UTF-8 is decoded after removing trailing zero padding. Supplied names are
  displayed as plain text. Malformed names produce a notice, not an exception.
  `index` is the zero-based token number (not the token ID); `date` is the
  creation timestamp in seconds. Decimal numbers are generated; `0x`-prefixed
  hexadecimal numbers are also accepted. Invalid numeric values are ignored.
  All three parameters are optional, so existing name-only links still work.
- Bundled tokens can show their archived index, date, collection, and creator.
  Other IDs show their artwork and supplied name, number, and date. The existing
  OpenSea link in the header points to the token; no extra detail-page button is needed.
  A valid ID by itself does not verify that the token has been minted.
- Uniqueness and derivative labels/warnings are omitted. Generated NFT metadata
  retains First 100, 2018 Genesis, and Collectible, where applicable.

For example, the first PixelCon can be opened with:

```text
https://pixelcons.io/#0x9a999999990990999909909999999999907777099400004999477499999aa999?index=0&date=1543779001&name=536d696c65000000
```

The build in `scripts/build-static.mjs` bundles the original `src/` React
components and SCSS. The adapters in `static/` replace Next.js routing, page
data, and image optimization with hash routing and embedded assets. The original
layouts, icons, typography, breakpoints, and CSS transitions are reused directly.
The browser build uses small Preact core/hooks adapters for those components.
The default stores artwork as shared templates with per-token color palettes.
The browser restores every ID and draws one lossless atlas, then uses the same
CSS cropping approach as lite. This avoids storing IDs and artwork twice.
Creator dictionaries, sparse fields, and date deltas compact the remaining data;
numeric columns and creator addresses are stored directly as binary records.
Other images are stored once as binary records and restored as local Blob URLs. Stronger
build-time gzip compression and an HTML-safe UTF-8 byte encoding reduce the outer
file. The packed HTML expands through the browser's native gzip decompressor,
with no extra downloads. A current browser supporting
`DecompressionStream` is required for the packed edition.
Serve the file as UTF-8 and preserve its payload when uploading it. The Base64
variant below is available for hosts or tools that rewrite HTML text.
The gallery initially mounts 500 entries, then fills in the rest in batches of
1,500. Returning to a scrolled gallery mounts the whole list immediately so
history restoration keeps its original behavior. No data is fetched while filling
the gallery; all 10,000 records are already in the file.

Build variants for comparisons or compatibility:

```sh
STATIC_PACK=0 npm run build                         # Unpacked HTML
STATIC_ARCHIVE=columns npm run build                # Store IDs instead of recovering them from sheets
STATIC_RUNTIME=react npm run build                  # Original React runtime
STATIC_TEXT_ENCODING=base64 npm run build           # ASCII-only outer payload
STATIC_COMPRESSION=fast npm run build               # Faster, larger gzip build
STATIC_ASSET_ENVELOPE=0 npm run build               # Keep images as data URIs
STATIC_PRUNE=0 npm run build                        # Retain unused module CSS
STATIC_PATTERN=0 npm run build                      # Store the atlas as lossless WebP
STATIC_PATTERN=0 STATIC_ATLAS=0 npm run build        # Retain ten native image sheets
STATIC_METADATA_BINARY=0 npm run build              # Keep Base64 metadata columns
STATIC_PROGRESSIVE=0 npm run build                  # Mount the entire gallery at once
STATIC_PROGRESSIVE=visibility npm run build         # Let CSS defer offscreen rendering
```

The first ten measured optimization ideas reduced 2,196,752 bytes to 512,494 bytes
(76.7% smaller). Nine paired offline
Chrome runs measured median first decoded artwork at 432 → 449 ms normally and
1,826 → 1,850 ms with 4× CPU throttling. These are local measurements, not a
guarantee for every device. Initial contentful paint changed from 316 → 340 ms
normally and 1,324 → 1,436 ms under throttling. Native canvas encoding replaces
the browser PNG encoder dependency; the Node archiver keeps its original PNG API.

The next ten ideas reduce 512,494 bytes to 395,067 bytes (another 22.9%, or 82.0%
below the original). Static About/Terms snapshots were rejected because they
increased size and changed rendering; the original components remain in use.
Nine paired offline Chrome runs measured median first decoded artwork at
464 → 450 ms normally and 1,839 → 1,786 ms with 4× CPU throttling. Median initial
contentful paint was 352 → 352 ms and 1,412 → 1,392 ms respectively. All 45 visual
comparisons match lite, and offline checks pass in Chrome and Firefox.

The following four experiments combine binary metadata, one atlas, shared art
templates, and progressive rendering into a 384,969-byte file (another 2.6%
smaller). Row dictionaries and mirrored/rotated templates were also tested;
palette-normalized templates sorted by pattern produced the smallest artwork.
All 640,000 displayed pixels match the original PNG sheets exactly, and all 45
visual comparisons still match lite. Offline checks include leaving during a
batch and returning from detail pages to the bottom of the gallery.
Nine paired offline Chrome runs measured median first artwork at 437 → 139 ms
normally and 1,766 → 533 ms with 4× CPU throttling. Initial contentful paint was
344 → 128 ms and 1,380 → 468 ms respectively. Total browser task time fell about
6% normally and 4% under throttling. All 10,000 gallery links were mounted after
443 ms normally and 1,687 ms under throttling; the initial view appears earlier.

The experiment ledgers and raw measurements are in `artifacts/optimization/`
and `artifacts/optimization-r2/`; the four subsequent experiments and timing
measurements are in `artifacts/optimization-r3/`.
To compare any two saved HTML versions with the same first-art test:

```sh
node scripts/benchmark-static.mjs --iterations 9 --cpu 4 old.html out/index.html
```

The build reads the checked-in archive; it does not run the archiver or modify
the files in `public/meta/`. Those existing JSON/PNG files are **not** part of the
single-file output. Future archiver runs omit the Unique trait and similarity
warnings from generated metadata and use the compact ID/name/number/date hash links for
`external_url` and `home_url`.

With the original `lite` site running at http://localhost:3001/, run:

```sh
npm run test:parity
```

This compares screenshots and gallery geometry at four viewport widths plus a
retina display, checks
collection hover animations, and tests offline navigation from `out/index.html`.
The reference gallery is truncated to 10,000 items for comparison. Only the
requested OpenSea additions and the Next.js development badge are hidden from
screenshots. Screenshots and results are written to
`artifacts/static-parity/`. Set `LITE_URL` for a different reference URL and
`CHROME_PATH` for a different Chrome executable; otherwise the test uses installed
Google Chrome or Playwright's Chromium (`npx playwright install chromium`).

The on-chain renderer and a collection tokenURI change are separate work and
have not been implemented or deployed here. This build does not replace NFT
metadata hosting by itself. Hash detail URLs share the main page's static
metadata, so they do not provide individual server-rendered social previews.

The previous Next.js app is retained through `dev:next`, `build:next`, and
`start:next`. Its setup is documented below.

## Previous Next.js app: setup and run
Please follow these steps if you wish to run the PixelCons app locally or wish to run the tests

#### 1. Clone the core repo
Clone the PixelCons-Core repo by downloading the zip from GitHub and extracting it or by running the following GIT command
```
git clone https://github.com/PixelCons/PixelCons-Core.git
```

#### 2. Set environment variables
By default, the app will attempt to use the ethers default mainnet provider which is often slow and unreliable. To improve performance you can provide your own JSON RPC endpoint via an environment variable. This JSON RPC endpoint is used by the archiver, server backend, and deploy scripts. You can set the `JSON_RPC` environment variable directly or create a `.env` file like below 
```
JSON_RPC=https://mainnet.infura.io/v3/[api_key]
```

#### 3. Run install and build
Run the following commands at the cloned PixelCons-Core directory to install dependencies and build the app (Make sure you have [Node.js](https://nodejs.org) installed)
```
npm install
npm run archive
npm run build:next
```

#### 4. Start web server
By default, the app is already configured to point to mainnet. Start the webapp by running the following command which will host it at [http://localhost:3000](http://localhost:3000)
```
npm run start:next
```

## Run the Tests
The PixelCons core project contains test scripts for verifying application integrity. Please follow these steps if you wish to run the tests yourself

#### 1. Run install and compile
Make sure you have all the dependancies installed and have compiled the contracts by running the following commands (Make sure you have [Node.js](https://nodejs.org) installed)
```
npm install
npm run compile
```

#### 2. Run the test script
Run the following command to start running the tests (uses hardhat in the background)
```
npm run test
```

## Run with testnet
The PixelCons core project can be configured to point to networks other than Ethereum mainnet for testing

#### Run local ethereum testnet
You can optionally spin up your own node as a test environment with the following command
```
npm run node
```

#### Deploy the contracts
You can use the deploy script to deploy the PixelCons contract to your local testnet by default
```
npm run deploy
```
You can reference the npm `deploy` script command to learn how to use the deploy script for other testnets

#### Configuration
There are a few optional build configuration settings that can be used to tweak the app found at the bottom of [src/build.config.ts](/src/build.config.ts). The main items that need to be configured to point to a custom network are
```
OVERRIDE_JSON_RPC - set to "http://localhost:8545/" for local network
OVERRIDE_CHAIN_ID - set to "31337" for local network
OVERRIDE_PIXELCONS_CONTRACT_ADDRESS - set to deployed contract address reported in the deploy script
```
