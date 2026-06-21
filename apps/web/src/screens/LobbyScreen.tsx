import { useEffect, useState, type CSSProperties } from 'react';
import { nations } from '@civa/game-config';
import type { lobby } from '@civa/protocol';
import { useLobbyStore } from '../state/lobbyStore.js';

const NATION_FLAG: Record<string, string> = {
  usa: '🇺🇸',
  china: '🇨🇳',
  russia: '🇷🇺',
  brazil: '🇧🇷',
  germany: '🇩🇪',
  india: '🇮🇳',
  japan: '🇯🇵',
  egypt: '🇪🇬',
};

const shell: CSSProperties = {
  position: 'absolute',
  inset: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'radial-gradient(120% 120% at 50% 0%, #16243a 0%, #0b0f16 70%)',
  pointerEvents: 'auto',
};

/** Phase 1.14 / Phase 2 — the real lobby, driven by the lobby service over Socket.io. */
export const LobbyScreen = (): JSX.Element => {
  const status = useLobbyStore((s) => s.status);
  const me = useLobbyStore((s) => s.me);
  const room = useLobbyStore((s) => s.room);

  // Auto-reconnect with the stored account on load (correct re-entry).
  useEffect(() => {
    useLobbyStore.getState().reconnectIfPossible();
  }, []);

  if (!me) return <NameEntry />;
  if (!room) return <RoomList />;
  return <RoomView room={room} myAccountId={me.accountId} status={status} />;
};

const ErrorBanner = (): JSX.Element | null => {
  const error = useLobbyStore((s) => s.error);
  if (!error) return null;
  return (
    <div style={{ color: 'var(--c-negative)', fontSize: 'var(--fs-sm)', marginTop: 8 }}>⚠ {error}</div>
  );
};

const NameEntry = (): JSX.Element => {
  const connect = useLobbyStore((s) => s.connect);
  const status = useLobbyStore((s) => s.status);
  const [name, setName] = useState('');
  return (
    <div style={shell}>
      <div className="civa-panel civa-fade-in" style={{ width: 380, padding: 24, textAlign: 'center' }}>
        <h1 style={{ fontSize: 'var(--fs-xxl)', fontWeight: 800, letterSpacing: 1 }}>CIVA</h1>
        <p style={{ color: 'var(--c-text-muted)', margin: '8px 0 18px' }}>Choose a display name to enter the lobby.</p>
        <input
          autoFocus
          value={name}
          placeholder="Your name"
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && name.trim() && connect(name.trim())}
          style={inputStyle}
        />
        <button
          disabled={!name.trim() || status === 'connecting'}
          onClick={() => connect(name.trim())}
          style={{ ...primaryBtn, width: '100%', marginTop: 12, opacity: !name.trim() ? 0.5 : 1 }}
        >
          {status === 'connecting' ? 'Connecting…' : 'Enter lobby ▸'}
        </button>
        <ErrorBanner />
      </div>
    </div>
  );
};

const RoomList = (): JSX.Element => {
  const rooms = useLobbyStore((s) => s.rooms);
  const create = useLobbyStore((s) => s.create);
  const join = useLobbyStore((s) => s.join);
  const me = useLobbyStore((s) => s.me);
  const logout = useLobbyStore((s) => s.logout);

  return (
    <div style={shell}>
      <div className="civa-panel civa-fade-in" style={{ width: 560, maxWidth: '92vw', padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
          <h1 style={{ fontSize: 'var(--fs-xl)', fontWeight: 800 }}>Games</h1>
          <span style={{ marginLeft: 'auto', color: 'var(--c-text-muted)', fontSize: 'var(--fs-sm)' }}>
            {me?.displayName} ·{' '}
            <button onClick={logout} style={{ color: 'var(--c-accent)', fontSize: 'var(--fs-sm)' }}>
              change
            </button>
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16, maxHeight: '50vh', overflowY: 'auto' }}>
          {rooms.length === 0 && (
            <div style={{ color: 'var(--c-text-muted)', textAlign: 'center', padding: 20 }}>
              No open games. Create one to start.
            </div>
          )}
          {rooms.map((r) => (
            <div
              key={r.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 14px',
                borderRadius: 'var(--r-md)',
                background: 'rgba(255,255,255,0.04)',
              }}
            >
              <span style={{ fontWeight: 600, flex: 1 }}>{r.name}</span>
              <span style={{ color: 'var(--c-text-muted)', fontSize: 'var(--fs-sm)' }}>
                {r.playerCount}/{r.maxPlayers} · {r.status}
              </span>
              <button onClick={() => join(r.id)} disabled={r.status !== 'waiting'} style={{ ...primaryBtn, opacity: r.status !== 'waiting' ? 0.5 : 1 }}>
                Join
              </button>
            </div>
          ))}
        </div>

        <button onClick={() => create()} style={{ ...primaryBtn, width: '100%' }}>
          + Create game
        </button>
        <ErrorBanner />
      </div>
    </div>
  );
};

