/** Production entry: real adapters (system clock, console logger, in-memory lobby store). */
import { createAuthCore } from '@civa/auth-core';
import { loadConfig } from './config.js';
import { createConsoleLogger } from './logger.js';
import { createLobbyServer } from './server.js';
import { createMemoryLobbyStore } from './store.js';

const config = loadConfig();
const logger = createConsoleLogger({ svc: config.service });
const auth = createAuthCore({
  secret: config.jwtSecret,
  issuer: config.jwtIssuer,
  accessTtl: '15m',
  refreshTtl: '30d',
});
const { httpServer } = createLobbyServer({
  auth,
  store: createMemoryLobbyStore(),
  logger,
  corsOrigin: config.corsOrigin,
  graceMs: config.graceMs,
});

httpServer.listen(config.port, () => logger.info('listening', { port: config.port, mode: 'production' }));
