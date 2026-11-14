// Pack bytes as seven-bit units in script raw text. Escape NUL, CR (which HTML
// normalizes), and '<' (which can close a script). Each escape also carries the
// next unit in one two-byte UTF-8 character. The stored byte length removes padding.
const illegal = [0, 13, 60];
export function encode(bytes) {
  const units = new Uint8Array(Math.ceil((bytes.length * 8) / 7));
  let accumulator = 0,
    bits = 0,
    position = 0;
  for (const byte of bytes) {
    accumulator = (accumulator << 8) | byte;
    bits += 8;
    while (bits >= 7) {
      bits -= 7;
      units[position++] = (accumulator >>> bits) & 127;
    }
  }
  if (bits) units[position++] = (accumulator << (7 - bits)) & 127;
  const encoded = new Uint16Array(position);
  let count = 0;
  for (let i = 0; i < position; i++) {
    const special = illegal.indexOf(units[i]);
    encoded[count++] =
      special < 0 ? units[i] : 128 + (special << 7) + (units[++i] || 0);
  }
  const chunks = [];
  for (let i = 0; i < count; i += 8192)
    chunks.push(
      String.fromCharCode(...encoded.subarray(i, Math.min(count, i + 8192))),
    );
  return chunks.join("");
}
export function decode(text, length) {
  const out = new Uint8Array(length),
    illegal = [0, 13, 60];
  let accumulator = 0,
    bits = 0,
    position = 0;
  for (let i = 0; i < text.length; i++) {
    let code = text.charCodeAt(i);
    if (code >= 128) {
      const packed = code - 128;
      accumulator = (accumulator << 7) | illegal[packed >> 7];
      bits += 7;
      if (bits >= 8) {
        bits -= 8;
        out[position++] = (accumulator >>> bits) & 255;
      }
      if (position === length) break;
      code = packed & 127;
    }
    accumulator = (accumulator << 7) | code;
    bits += 7;
    if (bits >= 8) {
      bits -= 8;
      out[position++] = (accumulator >>> bits) & 255;
    }
  }
  return out;
}
