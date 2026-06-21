/**
 * Mock per-location detail (cities + military bases): the building slots inside, and the
 * garrison stationed there — troops + fuel that the player can move between locations
 * (section 6 logistics). Keyed by hexKey so the map selection resolves straight to a location.
 *
 * Deterministic (hash-seeded) so the UI is stable. Replaced by server state in later phases.
 */
import { hexKey } from '@civa/hex-core';
import type { UnitKind } from '@civa/shared-types';
import { buildWorld } from '../map/worldMap.js';

export type LocationType = 'city' | 'base';

export interface Slot {
  /** Building key (matches @civa/game-config building kinds). */
  building: string | null;
}

export interface Garrison {
  troops: Partial<Record<UnitKind, number>>;
  /** Single military logistics resource. */
  fuel: number;
}

export interface BuildTask {
  building: string;
  ticksLeft: number;
  ticksTotal: number;
}

export interface LocationInfo {
  key: string;
  name: string;
  type: LocationType;
  owner: number;
  mine: boolean;
  slots: Slot[];
  garrison: Garrison;
  /** In-progress construction at this location (section 5). */
  queue: BuildTask[];
}

export const BUILDING_LABEL: Record<string, { label: string; icon: string }> = {
  farm: { label: 'Farm', icon: '🌾' },
  mine: { label: 'Mine', icon: '🧱' },
  fuel_rig: { label: 'Fuel Rig', icon: '⛽' },
  market: { label: 'Market', icon: '💰' },
  university: { label: 'University', icon: '🔬' },
  house: { label: 'Housing', icon: '🏘️' },
  air_defense: { label: 'Air Defense', icon: '🎯' },
  military_base: { label: 'Military Base', icon: '⭐' },
  warehouse: { label: 'Warehouse', icon: '📦' },
  airfield: { label: 'Airfield', icon: '🛫' },
  port: { label: 'Port', icon: '⚓' },
  exchange: { label: 'Exchange', icon: '💱' },
  diplomatic_mission: { label: 'Dip. Mission', icon: '🕊️' },
};

const UNIT_LABEL: Record<UnitKind, { label: string; icon: string }> = {
  infantry: { label: 'Infantry', icon: '🪖' },
  tank: { label: 'Tank', icon: '🛡️' },
  aircraft: { label: 'Aircraft', icon: '✈️' },
  missile: { label: 'Missile', icon: '🚀' },
};
export { UNIT_LABEL };

const CITY_SLOTS = ['farm', 'mine', 'market', 'university', 'house', null];
const BASE_SLOTS = ['warehouse', 'airfield', 'air_defense', null, null, null];

const hash = (s: string): number => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
};

const queueFor = (seed: number, type: LocationType, mine: boolean): BuildTask[] => {
  if (!mine) return [];
  const pool = type === 'base' ? ['airfield', 'air_defense', 'warehouse'] : ['university', 'market', 'house'];
  const count = 1 + (seed % 2); // 1..2 items so the queue is always visible
  return Array.from({ length: count }, (_, i) => {
    const total = 6 + ((seed >> (i * 3)) % 8);
    return {
      building: pool[(seed >> i) % pool.length]!,
      ticksTotal: total,
      ticksLeft: 1 + ((seed >> (i * 2)) % total),
    };
  });
};

const garrisonFor = (seed: number, type: LocationType, mine: boolean): Garrison => {
  const k = mine ? 1.6 : 1;
  const v = (n: number, max: number) => Math.floor((hash(`${seed}:${n}`) % (max + 1)) * k);
  return type === 'base'
    ? {
        troops: {
          infantry: 4 + v(1, 6),
          tank: 2 + v(2, 4),
          aircraft: 1 + v(3, 3),
          missile: v(4, 2),
        },
        fuel: 40 + v(8, 60),
      }
    : {
        troops: { infantry: 3 + v(1, 5), tank: 1 + v(2, 3) },
        fuel: 20 + v(8, 40),
      };
};

let cache: Map<string, LocationInfo> | null = null;

export const getLocations = (): Map<string, LocationInfo> => {
  if (cache) return cache;
  const world = buildWorld();
  const map = new Map<string, LocationInfo>();

  for (const c of world.cities) {
    const key = hexKey(c.hex);
    map.set(key, {
      key,
      name: c.name,
      type: 'city',
      owner: c.owner,
      mine: c.mine,
      slots: CITY_SLOTS.map((b, i) => ({ building: hash(`${c.name}:${i}`) % 5 === 0 ? null : b })),
      garrison: garrisonFor(hash(c.name), 'city', c.mine),
      queue: queueFor(hash(c.name), 'city', c.mine),
    });
  }
  for (const b of world.bases) {
    const key = hexKey(b.hex);
    map.set(key, {
      key,
      name: b.name,
      type: 'base',
      owner: b.owner,
      mine: b.mine,
      slots: BASE_SLOTS.map((bld) => ({ building: bld })),
      garrison: garrisonFor(hash(b.name), 'base', b.mine),
      queue: queueFor(hash(b.name), 'base', b.mine),
    });
  }
  cache = map;
  return cache;
};

/** All of the local player's locations — used by the transfer dialog as move targets. */
export const myLocations = (): LocationInfo[] => [...getLocations().values()].filter((l) => l.mine);

export const totalTroops = (g: Garrison): number =>
  Object.values(g.troops).reduce((a, b) => a + (b ?? 0), 0);
