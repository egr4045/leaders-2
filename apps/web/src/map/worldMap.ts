/**
 * Builds the real-Earth hex world. A hex grid is laid over an equirectangular projection; each
 * hex is assigned to whichever country polygon contains it (Natural Earth **50m** via world-atlas,
 * which gives much sharper coastlines/borders than 110m). A de-speckle pass cleans isolated
 * coastal artifacts, and city/base markers snap to a land hex so nothing floats in the sea.
 *
 * This mirrors the design (section 4: "hex grid over the real Earth, players pick real nations")
 * and is computed once, lazily, then cached. Later phases will receive this from the server.
 */
import { feature } from 'topojson-client';
import { geoEquirectangular, geoPath } from 'd3-geo';
import type { FeatureCollection, GeoJsonProperties, Geometry } from 'geojson';
import countries50m from 'world-atlas/countries-50m.json';
import {
  hex,
  hexAdd,
  hexesInRange,
  hexKey,
  HEX_DIRECTIONS,
  hexToPixel,
  pixelToHex,
  type Hex,
  type Point,
} from '@civa/hex-core';
import type { BiomeKind, ResourceKind } from '@civa/shared-types';

export const HEX_SIZE = 13;

// Grid resolution (columns × rows). Aspect ≈ 2.26 keeps countries roughly proportional to the
// equirectangular lon/lat window below. Higher = finer coast, slower one-time build.
const COLS = 176;
const ROWS = 78;

// Latitude window we render (drops most of Antarctica, keeps the Arctic).
const LAT_TOP = 82;
const LAT_BOTTOM = -56;

/** Playable nations keyed by ISO 3166-1 numeric code, with capital coordinates [lon, lat]. */
interface NationDef {
  owner: number;
  name: string;
  capital: { name: string; lon: number; lat: number };
}
export const NATIONS: Record<number, NationDef> = {
  840: { owner: 0, name: 'United States', capital: { name: 'Washington', lon: -77.04, lat: 38.9 } },
  156: { owner: 1, name: 'China', capital: { name: 'Beijing', lon: 116.4, lat: 39.9 } },
  643: { owner: 2, name: 'Russia', capital: { name: 'Moscow', lon: 37.62, lat: 55.75 } },
  76: { owner: 3, name: 'Brazil', capital: { name: 'Brasília', lon: -47.9, lat: -15.8 } },
  276: { owner: 4, name: 'Germany', capital: { name: 'Berlin', lon: 13.4, lat: 52.52 } },
  356: { owner: 5, name: 'India', capital: { name: 'New Delhi', lon: 77.21, lat: 28.61 } },
};

export const OWNER_COLORS = [0x3d7fc4, 0xc44d3d, 0x49a05a, 0xb05aa0, 0xc9a23d, 0x3db0a0];

/** Mock military-base sites (lon/lat). Replaced by server-placed bases in later phases. */
const BASE_SITES: { owner: number; name: string; lon: number; lat: number }[] = [
  { owner: 0, name: 'Norfolk Base', lon: -76.3, lat: 36.8 },
  { owner: 0, name: 'Pearl Base', lon: -157.9, lat: 21.3 },
  { owner: 1, name: 'Qingdao Base', lon: 120.4, lat: 36.1 },
  { owner: 2, name: 'Murmansk Base', lon: 33.1, lat: 68.9 },
  { owner: 3, name: 'Manaus Base', lon: -60.0, lat: -3.1 },
  { owner: 4, name: 'Kiel Base', lon: 10.1, lat: 54.3 },
  { owner: 5, name: 'Mumbai Base', lon: 72.9, lat: 19.1 },
];

export interface WorldHex {
  hex: Hex;
  pixel: Point;
  lon: number;
  lat: number;
  land: boolean;
  biome: BiomeKind;
  countryId: number | null;
  owner: number; // -1 = neutral/unowned land
  /** A visible resource deposit on this tile, if any (drives the resource-icon layer). */
  resource: ResourceKind | null;
  /** True if the tile borders the ocean (enables building a Port). */
  coastal: boolean;
}

