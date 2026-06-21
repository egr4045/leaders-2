/**
 * Client lobby store. Owns the Socket.io connection to the lobby service and mirrors the
 * server-authoritative lobby state. On load it re-claims the stored account and reconnects, so a
 * refresh restores your seat (correct re-entry). The server is the source of truth — actions just
 * emit commands and the store renders whatever `lobby.state` comes back.
 */
import { create } from 'zustand';
import { io, type Socket } from 'socket.io-client';
import { lobby, type ProtocolError } from '@civa/protocol';
import { LOBBY_URL } from '../net/config.js';
import { clearSession, loadSession, login } from '../net/authClient.js';
import { useClientStore } from './clientStore.js';

export type ConnStatus = 'idle' | 'connecting' | 'connected' | 'error';

let socket: Socket | null = null;
const emit = (type: string, payload?: unknown): void => {
  socket?.emit(type, payload ?? {});
};

interface LobbyUIState {
  status: ConnStatus;
  me: { accountId: string; displayName: string } | null;
  rooms: lobby.RoomSummary[];
  room: lobby.LobbyRoom | null;
  error: string | null;

  connect: (displayName: string) => Promise<void>;
  reconnectIfPossible: () => void;
  logout: () => void;
  create: (name?: string) => void;
  join: (roomId: string) => void;
  leave: () => void;
  pickNation: (nation: string | null) => void;
  setReady: (ready: boolean) => void;
  start: () => void;
}

export const useLobbyStore = create<LobbyUIState>((set, get) => ({
  status: 'idle',
  me: null,
  rooms: [],
  room: null,
  error: null,

  connect: async (displayName) => {
    set({ status: 'connecting', error: null });
    let token: string;
    try {
      const prev = loadSession();
      const session = await login(displayName, prev?.accountId);
      token = session.accessToken;
      set({ me: { accountId: session.accountId, displayName: session.displayName } });
    } catch (err) {
      set({ status: 'error', error: String(err) });
      return;
    }

    socket?.close();
    socket = io(LOBBY_URL, { auth: { token }, transports: ['websocket'] });

    socket.on('connect', () => set({ status: 'connected', error: null }));
    socket.on('disconnect', () => set({ status: 'connecting' }));
    socket.on('connect_error', (err: Error) => set({ status: 'error', error: err.message }));

    socket.on(lobby.S2C.rooms, (p: lobby.RoomsEvent) => set({ rooms: p.rooms }));
    socket.on(lobby.S2C.state, (p: lobby.StateEvent) => {
      set({ room: p.room });
      // If we reconnect into an already-started game, advance straight to it.
      if (p.room?.status === 'started') useClientStore.getState().setPhase('year');
    });
    socket.on(lobby.S2C.started, () => useClientStore.getState().setPhase('year'));
    socket.on(lobby.S2C.error, (e: ProtocolError) => {
      set({ error: e.message });
      window.setTimeout(() => set((s) => (s.error === e.message ? { error: null } : {})), 3500);
    });
  },

  reconnectIfPossible: () => {
    const prev = loadSession();
    if (prev && get().status === 'idle') void get().connect(prev.displayName);
  },

  logout: () => {
    socket?.close();
    socket = null;
    clearSession();
    set({ status: 'idle', me: null, room: null, rooms: [], error: null });
  },

  create: (name) => emit(lobby.C2S.create, { name }),
  join: (roomId) => emit(lobby.C2S.join, { roomId }),
  leave: () => emit(lobby.C2S.leave, {}),
  pickNation: (nation) => emit(lobby.C2S.pickNation, { nation }),
  setReady: (ready) => emit(lobby.C2S.ready, { ready }),
  start: () => emit(lobby.C2S.start, {}),
}));
