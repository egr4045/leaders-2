import { afterEach, describe, expect, it } from 'vitest';
import type { AddressInfo } from 'node:net';
import { io as ioc, type Socket as ClientSocket } from 'socket.io-client';
import { createAuthCore } from '@civa/auth-core';
import { lobby, type ProtocolError } from '@civa/protocol';
import { createCapturingLogger } from '@civa/test-harness';
import { createLobbyServer, type LobbyServer } from './server.js';
import { createMemoryLobbyStore } from './store.js';

const auth = createAuthCore({ secret: 's', issuer: 'civa', accessTtl: '15m', refreshTtl: '30d' });

let server: LobbyServer | undefined;
const clients: ClientSocket[] = [];

afterEach(() => {
  clients.splice(0).forEach((c) => c.close());
  server?.io.close();
  server?.httpServer.close();
  server = undefined;
});

const startServer = (graceMs = 50): Promise<number> => {
  server = createLobbyServer({
    auth,
    store: createMemoryLobbyStore(),
    logger: createCapturingLogger(),
    corsOrigin: '*',
    graceMs,
  });
  return new Promise((r) => server!.httpServer.listen(0, () => r((server!.httpServer.address() as AddressInfo).port)));
};

const connect = async (port: number, accountId: string, name: string): Promise<ClientSocket> => {
  const token = await auth.signAccess(accountId, name);
  const c = ioc(`http://127.0.0.1:${port}`, { auth: { token }, transports: ['websocket'], forceNew: true });
  clients.push(c);
  await new Promise<void>((res) => c.once('connect', () => res()));
  return c;
};

/** Resolve on the next lobby.state whose room matches the predicate (listener attached eagerly). */
const waitRoom = (c: ClientSocket, predicate: (r: lobby.LobbyRoom | null) => boolean = (r) => !!r) =>
  new Promise<lobby.LobbyRoom>((res) => {
    const h = (p: lobby.StateEvent) => {
      if (predicate(p.room)) {
        c.off(lobby.S2C.state, h);
        res(p.room as lobby.LobbyRoom);
      }
    };
    c.on(lobby.S2C.state, h);
  });

const waitError = (c: ClientSocket) => new Promise<ProtocolError>((res) => c.once(lobby.S2C.error, res));
const player = (room: lobby.LobbyRoom | null, id: string) => room?.players.find((p) => p.accountId === id);

describe('lobby', () => {
  it('hosts create rooms and others join (nation pick + readiness travel to everyone)', async () => {
    const port = await startServer();
    const c1 = await connect(port, 'a1', 'Mara');
    const created = waitRoom(c1);
    c1.emit(lobby.C2S.create, {});
    const room = await created;
    expect(room.players).toHaveLength(1);
    expect(player(room, 'a1')?.isHost).toBe(true);

    const c2 = await connect(port, 'a2', 'Wei');
    const joined = waitRoom(c2, (r) => !!r && r.players.length === 2);
    c2.emit(lobby.C2S.join, { roomId: room.id });
    const full = await joined;
    expect(full.players.map((p) => p.accountId).sort()).toEqual(['a1', 'a2']);
  });

  it('enforces unique nations per room', async () => {
    const port = await startServer();
    const c1 = await connect(port, 'a1', 'Mara');
    const created = waitRoom(c1);
    c1.emit(lobby.C2S.create, {});
    const room = (await created).id;
    const c2 = await connect(port, 'a2', 'Wei');
    c2.emit(lobby.C2S.join, { roomId: room });
    await waitRoom(c2, (r) => !!r && r.players.length === 2);

    const picked = waitRoom(c1, (r) => player(r, 'a1')?.nation === 'usa');
    c1.emit(lobby.C2S.pickNation, { nation: 'usa' });
    await picked;

    const err = waitError(c2);
    c2.emit(lobby.C2S.pickNation, { nation: 'usa' });
    expect((await err).code).toBe('conflict');
  });

  it('only starts when everyone has a nation and is ready', async () => {
    const port = await startServer();
    const c1 = await connect(port, 'a1', 'Mara');
    const created = waitRoom(c1);
    c1.emit(lobby.C2S.create, {});
    const roomId = (await created).id;
    const c2 = await connect(port, 'a2', 'Wei');
    c2.emit(lobby.C2S.join, { roomId });
    await waitRoom(c2, (r) => !!r && r.players.length === 2);

    // Host tries to start prematurely -> rejected.
    const tooEarly = waitError(c1);
    c1.emit(lobby.C2S.start, {});
    expect((await tooEarly).code).toBe('illegal_action');

    // Everyone picks a nation and readies up.
    c1.emit(lobby.C2S.pickNation, { nation: 'usa' });
    c2.emit(lobby.C2S.pickNation, { nation: 'china' });
    c1.emit(lobby.C2S.ready, { ready: true });
    const bothReady = waitRoom(c1, (r) => !!r && r.players.every((p) => p.ready && p.nation));
    c2.emit(lobby.C2S.ready, { ready: true });
    await bothReady;

    const started = new Promise<lobby.StartedEvent>((res) => c2.once(lobby.S2C.started, res));
    c1.emit(lobby.C2S.start, {});
    const ev = await started;
    expect(ev.sessionId).toBeTruthy();
  });

  it('holds the seat across a reconnect (session bound to account, not socket)', async () => {
    const port = await startServer(2000); // generous grace
    const c1 = await connect(port, 'a1', 'Mara');
    const created = waitRoom(c1);
    c1.emit(lobby.C2S.create, {});
    const roomId = (await created).id;
    c1.emit(lobby.C2S.pickNation, { nation: 'usa' });
    await waitRoom(c1, (r) => player(r, 'a1')?.nation === 'usa');
    c1.emit(lobby.C2S.ready, { ready: true });
    await waitRoom(c1, (r) => player(r, 'a1')?.ready === true);

    c1.close(); // simulate a page reload
    const c1b = await connect(port, 'a1', 'Mara'); // same account reconnects
    const restoredP = waitRoom(c1b, (r) => !!r && r.id === roomId);
    c1b.emit(lobby.C2S.getState, {});
    const restored = await restoredP;
    const me = player(restored, 'a1');
    expect(me?.nation).toBe('usa'); // seat + picks preserved
    expect(me?.ready).toBe(true);
    expect(me?.connected).toBe(true);
  });

  it('treats a second device of the same account as one seat', async () => {
    const port = await startServer();
    const c1 = await connect(port, 'a1', 'Mara');
    const created = waitRoom(c1);
    c1.emit(lobby.C2S.create, {});
    const roomId = (await created).id;

    const c1b = await connect(port, 'a1', 'Mara'); // second device, same account
    const seenP = waitRoom(c1b, (r) => !!r && r.id === roomId);
    c1b.emit(lobby.C2S.getState, {});
    const seen = await seenP;
    expect(seen.players).toHaveLength(1); // still one seat
  });
});
