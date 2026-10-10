// PNG rasterizer and encoder for Coreta Ink v1 (Fase 26).
// Produces a thumbnail/preview PNG from a CoretaInkDocument.
// Constraints:
// - Width never exceeds 1024 px.
// - Pure functions: works in Node.js, serverless environments, and browsers without native canvas dependencies.
// - Uses fflate zlibSync for standards-compliant PNG IDAT compression.

import { zlibSync } from "fflate";
import { getActiveStrokes, type CoretaInkDocumentV1 } from "./format";

export interface RenderPngOptions {
  /** Maximum width in pixels. Hard-capped at 1024 px. Defaults to 1024. */
  maxWidth?: number;
  /** Background color in RGBA or hex string. Defaults to white `#ffffff`. */
  background?: string | null;
  /** Fallback stroke color when not specified. Defaults to dark slate `#0f172a`. */
  defaultStrokeColor?: string;
}

// Universal IEEE 802.3 CRC-32 lookup table
const crcTable: Uint32Array = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i += 1) {
    let c = i;
    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c;
  }
  return table;
})();

export function crc32(buf: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i += 1) {
    const byte = buf[i] ?? 0;
    c = (crcTable[(c ^ byte) & 0xff] ?? 0) ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function createChunk(type: string, data: Uint8Array): Uint8Array {
  const len = data.length;
  const chunk = new Uint8Array(4 + 4 + len + 4);
  const view = new DataView(chunk.buffer, chunk.byteOffset, chunk.byteLength);

  view.setUint32(0, len);
  const typeBytes = new TextEncoder().encode(type);
  chunk.set(typeBytes, 4);
  chunk.set(data, 8);

  const crc = crc32(chunk.subarray(4, 8 + len));
  view.setUint32(8 + len, crc);

  return chunk;
}

/**
 * Encodes an RGBA pixel buffer to a valid PNG byte stream.
 */
export function encodePng(width: number, height: number, rgba: Uint8Array): Uint8Array {
  const PNG_SIGNATURE = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR Chunk (13 bytes)
  const ihdrData = new Uint8Array(13);
  const ihdrView = new DataView(ihdrData.buffer, ihdrData.byteOffset, ihdrData.byteLength);
  ihdrView.setUint32(0, width);
  ihdrView.setUint32(4, height);
  ihdrData[8] = 8; // 8 bits per channel
  ihdrData[9] = 6; // Color type: 6 (RGBA)
  ihdrData[10] = 0; // Compression: Deflate
  ihdrData[11] = 0; // Filter: Adaptive (0)
  ihdrData[12] = 0; // Interlace: None (0)

  // Scanlines with filter byte 0 (None) prefixing each row
  const rowBytes = 1 + width * 4;
  const scanlines = new Uint8Array(rowBytes * height);

  for (let y = 0; y < height; y += 1) {
    const rawOffset = y * rowBytes;
    scanlines[rawOffset] = 0; // Filter byte: 0
    const rgbaOffset = y * width * 4;
    scanlines.set(rgba.subarray(rgbaOffset, rgbaOffset + width * 4), rawOffset + 1);
  }

  // IDAT Chunk with zlib compression
  const compressed = zlibSync(scanlines);

  const ihdr = createChunk("IHDR", ihdrData);
  const idat = createChunk("IDAT", compressed);
  const iend = createChunk("IEND", new Uint8Array(0));

  const totalLength = PNG_SIGNATURE.length + ihdr.length + idat.length + iend.length;
  const png = new Uint8Array(totalLength);

  let offset = 0;
  png.set(PNG_SIGNATURE, offset);
  offset += PNG_SIGNATURE.length;
  png.set(ihdr, offset);
  offset += ihdr.length;
  png.set(idat, offset);
  offset += idat.length;
  png.set(iend, offset);

  return png;
}

/** Parses width and height from PNG IHDR chunk for testing/verification. */
export function getPngDimensions(png: Uint8Array): { width: number; height: number } {
  if (png.length < 24) {
    throw new Error("Invalid PNG: Buffer too small for IHDR header.");
  }
  const view = new DataView(png.buffer, png.byteOffset, png.byteLength);
  const width = view.getUint32(16);
  const height = view.getUint32(20);
  return { width, height };
}

interface ColorRGBA {
  r: number;
  g: number;
  b: number;
  a: number;
}

function parseColor(colorStr?: string): ColorRGBA {
  if (!colorStr || colorStr === "currentColor") {
    return { r: 15, g: 23, b: 42, a: 255 }; // slate-900
  }

  // Handle #RRGGBB or #RGB
  if (colorStr.startsWith("#")) {
    const hex = colorStr.slice(1);
    if (hex.length === 6) {
      return {
        r: Number.parseInt(hex.slice(0, 2), 16),
        g: Number.parseInt(hex.slice(2, 4), 16),
        b: Number.parseInt(hex.slice(4, 6), 16),
        a: 255,
      };
    }
    if (hex.length === 3) {
      const rHex = hex[0] ?? "0";
      const gHex = hex[1] ?? "0";
      const bHex = hex[2] ?? "0";
      return {
        r: Number.parseInt(rHex + rHex, 16),
        g: Number.parseInt(gHex + gHex, 16),
        b: Number.parseInt(bHex + bHex, 16),
        a: 255,
      };
    }
  }

  return { r: 15, g: 23, b: 42, a: 255 };
}

/**
 * Renders a CoretaInkDocument into a PNG image byte buffer.
 * - Width is scaled proportionally so it never exceeds 1024 px.
 * - Erased strokes are omitted.
 */
export function renderPng(doc: CoretaInkDocumentV1, options?: RenderPngOptions): Uint8Array {
  const origW = Math.max(1, doc.canvas.w);
  const origH = Math.max(1, doc.canvas.h);

  // Maximum width constraint: never exceed 1024 px
  const maxAllowedWidth = Math.min(options?.maxWidth ?? 1024, 1024);
  const scale = origW > maxAllowedWidth ? maxAllowedWidth / origW : 1;

  const width = Math.min(maxAllowedWidth, Math.max(1, Math.round(origW * scale)));
  const height = Math.max(1, Math.round(origH * scale));

  const pixelCount = width * height;
  const pixels = new Uint8Array(pixelCount * 4);

  // Fill background
  const bgColor =
    options?.background !== null ? parseColor(options?.background ?? "#ffffff") : null;
  if (bgColor) {
    for (let i = 0; i < pixelCount; i += 1) {
      const offset = i * 4;
      pixels[offset] = bgColor.r;
      pixels[offset + 1] = bgColor.g;
      pixels[offset + 2] = bgColor.b;
      pixels[offset + 3] = bgColor.a;
    }
  }

  const activeStrokes = getActiveStrokes(doc);

  // Helper to stamp a circular dot
  const stampDot = (cx: number, cy: number, radius: number, color: ColorRGBA) => {
    const minX = Math.max(0, Math.floor(cx - radius));
    const maxX = Math.min(width - 1, Math.ceil(cx + radius));
    const minY = Math.max(0, Math.floor(cy - radius));
    const maxY = Math.min(height - 1, Math.ceil(cy + radius));
    const r2 = radius * radius;

    for (let py = minY; py <= maxY; py += 1) {
      for (let px = minX; px <= maxX; px += 1) {
        const dx = px - cx;
        const dy = py - cy;
        if (dx * dx + dy * dy <= r2) {
          const idx = (py * width + px) * 4;
          pixels[idx] = color.r;
          pixels[idx + 1] = color.g;
          pixels[idx + 2] = color.b;
          pixels[idx + 3] = color.a;
        }
      }
    }
  };

  // Render each active stroke
  for (const stroke of activeStrokes) {
    if (stroke.pts.length === 0) continue;
    const color = parseColor(stroke.color ?? options?.defaultStrokeColor);
    const baseSize = (stroke.size ?? 2) * scale;

    for (let i = 0; i < stroke.pts.length; i += 1) {
      const pt = stroke.pts[i]!;
      const cx = pt[0] * scale;
      const cy = pt[1] * scale;
      const pressure = pt[2] > 0 ? pt[2] : 0.5;
      const radius = Math.max(0.75, (baseSize / 2) * (0.5 + pressure * 0.5));

      stampDot(cx, cy, radius, color);

      // Interpolate between consecutive points to avoid gaps
      if (i > 0) {
        const prevPt = stroke.pts[i - 1]!;
        const px = prevPt[0] * scale;
        const py = prevPt[1] * scale;
        const prevPressure = prevPt[2] > 0 ? prevPt[2] : 0.5;
        const prevRadius = Math.max(0.75, (baseSize / 2) * (0.5 + prevPressure * 0.5));

        const dist = Math.hypot(cx - px, cy - py);
        const steps = Math.max(1, Math.ceil(dist / 1.5));

        for (let s = 1; s < steps; s += 1) {
          const t = s / steps;
          const ix = px + (cx - px) * t;
          const iy = py + (cy - py) * t;
          const ir = prevRadius + (radius - prevRadius) * t;
          stampDot(ix, iy, ir, color);
        }
      }
    }
  }

  return encodePng(width, height, pixels);
}
