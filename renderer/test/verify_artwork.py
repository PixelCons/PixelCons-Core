#!/usr/bin/env python3
"""Compare live local renderer output with original PNGs using only Python's standard library.

An optional --mock address loads fixtures into our local MockPixelCons contract.
Without --mock this script only makes read-only RPC calls.
"""
import argparse
import base64
import hashlib
import json
from pathlib import Path
import struct
import subprocess
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
import zlib

ROOT = Path(__file__).resolve().parents[1]


def png_pixels(path):
    data = path.read_bytes()
    assert data[:8] == b"\x89PNG\r\n\x1a\n"
    offset, compressed, palette, alpha = 8, bytearray(), b"", b""
    while offset < len(data):
        length = struct.unpack_from(">I", data, offset)[0]
        kind, body = data[offset + 4:offset + 8], data[offset + 8:offset + 8 + length]
        if kind == b"IHDR":
            width, height, depth, color, compression, filtering, interlace = struct.unpack(">IIBBBBB", body)
        elif kind == b"PLTE":
            palette = body
        elif kind == b"tRNS":
            alpha = body
        elif kind == b"IDAT":
            compressed.extend(body)
        offset += length + 12
    assert interlace == 0 and compression == filtering == 0
    channels = {0: 1, 2: 3, 3: 1, 4: 2, 6: 4}[color]
    assert depth in (1, 2, 4, 8) and (depth == 8 or color in (0, 3))
    stride = (width * channels * depth + 7) // 8
    bpp = max(1, (channels * depth + 7) // 8)
    source, cursor, previous = zlib.decompress(compressed), 0, bytearray(stride)
    pixels = bytearray()
    for _ in range(height):
        filter_type = source[cursor]
        cursor += 1
        row = bytearray(source[cursor:cursor + stride])
        cursor += stride
        for i in range(stride):
            left, up = (row[i - bpp] if i >= bpp else 0), previous[i]
            upper_left = previous[i - bpp] if i >= bpp else 0
            if filter_type == 0:
                predictor = 0
            elif filter_type == 1:
                predictor = left
            elif filter_type == 2:
                predictor = up
            elif filter_type == 3:
                predictor = (left + up) // 2
            elif filter_type == 4:
                p = left + up - upper_left
                choices = [(abs(p - left), left), (abs(p - up), up), (abs(p - upper_left), upper_left)]
                predictor = min(enumerate(choices), key=lambda pair: (pair[1][0], pair[0]))[1][1]
            else:
                raise ValueError("Invalid PNG filter")
            row[i] = (row[i] + predictor) & 255
        for x in range(width):
            if color in (0, 3):
                sample = row[x * depth // 8] >> (8 - depth - (x * depth % 8)) & ((1 << depth) - 1)
                if color == 3:
                    pixels.extend(palette[sample * 3:sample * 3 + 3])
                    pixels.append(alpha[sample] if sample < len(alpha) else 255)
                else:
                    shade = sample * 255 // ((1 << depth) - 1)
                    pixels.extend((shade, shade, shade, 255))
            elif color == 2:
                pixels.extend(row[x * 3:x * 3 + 3])
                pixels.append(255)
            elif color == 4:
                pixels.extend((row[x * 2], row[x * 2], row[x * 2], row[x * 2 + 1]))
            else:
                pixels.extend(row[x * 4:x * 4 + 4])
        previous = row
    return width, height, pixels


def svg_pixels(svg):
    root = ET.fromstring(svg)
    assert root.tag == "{http://www.w3.org/2000/svg}svg"
    width, height = int(root.attrib["width"]), int(root.attrib["height"])
    assert root.attrib["viewBox"] == f"0 0 {width} {height}"
    assert root.attrib["shape-rendering"] == "crispEdges"
    pixels = bytearray(width * height * 4)
    for node in root:
        assert node.tag == "{http://www.w3.org/2000/svg}rect"
        x, y = int(node.attrib.get("x", 0)), int(node.attrib.get("y", 0))
        w, h = int(node.attrib["width"]), int(node.attrib["height"])
        assert 0 <= x <= x + w <= width and 0 <= y <= y + h <= height
        fill = node.attrib["fill"]
        assert len(fill) == 7 and fill[0] == "#"
        row = (bytes.fromhex(fill[1:]) + b"\xff") * w
        for py in range(y, y + h):
            start = (py * width + x) * 4
            pixels[start:start + len(row)] = row
    return width, height, pixels


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--rpc-url", default="http://127.0.0.1:8545")
    parser.add_argument("--renderer", required=True)
    parser.add_argument("--mock", help="Load fixtures into a MockPixelCons on localhost only")
    parser.add_argument("--report", default="out/artwork-verification.json")
    args = parser.parse_args()
    if args.mock and urllib.parse.urlparse(args.rpc_url).hostname not in ("127.0.0.1", "localhost", "::1"):
        parser.error("Fixture writes are supported only on a local test node")

    def rpc(method, params):
        request = urllib.request.Request(args.rpc_url, data=json.dumps({"jsonrpc": "2.0", "id": 1, "method": method, "params": params}).encode(), headers={"Content-Type": "application/json"})
        with urllib.request.urlopen(request, timeout=30) as response:
            result = json.load(response)
        if "error" in result:
            raise RuntimeError(result["error"])
        return result["result"]

    def call(data):
        output = bytes.fromhex(rpc("eth_call", [{"to": args.renderer, "data": data, "gas": hex(30_000_000)}, "latest"])[2:])
        assert len(output) >= 64
        offset = int.from_bytes(output[:32], "big")
        length = int.from_bytes(output[offset:offset + 32], "big")
        body = output[offset + 32:offset + 32 + length]
        assert len(body) == length
        return body

    fixtures = json.loads((ROOT / "fixtures/metadata.json").read_text())
    cases = {case["index"]: case for case in fixtures["cases"]}
    images = json.loads((ROOT / "fixtures/images.json").read_text())
    selector = subprocess.check_output(["cast", "sig", "image(bytes32)"], text=True).strip()
    sender = rpc("eth_accounts", [])[0] if args.mock else None
    checked, pixel_count = [], 0
    for image in images:
        case = cases[image["index"]]
        if args.mock:
            calldata = subprocess.check_output(["cast", "calldata", "set(bytes32,uint64,uint64,address,bytes8,uint32,bytes8)", case["id"], str(case["index"]), str(case["collection"]), case["creator"], case["rawName"], str(case["date"]), case["collectionName"]], text=True).strip()
            tx = rpc("eth_sendTransaction", [{"from": sender, "to": args.mock, "data": calldata, "gas": hex(2_000_000)}])
            assert rpc("eth_getTransactionReceipt", [tx])["status"] == "0x1"
        svg = call(selector + image["id"][2:])
        reference_path = ROOT / "fixtures" / image["file"]
        assert hashlib.sha256(reference_path.read_bytes()).hexdigest() == image["sha256"]
        expected = png_pixels(reference_path)
        actual = svg_pixels(svg)
        assert actual == expected, f"Artwork mismatch for #{image['index']}"
        pixel_count += actual[0] * actual[1]
        metadata = json.loads(call("0x" + ("/" + image["id"] + ".json").encode().hex()))
        assert "attributes" not in metadata
        for key, value in case["expected"].items():
            assert metadata[key] == value, f"Metadata mismatch for #{image['index']}: {key}"
        assert metadata["image"] == metadata["image_url"]
        prefix = "data:image/svg+xml;base64,"
        assert metadata["image"].startswith(prefix)
        assert base64.b64decode(metadata["image"][len(prefix):], validate=True) == svg
        checked.append({"index": image["index"], "pixels": actual[0] * actual[1], "exact": True})
    html = ROOT.parent / "site/index.html"
    digest = hashlib.sha256(html.read_bytes()).hexdigest()
    assert digest == "3332aef5e7b7da661cd76a28aaa7585ee7053b974855aa1b7b8c1ef091f92d2a"
    report = {"images": checked, "totalPixels": pixel_count, "changedPixels": 0, "manualWeb3Metadata": True, "embeddedSVG": True, "frozenHTMLSHA256": digest}
    path = ROOT / args.report
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(report, indent=2) + "\n")
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
