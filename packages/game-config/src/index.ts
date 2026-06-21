/**
 * @civa/game-config — all tunable balance data in one place. Deliberately flat and small so the
 * game is legible at a glance (criterion: "understandable at first sight"). Final numbers are
 * tuned in Phase 10; these are sane starting values.
 *
 * Economy: 5 resources (food, materials, fuel, money, science) + Influence (victory currency).
 * No intermediate goods, no electricity. Fuel is the single military logistics resource and is
 * extracted directly. Buildings produce a final resource directly. Four unit roles.
 */
import type {
  BiomeKind,
  BuildingKind,
  ResourceBag,
  TechBranch,
  UnitKind,
} from '@civa/shared-types';

// ---------------------------------------------------------------------------
// Time / lifecycle (section 2.1, 3).
// ---------------------------------------------------------------------------

export const timeConfig = {
  tickSeconds: 30,
  yearSeconds: 20 * 60,
  assemblySeconds: 8 * 60,
  totalYears: 5,
} as const;

// ---------------------------------------------------------------------------
// Buildings — flat production. `produces`/`consumes` are per-tick flows; `cost` one-off.
// ---------------------------------------------------------------------------

export interface BuildingDef {
  readonly kind: BuildingKind;
  readonly cost: ResourceBag;
  /** Per-tick upkeep paid from the warehouse (building idles if unpaid). */
  readonly upkeep: ResourceBag;
  /** Per-tick output. */
  readonly produces: ResourceBag;
  /** Per-tick inputs required to produce. */
  readonly consumes: ResourceBag;
  /** Population working slots required to run at full output. */
  readonly workers: number;
  /** Unique per player (e.g. the Exchange). */
  readonly unique?: boolean;
  /** One-line "what it does" for the UI production preview. */
  readonly summary: string;
}

export const buildings: Record<BuildingKind, BuildingDef> = {
  farm: { kind: 'farm', cost: { materials: 40 }, upkeep: {}, produces: { food: 10 }, consumes: {}, workers: 2, summary: 'Grows food for population and armies.' },
  mine: { kind: 'mine', cost: { materials: 50 }, upkeep: {}, produces: { materials: 8 }, consumes: {}, workers: 3, summary: 'Extracts materials for building and units.' },
  fuel_rig: { kind: 'fuel_rig', cost: { materials: 80 }, upkeep: {}, produces: { fuel: 8 }, consumes: {}, workers: 2, summary: 'Produces fuel — the single military logistics resource.' },
  market: { kind: 'market', cost: { materials: 60 }, upkeep: {}, produces: { money: 12 }, consumes: {}, workers: 2, summary: 'Generates money from taxes and commerce.' },
  university: { kind: 'university', cost: { materials: 100 }, upkeep: { money: 5 }, produces: { science: 4 }, consumes: {}, workers: 4, summary: 'Generates science toward the tech tree.' },
  house: { kind: 'house', cost: { materials: 40 }, upkeep: { food: 4 }, produces: { population: 6 }, consumes: {}, workers: 0, summary: 'Adds population capacity (workers + taxes).' },
  air_defense: { kind: 'air_defense', cost: { materials: 90, money: 40 }, upkeep: { money: 3 }, produces: {}, consumes: {}, workers: 1, summary: 'Intercepts incoming aircraft and missiles.' },
  military_base: { kind: 'military_base', cost: { materials: 200, money: 500 }, upkeep: { money: 8 }, produces: {}, consumes: {}, workers: 4, summary: 'Forward garrison hub: store & project troops, fuel.' },
  warehouse: { kind: 'warehouse', cost: { materials: 120, money: 250 }, upkeep: {}, produces: {}, consumes: {}, workers: 1, summary: 'Adds global storage capacity for resources.' },
  airfield: { kind: 'airfield', cost: { materials: 80, money: 400 }, upkeep: { money: 4 }, produces: {}, consumes: {}, workers: 2, summary: 'Bases & refuels aircraft; extends air strike range.' },
  port: { kind: 'port', cost: { materials: 150, money: 450 }, upkeep: { money: 4 }, produces: { money: 4 }, consumes: {}, workers: 3, summary: 'Sea trade & cheaper exchange delivery (coastal).' },
  exchange: { kind: 'exchange', cost: { materials: 200, money: 600 }, upkeep: { money: 20 }, produces: {}, consumes: {}, workers: 6, unique: true, summary: 'Run the global market and earn commission.' },
  diplomatic_mission: { kind: 'diplomatic_mission', cost: { money: 300 }, upkeep: { money: 10 }, produces: {}, consumes: {}, workers: 2, unique: true, summary: 'Cheaper vote-buying and stronger pacts.' },
};

// ---------------------------------------------------------------------------
// Units — four roles. Strike range in hexes; attacking at range burns Fuel (~distance).
// ---------------------------------------------------------------------------

export interface UnitDef {
  readonly kind: UnitKind;
  /** Strike range in hexes. */
  readonly range: number;
  readonly cost: ResourceBag;
  /** Fuel per hex of distance when attacking at range. Defensive use costs none. */
  readonly fuelPerHex: number;
  /** Fraction of the target's resources stolen per hit (0 = cannot loot). */
  readonly lootFraction: number;
  /** Relative damage dealt to buildings/armor. */
  readonly damage: number;
  /** One-shot (missiles). */
  readonly disposable?: boolean;
  /** Ignores ground armor (aircraft). */
  readonly ignoresArmor?: boolean;
  readonly summary: string;
}

