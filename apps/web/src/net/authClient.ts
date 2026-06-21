/**
 * Auth client: passwordless dev login + session persistence. The accountId is stored so a reload
 * re-claims the *same* account (durable identity) — that's what lets the lobby restore your seat.
 */
import type { LoginResponse } from '@civa/protocol';
import { AUTH_URL } from './config.js';

export interface Session {
  accountId: string;
  displayName: string;
  accessToken: string;
  refreshToken: string;
}

const KEY = 'civa.session';

export const loadSession = (): Session | null => {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
};

export const saveSession = (s: Session): void => localStorage.setItem(KEY, JSON.stringify(s));
export const clearSession = (): void => localStorage.removeItem(KEY);

/** Log in (or re-claim `accountId`) and persist the fresh tokens. */
export const login = async (displayName: string, accountId?: string): Promise<Session> => {
  const res = await fetch(`${AUTH_URL}/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ displayName, accountId }),
  });
  if (!res.ok) throw new Error(`login failed (${res.status})`);
  const session = (await res.json()) as LoginResponse;
  saveSession(session);
  return session;
};
