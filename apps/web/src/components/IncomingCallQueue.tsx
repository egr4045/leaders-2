import { useState } from 'react';
import { diploPlayers, incomingRequests } from '../mock/diplomacy.js';

/**
 * Floating queue of incoming call requests (section 3.1 / 7.2): you can see who wants to talk
 * and answer or dismiss. Sits above the diplomacy widget. Phase 7 connects "Answer" to a real
 * LiveKit caucus room.
 */
export const IncomingCallQueue = (): JSX.Element | null => {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const calls = incomingRequests.filter((r) => r.kind === 'call' && !dismissed.has(r.id));
  if (calls.length === 0) return null;

  const dismiss = (id: string) => setDismissed((s) => new Set(s).add(id));

  return (
    <div
      style={{
        position: 'absolute',
        right: 12,
        bottom: 96,
        zIndex: 250,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        width: 250,
      }}
    >
      {calls.map((r) => {
        const from = diploPlayers.find((p) => p.id === r.from)!;
        return (
          <div
            key={r.id}
            className="civa-panel civa-fade-in"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 12px',
              borderLeft: '3px solid var(--c-positive)',
              pointerEvents: 'auto',
            }}
          >
            <span style={{ fontSize: 22, animation: 'civaRing 1s ease-in-out infinite' }}>📞</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 'var(--fs-sm)' }}>
                {from.flag} {from.name}
              </div>
              <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--c-text-muted)' }}>incoming call…</div>
            </div>
            <button
              title="Answer"
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: 'var(--c-positive)',
                color: 'var(--c-text-inverse)',
                fontSize: 15,
              }}
            >
              ✓
            </button>
            <button
              title="Decline"
              onClick={() => dismiss(r.id)}
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: 'var(--c-negative)',
                color: 'var(--c-text-inverse)',
                fontSize: 15,
              }}
            >
              ✕
            </button>
          </div>
        );
      })}
    </div>
  );
};
