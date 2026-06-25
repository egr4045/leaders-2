/**
 * Lobby core logic — pure operations over the store with server-authoritative validation. No
 * socket.io here; the server layer wires these to events and broadcasts the results. Illegal
 * actions throw `ContractError` so the transport can map them to a uniform error event.
 */
import { ContractError, type lobby } from '@civa/protocol';
import { lobbyConfig, nationIds } from '@civa/game-config';
import type { LobbyStore, RoomRecord, PlayerRecord, RoomVisibility } from './store.js';

const newPlayer = (accountId: string, displayName: string): PlayerRecord => ({
  accountId,
  displayName,
  nation: null,
  ready: false,
  sockets: new Set(),
});

export const toWire = (room: RoomRecord): lobby.LobbyRoom => ({
  id: room.id,
  name: room.name,
  status: room.status,
  minPlayers: lobbyConfig.minPlayers,
  maxPlayers: lobbyConfig.maxPlayers,
  visibility: room.visibility,
  autostart: room.autostart,
  countdown: room.status === 'starting' ? (room.countdown ?? null) : null,
  players: [...room.players.values()].map((p) => ({
    accountId: p.accountId,
    displayName: p.displayName,
    nation: p.nation,
    ready: p.ready,
    connected: p.isBot ? true : p.sockets.size > 0,
    isHost: p.accountId === room.hostAccountId,
    isBot: p.isBot ?? false,
  })),
});

/** A room is startable when it has enough players and everyone has a nation and is ready. */
export const canStart = (room: RoomRecord): boolean => {
  const players = [...room.players.values()];
  return (
    players.length >= lobbyConfig.minPlayers &&
    players.every((p) => p.nation !== null) &&
    players.every((p) => p.ready)
  );
};

/** Number of real (non-bot) players still in the room. */
const humanCount = (room: RoomRecord): number =>
  [...room.players.values()].filter((p) => !p.isBot).length;

/** Mutate a room into the started state (no authority check — callers gate that). */
export const beginGame = (room: RoomRecord, sessionId: string): void => {
  room.status = 'started';
  room.sessionId = sessionId;
  delete room.countdown;
};

export const toSummary = (room: RoomRecord): lobby.RoomSummary => ({
  id: room.id,
  name: room.name,
  playerCount: room.players.size,
  maxPlayers: lobbyConfig.maxPlayers,
  status: room.status,
});

const playerIn = (store: LobbyStore, accountId: string): { room: RoomRecord; player: PlayerRecord } => {
  const room = store.roomOfAccount(accountId);
  const player = room?.players.get(accountId);
  if (!room || !player) throw new ContractError('not_found', 'you are not in a room');
  return { room, player };
};

export interface CreateOpts {
  name?: string | undefined;
  visibility?: RoomVisibility | undefined;
  autostart?: boolean | undefined;
}

export const createRoom = (
  store: LobbyStore,
  accountId: string,
  displayName: string,
  opts: CreateOpts = {},
): RoomRecord => {
  leaveRoom(store, accountId); // a player is in at most one room
  const room = store.create(opts.name?.trim() || `${displayName}'s game`, accountId);
  if (opts.visibility) room.visibility = opts.visibility;
  if (opts.autostart !== undefined) room.autostart = opts.autostart;
  room.players.set(accountId, newPlayer(accountId, displayName));
  return room;
};

export const joinRoom = (
  store: LobbyStore,
  accountId: string,
  displayName: string,
  roomId: string,
): RoomRecord => {
  const room = store.get(roomId);
  if (!room) throw new ContractError('not_found', 'room not found');
  if (room.status !== 'waiting') throw new ContractError('conflict', 'game already started');
  if (!room.players.has(accountId) && room.players.size >= lobbyConfig.maxPlayers) {
    throw new ContractError('conflict', 'room is full');
  }
  if (store.roomOfAccount(accountId)?.id !== roomId) leaveRoom(store, accountId);
  if (!room.players.has(accountId)) room.players.set(accountId, newPlayer(accountId, displayName));
  return room;
};

/** Remove the player from whatever room they're in. Returns that room (post-removal) or null. */
export const leaveRoom = (store: LobbyStore, accountId: string): RoomRecord | null => {
  const room = store.roomOfAccount(accountId);
  if (!room) return null;
  room.players.delete(accountId);
  // A room only exists for its humans — once the last one leaves, it (and any bots) is gone.
  if (humanCount(room) === 0) {
    if (room.startTimer) clearTimeout(room.startTimer);
    store.remove(room.id);
    return room;
  }
  if (room.hostAccountId === accountId) {
    const nextHuman = [...room.players.values()].find((p) => !p.isBot);
    if (nextHuman) room.hostAccountId = nextHuman.accountId; // reassign host to a human
  }
  return room;
};

