/**
 * Dependency-free QR + Code128 barcode generators.
 *
 * The report PDF, the report preview and the patient card all need a QR code
 * and a barcode. Doing the encoding ourselves keeps it working offline on
 * Android, iOS and web, and lets the same matrix be rendered both as SVG
 * markup (for the printed HTML) and as React Native <Svg> children.
 *
 * QR: byte mode, error correction level M, mask 0, versions 1–6
 *     (up to 108 data bytes — far more than a report id / verify URL).
 * Barcode: Code 128 (auto B/C), the format used on lab sample labels.
 */

/* ------------------------------------------------------------------ */
/* Galois field helpers (Reed–Solomon)                                 */
/* ------------------------------------------------------------------ */

const EXP = new Uint8Array(512);
const LOG = new Uint8Array(256);
(function initTables() {
  let x = 1;
  for (let i = 0; i < 255; i += 1) {
    EXP[i] = x;
    LOG[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d;
  }
  for (let i = 255; i < 512; i += 1) EXP[i] = EXP[i - 255];
})();

const mul = (a: number, b: number) => (a === 0 || b === 0 ? 0 : EXP[LOG[a] + LOG[b]]);

function rsGenerator(degree: number): Uint8Array {
  let poly = new Uint8Array([1]);
  for (let i = 0; i < degree; i += 1) {
    const next = new Uint8Array(poly.length + 1);
    for (let j = 0; j < poly.length; j += 1) {
      next[j] ^= mul(poly[j], 1);
      next[j + 1] ^= mul(poly[j], EXP[i]);
    }
    poly = next;
  }
  return poly;
}

function rsEncode(data: Uint8Array, ecLen: number): Uint8Array {
  const gen = rsGenerator(ecLen);
  const res = new Uint8Array(ecLen);
  for (let i = 0; i < data.length; i += 1) {
    const factor = data[i] ^ res[0];
    res.copyWithin(0, 1);
    res[ecLen - 1] = 0;
    if (factor !== 0) {
      for (let j = 0; j < ecLen; j += 1) res[j] ^= mul(gen[j + 1], factor);
    }
  }
  return res;
}

/* ------------------------------------------------------------------ */
/* Version table — error correction level M, versions 1..6             */
/* ------------------------------------------------------------------ */

type VersionSpec = { version: number; dataBytes: number; ecPerBlock: number; blocks: number; align: number[] };

const VERSIONS: VersionSpec[] = [
  { version: 1, dataBytes: 16, ecPerBlock: 10, blocks: 1, align: [] },
  { version: 2, dataBytes: 28, ecPerBlock: 16, blocks: 1, align: [6, 18] },
  { version: 3, dataBytes: 44, ecPerBlock: 26, blocks: 1, align: [6, 22] },
  { version: 4, dataBytes: 64, ecPerBlock: 18, blocks: 2, align: [6, 26] },
  { version: 5, dataBytes: 86, ecPerBlock: 24, blocks: 2, align: [6, 30] },
  { version: 6, dataBytes: 108, ecPerBlock: 16, blocks: 4, align: [6, 34] },
];

/** UTF-8 bytes without depending on TextEncoder (missing on some engines). */
function utf8Bytes(text: string): number[] {
  const out: number[] = [];
  for (let i = 0; i < text.length; i += 1) {
    let code = text.charCodeAt(i);
    if (code >= 0xd800 && code <= 0xdbff && i + 1 < text.length) {
      const next = text.charCodeAt(i + 1);
      if (next >= 0xdc00 && next <= 0xdfff) {
        code = ((code - 0xd800) << 10) + (next - 0xdc00) + 0x10000;
        i += 1;
      }
    }
    if (code < 0x80) out.push(code);
    else if (code < 0x800) out.push(0xc0 | (code >> 6), 0x80 | (code & 0x3f));
    else if (code < 0x10000) out.push(0xe0 | (code >> 12), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f));
    else out.push(0xf0 | (code >> 18), 0x80 | ((code >> 12) & 0x3f), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f));
  }
  return out;
}

