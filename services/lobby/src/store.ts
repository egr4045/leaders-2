import { randomUUID } from 'node:crypto';

/**
 * In-memory lobby store (a port — a Redis adapter swaps in later). Holds richer server-side
 * records than the wire snapshot: a player tracks its connected sockets (multi-device) and a
 * grace timer (held seat during a brief disconnect).
 */
export type RoomStatus = 'waiting' | 'starting' | 'started';

export interface PlayerRecord {
  accountId: string;
  displayName: string;
  nation: string | null;
  ready: boolean;
  /** Connected socket ids for this account (>1 = multi-device, 0 = disconnected). */
  sockets: Set<string>;
  graceTimer?: ReturnType<typeof setTimeout>;
}

export interface RoomRecord {
  id: string;
  name: string;
  hostAccountId: string;
  status: RoomStatus;
  players: Map<string, PlayerRecord>;
  sessionId?: string;
}

export interface LobbyStore {
  list(): RoomRecord[];
  get(id: string): RoomRecord | undefined;
  create(name: string, hostAccountId: string): RoomRecord;
  remove(id: string): void;
  /** The room a player currently belongs to (a player is in at most one room). */
  roomOfAccount(accountId: string): RoomRecord | undefined;
}

export const createMemoryLobbyStore = (): LobbyStore => {
  const rooms = new Map<string, RoomRecord>();
  return {
    list: () => [...rooms.values()],
    get: (id) => rooms.get(id),
    create: (name, hostAccountId) => {
      const room: RoomRecord = {
        id: randomUUID().slice(0, 8),
        name,
        hostAccountId,
        status: 'waiting',
        players: new Map(),
      };
      rooms.set(room.id, room);
      return room;
    },
    remove: (id) => rooms.delete(id),
    roomOfAccount: (accountId) => [...rooms.values()].find((r) => r.players.has(accountId)),
  };
};
