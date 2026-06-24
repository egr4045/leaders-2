import { useEffect, useState, type CSSProperties } from 'react';
import { nations } from '@civa/game-config';
import type { lobby } from '@civa/protocol';
import { useLobbyStore } from '../state/lobbyStore.js';
import { usePlatformStore } from '../platform/platformStore.js';
import { GAMES, type GameInfo } from '../platform/games.js';
import { enterGame } from '../net/orchestratorClient.js';

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
  padding: '10px 18px',
  borderRadius: 'var(--r-md)',
  background: 'var(--c-accent)',
  color: 'var(--c-text-inverse)',
  fontWeight: 700,
};

/**
 * Platform router: shared login → game selection (hub) → the selected game's lobby. Today only
 * CIVA is playable; new games appear as tiles (point 1 & 3). Account identity is durable, so a
 * reload returns you to the hub and — inside CIVA — to your seat.
 */
export const LobbyScreen = (): JSX.Element => {
  const account = usePlatformStore((s) => s.account);
  const selectedGame = usePlatformStore((s) => s.selectedGame);

  useEffect(() => {
    usePlatformStore.getState().restore();
  }, []);

  if (!account) return <NameEntry />;
  if (!selectedGame) return <GameSelect />;
  if (selectedGame === 'civa') return <CivaLobby />;
  return <GameSelect />;
};

const Err = ({ error }: { error: string | null }): JSX.Element | null =>
  error ? (
    <div style={{ color: 'var(--c-negative)', fontSize: 'var(--fs-sm)', marginTop: 8 }}>⚠ {error}</div>
  ) : null;

// --- Shared login -----------------------------------------------------------
const NameEntry = (): JSX.Element => {
  const login = usePlatformStore((s) => s.login);
  const status = usePlatformStore((s) => s.status);
  const error = usePlatformStore((s) => s.error);
  const [name, setName] = useState('');
  const go = () => name.trim() && void login(name.trim());

  return (
    <div style={shell}>
      <div className="civa-panel civa-fade-in" style={{ width: 380, padding: 24, textAlign: 'center' }}>
        <h1 style={{ fontSize: 'var(--fs-xxl)', fontWeight: 800, letterSpacing: 1 }}>Game Hub</h1>
        <p style={{ color: 'var(--c-text-muted)', margin: '8px 0 18px' }}>
          One account, many games. Choose a display name.
        </p>
        <input
          autoFocus
          value={name}
          placeholder="Your name"
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && go()}
          style={inputStyle}
        />
        <button
          disabled={!name.trim() || status === 'logging-in'}
          onClick={go}
          style={{ ...primaryBtn, width: '100%', marginTop: 12, opacity: !name.trim() ? 0.5 : 1 }}
        >
          {status === 'logging-in' ? 'Signing in…' : 'Enter ▸'}
        </button>
        <Err error={error} />
      </div>
    </div>
  );
};

// --- Game selection (hub) ---------------------------------------------------
const GameSelect = (): JSX.Element => {
  const account = usePlatformStore((s) => s.account);
  const selectGame = usePlatformStore((s) => s.selectGame);
  const logout = usePlatformStore((s) => s.logout);

  const handlePlay = (g: GameInfo): void => {
    if (g.externalPort) {
      // Wake the game (orchestrator) then navigate to its own origin.
      void (async () => {
        await enterGame(g.id);
        window.location.href = `${window.location.protocol}//${window.location.hostname}:${g.externalPort}`;
      })();
    } else {
      selectGame(g.id);
    }
  };

  return (
    <div style={shell}>
      <div className="civa-panel civa-fade-in" style={{ width: 720, maxWidth: '94vw', padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 18 }}>
          <h1 style={{ fontSize: 'var(--fs-xl)', fontWeight: 800 }}>Choose a game</h1>
          <span style={{ marginLeft: 'auto', color: 'var(--c-text-muted)', fontSize: 'var(--fs-sm)' }}>
            {account?.displayName} ·{' '}
            <button onClick={logout} style={{ color: 'var(--c-accent)', fontSize: 'var(--fs-sm)' }}>
              sign out
            </button>
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {GAMES.map((g) => (
            <GameTile key={g.id} game={g} onPlay={() => handlePlay(g)} />
          ))}
        </div>
      </div>
    </div>
  );
};

const GameTile = ({ game, onPlay }: { game: GameInfo; onPlay: () => void }): JSX.Element => {
  const playable = game.status === 'playable';
  return (
    <button
      disabled={!playable}
      onClick={onPlay}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        padding: 18,
        borderRadius: 'var(--r-lg)',
        textAlign: 'left',
        minHeight: 150,
        border: `1px solid ${playable ? game.accent : 'var(--c-panel-border)'}`,
        background: playable
          ? `linear-gradient(160deg, ${game.accent}22, rgba(255,255,255,0.03))`
          : 'rgba(255,255,255,0.02)',
        opacity: playable ? 1 : 0.6,
        cursor: playable ? 'pointer' : 'default',
      }}
    >
      <span style={{ fontSize: 34 }}>{game.emoji}</span>
      <span style={{ fontWeight: 800, fontSize: 'var(--fs-lg)' }}>{game.name}</span>
      <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--c-text-muted)', flex: 1 }}>{game.tagline}</span>
      <span
        style={{
          alignSelf: 'flex-start',
          padding: '4px 10px',
          borderRadius: 'var(--r-pill)',
          fontSize: 'var(--fs-xs)',
          fontWeight: 700,
          background: playable ? game.accent : 'rgba(255,255,255,0.08)',
          color: playable ? 'var(--c-text-inverse)' : 'var(--c-text-muted)',
        }}
      >
        {playable ? 'Play ▸' : 'Coming soon'}
      </span>
    </button>
  );
};

