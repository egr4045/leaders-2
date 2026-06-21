/** Endpoints for the auth + lobby services. Override via Vite env vars in other environments. */
export const AUTH_URL = (import.meta.env.VITE_AUTH_URL as string | undefined) ?? 'http://localhost:8081';
export const LOBBY_URL = (import.meta.env.VITE_LOBBY_URL as string | undefined) ?? 'http://localhost:8082';