export const units: Record<UnitKind, UnitDef> = {
  infantry: { kind: 'infantry', range: 1, cost: { materials: 30, money: 50 }, fuelPerHex: 1, lootFraction: 0.15, damage: 2, summary: 'Cheap raiders — loot up to 15% per hit.' },
  tank: { kind: 'tank', range: 2, cost: { materials: 60, money: 120 }, fuelPerHex: 2, lootFraction: 0.05, damage: 6, summary: 'Breaks armor; medium damage, light loot.' },
  aircraft: { kind: 'aircraft', range: 5, cost: { materials: 40, money: 200 }, fuelPerHex: 3, lootFraction: 0, damage: 10, ignoresArmor: true, summary: 'Long reach, ignores armor; no loot.' },
  missile: { kind: 'missile', range: 10, cost: { materials: 80, money: 300 }, fuelPerHex: 1, lootFraction: 0, damage: 1000, disposable: true, summary: 'One-shot; flattens a building. Intercepted by Air Defense.' },
};

// ---------------------------------------------------------------------------
// Combat modifiers (section 6.1).
// ---------------------------------------------------------------------------

export const combatConfig = {
  /** Buildings in a city/base grant this armor bonus to the garrison. */
  garrisonArmorBonus: 0.3,
  /** Chance an Air Defense building intercepts an incoming aircraft/missile. */
  airDefenseInterceptChance: 0.5,
} as const;

// ---------------------------------------------------------------------------
// Biome output modifiers (section 4). Multipliers applied to a building's base output on that
// biome. Absent => 1.0. Drives the deficits that force trade & diplomacy.
// ---------------------------------------------------------------------------

export const biomeModifiers: Record<BiomeKind, Partial<Record<BuildingKind, number>>> = {
  desert: { fuel_rig: 1.6, farm: 0.4, mine: 0.7 },
  taiga: { mine: 1.4, farm: 0.7, fuel_rig: 0.6 },
  mountains: { mine: 1.6, farm: 0.4, fuel_rig: 0.5 },
  plains: { farm: 1.6, mine: 0.7, fuel_rig: 0.7 },
  tundra: { mine: 1.2, farm: 0.5, fuel_rig: 0.8 },
  ocean: {},
};

// ---------------------------------------------------------------------------
// Tech tree (section 5): 3 branches × 3 tiers. First to a tier wins an Influence bounty.
// ---------------------------------------------------------------------------

export const techConfig: Record<
  TechBranch,
  { readonly tierScienceCost: readonly [number, number, number]; readonly summary: string }
> = {
  economy: { tierScienceCost: [100, 250, 500], summary: '+output and storage; cheaper buildings.' },
  logistics: { tierScienceCost: [100, 250, 500], summary: '+unit range and -fuel per hex.' },
  military: { tierScienceCost: [120, 280, 560], summary: '+damage and -unit cost.' },
};

// ---------------------------------------------------------------------------
// Trade (section 7).
// ---------------------------------------------------------------------------

export const tradeConfig = {
  /** Fuel cost per hex of distance to move a lot to/from the Exchange. */
  exchangeFuelPerHex: 0.5,
  /** Default commission ceiling the Exchange owner may set, as a fraction. */
  maxExchangeCommission: 0.25,
} as const;

// ---------------------------------------------------------------------------
// Influence — the single victory currency. Four sources (one per strategy). These weights are
// the primary balance lever to keep all four win paths competitive.
// ---------------------------------------------------------------------------

export const influenceConfig = {
  /** Money spent to buy one unit of Influence ("a vote"). Expensive on purpose. */
  moneyPerVote: 250,
  /** Diplomatic Mission discount on vote price (fraction). */
  missionVoteDiscount: 0.25,
  /** One-time Influence for being first to reach a tech tier [t1, t2, t3]. */
  techRaceBounty: [10, 20, 35] as const,
  /** One-time Influence gained when a victim pays tribute for peace. */
  tributeInfluence: 15,
  /** Fraction of a vassal's Influence that flows to its overlord each tick. */
  vassalInfluenceShare: 0.5,
} as const;

// ---------------------------------------------------------------------------
// Victory — most Influence after 5 years is elected UN Leader. Vassals count toward their
// overlord's bloc; the final screen reveals the blocs.
// ---------------------------------------------------------------------------

export const victoryConfig = {
  totalYears: 5,
  title: 'UN Leader',
} as const;

// ---------------------------------------------------------------------------
// Playable nations (lobby selection). The server validates picks against this list and enforces
// uniqueness per room. `iso` ties a nation to its real-Earth territory on the map.
// ---------------------------------------------------------------------------

export interface NationOption {
  readonly id: string;
  readonly name: string;
  readonly iso: number; // ISO 3166-1 numeric (links to the map)
}

export const nations: readonly NationOption[] = [
  { id: 'usa', name: 'United States', iso: 840 },
  { id: 'china', name: 'China', iso: 156 },
  { id: 'russia', name: 'Russia', iso: 643 },
  { id: 'brazil', name: 'Brazil', iso: 76 },
  { id: 'germany', name: 'Germany', iso: 276 },
  { id: 'india', name: 'India', iso: 356 },
  { id: 'japan', name: 'Japan', iso: 392 },
  { id: 'egypt', name: 'Egypt', iso: 818 },
];

export const nationIds: readonly string[] = nations.map((n) => n.id);

/** Lobby sizing (design: 5–8 players). `minPlayers` is relaxed for dev testing. */
export const lobbyConfig = {
  minPlayers: 2,
  maxPlayers: 8,
} as const;
