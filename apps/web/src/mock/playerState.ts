/**
 * Mock player-facing snapshot for Phase 1 screens. Phase 1.2 serves this through the protocol
 * contract; later phases replace it with real engine state. Deterministic values only.
 *
 * Economy is flat: 5 resources (money/food/materials/fuel/science) + population (a stat) +
 * Influence (the victory currency, shown prominently).
 */
import type { ResourceKind } from '@civa/shared-types';

export interface ResourceRow {
  kind: ResourceKind;
  amount: number;
  /** Net change per tick (can be negative). */
  delta: number;
}

/** The 5 economic resources + population, shown in the top bar. Influence is shown separately. */
export const mockResources: ResourceRow[] = [
  { kind: 'money', amount: 1240, delta: 18 },
  { kind: 'food', amount: 540, delta: 6 },
  { kind: 'materials', amount: 310, delta: 5 },
  { kind: 'fuel', amount: 88, delta: 2 },
  { kind: 'science', amount: 130, delta: 4 },
  { kind: 'population', amount: 36, delta: 1 },
];

/** Current Influence and its per-tick gain (the victory currency). */
export const mockInfluence = { amount: 42, delta: 3 };

export const RESOURCE_LABEL: Record<ResourceKind, string> = {
  money: 'Money',
  food: 'Food',
  materials: 'Materials',
  fuel: 'Fuel',
  science: 'Science',
  population: 'Population',
  influence: 'Influence',
};

export const RESOURCE_ICON: Record<ResourceKind, string> = {
  money: '💰',
  food: '🌾',
  materials: '🧱',
  fuel: '⛽',
  science: '🔬',
  population: '👥',
  influence: '⭐',
};

export type FeedKind = 'combat' | 'trade' | 'diplomacy' | 'world';

export interface FeedEvent {
  id: string;
  kind: FeedKind;
  text: string;
  /** Ticks ago (for the relative timestamp). */
  ago: number;
}

export const mockFeed: FeedEvent[] = [
  { id: 'e1', kind: 'combat', text: 'Your Air Defense intercepted a missile aimed at Chicago.', ago: 1 },
  { id: 'e2', kind: 'trade', text: 'Beijing offers 50 fuel for 30 materials on the shadow market.', ago: 2 },
  { id: 'e3', kind: 'combat', text: 'Infantry raided Shanghai — looted 14 materials.', ago: 4 },
  { id: 'e4', kind: 'diplomacy', text: 'Brazil invited you to a private caucus.', ago: 5 },
  { id: 'e5', kind: 'world', text: 'Fuel prices surged on the global exchange.', ago: 8 },
];

export interface MockPlayerCard {
  id: number;
  name: string;
  nation: string;
  speaking: boolean;
  muted: boolean;
}

export const mockCaucus: MockPlayerCard[] = [
  { id: 0, name: 'You', nation: 'USA', speaking: false, muted: false },
  { id: 1, name: 'Mara', nation: 'Brazil', speaking: true, muted: false },
  { id: 2, name: 'Wei', nation: 'China', speaking: false, muted: true },
];
