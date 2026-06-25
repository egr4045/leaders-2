/**
 * CIVA lobby store. Owns the Socket.io connection to the CIVA lobby service and mirrors the
 * server-authoritative lobby state. Platform login lives in `platformStore`; here we just take the
 * stored account, refresh its token and connect. On entering CIVA it reconnects, so a refresh
 * restores your seat (correct re-entry). The server is the source of truth — actions emit commands
 * and the store renders whatever `lobby.state` comes back.
 */
import { create } from 'zustand';
import { io, type Socket } from 'socket.io-client';
import { lobby, type ProtocolError } from '@civa/protocol';
import { LOBBY_URL } from '../net/config.js';
import { loadSession, login } from '../net/authClient.js';
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
  /** A room to auto-join once connected (set by an invite deep-link). */
  pendingRoomId: string | null;
  error: string | null;

  /** Connect to the CIVA lobby using the stored account (refreshes the access token first). */
  connectToLobby: () => Promise<void>;
  disconnect: () => void;
  create: (name?: string) => void;
  join: (roomId: string) => void;
  /** Join a room now if connected, else remember it and join on connect (invite deep-link). */
  setPendingJoin: (roomId: string) => void;
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
  pendingRoomId: null,
  error: null,

  connectToLobby: async () => {
    if (socket?.connected) return;
    set({ status: 'connecting', error: null });
    const prev = loadSession();
    if (!prev) {
      set({ status: 'error', error: 'not logged in' });
      return;
    }
    let token: string;
    try {
      // Refresh the access token for the same account (tokens are short-lived).
      const session = await login(prev.displayName, prev.accountId);
      token = session.accessToken;
      set({ me: { accountId: session.accountId, displayName: session.displayName } });
    } catch (err) {
      set({ status: 'error', error: String(err) });
      return;
    }

    socket?.close();
    socket = io(LOBBY_URL, { auth: { token }, transports: ['websocket'] });

    socket.on('connect', () => {
      set({ status: 'connected', error: null });
      // Honour an invite deep-link: jump straight into the room once we're connected.
      const pending = get().pendingRoomId;
      if (pending) {
        emit(lobby.C2S.join, { roomId: pending });
        set({ pendingRoomId: null });
      }
    });
    socket.on('disconnect', () => set({ status: 'connecting' }));
    socket.on('connect_error', (err: Error) => set({ status: 'error', error: err.message }));

    socket.on(lobby.S2C.rooms, (p: lobby.RoomsEvent) => set({ rooms: p.rooms }));
    socket.on(lobby.S2C.state, (p: lobby.StateEvent) => {
      set({ room: p.room });
      if (p.room?.status === 'started') useClientStore.getState().setPhase('year');
    });
    socket.on(lobby.S2C.started, () => useClientStore.getState().setPhase('year'));
    socket.on(lobby.S2C.error, (e: ProtocolError) => {
      set({ error: e.message });
      window.setTimeout(() => set((s) => (s.error === e.message ? { error: null } : {})), 3500);
    });
  },

  disconnect: () => {
    socket?.close();
    socket = null;
    set({ status: 'idle', room: null, rooms: [] });
  },

  create: (name) => emit(lobby.C2S.create, { name }),
  join: (roomId) => emit(lobby.C2S.join, { roomId }),
  setPendingJoin: (roomId) => {
    if (socket?.connected) emit(lobby.C2S.join, { roomId });
    else set({ pendingRoomId: roomId });
  },
  leave: () => emit(lobby.C2S.leave, {}),
  pickNation: (nation) => emit(lobby.C2S.pickNation, { nation }),
  setReady: (ready) => emit(lobby.C2S.ready, { ready }),
  start: () => emit(lobby.C2S.start, {}),
}));
