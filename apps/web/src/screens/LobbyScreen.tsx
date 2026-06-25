import { useEffect, useState, type CSSProperties } from 'react';
import { nations } from '@civa/game-config';
import type { lobby } from '@civa/protocol';
import { useLobbyStore } from '../state/lobbyStore.js';
import { useSocialStore } from '../state/socialStore.js';
import { usePlatformStore } from '../platform/platformStore.js';
import { GAMES, type GameInfo } from '../platform/games.js';
import { FriendsSidebar } from '../platform/FriendsSidebar.js';
import { routeToInvite } from '../platform/inviteRouting.js';
import { enterGame } from '../net/orchestratorClient.js';
import { AuthScreen } from './AuthScreen.js';
import { HubScreen } from './HubScreen.js';
import { resolveInvite } from '../net/inviteClient.js';

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

  // Connect the platform social layer (friends + presence) once we have an account.
  useEffect(() => {
    if (account) void useSocialStore.getState().connect();
    else useSocialStore.getState().disconnect();
  }, [account?.accountId]);

  // Honour an invite deep-link (`?invite=CODE`) once logged in: resolve it, route into the game,
  // and strip the param so a refresh doesn't re-trigger.
  useEffect(() => {
    if (!account) return;
    const params = new URLSearchParams(window.location.search);
    const code = params.get('invite');
    if (!code) return;
    void (async () => {
      const inv = await resolveInvite(code);
      params.delete('invite');
      const qs = params.toString();
      window.history.replaceState({}, '', window.location.pathname + (qs ? `?${qs}` : ''));
      if (inv) await routeToInvite(inv);
    })();
  }, [account?.accountId]);

  if (!account) return <AuthScreen />;
  if (!selectedGame) return <HubScreen />;
  if (selectedGame === 'civa') return <CivaLobby />;
  return <HubScreen />;
};

const Err = ({ error }: { error: string | null }): JSX.Element | null =>
  error ? (
    <div style={{ color: 'var(--c-negative)', fontSize: 'var(--fs-sm)', marginTop: 8 }}>⚠ {error}</div>
  ) : null;



// --- CIVA lobby -------------------------------------------------------------
const exitToHub = (): void => {
  useLobbyStore.getState().disconnect();
  useSocialStore.getState().setActivity(null); // clear presence: back on the hub
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

  // Report presence so friends see "Playing CIVA" (and which room, for Join/Spectate later).
  useEffect(() => {
    useSocialStore.getState().setActivity({
      game: 'civa',
      gameName: 'CIVA',
      room: room?.id ?? null,
      joinable: room?.status === 'waiting',
    });
  }, [room?.id, room?.status]);

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

/** In-room invite affordances: a shareable link/code, plus one-click invites to online friends. */
const InvitePanel = ({ roomId }: { roomId: string }): JSX.Element => {
  const friends = useSocialStore((s) => s.friends);
  const { createInvite, inviteFriend } = useSocialStore.getState();
  const [code, setCode] = useState<string | null>(null);
  const [copied, setCopied] = useState<'code' | 'link' | null>(null);
  const [invited, setInvited] = useState<string[]>([]);
  const target = { game: 'civa', gameName: 'CIVA', room: roomId, role: 'player' as const };

  useEffect(() => {
    let alive = true;
    void createInvite(target).then((c) => alive && setCode(c));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  const link = code ? `${window.location.origin}/?invite=${code}` : '';
  const copy = (what: 'code' | 'link', value: string) =>
    void navigator.clipboard?.writeText(value).then(() => {
      setCopied(what);
      window.setTimeout(() => setCopied(null), 1500);
    });
  const online = friends.filter((f) => f.status === 'accepted' && f.presence === 'online');

  return (
    <div className="civa-fade-in" style={{ padding: 14, marginBottom: 16, borderRadius: 'var(--r-md)', background: 'rgba(255,255,255,0.04)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ color: 'var(--c-text-muted)', fontSize: 'var(--fs-xs)' }}>Code</span>
        <code style={{ fontWeight: 700, letterSpacing: 1 }}>{code ?? '…'}</code>
        <button disabled={!code} onClick={() => code && copy('code', code)} style={{ ...primaryBtn, padding: '4px 10px' }}>
          {copied === 'code' ? '✓' : 'Copy code'}
        </button>
        <button disabled={!code} onClick={() => copy('link', link)} style={{ marginLeft: 'auto', ...primaryBtn, padding: '4px 10px' }}>
          {copied === 'link' ? '✓ Copied' : 'Copy link'}
        </button>
      </div>

      {online.length > 0 && (
        <>
          <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--c-text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, margin: '12px 0 6px' }}>
            Invite friends
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 140, overflowY: 'auto' }}>
            {online.map((f) => (
              <div key={f.accountId} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 8px' }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--c-positive)' }} />
                <span style={{ flex: 1, fontSize: 'var(--fs-sm)' }}>{f.displayName}</span>
                <button
                  disabled={invited.includes(f.accountId)}
                  onClick={() => {
                    inviteFriend(f.accountId, target);
                    setInvited((p) => [...p, f.accountId]);
                  }}
                  style={{ ...primaryBtn, padding: '4px 10px', opacity: invited.includes(f.accountId) ? 0.5 : 1 }}
                >
                  {invited.includes(f.accountId) ? 'Invited' : 'Invite'}
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

const RoomView = ({ room, myAccountId }: { room: lobby.LobbyRoom; myAccountId: string }): JSX.Element => {
  const { pickNation, setReady, start, leave } = useLobbyStore.getState();
  const error = useLobbyStore((s) => s.error);
  const [showInvite, setShowInvite] = useState(false);
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
          <button
            onClick={() => setShowInvite((v) => !v)}
            style={{ marginLeft: 'auto', ...primaryBtn, padding: '6px 12px' }}
          >
            ✉ Invite
          </button>
          <button onClick={() => leave()} style={{ marginLeft: 12, color: 'var(--c-text-muted)', fontSize: 'var(--fs-sm)' }}>
            Leave
          </button>
        </div>

        {showInvite && <InvitePanel roomId={room.id} />}

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
