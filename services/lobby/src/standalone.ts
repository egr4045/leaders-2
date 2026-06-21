/**
 * Standalone entry: runs the lobby in isolation with in-memory adapters and no real
 * infrastructure. JWTs are verified with the shared dev secret (the auth service issues them).
 */
import { createAuthCore } from '@civa/auth-core';
import { loadConfig } from './config.js';
import { createConsoleLogger } from './logger.js';
import { createLobbyServer } from './server.js';
import { createMemoryLobbyStore } from './store.js';

const config = loadConfig();
const logger = createConsoleLogger({ svc: config.service, mode: 'standalone' });
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

httpServer.listen(config.port, () => logger.info('listening (standalone)', { port: config.port }));
