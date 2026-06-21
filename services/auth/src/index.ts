/** Production entry: real adapters (system clock, console logger, in-memory account store). */
import { createAuthCore } from '@civa/auth-core';
import { createApp } from './app.js';
import { loadConfig } from './config.js';
import { createConsoleLogger } from './logger.js';
import { createMemoryAccountStore } from './store.js';

const config = loadConfig();
const logger = createConsoleLogger({ svc: config.service });
const auth = createAuthCore({
  secret: config.jwtSecret,
  issuer: config.jwtIssuer,
  accessTtl: config.accessTtl,
  refreshTtl: config.refreshTtl,
});
const app = createApp({ clock: { now: () => Date.now() }, logger, auth, accounts: createMemoryAccountStore() });

app.listen(config.port, () => logger.info('listening', { port: config.port, mode: 'production' }));