/** Builds the final (interleaved) codeword stream for the chosen version. */
function buildCodewords(bytes: number[], spec: VersionSpec): Uint8Array {
  const bits: number[] = [];
  const push = (value: number, length: number) => {
    for (let i = length - 1; i >= 0; i -= 1) bits.push((value >> i) & 1);
  };

  push(0b0100, 4);          // byte mode
  push(bytes.length, 8);    // character count (8 bits for versions 1–9)
  bytes.forEach((b) => push(b, 8));

  const capacityBits = spec.dataBytes * 8;
  for (let i = 0; i < 4 && bits.length < capacityBits; i += 1) bits.push(0);
  while (bits.length % 8 !== 0) bits.push(0);

  const data: number[] = [];
  for (let i = 0; i < bits.length; i += 8) {
    let byte = 0;
    for (let j = 0; j < 8; j += 1) byte = (byte << 1) | bits[i + j];
    data.push(byte);
  }
  const padBytes = [0xec, 0x11];
  let pad = 0;
  while (data.length < spec.dataBytes) {
    data.push(padBytes[pad % 2]);
    pad += 1;
  }

  // Split into blocks, compute EC per block, then interleave.
  const shorter = Math.floor(spec.dataBytes / spec.blocks);
  const longerCount = spec.dataBytes % spec.blocks;
  const dataBlocks: Uint8Array[] = [];
  const ecBlocks: Uint8Array[] = [];
  let offset = 0;
  for (let b = 0; b < spec.blocks; b += 1) {
    const size = shorter + (b >= spec.blocks - longerCount ? 1 : 0);
    const block = Uint8Array.from(data.slice(offset, offset + size));
    offset += size;
    dataBlocks.push(block);
    ecBlocks.push(rsEncode(block, spec.ecPerBlock));
  }

  const out: number[] = [];
  const maxData = Math.max(...dataBlocks.map((b) => b.length));
  for (let i = 0; i < maxData; i += 1) {
    dataBlocks.forEach((b) => { if (i < b.length) out.push(b[i]); });
  }
  for (let i = 0; i < spec.ecPerBlock; i += 1) {
    ecBlocks.forEach((b) => out.push(b[i]));
  }
  return Uint8Array.from(out);
}

/** 15-bit format strings for EC level M, one per mask (we always use mask 0). */
const FORMAT_M = [
  0b101010000010010, 0b101000100100101, 0b101111001111100, 0b101101101001011,
  0b100010111111001, 0b100000011001110, 0b100111110010111, 0b100101010100000,
];

export type QrMatrix = { size: number; modules: boolean[][] };

/** Encodes `text` into a QR matrix (EC level M, mask 0). */
export function qrMatrix(text: string): QrMatrix {
  const bytes = utf8Bytes(text || ' ');
  const spec = VERSIONS.find((v) => bytes.length + 2 <= v.dataBytes) || VERSIONS[VERSIONS.length - 1];
  const size = spec.version * 4 + 17;

  const modules: (boolean | null)[][] = Array.from({ length: size }, () => Array(size).fill(null));
  const set = (r: number, c: number, v: boolean) => { modules[r][c] = v; };

  const finder = (row: number, col: number) => {
    for (let r = -1; r <= 7; r += 1) {
      for (let c = -1; c <= 7; c += 1) {
        const rr = row + r;
        const cc = col + c;
        if (rr < 0 || rr >= size || cc < 0 || cc >= size) continue;
        const on = (r >= 0 && r <= 6 && (c === 0 || c === 6))
          || (c >= 0 && c <= 6 && (r === 0 || r === 6))
          || (r >= 2 && r <= 4 && c >= 2 && c <= 4);
        set(rr, cc, on);
      }
    }
  };
  finder(0, 0);
  finder(0, size - 7);
  finder(size - 7, 0);

  // Alignment patterns
  spec.align.forEach((r) => {
    spec.align.forEach((c) => {
      const skip = (r <= 8 && c <= 8) || (r <= 8 && c >= size - 9) || (r >= size - 9 && c <= 8);
      if (skip) return;
      for (let dr = -2; dr <= 2; dr += 1) {
        for (let dc = -2; dc <= 2; dc += 1) {
          set(r + dr, c + dc, Math.max(Math.abs(dr), Math.abs(dc)) !== 1);
        }
      }
    });
  });

  // Timing patterns
  for (let i = 8; i < size - 8; i += 1) {
    const on = i % 2 === 0;
    if (modules[6][i] === null) set(6, i, on);
    if (modules[i][6] === null) set(i, 6, on);
  }

  // Dark module
  set(size - 8, 8, true);

  // Format information (EC level M, mask 0) — written twice, LSB first.
  const format = FORMAT_M[0];
  for (let i = 0; i < 15; i += 1) {
    const bit = ((format >> i) & 1) === 1;
    if (i < 6) set(i, 8, bit);
    else if (i < 8) set(i + 1, 8, bit);
    else set(size - 15 + i, 8, bit);

    if (i < 8) set(8, size - i - 1, bit);
    else if (i < 9) set(8, 15 - i, bit);
    else set(8, 15 - i - 1, bit);
  }

  // Data placement (zig-zag, right to left) with mask 0 → (row + col) % 2 === 0
  const codewords = buildCodewords(bytes, spec);
  let bitIndex = 0;
  const nextBit = () => {
    const byte = codewords[bitIndex >> 3];
    const bit = byte === undefined ? 0 : (byte >> (7 - (bitIndex & 7))) & 1;
    bitIndex += 1;
    return bit === 1;
  };

  let upward = true;
  for (let col = size - 1; col > 0; col -= 2) {
    if (col === 6) col -= 1; // skip the vertical timing column
    for (let i = 0; i < size; i += 1) {
      const row = upward ? size - 1 - i : i;
      for (let k = 0; k < 2; k += 1) {
        const cc = col - k;
        if (modules[row][cc] !== null) continue;
        const dark = nextBit();
        set(row, cc, (row + cc) % 2 === 0 ? !dark : dark);
      }
    }
    upward = !upward;
  }

  return { size, modules: modules.map((row) => row.map((v) => v === true)) };
}

