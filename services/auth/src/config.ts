/** Environment-driven config for the auth service. */
export interface ServiceConfig {
  readonly service: string;
  readonly port: number;
  readonly env: string;
  readonly jwtSecret: string;
  readonly jwtIssuer: string;
  readonly accessTtl: string;
  readonly refreshTtl: string;
}

export const loadConfig = (): ServiceConfig => ({
  service: 'auth',
  port: Number(process.env.AUTH_PORT ?? 8081),
  env: process.env.NODE_ENV ?? 'development',
  jwtSecret: process.env.JWT_SECRET ?? 'dev-only-change-me',
  jwtIssuer: process.env.JWT_ISSUER ?? 'civa',
  accessTtl: process.env.ACCESS_TTL ?? '15m',
  refreshTtl: process.env.REFRESH_TTL ?? '30d',
});
