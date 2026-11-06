/**
 * FoodLoop QR Code Engine (Pure Vanilla ES Module)
 * Zero external dependencies. Generates authentic, compliant QR matrix & SVG.
 * Used for digital surplus pickup tickets and provider handoff verification.
 */

const GF_EXP = new Uint8Array(512);
const GF_LOG = new Uint8Array(256);

// Initialize Galois Field GF(2^8) with primitive poly 0x11d
(function initGfTables() {
  let v = 1;
  for (let i = 0; i < 255; i++) {
    GF_EXP[i] = v;
    GF_EXP[i + 255] = v;
    GF_LOG[v] = i;
    v = (v << 1) ^ (v >= 128 ? 0x11d : 0);
  }
})();

function gfMultiply(a, b) {
  if (a === 0 || b === 0) return 0;
  return GF_EXP[GF_LOG[a] + GF_LOG[b]];
}

function rsGeneratorPoly(numEcBytes) {
  let poly = [1];
  for (let i = 0; i < numEcBytes; i++) {
    const next = new Array(poly.length + 1).fill(0);
    for (let j = 0; j < poly.length; j++) {
      next[j] ^= gfMultiply(poly[j], GF_EXP[i]);
      next[j + 1] ^= poly[j];
    }
    poly = next;
  }
  return poly;
}

function rsCalculateRemainder(data, poly) {
  const res = Array.from(data).concat(new Array(poly.length - 1).fill(0));
  for (let i = 0; i < data.length; i++) {
    const coef = res[i];
    if (coef !== 0) {
      for (let j = 0; j < poly.length; j++) {
        res[i + j] ^= gfMultiply(poly[j], coef);
      }
    }
  }
  return res.slice(data.length);
}

