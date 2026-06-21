import { z } from 'zod';
import { errorSchema } from './errors.js';

/**
 * Lobby contract (Socket.io). Messages are named events whose payloads are validated by these
 * schemas. A player is identified by their account (from the JWT), so reconnects re-attach to the
 * same seat and a second device shares one seat.
 */

export const lobbyStatus = z.enum(['waiting', 'starting', 'started']);
export type LobbyStatus = z.infer<typeof lobbyStatus>;

export const lobbyPlayer = z.object({
  accountId: z.string(),
  displayName: z.string(),
  nation: z.string().nullable(),
  ready: z.boolean(),
  /** False while every device of this account is disconnected (seat is held during the grace window). */
  connected: z.boolean(),
  isHost: z.boolean(),
});
export type LobbyPlayer = z.infer<typeof lobbyPlayer>;

export const lobbyRoom = z.object({
  id: z.string(),
  name: z.string(),
  status: lobbyStatus,
  players: z.array(lobbyPlayer),
  minPlayers: z.number().int(),
  maxPlayers: z.number().int(),
});
export type LobbyRoom = z.infer<typeof lobbyRoom>;

export const roomSummary = z.object({
  id: z.string(),
  name: z.string(),
  playerCount: z.number().int(),
  maxPlayers: z.number().int(),
  status: lobbyStatus,
});
export type RoomSummary = z.infer<typeof roomSummary>;

// --- Client -> Server events -------------------------------------------------
export const C2S = {
  create: 'lobby.create',
  join: 'lobby.join',
  leave: 'lobby.leave',
  pickNation: 'lobby.pickNation',
  ready: 'lobby.ready',
  start: 'lobby.start',
  getState: 'lobby.getState',
} as const;

export const createPayload = z.object({ name: z.string().max(40).optional() });
export const joinPayload = z.object({ roomId: z.string() });
export const leavePayload = z.object({}).strict();
export const pickNationPayload = z.object({ nation: z.string().nullable() });
export const readyPayload = z.object({ ready: z.boolean() });
export const startPayload = z.object({}).strict();
export const getStatePayload = z.object({}).strict();

export type CreatePayload = z.infer<typeof createPayload>;
export type JoinPayload = z.infer<typeof joinPayload>;
export type PickNationPayload = z.infer<typeof pickNationPayload>;
export type ReadyPayload = z.infer<typeof readyPayload>;

// --- Server -> Client events -------------------------------------------------
export const S2C = {
  rooms: 'lobby.rooms',
  state: 'lobby.state',
  started: 'lobby.started',
  error: 'lobby.error',
} as const;

export const roomsEvent = z.object({ rooms: z.array(roomSummary) });
export const stateEvent = z.object({ room: lobbyRoom.nullable() });
export const startedEvent = z.object({ roomId: z.string(), sessionId: z.string() });
export const errorEvent = errorSchema;

export type RoomsEvent = z.infer<typeof roomsEvent>;
export type StateEvent = z.infer<typeof stateEvent>;
export type StartedEvent = z.infer<typeof startedEvent>;
