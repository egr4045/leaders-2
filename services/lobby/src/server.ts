/**
 * Lobby transport: a Socket.io server over an HTTP server (with a /health route). Authenticates
 * each socket with a JWT, then binds it to the player's **account** — so a reconnecting socket
 * re-attaches to the same seat, a second device shares one seat, and a brief disconnect holds the
 * seat for a grace window. Game logic lives in ./lobby; this layer wires events + broadcasts.
 */
import { createServer, type Server as HttpServer } from 'node:http';
import { randomUUID } from 'node:crypto';
import { Server as IOServer, type Socket } from 'socket.io';
import { ContractError, lobby } from '@civa/protocol';
import type { AuthCore } from '@civa/auth-core';
import type { Logger } from '@civa/shared-types';
import type { ZodType } from 'zod';
import type { LobbyStore, RoomRecord } from './store.js';
import * as L from './lobby.js';

interface SocketData {
  accountId: string;
  displayName: string;
}

export interface LobbyDeps {
  readonly auth: AuthCore;
  readonly store: LobbyStore;
  readonly logger: Logger;
  readonly corsOrigin: string;
  readonly graceMs: number;
}

export interface LobbyServer {
  httpServer: HttpServer;
  io: IOServer;
}

const parse = <T>(schema: ZodType<T>, raw: unknown): T => {
  const r = schema.safeParse(raw ?? {});
  if (!r.success) throw new ContractError('validation', 'invalid payload');
  return r.data;
};

export const createLobbyServer = (deps: LobbyDeps): LobbyServer => {
  const httpServer = createServer((req, res) => {
    if (req.url === '/health' || req.url === '/ready') {
      res.writeHead(200, { 'content-type': 'application/json', 'access-control-allow-origin': '*' });
      res.end(JSON.stringify({ status: 'ok', service: 'lobby' }));
      return;
    }
    res.writeHead(404, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ error: 'not_found' }));
  });

  const io = new IOServer(httpServer, { cors: { origin: deps.corsOrigin, methods: ['GET', 'POST'] } });

  // --- Auth: bind each socket to an account via its access token ---------
  io.use((socket, next) => {
    const token = (socket.handshake.auth as { token?: string }).token;
    if (!token) {
      next(new Error('unauthorized'));
      return;
    }
    void deps.auth
      .verify(token)
      .then((claims) => {
        if (claims.typ !== 'access') {
          next(new Error('unauthorized'));
          return;
        }
        (socket.data as SocketData).accountId = claims.sub;
        (socket.data as SocketData).displayName = claims.name;
        next();
      })
      .catch(() => next(new Error('unauthorized')));
  });

  const rooms = () => deps.store.list().map(L.toSummary);
  const broadcastRooms = () => io.emit(lobby.S2C.rooms, { rooms: rooms() });
  const broadcastRoom = (room: RoomRecord) => {
    if (deps.store.get(room.id)) io.to(room.id).emit(lobby.S2C.state, { room: L.toWire(room) });
  };
  const sendMyState = (socket: Socket) => {
    const room = deps.store.roomOfAccount((socket.data as SocketData).accountId);
    socket.emit(lobby.S2C.state, { room: room ? L.toWire(room) : null });
  };

  io.on('connection', (socket) => {
    const { accountId, displayName } = socket.data as SocketData;
    deps.logger.info('connect', { accountId, socket: socket.id });

    // Re-attach to an existing seat (reconnect / multi-device).
    const existing = deps.store.roomOfAccount(accountId);
    if (existing) {
      const player = existing.players.get(accountId)!;
      if (player.graceTimer) {
        clearTimeout(player.graceTimer);
        delete player.graceTimer;
      }
      player.sockets.add(socket.id);
      void socket.join(existing.id);
      broadcastRoom(existing);
    }
    socket.emit(lobby.S2C.rooms, { rooms: rooms() });
    sendMyState(socket);

    const guard = (fn: () => void) => {
      try {
        fn();
      } catch (err) {
        if (err instanceof ContractError) socket.emit(lobby.S2C.error, err.toProtocol());
        else {
          deps.logger.error('handler', { err: String(err) });
          socket.emit(lobby.S2C.error, { code: 'internal', message: 'internal error' });
        }
      }
    };

    /** Attach this socket to `room`, broadcast it + the previous room (if the player switched). */
    const enter = (room: RoomRecord, prev: RoomRecord | undefined) => {
      room.players.get(accountId)?.sockets.add(socket.id);
      void socket.join(room.id);
      if (prev && prev.id !== room.id) {
        void socket.leave(prev.id);
        broadcastRoom(prev);
      }
      broadcastRoom(room);
      broadcastRooms();
    };

    socket.on(lobby.C2S.create, (raw) =>
      guard(() => {
        const prev = deps.store.roomOfAccount(accountId);
        const p = parse(lobby.createPayload, raw);
        enter(L.createRoom(deps.store, accountId, displayName, p.name), prev);
      }),
    );
    socket.on(lobby.C2S.join, (raw) =>
      guard(() => {
        const prev = deps.store.roomOfAccount(accountId);
        const p = parse(lobby.joinPayload, raw);
        enter(L.joinRoom(deps.store, accountId, displayName, p.roomId), prev);
      }),
    );
    socket.on(lobby.C2S.leave, () =>
      guard(() => {
        const left = L.leaveRoom(deps.store, accountId);
        if (left) {
          void socket.leave(left.id);
          broadcastRoom(left);
        }
        broadcastRooms();
        sendMyState(socket);
      }),
    );
    socket.on(lobby.C2S.pickNation, (raw) =>
      guard(() => broadcastRoom(L.pickNation(deps.store, accountId, parse(lobby.pickNationPayload, raw).nation))),
    );
    socket.on(lobby.C2S.ready, (raw) =>
      guard(() => broadcastRoom(L.setReady(deps.store, accountId, parse(lobby.readyPayload, raw).ready))),
    );
    socket.on(lobby.C2S.start, () =>
      guard(() => {
        const room = L.startRoom(deps.store, accountId, randomUUID());
        broadcastRoom(room);
        broadcastRooms();
        io.to(room.id).emit(lobby.S2C.started, { roomId: room.id, sessionId: room.sessionId! });
      }),
    );
    socket.on(lobby.C2S.getState, () => sendMyState(socket));

    socket.on('disconnect', () => {
      const room = deps.store.roomOfAccount(accountId);
      const player = room?.players.get(accountId);
      if (!room || !player) return;
      player.sockets.delete(socket.id);
      if (player.sockets.size > 0) return; // another device still connected — seat unaffected
      // Hold the seat briefly, then drop it if no device returns (correct reconnect).
      player.graceTimer = setTimeout(() => {
        const left = L.leaveRoom(deps.store, accountId);
        if (left) broadcastRoom(left);
        broadcastRooms();
      }, deps.graceMs);
      broadcastRoom(room); // mark disconnected
    });
  });

  return { httpServer, io };
};
