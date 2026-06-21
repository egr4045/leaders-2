/**
 * @civa/sim-core — the pure, deterministic heart of the game.
 *
 * The whole simulation is a single function:
 *
 *     tick(state, commands, ctx) -> { state, events }
 *
 * No I/O, no clocks, no Math.random. Given the same (state, commands, seed) it always
 * produces the same (state, events). The game-engine service wraps this with the real
 * clock, networking and persistence; tests drive it directly from fixtures and replay a
 * command journal to reproduce any match exactly.
 *
 * Economy, combat, logistics, trade resolution and aggression accounting are added here as
 * reducers across phases 4–6; phase 3 establishes this contract and the determinism guarantee.
 */
import type { PlayerId, ResourceBag } from '@civa/shared-types';
import { rngForTick, type Rng } from './rng.js';
import type { GameState, PlayerState } from './state.js';

export * from './rng.js';
export * from './state.js';

// ---------------------------------------------------------------------------
// Commands (player intent) and events (what happened). Both are discriminated unions
// that each module extends. Phase 0 ships a debug command so the contract is exercisable.
// ---------------------------------------------------------------------------

export interface BaseCommand {
  readonly type: string;
  readonly playerId: PlayerId;
}

/** Dev/test-only: deposit resources, used to prove the reducer + determinism wiring. */
export interface DebugGrantCommand extends BaseCommand {
  readonly type: 'debug.grant';
  readonly resources: ResourceBag;
}

export type Command = DebugGrantCommand;

export interface BaseEvent {
  readonly type: string;
}

export interface ResourcesChangedEvent extends BaseEvent {
  readonly type: 'resourcesChanged';
  readonly playerId: PlayerId;
  readonly delta: ResourceBag;
}

export type GameEvent = ResourcesChangedEvent;

export interface TickContext {
  /** Per-tick RNG; derived deterministically from the state's seed + tick number. */
  readonly rng: Rng;
}

export interface TickResult {
  readonly state: GameState;
  readonly events: readonly GameEvent[];
}

// ---------------------------------------------------------------------------
// Pure helpers.
// ---------------------------------------------------------------------------

export const addBags = (a: ResourceBag, b: ResourceBag): ResourceBag => {
  const out: ResourceBag = { ...a };
  for (const k of Object.keys(b) as (keyof ResourceBag)[]) {
    out[k] = (out[k] ?? 0) + (b[k] ?? 0);
  }
  return out;
};

const applyCommand = (
  player: PlayerState,
  command: Command,
): { player: PlayerState; events: GameEvent[] } => {
  switch (command.type) {
    case 'debug.grant': {
      return {
        player: { ...player, warehouse: addBags(player.warehouse, command.resources) },
        events: [{ type: 'resourcesChanged', playerId: player.id, delta: command.resources }],
      };
    }
    default:
      return { player, events: [] };
  }
};

/**
 * Advance the simulation by exactly one tick. Commands are applied in array order
 * (the engine is responsible for a deterministic ordering before calling this).
 */
export const tick = (
  state: GameState,
  commands: readonly Command[],
  ctx: TickContext = { rng: rngForTick(state.seed, state.tick) },
): TickResult => {
  void ctx; // reserved for stochastic resolution (combat, events) in later phases
  const players: Record<string, PlayerState> = { ...state.players };
  const events: GameEvent[] = [];

  for (const command of commands) {
    const current = players[command.playerId];
    if (!current) continue; // unknown player -> ignored (server validates before this point)
    const result = applyCommand(current, command);
    players[command.playerId] = result.player;
    events.push(...result.events);
  }

  return {
    state: { ...state, tick: state.tick + 1, players },
    events,
  };
};

/** Replay a journal of per-tick command batches from an initial state — the regression tool. */
export const replay = (
  initial: GameState,
  journal: ReadonlyArray<readonly Command[]>,
): GameState => {
  let state = initial;
  for (const batch of journal) {
    state = tick(state, batch).state;
  }
  return state;
};
