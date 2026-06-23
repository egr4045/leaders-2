/** Standalone entry: in-memory fake Docker (no real containers) so the API can be exercised alone. */
import { createApp } from './app.js';
import { loadConfig } from './config.js';
import { createConsoleLogger } from './logger.js';
import { Orchestrator } from './orchestrator.js';
import type { ActivityProbe, ContainerRuntime, GameStatus } from './ports.js';

const states = new Map<string, GameStatus>();
const fakeRuntime: ContainerRuntime = {
  async status(g) {
    return states.get(g.id) ?? 'stopped';
  },
  async up(g) {
    states.set(g.id, 'running');
  },
  async down(g) {
    states.set(g.id, 'stopped');
  },
};
const fakeProbe: ActivityProbe = { async players() {
  return 0;
} };

const config = loadConfig();
const logger = createConsoleLogger({ svc: config.service, mode: 'standalone' });
const orch = new Orchestrator(config.games, {
  runtime: fakeRuntime,
  probe: fakeProbe,
  clock: { now: () => Date.now() },
  logger,
});

createApp(orch, logger).listen(config.port, () =>
  logger.info('listening (standalone, fake docker)', { port: config.port }),
);
