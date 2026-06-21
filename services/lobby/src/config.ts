/** Environment-driven config for the lobby service. */
export interface ServiceConfig {
  readonly service: string;
  readonly port: number;
  readonly env: string;
  readonly jwtSecret: string;
  readonly jwtIssuer: string;
  /** How long a fully-disconnected player keeps their seat before being dropped (ms). */
  readonly graceMs: number;
  /** Allowed CORS origin for the Socket.io server. */
  readonly corsOrigin: string;
}

export const loadConfig = (): ServiceConfig => ({
  service: 'lobby',
  port: Number(process.env.LOBBY_PORT ?? 8082),
  env: process.env.NODE_ENV ?? 'development',
  jwtSecret: process.env.JWT_SECRET ?? 'dev-only-change-me',
  jwtIssuer: process.env.JWT_ISSUER ?? 'civa',
  graceMs: Number(process.env.LOBBY_GRACE_MS ?? 60_000),
  corsOrigin: process.env.CORS_ORIGIN ?? '*',
});
