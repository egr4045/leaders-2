/**
 * @civa/hex-core — pure hex-grid math shared by the PixiJS client and the server.
 *
 * Uses axial coordinates (q, r) with a pointy-top layout and cube math under the hood.
 * Everything here is a pure function: no I/O, no globals — trivially unit-testable and
 * identical on client and server (the server is authoritative about ranges/distances).
 *
 * Reference: https://www.redblobgames.com/grids/hexagons/
 */

export interface Hex {
  readonly q: number;
  readonly r: number;
}

export const hex = (q: number, r: number): Hex => ({ q, r });

/** Cube s-coordinate, derived so that q + r + s === 0. */
export const hexS = (h: Hex): number => -h.q - h.r;

export const hexEquals = (a: Hex, b: Hex): boolean => a.q === b.q && a.r === b.r;

/** Stable string key for using hexes in Map/Set. */
export const hexKey = (h: Hex): string => `${h.q},${h.r}`;

export const hexFromKey = (key: string): Hex => {
  const comma = key.indexOf(',');
  const q = Number(key.slice(0, comma));
  const r = Number(key.slice(comma + 1));
  return { q, r };
};

export const hexAdd = (a: Hex, b: Hex): Hex => ({ q: a.q + b.q, r: a.r + b.r });
export const hexSubtract = (a: Hex, b: Hex): Hex => ({ q: a.q - b.q, r: a.r - b.r });
export const hexScale = (h: Hex, k: number): Hex => ({ q: h.q * k, r: h.r * k });

/**
 * The 6 axial neighbour directions, ordered clockwise from "east".
 */
export const HEX_DIRECTIONS: readonly Hex[] = [
  { q: 1, r: 0 },
  { q: 1, r: -1 },
  { q: 0, r: -1 },
  { q: -1, r: 0 },
  { q: -1, r: 1 },
  { q: 0, r: 1 },
];

export const hexNeighbor = (h: Hex, direction: number): Hex => {
  const dir = HEX_DIRECTIONS[((direction % 6) + 6) % 6]!;
  return hexAdd(h, dir);
};

export const hexNeighbors = (h: Hex): Hex[] => HEX_DIRECTIONS.map((d) => hexAdd(h, d));

/**
 * Distance in hexes between two tiles — the core primitive for unit strike ranges,
 * trade-logistics fuel cost (~distance to the exchange), etc.
 */
export const hexDistance = (a: Hex, b: Hex): number => {
  const dq = a.q - b.q;
  const dr = a.r - b.r;
  const ds = hexS(a) - hexS(b);
  return (Math.abs(dq) + Math.abs(dr) + Math.abs(ds)) / 2;
};

/** Is `target` within `range` hexes of `origin` (inclusive)? Used for "can this unit hit that?". */
export const hexInRange = (origin: Hex, target: Hex, range: number): boolean =>
  hexDistance(origin, target) <= range;

/**
 * All hexes within `range` of `center` (inclusive), including the center itself.
 * Drives the "highlight strike radius" overlay on the map.
 */
export const hexesInRange = (center: Hex, range: number): Hex[] => {
  const out: Hex[] = [];
  for (let dq = -range; dq <= range; dq++) {
    const rMin = Math.max(-range, -dq - range);
    const rMax = Math.min(range, -dq + range);
    for (let dr = rMin; dr <= rMax; dr++) {
      out.push({ q: center.q + dq, r: center.r + dr });
    }
  }
  return out;
};

/**
 * Linear interpolation + cube rounding to walk the straight line between two hexes.
 * Useful for line-of-fire previews and missile trajectories.
 */
export const hexLine = (a: Hex, b: Hex): Hex[] => {
  const n = hexDistance(a, b);
  if (n === 0) return [a];
  const out: Hex[] = [];
  for (let i = 0; i <= n; i++) {
    out.push(hexRound(hexLerp(a, b, i / n)));
  }
  return out;
};

interface FractionalHex {
  q: number;
  r: number;
}

const hexLerp = (a: Hex, b: Hex, t: number): FractionalHex => ({
  q: a.q + (b.q - a.q) * t,
  r: a.r + (b.r - a.r) * t,
});

const hexRound = (f: FractionalHex): Hex => {
  const s = -f.q - f.r;
  let rq = Math.round(f.q);
  let rr = Math.round(f.r);
  const rs = Math.round(s);
  const dq = Math.abs(rq - f.q);
  const dr = Math.abs(rr - f.r);
  const ds = Math.abs(rs - s);
  if (dq > dr && dq > ds) {
    rq = -rr - rs;
  } else if (dr > ds) {
    rr = -rq - rs;
  }
  return { q: rq, r: rr };
};

// ---------------------------------------------------------------------------
// Pixel layout (pointy-top) — for the PixiJS renderer. Server never needs this,
// but it lives here so client and any map tooling agree on the projection.
// ---------------------------------------------------------------------------

export interface Point {
  readonly x: number;
  readonly y: number;
}

const SQRT3 = Math.sqrt(3);

/** Axial hex -> pixel center for a pointy-top layout with the given hex `size` (radius). */
export const hexToPixel = (h: Hex, size: number): Point => ({
  x: size * (SQRT3 * h.q + (SQRT3 / 2) * h.r),
  y: size * (3 / 2) * h.r,
});

/** Pixel -> nearest hex (rounded) for a pointy-top layout. */
export const pixelToHex = (p: Point, size: number): Hex => {
  const q = ((SQRT3 / 3) * p.x - (1 / 3) * p.y) / size;
  const r = ((2 / 3) * p.y) / size;
  return hexRound({ q, r });
};
