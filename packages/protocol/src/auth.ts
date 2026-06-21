import { z } from 'zod';

/**
 * Auth contract (HTTP). Dev login is passwordless — a player just claims a display name and gets
 * an account + JWTs. The account is the durable identity; sessions bind to it, not to a tab.
 */

export const loginRequest = z.object({
  displayName: z.string().min(1).max(32),
  /** Optional: re-claim an existing account id (e.g. persisted in localStorage). */
  accountId: z.string().optional(),
});
export type LoginRequest = z.infer<typeof loginRequest>;

export const loginResponse = z.object({
  accountId: z.string(),
  displayName: z.string(),
  accessToken: z.string(),
  refreshToken: z.string(),
});
export type LoginResponse = z.infer<typeof loginResponse>;

export const refreshRequest = z.object({ refreshToken: z.string() });
export type RefreshRequest = z.infer<typeof refreshRequest>;

export const refreshResponse = z.object({ accessToken: z.string() });
export type RefreshResponse = z.infer<typeof refreshResponse>;

/** Verified JWT claims. `sub` is the accountId. */
export interface AuthClaims {
  sub: string;
  name: string;
  /** 'access' | 'refresh' — refresh tokens cannot authenticate a socket. */
  typ: 'access' | 'refresh';
}
