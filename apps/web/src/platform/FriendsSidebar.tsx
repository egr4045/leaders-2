/**
 * Friends sidebar — the Steam-style social panel on the hub. Shows your friend code, an add-by-code
 * box, incoming requests (accept/decline), and your friends with live presence + "playing X". The
 * data is server-pushed via `socialStore`; this is a thin view. Join/Spectate buttons arrive with
 * the invites module (P3/P4).
 */
import { useState, type CSSProperties } from 'react';
import type { social } from '@civa/protocol';
import { useSocialStore } from '../state/socialStore.js';
import { routeToInvite } from './inviteRouting.js';

const panel: CSSProperties = {
  position: 'absolute',
  top: 16,
  right: 16,
  bottom: 16,
  width: 280,
  padding: 16,
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
  pointerEvents: 'auto',
  overflow: 'hidden',
};

const input: CSSProperties = {
  flex: 1,
  padding: '8px 10px',
  borderRadius: 'var(--r-md)',
  background: 'var(--c-panel-solid)',
  color: 'var(--c-text-primary)',
  border: '1px solid var(--c-panel-border)',
  fontSize: 'var(--fs-sm)',
  minWidth: 0,
};

const smallBtn: CSSProperties = {
  padding: '6px 10px',
  borderRadius: 'var(--r-md)',
  background: 'var(--c-accent)',
  color: 'var(--c-text-inverse)',
  fontWeight: 700,
  fontSize: 'var(--fs-sm)',
};

const ghostBtn: CSSProperties = {
  padding: '6px 10px',
  borderRadius: 'var(--r-md)',
  border: '1px solid var(--c-panel-border)',
  color: 'var(--c-text-muted)',
  fontSize: 'var(--fs-sm)',
};

const sectionLabel: CSSProperties = {
  fontSize: 'var(--fs-xs)',
  color: 'var(--c-text-muted)',
  textTransform: 'uppercase',
  letterSpacing: 0.5,
  marginTop: 4,
};

const activityText = (f: social.Friend): string => {
  if (f.presence === 'offline') return 'Offline';
  if (f.activity) return `Playing ${f.activity.gameName}`;
  return 'Online';
};

export const FriendsSidebar = (): JSX.Element => {
  const me = useSocialStore((s) => s.me);
  const friends = useSocialStore((s) => s.friends);
  const invites = useSocialStore((s) => s.invites);
  const status = useSocialStore((s) => s.status);
  const error = useSocialStore((s) => s.error);
  const { addByCode, accept, decline, removeFriend, dismissInvite } = useSocialStore.getState();
  const [code, setCode] = useState('');
  const [copied, setCopied] = useState(false);

  const incoming = friends.filter((f) => f.status === 'incoming');
  const accepted = friends.filter((f) => f.status === 'accepted');
  const outgoing = friends.filter((f) => f.status === 'outgoing');
  // Online friends first, then alphabetical.
  accepted.sort((a, b) => (a.presence === b.presence ? a.displayName.localeCompare(b.displayName) : a.presence === 'online' ? -1 : 1));

  const add = () => {
    if (code.trim()) {
      addByCode(code);
      setCode('');
    }
  };
  const copyCode = () => {
    if (!me) return;
    void navigator.clipboard?.writeText(me.accountId).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <div className="civa-panel" style={panel}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <h2 style={{ fontSize: 'var(--fs-lg)', fontWeight: 800 }}>Friends</h2>
        <span
          title={status}
          style={{
            marginLeft: 8,
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: status === 'connected' ? 'var(--c-positive)' : 'var(--c-warning)',
          }}
        />
        <span style={{ marginLeft: 'auto', color: 'var(--c-text-muted)', fontSize: 'var(--fs-xs)' }}>
          {accepted.filter((f) => f.presence === 'online').length} online
        </span>
      </div>

      {/* Your friend code */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ color: 'var(--c-text-muted)', fontSize: 'var(--fs-xs)' }}>Your code</span>
        <code style={{ flex: 1, fontSize: 'var(--fs-xs)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {me?.accountId ?? '…'}
        </code>
        <button onClick={copyCode} style={ghostBtn}>
          {copied ? '✓' : 'Copy'}
        </button>
      </div>

      {/* Add by code */}
      <div style={{ display: 'flex', gap: 6 }}>
        <input
          value={code}
          placeholder="Add by friend code"
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && add()}
          style={input}
        />
        <button onClick={add} style={smallBtn}>
          Add
        </button>
      </div>
      {error && <div style={{ color: 'var(--c-negative)', fontSize: 'var(--fs-xs)' }}>⚠ {error}</div>}

      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {invites.length > 0 && <div style={sectionLabel}>Invites</div>}
        {invites.map((inv) => (
          <div
            key={inv.code}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 'var(--r-md)', background: 'var(--c-accent-muted)' }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 'var(--fs-sm)' }}>{inv.inviterName}</div>
              <div style={{ color: 'var(--c-accent)', fontSize: 'var(--fs-xs)' }}>
                {inv.gameName}
                {inv.role === 'spectator' ? ' · spectate' : ''}
              </div>
            </div>
            <button
              onClick={() => {
                dismissInvite(inv.code);
                void routeToInvite(inv);
              }}
              style={smallBtn}
            >
              Join
            </button>
            <button title="Dismiss" onClick={() => dismissInvite(inv.code)} style={ghostBtn}>
              ✕
            </button>
          </div>
        ))}

        {incoming.length > 0 && <div style={sectionLabel}>Requests</div>}
        {incoming.map((f) => (
          <Row key={f.accountId} f={f}>
            <button onClick={() => accept(f.accountId)} style={smallBtn}>
              Accept
            </button>
            <button onClick={() => decline(f.accountId)} style={ghostBtn}>
              ✕
            </button>
          </Row>
        ))}

        {accepted.length > 0 && <div style={sectionLabel}>Friends</div>}
        {accepted.map((f) => (
          <Row key={f.accountId} f={f}>
            <button title="Remove" onClick={() => removeFriend(f.accountId)} style={ghostBtn}>
              ✕
            </button>
          </Row>
        ))}
        {accepted.length === 0 && incoming.length === 0 && (
          <div style={{ color: 'var(--c-text-muted)', fontSize: 'var(--fs-sm)', textAlign: 'center', padding: 16 }}>
            No friends yet. Share your code to connect.
          </div>
        )}

        {outgoing.length > 0 && <div style={sectionLabel}>Pending</div>}
        {outgoing.map((f) => (
          <Row key={f.accountId} f={f}>
            <span style={{ color: 'var(--c-text-muted)', fontSize: 'var(--fs-xs)' }}>requested</span>
            <button onClick={() => decline(f.accountId)} style={ghostBtn}>
              ✕
            </button>
          </Row>
        ))}
      </div>
    </div>
  );
};

const Row = ({ f, children }: { f: social.Friend; children: React.ReactNode }): JSX.Element => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '6px 8px',
      borderRadius: 'var(--r-md)',
      background: 'rgba(255,255,255,0.03)',
    }}
  >
    <span
      title={f.presence}
      style={{
        width: 8,
        height: 8,
        borderRadius: '50%',
        flexShrink: 0,
        background: f.presence === 'online' ? 'var(--c-positive)' : 'var(--c-text-muted)',
      }}
    />
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontWeight: 600, fontSize: 'var(--fs-sm)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {f.displayName}
      </div>
      <div style={{ color: f.activity ? 'var(--c-accent)' : 'var(--c-text-muted)', fontSize: 'var(--fs-xs)' }}>
        {activityText(f)}
      </div>
    </div>
    {children}
  </div>
);
