import type { GameManifest } from './manifest.js';

export interface ServiceConfig {
  readonly service: string;
  readonly port: number;
  readonly reaperMs: number;
  readonly games: GameManifest[];
}

/** Game registry from env. Add a game = one entry here (+ its compose). */
const defaultGames = (): GameManifest[] => [
  {
    id: 'civa',
    name: 'CIVA',
    composeDir: process.env.CIVA_GAME_DIR ?? '/root/civa/deploy/civa-game',
    composeProject: process.env.CIVA_GAME_PROJECT ?? 'civa-game',
    activityUrl: process.env.CIVA_ACTIVITY_URL ?? 'http://lobby:8082/metrics',
    idleMs: Number(process.env.CIVA_IDLE_MS ?? 10 * 60 * 1000),
  },
  {
    id: 'svoyak',
    name: 'Своя игра',
    composeDir: process.env.SVOYAK_GAME_DIR ?? '/root/civa/deploy/svoyak',
    composeProject: process.env.SVOYAK_GAME_PROJECT ?? 'svoyak',
    activityUrl: process.env.SVOYAK_ACTIVITY_URL ?? 'http://svoyak:8089/metrics',
    idleMs: Number(process.env.SVOYAK_IDLE_MS ?? 10 * 60 * 1000),
  },
];

export const loadConfig = (): ServiceConfig => ({
  service: 'orchestrator',
  port: Number(process.env.ORCHESTRATOR_PORT ?? 8090),
  reaperMs: Number(process.env.REAPER_MS ?? 30_000),
  games: defaultGames(),
});
