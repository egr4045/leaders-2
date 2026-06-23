/**
 * Game manifest — how the orchestrator wakes and reaps a game. Adding a game = one entry (plus
 * its compose file). The launcher routes by `id`; the orchestrator starts the game's compose
 * project on demand and stops it after `idleMs` with zero players.
 */
export interface GameManifest {
  id: string;
  name: string;
  /** Directory containing the game's docker-compose.yml (managed by the orchestrator). */
  composeDir: string;
  /** `docker compose -p <project>` name. */
  composeProject: string;
  /** URL the orchestrator polls for the live player count — returns `{ players: number }`. */
  activityUrl: string;
  /** Stop the game after this many ms with zero players. */
  idleMs: number;
  /** Never reaped (e.g. shared, always-on services). */
  alwaysOn?: boolean;
}