export function generateQrMatrix(text) {
  const enc = new TextEncoder();
  const utf8 = enc.encode(String(text));

  // Determine minimal version needed (Version 2 holds 28 data bytes, Version 3 holds 44)
  const ver = utf8.length <= 26 ? 2 : 3;
  const size = ver === 2 ? 25 : 29;
  const totalDataBytes = ver === 2 ? 28 : 44;
  const ecBytes = ver === 2 ? 16 : 26;

  // 1. Bitstream packing (8-bit Byte Mode)
  const bits = [];
  function pushBits(val, len) {
    for (let i = len - 1; i >= 0; i--) {
      bits.push((val >> i) & 1);
    }
  }

  pushBits(0b0100, 4); // Byte mode indicator
  pushBits(utf8.length, 8); // Character count
  for (let i = 0; i < utf8.length; i++) {
    pushBits(utf8[i], 8);
  }

  // Terminator
  const padLen = Math.min(4, totalDataBytes * 8 - bits.length);
  pushBits(0, padLen);

  // Pad to 8-bit boundary
  while (bits.length % 8 !== 0) {
    bits.push(0);
  }

  // Convert bits to byte codewords
  const dataBytes = [];
  for (let i = 0; i < bits.length; i += 8) {
    let byteVal = 0;
    for (let j = 0; j < 8; j++) {
      byteVal = (byteVal << 1) | bits[i + j];
    }
    dataBytes.push(byteVal);
  }

  // Alternating pad bytes 0xEC, 0x11
  let padToggle = false;
  while (dataBytes.length < totalDataBytes) {
    dataBytes.push(padToggle ? 0x11 : 0xec);
    padToggle = !padToggle;
  }

  // 2. Reed-Solomon Error Correction Code
  const poly = rsGeneratorPoly(ecBytes);
  const ecCodewords = rsCalculateRemainder(dataBytes, poly);
  const allCodewords = dataBytes.concat(ecCodewords);

  // 3. Matrix Placement
  const matrix = Array.from({ length: size }, () => new Array(size).fill(null));
  const isReserved = Array.from({ length: size }, () => new Array(size).fill(false));

  function setModule(r, c, val, reserved = true) {
    if (r >= 0 && r < size && c >= 0 && c < size) {
      matrix[r][c] = val;
      if (reserved) isReserved[r][c] = true;
    }
  }

  // Finder pattern (7x7) + 1-module quiet border
  function setFinder(startR, startC) {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const isBlack =
          (r >= 0 && r <= 6 && (c === 0 || c === 6)) ||
          (c >= 0 && c <= 6 && (r === 0 || r === 6)) ||
          (r >= 2 && r <= 4 && c >= 2 && c <= 4);
        setModule(startR + r, startC + c, isBlack ? 1 : 0);
      }
    }
  }

  setFinder(0, 0);
  setFinder(0, size - 7);
  setFinder(size - 7, 0);

  // Timing patterns
  for (let i = 8; i < size - 8; i++) {
    setModule(6, i, i % 2 === 0 ? 1 : 0);
    setModule(i, 6, i % 2 === 0 ? 1 : 0);
  }

  // Alignment pattern
  const alignCenter = ver === 2 ? 18 : 22;
  for (let r = -2; r <= 2; r++) {
    for (let c = -2; c <= 2; c++) {
      const isBlack = Math.max(Math.abs(r), Math.abs(c)) !== 1;
      setModule(alignCenter + r, alignCenter + c, isBlack ? 1 : 0);
    }
  }

  // Dark module
  setModule(4 * ver + 9, 8, 1);

  // Reserve format bits
  for (let i = 0; i < 9; i++) {
    if (i !== 6) {
      setModule(8, i, 0);
      setModule(i, 8, 0);
    }
  }
  for (let i = 0; i < 8; i++) {
    setModule(8, size - 1 - i, 0);
    setModule(size - 1 - i, 8, 0);
  }

  // Place data bits in zigzag upward/downward columns
  const allBits = [];
  for (let i = 0; i < allCodewords.length; i++) {
    const b = allCodewords[i];
    for (let bit = 7; bit >= 0; bit--) {
      allBits.push((b >> bit) & 1);
    }
  }

  let bitIdx = 0;
  let dir = -1;
  let c = size - 1;
  while (c > 0) {
    if (c === 6) c--; // Skip vertical timing column
    for (let step = 0; step < size; step++) {
      const r = dir === -1 ? size - 1 - step : step;
      for (let colOffset = 0; colOffset < 2; colOffset++) {
        const col = c - colOffset;
        if (!isReserved[r][col]) {
          let b = bitIdx < allBits.length ? allBits[bitIdx++] : 0;
          // Mask 0: (r + col) % 2 === 0
          if ((r + col) % 2 === 0) b ^= 1;
          matrix[r][col] = b;
        }
      }
    }
    dir = -dir;
    c -= 2;
  }

  // Format bits: Error Level M (00) & Mask 0 (000) -> 0x5412 XOR -> 101010000010010
  const formatBits = [1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0];
  setModule(8, 0, formatBits[0]);
  setModule(8, 1, formatBits[1]);
  setModule(8, 2, formatBits[2]);
  setModule(8, 3, formatBits[3]);
  setModule(8, 4, formatBits[4]);
  setModule(8, 5, formatBits[5]);
  setModule(8, 7, formatBits[6]);
  setModule(8, 8, formatBits[7]);
  setModule(7, 8, formatBits[8]);
  setModule(5, 8, formatBits[9]);
  setModule(4, 8, formatBits[10]);
  setModule(3, 8, formatBits[11]);
  setModule(2, 8, formatBits[12]);
  setModule(1, 8, formatBits[13]);
  setModule(0, 8, formatBits[14]);

  for (let i = 0; i < 7; i++) {
    setModule(8, size - 1 - i, formatBits[14 - i]);
  }
  for (let i = 0; i < 8; i++) {
    setModule(size - 8 + i, 8, formatBits[i]);
  }

  return { matrix, size };
}

/**
 * Render crisp SVG QR Code
 */
export function renderQrCodeSvg(text, { size = 180, margin = 3, darkColor = '#244B3B', lightColor = '#FFFFFF' } = {}) {
  const { matrix, size: matrixSize } = generateQrMatrix(text);
  const totalDim = matrixSize + margin * 2;

  let pathD = '';
  for (let r = 0; r < matrixSize; r++) {
    for (let c = 0; c < matrixSize; c++) {
      if (matrix[r][c] === 1) {
        const x = c + margin;
        const y = r + margin;
        pathD += `M${x},${y}h1v1h-1z `;
      }
    }
  }

  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalDim} ${totalDim}" width="${size}" height="${size}" shape-rendering="crispEdges" class="qr-svg-code" aria-label="QR Code for ${text}">
      <rect width="100%" height="100%" fill="${lightColor}" rx="10"/>
      <path d="${pathD}" fill="${darkColor}"/>
    </svg>
  `;
}

