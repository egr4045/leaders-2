/**
 * Swappable infrastructure for the orchestrator. Real adapters drive Docker / HTTP; fakes drive
 * the isolated tests. (Ports & adapters — the isolation contract.)
 */
import type { GameManifest } from './manifest.js';

export type GameStatus = 'running' | 'stopped';

/** Starts/stops/inspects a game's container stack. */
export interface ContainerRuntime {
  status(game: GameManifest): Promise<GameStatus>;
  up(game: GameManifest): Promise<void>;
  down(game: GameManifest): Promise<void>;
}

/** Reads a running game's current player count (used to decide idleness). */
export interface ActivityProbe {
  players(game: GameManifest): Promise<number>;
}