/** QR as standalone SVG markup (used inside the printed report HTML). */
export function qrSvg(text: string, pixels = 96, color = '#0F172A'): string {
  const { size, modules } = qrMatrix(text);
  const parts: string[] = [];
  for (let r = 0; r < size; r += 1) {
    for (let c = 0; c < size; c += 1) {
      if (modules[r][c]) parts.push(`M${c} ${r}h1v1h-1z`);
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${pixels}" height="${pixels}" viewBox="0 0 ${size} ${size}" shape-rendering="crispEdges"><rect width="${size}" height="${size}" fill="#fff"/><path d="${parts.join('')}" fill="${color}"/></svg>`;
}

/* ------------------------------------------------------------------ */
/* Code 128 barcode                                                     */
/* ------------------------------------------------------------------ */

const CODE128_PATTERNS = [
  '11011001100', '11001101100', '11001100110', '10010011000', '10010001100', '10001001100',
  '10011001000', '10011000100', '10001100100', '11001001000', '11001000100', '11000100100',
  '10110011100', '10011011100', '10011001110', '10111001100', '10011101100', '10011100110',
  '11001110010', '11001011100', '11001001110', '11011100100', '11001110100', '11101101110',
  '11101001100', '11100101100', '11100100110', '11101100100', '11100110100', '11100110010',
  '11011011000', '11011000110', '11000110110', '10100011000', '10001011000', '10001000110',
  '10110001000', '10001101000', '10001100010', '11010001000', '11000101000', '11000100010',
  '10110111000', '10110001110', '10001101110', '10111011000', '10111000110', '10001110110',
  '11101110110', '11010001110', '11000101110', '11011101000', '11011100010', '11011101110',
  '11101011000', '11101000110', '11100010110', '11101101000', '11101100010', '11100011010',
  '11101111010', '11001000010', '11110001010', '10100110000', '10100001100', '10010110000',
  '10010000110', '10000101100', '10000100110', '10110010000', '10110000100', '10011010000',
  '10011000010', '10000110100', '10000110010', '11000010010', '11001010000', '11110111010',
  '11000010100', '10001111010', '10100111100', '10010111100', '10010011110', '10111100100',
  '10011110100', '10011110010', '11110100100', '11110010100', '11110010010', '11011011110',
  '11011110110', '11110110110', '10101111000', '10100011110', '10001011110', '10111101000',
  '10111100010', '11110101000', '11110100010', '10111011110', '10111101110', '11101011110',
  '11110101110', '11010000100', '11010010000', '11010011100', '11000111010',
];

const STOP = '1100011101011';

/** Bar/space widths for a Code 128-B barcode of `text`. */
export function code128Bars(text: string): number[] {
  const value = String(text || '').replace(/[^\x20-\x7E]/g, '') || '0';
  const codes = [104]; // START B
  for (let i = 0; i < value.length; i += 1) codes.push(value.charCodeAt(i) - 32);
  let checksum = codes[0];
  for (let i = 1; i < codes.length; i += 1) checksum += codes[i] * i;
  codes.push(checksum % 103);

  const bits = codes.map((c) => CODE128_PATTERNS[c] || CODE128_PATTERNS[0]).join('') + STOP;
  // Run-length encode into alternating bar/space widths starting with a bar.
  const runs: number[] = [];
  let current = bits[0];
  let count = 0;
  for (let i = 0; i < bits.length; i += 1) {
    if (bits[i] === current) count += 1;
    else {
      runs.push(count);
      current = bits[i];
      count = 1;
    }
  }
  runs.push(count);
  return runs;
}

export type BarRect = { x: number; width: number };

/** Positioned black bars, ready for <Svg> or SVG markup. */
export function barcodeRects(text: string, totalWidth = 200): { rects: BarRect[]; unit: number; width: number } {
  const runs = code128Bars(text);
  const units = runs.reduce((a, b) => a + b, 0);
  const unit = totalWidth / units;
  const rects: BarRect[] = [];
  let x = 0;
  runs.forEach((run, i) => {
    const w = run * unit;
    if (i % 2 === 0) rects.push({ x, width: w });
    x += w;
  });
  return { rects, unit, width: totalWidth };
}

/** Barcode as standalone SVG markup (used inside the printed report HTML). */
export function barcodeSvg(text: string, width = 200, height = 40, color = '#0F172A'): string {
  const { rects } = barcodeRects(text, width);
  const bars = rects
    .map((r) => `<rect x="${r.x.toFixed(2)}" y="0" width="${r.width.toFixed(2)}" height="${height}" fill="${color}"/>`)
    .join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${bars}</svg>`;
}

/** Inline data-URI so the SVG can be dropped into an <img> tag in HTML. */
export function svgDataUri(svg: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
