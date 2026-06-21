/**
 * Rendering helpers for the PixiJS hex map. Pure geometry/colour — no Pixi imports — so it can
 * be unit-tested and reused. Pairs with @civa/hex-core (which owns coordinate math).
 */
import { hexToPixel, type Hex, type Point } from '@civa/hex-core';
import type { BiomeKind } from '@civa/shared-types';
import { color } from '@civa/ui-kit';

/** The six corner points of a pointy-top hex of the given size, centred at the hex's pixel pos. */
export const hexCorners = (h: Hex, size: number): Point[] => {
  const center = hexToPixel(h, size);
  const pts: Point[] = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 180) * (60 * i - 30);
    pts.push({ x: center.x + size * Math.cos(angle), y: center.y + size * Math.sin(angle) });
  }
  return pts;
};

/** Flatten corners to the number[] form PixiJS Graphics.poly expects. */
export const hexPolyPoints = (h: Hex, size: number): number[] =>
  hexCorners(h, size).flatMap((p) => [p.x, p.y]);

const BIOME_HEX: Record<BiomeKind, number> = {
  desert: 0xc9a86a,
  taiga: 0x3f6b4a,
  mountains: 0x7d8590,
  plains: 0x6fae54,
  tundra: 0xa9b6bf,
  ocean: 0x21496b,
};

export const biomeColor = (biome: BiomeKind): number => BIOME_HEX[biome];

/** Parse a `rgba()`/hex token from ui-kit into a Pixi numeric colour (best-effort). */
export const cssToHex = (css: string): number => {
  const m = /#([0-9a-f]{6})/i.exec(css);
  return m ? parseInt(m[1]!, 16) : 0xffffff;
};

export const mapColors = {
  selection: cssToHex(color.accent),
  hover: 0xffffff,
  gridLine: 0x0b0f16,
};