export const pickNation = (store: LobbyStore, accountId: string, nation: string | null): RoomRecord => {
  const { room, player } = playerIn(store, accountId);
  if (room.status !== 'waiting') throw new ContractError('conflict', 'game already started');
  if (nation !== null) {
    if (!nationIds.includes(nation)) throw new ContractError('validation', 'unknown nation');
    const taken = [...room.players.values()].some((p) => p.accountId !== accountId && p.nation === nation);
    if (taken) throw new ContractError('conflict', 'nation already taken');
  }
  player.nation = nation;
  return room;
};

export const setReady = (store: LobbyStore, accountId: string, ready: boolean): RoomRecord => {
  const { room, player } = playerIn(store, accountId);
  if (ready && player.nation === null) throw new ContractError('illegal_action', 'pick a nation first');
  player.ready = ready;
  return room;
};

export const startRoom = (store: LobbyStore, accountId: string, sessionId: string): RoomRecord => {
  const { room, player } = playerIn(store, accountId);
  if (player.accountId !== room.hostAccountId) throw new ContractError('forbidden', 'only the host can start');
  if (room.status === 'started') throw new ContractError('conflict', 'already started');
  if (room.players.size < lobbyConfig.minPlayers) throw new ContractError('illegal_action', 'not enough players');
  const players = [...room.players.values()];
  if (players.some((p) => p.nation === null)) throw new ContractError('illegal_action', 'everyone must pick a nation');
  if (players.some((p) => !p.ready)) throw new ContractError('illegal_action', 'everyone must be ready');
  beginGame(room, sessionId);
  return room;
};

const requireHost = (store: LobbyStore, accountId: string): RoomRecord => {
  const { room, player } = playerIn(store, accountId);
  if (player.accountId !== room.hostAccountId) throw new ContractError('forbidden', 'only the host can do that');
  return room;
};

/** Host adds a filler bot: auto-ready, claims a free nation. Bots let small groups start. */
export const addBot = (store: LobbyStore, accountId: string): RoomRecord => {
  const room = requireHost(store, accountId);
  if (room.status !== 'waiting') throw new ContractError('conflict', 'game already started');
  if (room.players.size >= lobbyConfig.maxPlayers) throw new ContractError('conflict', 'room is full');
  const taken = new Set([...room.players.values()].map((p) => p.nation).filter(Boolean));
  const nation = nationIds.find((n) => !taken.has(n)) ?? null;
  if (!nation) throw new ContractError('conflict', 'no free nation for a bot');
  const botCount = [...room.players.values()].filter((p) => p.isBot).length;
  const id = `bot:${nation}`;
  room.players.set(id, {
    accountId: id,
    displayName: `Bot ${botCount + 1}`,
    nation,
    ready: true,
    sockets: new Set(),
    isBot: true,
  });
  return room;
};

export const removeBot = (store: LobbyStore, accountId: string, botId: string): RoomRecord => {
  const room = requireHost(store, accountId);
  const bot = room.players.get(botId);
  if (!bot || !bot.isBot) throw new ContractError('not_found', 'no such bot');
  room.players.delete(botId);
  return room;
};

export const setVisibility = (store: LobbyStore, accountId: string, visibility: RoomVisibility): RoomRecord => {
  const room = requireHost(store, accountId);
  room.visibility = visibility;
  return room;
};

export const setAutostart = (store: LobbyStore, accountId: string, autostart: boolean): RoomRecord => {
  const room = requireHost(store, accountId);
  room.autostart = autostart;
  return room;
};

/** "Play now": join the most-populated open public room with space, else create a fresh one. */
export const quickMatch = (store: LobbyStore, accountId: string, displayName: string): RoomRecord => {
  const existing = store.roomOfAccount(accountId);
  if (existing) return existing;
  const open = store
    .list()
    .filter(
      (r) =>
        r.visibility === 'public' &&
        r.status === 'waiting' &&
        r.players.size < lobbyConfig.maxPlayers,
    )
    .sort((a, b) => b.players.size - a.players.size)[0];
  if (open) return joinRoom(store, accountId, displayName, open.id);
  return createRoom(store, accountId, displayName, {});
};