// --- CIVA lobby -------------------------------------------------------------
const exitToHub = (): void => {
  useLobbyStore.getState().disconnect();
  usePlatformStore.getState().exitGame();
};

const CivaLobby = (): JSX.Element => {
  const me = useLobbyStore((s) => s.me);
  const room = useLobbyStore((s) => s.room);
  const status = useLobbyStore((s) => s.status);
  const [waking, setWaking] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      await enterGame('civa'); // ask the orchestrator to start the game (no-op in dev)
      if (cancelled) return;
      setWaking(false);
      await useLobbyStore.getState().connectToLobby();
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (waking) return <Splash text="Starting CIVA…" />;
  if (!room) return <RoomList connecting={status !== 'connected'} />;
  return <RoomView room={room} myAccountId={me?.accountId ?? ''} />;
};

const Splash = ({ text }: { text: string }): JSX.Element => (
  <div style={shell}>
    <div className="civa-panel civa-fade-in" style={{ padding: 28, textAlign: 'center' }}>
      <div style={{ fontSize: 30, marginBottom: 8 }}>🌍</div>
      <div style={{ fontWeight: 700 }}>{text}</div>
      <div style={{ color: 'var(--c-text-muted)', fontSize: 'var(--fs-sm)', marginTop: 4 }}>
        waking the game server…
      </div>
    </div>
  </div>
);

const RoomList = ({ connecting }: { connecting: boolean }): JSX.Element => {
  const rooms = useLobbyStore((s) => s.rooms);
  const create = useLobbyStore((s) => s.create);
  const join = useLobbyStore((s) => s.join);
  const error = useLobbyStore((s) => s.error);

  return (
    <div style={shell}>
      <div className="civa-panel civa-fade-in" style={{ width: 560, maxWidth: '92vw', padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
          <button onClick={exitToHub} style={{ color: 'var(--c-text-muted)', fontSize: 'var(--fs-sm)', marginRight: 12 }}>
            ← Games
          </button>
          <h1 style={{ fontSize: 'var(--fs-xl)', fontWeight: 800 }}>🌍 CIVA</h1>
          {connecting && (
            <span style={{ marginLeft: 'auto', color: 'var(--c-text-muted)', fontSize: 'var(--fs-sm)' }}>connecting…</span>
          )}
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
        <Err error={error} />
      </div>
    </div>
  );
};

const RoomView = ({ room, myAccountId }: { room: lobby.LobbyRoom; myAccountId: string }): JSX.Element => {
  const { pickNation, setReady, start, leave } = useLobbyStore.getState();
  const error = useLobbyStore((s) => s.error);
  const me = room.players.find((p) => p.accountId === myAccountId);
  const takenBy = new Map(room.players.filter((p) => p.nation).map((p) => [p.nation!, p.accountId]));
  const readyCount = room.players.filter((p) => p.ready).length;
  const isHost = me?.isHost ?? false;
  const canStart = isHost && room.players.length >= room.minPlayers && readyCount === room.players.length;

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

        {/* Nation grid */}
        <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--c-text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>
          Pick a nation
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 18 }}>
          {nations.map((n) => {
            const owner = takenBy.get(n.id);
            const mine = owner === myAccountId;
            const taken = owner && !mine;
            return (
              <button
                key={n.id}
                disabled={Boolean(taken)}
                onClick={() => pickNation(mine ? null : n.id)}
                style={{
                  padding: 10,
                  borderRadius: 'var(--r-md)',
                  border: `2px solid ${mine ? 'var(--c-accent)' : 'var(--c-panel-border)'}`,
                  background: mine ? 'var(--c-accent-muted)' : 'rgba(255,255,255,0.03)',
                  opacity: taken ? 0.4 : 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <span style={{ fontSize: 24 }}>{NATION_FLAG[n.id]}</span>
                <span style={{ fontSize: 'var(--fs-xs)', fontWeight: 600 }}>{n.name}</span>
              </button>
            );
          })}
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => setReady(!me?.ready)}
            style={{
              flex: 1,
              padding: '12px',
              borderRadius: 'var(--r-md)',
              border: '1px solid var(--c-panel-border)',
              fontWeight: 700,
              color: me?.ready ? 'var(--c-positive)' : 'var(--c-text-primary)',
            }}
          >
            {me?.ready ? '✓ Ready' : 'Ready up'}
          </button>
          {isHost && (
            <button
              onClick={() => start()}
              disabled={!canStart}
              style={{ ...primaryBtn, flex: 1, opacity: canStart ? 1 : 0.5 }}
            >
              Start game ▸
            </button>
          )}
        </div>
        <Err error={error} />
      </div>
    </div>
  );
};
