/**
 * Builders for deterministic test/mocks state. The mock-server in Phase 1 and the contract
 * tests in every later phase build their worlds from these so fixtures stay consistent.
 */
import { asPlayerId } from '@civa/shared-types';
import { createInitialState, type GameState } from '@civa/sim-core';

export interface FixturePlayer {
  id: string;
  nationId: string;
  money?: number;
}

/** A small, balanced lobby of N players with equal starting money — handy default world. */
export const makeGameState = (
  players: FixturePlayer[] = [
    { id: 'p1', nationId: 'usa', money: 1000 },
    { id: 'p2', nationId: 'china', money: 1000 },
  ],
  seed = 20260616,
): GameState =>
  createInitialState({
    seed,
    players: players.map((p) => ({
      id: asPlayerId(p.id),
      nationId: p.nationId,
      warehouse: { money: p.money ?? 1000 },
    })),
  });
