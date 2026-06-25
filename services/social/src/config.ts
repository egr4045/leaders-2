/** Environment-driven config for the social service (friends + presence). */
export interface ServiceConfig {
  readonly service: string;
  readonly port: number;
  readonly env: string;
  readonly jwtSecret: string;
  readonly jwtIssuer: string;
  /** Allowed CORS origin for the Socket.io server. */
  readonly corsOrigin: string;
}

export const loadConfig = (): ServiceConfig => ({
  service: 'social',
  port: Number(process.env.SOCIAL_PORT ?? 8083),
  env: process.env.NODE_ENV ?? 'development',
  jwtSecret: process.env.JWT_SECRET ?? 'dev-only-change-me',
  jwtIssuer: process.env.JWT_ISSUER ?? 'civa',
  corsOrigin: process.env.CORS_ORIGIN ?? '*',
});