const RoomView = ({
  room,
  myAccountId,
}: {
  room: lobby.LobbyRoom;
  myAccountId: string;
  status: string;
}): JSX.Element => {
  const { pickNation, setReady, start, leave } = useLobbyStore.getState();
  const me = room.players.find((p) => p.accountId === myAccountId);
  const takenBy = new Map(room.players.filter((p) => p.nation).map((p) => [p.nation!, p.accountId]));
  const readyCount = room.players.filter((p) => p.ready).length;
  const isHost = me?.isHost ?? false;

  return (
    <div style={shell}>
      <div className="civa-panel civa-fade-in" style={{ width: 720, maxWidth: '94vw', padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
          <h1 style={{ fontSize: 'var(--fs-xl)', fontWeight: 800 }}>{room.name}</h1>
          <span style={{ marginLeft: 12, color: 'var(--c-text-muted)', fontSize: 'var(--fs-sm)' }}>
            {room.players.length}/{room.maxPlayers} · {readyCount} ready · min {room.minPlayers}
          </span>
          <button onClick={() => leave()} style={{ marginLeft: 'auto', color: 'var(--c-text-muted)', fontSize: 'var(--fs-sm)' }}>
            Leave
          </button>
        </div>

        {/* Players */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 18 }}>
          {room.players.map((p) => (
            <div
              key={p.accountId}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 12px',
                borderRadius: 'var(--r-md)',
                background: p.accountId === myAccountId ? 'var(--c-accent-muted)' : 'rgba(255,255,255,0.03)',
              }}
            >
              <span title={p.connected ? 'online' : 'reconnecting…'} style={{ width: 8, height: 8, borderRadius: '50%', background: p.connected ? 'var(--c-positive)' : 'var(--c-warning)' }} />
              <span style={{ fontSize: 20 }}>{p.nation ? NATION_FLAG[p.nation] : '—'}</span>
              <span style={{ flex: 1, fontWeight: 600 }}>
                {p.displayName}
                {p.isHost && <span style={{ color: 'var(--c-warning)', fontSize: 'var(--fs-xs)', marginLeft: 6 }}>host</span>}
                {p.accountId === myAccountId && <span style={{ color: 'var(--c-text-muted)', fontSize: 'var(--fs-xs)', marginLeft: 6 }}>you</span>}
              </span>
              <span style={{ fontSize: 'var(--fs-sm)', color: p.ready ? 'var(--c-positive)' : 'var(--c-text-muted)' }}>
                {p.ready ? '✓ ready' : 'not ready'}
              </span>
            </div>
          ))}
        </div>

        {/* Nation picker */}
        <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--c-text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
          Pick a nation
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 18 }}>
          {nations.map((n) => {
            const owner = takenBy.get(n.id);
            const mine = me?.nation === n.id;
            const takenByOther = owner !== undefined && owner !== myAccountId;
            return (
              <button
                key={n.id}
                disabled={takenByOther}
                onClick={() => pickNation(mine ? null : n.id)}
                style={{
                  padding: 12,
                  borderRadius: 'var(--r-lg)',
                  border: `2px solid ${mine ? 'var(--c-accent)' : 'var(--c-panel-border)'}`,
                  background: mine ? 'var(--c-accent-muted)' : 'rgba(255,255,255,0.03)',
                  opacity: takenByOther ? 0.4 : 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <span style={{ fontSize: 26 }}>{NATION_FLAG[n.id]}</span>
                <span style={{ fontSize: 'var(--fs-xs)', fontWeight: 600 }}>{n.name}</span>
              </button>
            );
          })}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => setReady(!me?.ready)}
            disabled={!me?.nation}
            style={{
              flex: 1,
              padding: '12px',
              borderRadius: 'var(--r-md)',
              fontWeight: 700,
              border: '1px solid var(--c-panel-border)',
              color: me?.ready ? 'var(--c-positive)' : 'var(--c-text-primary)',
              opacity: !me?.nation ? 0.5 : 1,
            }}
          >
            {me?.ready ? '✓ Ready' : 'Ready up'}
          </button>
          {isHost && (
            <button onClick={() => start()} style={{ ...primaryBtn, flex: 1, padding: '12px' }}>
              Start game ▸
            </button>
          )}
        </div>
        <ErrorBanner />
      </div>
    </div>
  );
};

const inputStyle: CSSProperties = {
  width: '100%',
  padding: '12px 14px',
  borderRadius: 'var(--r-md)',
  background: 'var(--c-panel-solid)',
  color: 'var(--c-text-primary)',
  border: '1px solid var(--c-panel-border)',
  fontSize: 'var(--fs-md)',
};

const primaryBtn: CSSProperties = {
  padding: '8px 18px',
  borderRadius: 'var(--r-md)',
  background: 'var(--c-accent)',
  color: 'var(--c-text-inverse)',
  fontWeight: 700,
};
