/**
 * Core simulation state shapes. This is the authoritative snapshot the engine stores and
 * hands back on reconnect (`getState`). It grows module-by-module across phases 3–9; here we
 * establish the spine: tick/phase/year + per-player warehouses.
 */
import type { GamePhase, PlayerId, ResourceBag } from '@civa/shared-types';

export interface PlayerState {
  readonly id: PlayerId;
  readonly nationId: string;
  /** Accumulated resources on the global warehouse (electricity is never stored here). */
  readonly warehouse: ResourceBag;
  /** Hidden aggression index in credits (section 6.3); revealed during the assembly. */
  readonly aggression: number;
}

export interface GameState {
  readonly tick: number;
  readonly phase: GamePhase;
  /** 1..TOTAL_YEARS. */
  readonly year: number;
  readonly seed: number;
  readonly players: Readonly<Record<string, PlayerState>>;
}

export const createInitialState = (params: {
  seed: number;
  players: ReadonlyArray<{ id: PlayerId; nationId: string; warehouse?: ResourceBag }>;
}): GameState => ({
  tick: 0,
  phase: 'year',
  year: 1,
  seed: params.seed,
  players: Object.fromEntries(
    params.players.map((p) => [
      p.id,
      { id: p.id, nationId: p.nationId, warehouse: p.warehouse ?? {}, aggression: 0 },
    ]),
  ),
});