export interface WorldCity {
  hex: Hex;
  pixel: Point;
  name: string;
  owner: number;
  mine: boolean;
}

export interface WorldBase {
  hex: Hex;
  pixel: Point;
  name: string;
  owner: number;
  mine: boolean;
}

export interface World {
  hexes: WorldHex[];
  byKey: Map<string, WorldHex>;
  cities: WorldCity[];
  cityByKey: Map<string, WorldCity>;
  bases: WorldBase[];
  baseByKey: Map<string, WorldBase>;
  bounds: { minX: number; minY: number; maxX: number; maxY: number };
}

/** Sparse, biome-appropriate resource deposit for a tile (deterministic). */
const resourceForHex = (biome: BiomeKind, h: Hex): ResourceKind | null => {
  const r = Math.abs(Math.imul(h.q * 2246822519, 1) ^ Math.imul(h.r * 3266489917, 1)) % 100;
  switch (biome) {
    case 'desert':
      return r < 18 ? 'fuel' : null;
    case 'mountains':
      return r < 20 ? 'materials' : null;
    case 'taiga':
      return r < 16 ? 'materials' : null;
    case 'tundra':
      return r < 9 ? 'materials' : null;
    case 'plains':
      return r < 13 ? 'food' : null;
    default:
      return null;
  }
};

const biomeForLat = (lat: number, h: Hex): BiomeKind => {
  const a = Math.abs(lat);
  // Deterministic sprinkle of mountains for visual texture (no elevation data here).
  const sprinkle = Math.abs(Math.imul(h.q * 374761393, 1) ^ Math.imul(h.r * 668265263, 1)) % 100;
  if (a >= 60) return sprinkle < 30 ? 'mountains' : 'tundra';
  if (a >= 45) return sprinkle < 25 ? 'mountains' : 'taiga';
  if (a >= 18 && a <= 33) return sprinkle < 20 ? 'mountains' : 'desert';
  return sprinkle < 12 ? 'mountains' : 'plains';
};

const ownerFor = (countryId: number | null): number =>
  countryId !== null ? (NATIONS[countryId]?.owner ?? -1) : -1;

let cached: World | null = null;

