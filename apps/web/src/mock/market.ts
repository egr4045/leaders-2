/**
 * Mock global exchange (section 7.1): a public order book per resource. To post or take a lot
 * the player pays fuel for delivery (~distance to the exchange) and the exchange owner's
 * commission in money. Only physical goods trade here: food, materials, fuel.
 * Phase 6 replaces this with the real trade service.
 */
import { tradeConfig } from '@civa/game-config';
import { MARKET_RESOURCES, type MarketResource } from '@civa/shared-types';
import { RESOURCE_ICON } from './playerState.js';

export { RESOURCE_ICON };

export interface MarketOrder {
  id: string;
  side: 'buy' | 'sell';
  resource: MarketResource;
  qty: number;
  /** Money per unit. */
  price: number;
  owner: string; // nation name
  /** Hex distance from the lot to the exchange (drives fuel delivery cost). */
  distance: number;
}

/** Exchange owner's commission (money), and the public fuel-per-hex delivery rate. */
export const COMMISSION = 0.05;
export const FUEL_PER_HEX = tradeConfig.exchangeFuelPerHex;

/** Physical goods that trade on the exchange. */
export const TRADABLE: MarketResource[] = [...MARKET_RESOURCES];

export const marketOrders: MarketOrder[] = [
  { id: 'o1', side: 'sell', resource: 'fuel', qty: 120, price: 4.2, owner: 'Russia', distance: 14 },
  { id: 'o2', side: 'sell', resource: 'fuel', qty: 80, price: 4.5, owner: 'Brazil', distance: 22 },
  { id: 'o3', side: 'buy', resource: 'fuel', qty: 60, price: 3.9, owner: 'Germany', distance: 9 },
  { id: 'o4', side: 'buy', resource: 'fuel', qty: 100, price: 3.6, owner: 'India', distance: 18 },
  { id: 'o5', side: 'sell', resource: 'materials', qty: 200, price: 2.1, owner: 'China', distance: 26 },
  { id: 'o6', side: 'buy', resource: 'materials', qty: 150, price: 1.8, owner: 'Brazil', distance: 12 },
  { id: 'o7', side: 'sell', resource: 'materials', qty: 90, price: 2.3, owner: 'Germany', distance: 9 },
  { id: 'o8', side: 'buy', resource: 'food', qty: 120, price: 1.3, owner: 'China', distance: 26 },
  { id: 'o9', side: 'sell', resource: 'food', qty: 300, price: 1.2, owner: 'India', distance: 18 },
  { id: 'o10', side: 'buy', resource: 'food', qty: 90, price: 1.1, owner: 'Russia', distance: 14 },
];

export const fuelCost = (distance: number, qty: number): number =>
  Math.round(distance * FUEL_PER_HEX * Math.max(1, qty / 50) * 10) / 10;

/**
 * Domestic trade (internal): convert resources ⇄ money instantly at deliberately poor rates —
 * a liquidity option that's worse than the exchange but needs no fuel or counterpart.
 */
export const BASE_PRICE: Record<MarketResource, number> = {
  food: 1.4,
  materials: 2.2,
  fuel: 4.2,
};
export const DOMESTIC_SELL_RATE = 0.65; // you receive 65% of base value
export const DOMESTIC_BUY_RATE = 1.45; // you pay 145% of base value
