import { useState } from 'react';

interface Resolution {
  id: string;
  title: string;
  detail: string;
}

const RESOLUTIONS: Resolution[] = [
  { id: 'embargo', title: 'Trade embargo on China', detail: 'Freeze all exchange lots to/from China for one year.' },
  { id: 'nuke-ban', title: 'Ban nuclear weapons', detail: 'Outlaw missile strikes for the next year.' },
  { id: 'sanction', title: 'Economic sanctions on Brazil', detail: 'Halve Brazil’s exchange commission income.' },
];

const BULLETIN = [
  'China struck Washington twice — 38 ore looted.',
  'Brazil’s aggression index is the highest in the assembly.',
  'Global oil reserves fell sharply this year.',
];

/**
 * Phase 1.13 — UN General Assembly (section 3.2). Map is locked behind this. The TTS announcer
 * reads the crisis bulletin (audio stubbed in Phase 1), then debate + resolution voting.
 * Diplomatic Mission doubles a player's vote.
 */
export const AssemblyScreen = (): JSX.Element => {
  const [votes, setVotes] = useState<Record<string, 'for' | 'against' | null>>({});

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 18,
        padding: 24,
        background: 'rgba(7, 11, 18, 0.78)',
        backdropFilter: 'blur(2px)',
        pointerEvents: 'auto',
        overflowY: 'auto',
      }}
    >
      <h1 style={{ fontSize: 'var(--fs-xxl)', fontWeight: 800, letterSpacing: 1, marginTop: 12 }}>
        🏛️ General Assembly
      </h1>

      {/* Crisis bulletin / announcer */}
      <div className="civa-panel civa-fade-in" style={{ width: 640, maxWidth: '92vw', padding: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <span style={{ fontSize: 22 }}>📢</span>
          <strong>World Crisis Bulletin</strong>
          <span style={{ marginLeft: 'auto', display: 'flex', gap: 6, alignItems: 'center' }}>
            <span className="civa-eq" /> announcer speaking · mics muted
          </span>
        </div>
        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {BULLETIN.map((line, i) => (
            <li key={i} style={{ display: 'flex', gap: 8 }}>
              <span style={{ color: 'var(--c-aggression)' }}>▸</span>
              {line}
            </li>
          ))}
        </ul>
      </div>

      {/* Resolutions */}
      <div style={{ width: 640, maxWidth: '92vw', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {RESOLUTIONS.map((r) => (
          <div key={r.id} className="civa-panel" style={{ padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
              <div>
                <strong>{r.title}</strong>
                <p style={{ color: 'var(--c-text-muted)', fontSize: 'var(--fs-sm)', marginTop: 4 }}>{r.detail}</p>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {(['for', 'against'] as const).map((side) => (
                  <button
                    key={side}
                    onClick={() => setVotes((v) => ({ ...v, [r.id]: side }))}
                    style={{
                      padding: '8px 16px',
                      borderRadius: 'var(--r-md)',
                      fontWeight: 600,
                      textTransform: 'capitalize',
                      background:
                        votes[r.id] === side
                          ? side === 'for'
                            ? 'var(--c-positive)'
                            : 'var(--c-negative)'
                          : 'rgba(255,255,255,0.05)',
                      color: votes[r.id] === side ? 'var(--c-text-inverse)' : 'var(--c-text-primary)',
                    }}
                  >
                    {side}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      <span style={{ color: 'var(--c-text-muted)', fontSize: 'var(--fs-sm)' }}>
        Majority rules · a Diplomatic Mission doubles your vote
      </span>
    </div>
  );
};