export const buildWorld = (): World => {
  if (cached) return cached;
  const t0 = performance.now();

  const fc = feature(
    countries50m as never,
    (countries50m as { objects: { countries: unknown } }).objects.countries as never,
  ) as unknown as FeatureCollection<Geometry, GeoJsonProperties>;
  const features = fc.features;
  const ids = features.map((f) => Number(f.id));

  // Rasterize the country polygons once to an offscreen canvas — each country's index is encoded
  // in the red channel. Classifying a hex is then an O(1) pixel read instead of a polygon
  // containment test, which is ~40× faster and lets us multi-sample cheaply for smoother coasts.
  const RW = 1600;
  const RH = Math.round((RW * (LAT_TOP - LAT_BOTTOM)) / 360);
  const raster: Uint8ClampedArray = (() => {
    const canvas = document.createElement('canvas');
    canvas.width = RW;
    canvas.height = RH;
    const ctx = canvas.getContext('2d')!;
    const projection = geoEquirectangular()
      .scale(RW / (2 * Math.PI))
      .center([0, (LAT_TOP + LAT_BOTTOM) / 2])
      .translate([RW / 2, RH / 2]);
    const path = geoPath(projection, ctx);
    ctx.clearRect(0, 0, RW, RH);
    features.forEach((f, i) => {
      ctx.fillStyle = `rgb(${i + 1},0,0)`;
      ctx.beginPath();
      path(f as never);
      ctx.fill();
    });
    return ctx.getImageData(0, 0, RW, RH).data;
  })();

  const idAtPixel = (lon: number, lat: number): number | null => {
    let px = Math.floor(((lon + 180) / 360) * RW);
    let py = Math.floor(((LAT_TOP - lat) / (LAT_TOP - LAT_BOTTOM)) * RH);
    if (px < 0) px = 0;
    else if (px >= RW) px = RW - 1;
    if (py < 0) py = 0;
    else if (py >= RH) py = RH - 1;
    const o = (py * RW + px) * 4;
    if (raster[o + 3]! < 100) return null; // ocean (transparent)
    const idx = raster[o]! - 1;
    return idx >= 0 && idx < ids.length ? ids[idx]! : null;
  };

  // Multi-sample a hex (centre + 4 offsets) and take the majority for land + country — smooths
  // the coastline and removes single-pixel speckle.
  const dLon = (360 / COLS) * 0.34;
  const dLat = ((LAT_TOP - LAT_BOTTOM) / ROWS) * 0.34;
  const SAMPLES: readonly (readonly [number, number])[] = [
    [0, 0],
    [dLon, dLat],
    [-dLon, dLat],
    [dLon, -dLat],
    [-dLon, -dLat],
  ];
  const classify = (lon: number, lat: number): number | null => {
    const votes = new Map<number, number>();
    let landVotes = 0;
    for (const [ox, oy] of SAMPLES) {
      const id = idAtPixel(lon + ox, lat + oy);
      if (id === null) continue;
      landVotes++;
      votes.set(id, (votes.get(id) ?? 0) + 1);
    }
    if (landVotes < 3) return null; // majority ocean
    return [...votes.entries()].sort((a, b) => b[1] - a[1])[0]![0];
  };

  // 1) Lay out the offset hex grid and record raw pixel positions + grid bounds.
  const raw: { hex: Hex; pixel: Point }[] = [];
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const q = col - (row - (row & 1)) / 2;
      const h = hex(q, row);
      const p = hexToPixel(h, HEX_SIZE);
      raw.push({ hex: h, pixel: p });
      if (p.x < minX) minX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.x > maxX) maxX = p.x;
      if (p.y > maxY) maxY = p.y;
    }
  }

  const toLonLat = (p: Point): { lon: number; lat: number } => ({
    lon: -180 + ((p.x - minX) / (maxX - minX)) * 360,
    lat: LAT_TOP - ((p.y - minY) / (maxY - minY)) * (LAT_TOP - LAT_BOTTOM),
  });

  // 2) Classify each hex by its centre.
  const hexes: WorldHex[] = raw.map(({ hex: h, pixel }) => {
    const { lon, lat } = toLonLat(pixel);
    const countryId = classify(lon, lat);
    const land = countryId !== null;
    const biome: BiomeKind = land ? biomeForLat(lat, h) : 'ocean';
    return {
      hex: h,
      pixel,
      lon,
      lat,
      land,
      biome,
      countryId,
      owner: ownerFor(countryId),
      resource: land ? resourceForHex(biome, h) : null,
      coastal: false,
    };
  });

  const byKey = new Map(hexes.map((wh) => [hexKey(wh.hex), wh]));
  const landNeighbours = (wh: WorldHex): WorldHex[] =>
    HEX_DIRECTIONS.map((d) => byKey.get(hexKey(hexAdd(wh.hex, d)))).filter(
      (n): n is WorldHex => !!n && n.land,
    );

  // 3) De-speckle: drop isolated land specks and fill interior ocean holes. Two passes give
  //    clean coastlines without erasing real (multi-hex) landmasses.
  for (let pass = 0; pass < 1; pass++) {
    for (const wh of hexes) {
      const land = landNeighbours(wh);
      if (wh.land && land.length <= 1) {
        // lone speck in the sea -> ocean
        wh.land = false;
        wh.countryId = null;
        wh.owner = -1;
        wh.biome = 'ocean';
        wh.resource = null;
      } else if (!wh.land && land.length >= 5) {
        // interior hole -> land, inherit the majority neighbour's country
        const votes = new Map<number, number>();
        for (const n of land) if (n.countryId !== null) votes.set(n.countryId, (votes.get(n.countryId) ?? 0) + 1);
        const winner = [...votes.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
        wh.land = true;
        wh.countryId = winner;
        wh.owner = ownerFor(winner);
        wh.biome = biomeForLat(wh.lat, wh.hex);
        wh.resource = resourceForHex(wh.biome, wh.hex);
      }
    }
  }

  // 4) Coastal pass: a land tile touching the ocean (or grid edge) can host a Port.
  for (const wh of hexes) {
    if (!wh.land) continue;
    wh.coastal = HEX_DIRECTIONS.some((d) => {
      const nb = byKey.get(hexKey(hexAdd(wh.hex, d)));
      return !nb || !nb.land;
    });
  }

  // 5) Place capitals/bases: lon/lat -> hex, then snap to the nearest land hex (prefer the same
  //    country) so markers never float in the ocean.
  const lonLatToHex = (lon: number, lat: number): Hex => {
    const x = minX + ((lon + 180) / 360) * (maxX - minX);
    const y = minY + ((LAT_TOP - lat) / (LAT_TOP - LAT_BOTTOM)) * (maxY - minY);
    return pixelToHex({ x, y }, HEX_SIZE);
  };

  const snapToLand = (target: Hex, preferCountry: number | null): Hex => {
    const here = byKey.get(hexKey(target));
    if (here?.land && (preferCountry === null || here.countryId === preferCountry)) return target;
    let fallback: Hex | null = null;
    for (const h of hexesInRange(target, 5)) {
      const wh = byKey.get(hexKey(h));
      if (!wh?.land) continue;
      if (preferCountry !== null && wh.countryId === preferCountry) return h;
      fallback ??= h;
    }
    return fallback ?? target;
  };

  const countryIdByOwner = new Map<number, number>();
  for (const [cid, n] of Object.entries(NATIONS)) countryIdByOwner.set(n.owner, Number(cid));

  /**
   * Place a marker: snap to nearby land of the owner's country; if still ocean (a small island
   * the grid is too coarse to capture, e.g. Hawaii for Pearl Base), promote the hex to a small
   * island owned by that nation so the marker never floats.
   */
  const placeMarker = (target: Hex, owner: number): Hex => {
    const countryId = countryIdByOwner.get(owner) ?? null;
    const h = snapToLand(target, countryId);
    const wh = byKey.get(hexKey(h));
    if (wh && !wh.land) {
      wh.land = true;
      wh.countryId = countryId;
      wh.owner = owner;
      wh.biome = 'plains';
      wh.resource = null;
      wh.coastal = true;
    }
    return h;
  };

  const cities: WorldCity[] = Object.values(NATIONS).map((n) => {
    const h = placeMarker(lonLatToHex(n.capital.lon, n.capital.lat), n.owner);
    return { hex: h, pixel: hexToPixel(h, HEX_SIZE), name: n.capital.name, owner: n.owner, mine: n.owner === 0 };
  });

  const bases: WorldBase[] = BASE_SITES.map((b) => {
    const h = placeMarker(lonLatToHex(b.lon, b.lat), b.owner);
    return { hex: h, pixel: hexToPixel(h, HEX_SIZE), name: b.name, owner: b.owner, mine: b.owner === 0 };
  });

  cached = {
    hexes,
    byKey,
    cities,
    cityByKey: new Map(cities.map((c) => [hexKey(c.hex), c])),
    bases,
    baseByKey: new Map(bases.map((b) => [hexKey(b.hex), b])),
    bounds: { minX, minY, maxX, maxY },
  };
  console.info(`[worldMap] built ${hexes.length} hexes in ${Math.round(performance.now() - t0)}ms`);
  return cached;
};
