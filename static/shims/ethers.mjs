// Static website subset: no wallet, provider, signing, or contract machinery.
function integer(value) {
  if (typeof value === "number" && !Number.isSafeInteger(value))
    throw new Error("Invalid integer");
  if (typeof value === "string" && value === "")
    throw new Error("Invalid integer");
  if (
    typeof value !== "string" &&
    typeof value !== "number" &&
    typeof value !== "bigint"
  )
    throw new Error("Invalid integer");
  return typeof value === "string" && value[0] === "-" && value[1] !== "-"
    ? -BigInt(value.slice(1))
    : BigInt(value);
}
export function toBigInt(value) {
  if (value instanceof Uint8Array)
    return BigInt(
      "0x0" +
        Array.from(value, (byte) => byte.toString(16).padStart(2, "0")).join(
          "",
        ),
    );
  return integer(value);
}
export function toBeHex(value) {
  const number = integer(value);
  if (number < 0n) throw new Error("Unsigned value required");
  let hex = number.toString(16);
  if (hex.length % 2) hex = "0" + hex;
  return "0x" + hex;
}
export function toUtf8String(value) {
  let bytes;
  if (typeof value === "string") {
    if (!/^0x(?:[a-f0-9]{2})*$/i.test(value)) throw new Error("Invalid bytes");
    bytes = Uint8Array.from(value.slice(2).match(/../g) || [], (byte) =>
      parseInt(byte, 16),
    );
  } else if (value instanceof Uint8Array) bytes = value;
  else throw new Error("Invalid bytes");
  return new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(
    bytes,
  );
}
export function toUtf8Bytes(text) {
  if (typeof text !== "string") throw new Error("String required");
  const bytes = [];
  for (let i = 0; i < text.length; i++) {
    let code = text.charCodeAt(i);
    if (code < 128) bytes.push(code);
    else if (code < 2048) bytes.push(192 | (code >> 6), 128 | (code & 63));
    else if (code >= 0xd800 && code <= 0xdbff) {
      const next = text.charCodeAt(++i);
      if (!(next >= 0xdc00 && next <= 0xdfff))
        throw new Error("Invalid surrogate");
      code = 65536 + ((code & 1023) << 10) + (next & 1023);
      bytes.push(
        240 | (code >> 18),
        128 | ((code >> 12) & 63),
        128 | ((code >> 6) & 63),
        128 | (code & 63),
      );
    } else
      bytes.push(
        224 | (code >> 12),
        128 | ((code >> 6) & 63),
        128 | (code & 63),
      );
  }
  return new Uint8Array(bytes);
}
