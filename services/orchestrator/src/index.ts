/** Production entry: real Docker + HTTP adapters, periodic reaper. */
import { createApp } from './app.js';
import { loadConfig } from './config.js';
import { createConsoleLogger } from './logger.js';
import { dockerRuntime } from './docker.js';
import { httpProbe } from './probe.js';
import { Orchestrator } from './orchestrator.js';

const config = loadConfig();
const logger = createConsoleLogger({ svc: config.service });

const orch = new Orchestrator(config.games, {
  runtime: dockerRuntime,
  probe: httpProbe,
  clock: { now: () => Date.now() },
  logger,
});
orch.startReaper(config.reaperMs);

createApp(orch, logger).listen(config.port, () =>
  logger.info('listening', { port: config.port, games: config.games.map((g) => g.id), reaperMs: config.reaperMs }),
);
