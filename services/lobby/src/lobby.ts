/**
 * Lobby core logic — pure operations over the store with server-authoritative validation. No
 * socket.io here; the server layer wires these to events and broadcasts the results. Illegal
 * actions throw `ContractError` so the transport can map them to a uniform error event.
 */
import { ContractError, type lobby } from '@civa/protocol';
import { lobbyConfig, nationIds } from '@civa/game-config';
import type { LobbyStore, RoomRecord, PlayerRecord } from './store.js';

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
  players: [...room.players.values()].map((p) => ({
    accountId: p.accountId,
    displayName: p.displayName,
    nation: p.nation,
    ready: p.ready,
    connected: p.sockets.size > 0,
    isHost: p.accountId === room.hostAccountId,
  })),
});

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

export const createRoom = (
  store: LobbyStore,
  accountId: string,
  displayName: string,
  name?: string,
): RoomRecord => {
  leaveRoom(store, accountId); // a player is in at most one room
  const room = store.create(name?.trim() || `${displayName}'s game`, accountId);
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
  if (room.players.size === 0) {
    store.remove(room.id);
    return room;
  }
  if (room.hostAccountId === accountId) {
    room.hostAccountId = room.players.keys().next().value as string; // reassign host
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
  if (room.status !== 'waiting') throw new ContractError('conflict', 'already started');
  if (room.players.size < lobbyConfig.minPlayers) throw new ContractError('illegal_action', 'not enough players');
  const players = [...room.players.values()];
  if (players.some((p) => p.nation === null)) throw new ContractError('illegal_action', 'everyone must pick a nation');
  if (players.some((p) => !p.ready)) throw new ContractError('illegal_action', 'everyone must be ready');
  room.status = 'started';
  room.sessionId = sessionId;
  return room;
};
