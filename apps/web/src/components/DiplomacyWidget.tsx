import { useClientStore } from '../state/clientStore.js';
import { mockCaucus } from '../mock/playerState.js';

/**
 * Floating WebRTC diplomacy widget (section 8). Phase 1 renders avatar tiles, mute, and a
 * caucus shell with placeholder streams; Phase 7 wires real LiveKit tracks in.
 */
export const DiplomacyWidget = (): JSX.Element => {
  const open = useClientStore((s) => s.diplomacyOpen);
  const toggle = useClientStore((s) => s.toggleDiplomacy);
  const setOverlay = useClientStore((s) => s.setOverlay);

  return (
    <div style={{ position: 'absolute', right: 12, bottom: 48, zIndex: 200 }}>
      {open && (
        <div
          className="civa-panel civa-fade-in"
          style={{ width: 240, marginBottom: 8, padding: 10, display: 'flex', flexDirection: 'column', gap: 8 }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <strong style={{ fontSize: 'var(--fs-sm)' }}>Caucus · 3</strong>
            <button
              onClick={() => setOverlay('trade')}
              style={{ fontSize: 'var(--fs-xs)', color: 'var(--c-accent)' }}
            >
              Exchange ▸
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            {mockCaucus.map((p) => (
              <div
                key={p.id}
                style={{
                  position: 'relative',
                  aspectRatio: '4 / 3',
                  borderRadius: 'var(--r-md)',
                  background: 'linear-gradient(135deg,#1b2740,#0e141e)',
                  border: p.speaking ? '2px solid var(--c-positive)' : '1px solid var(--c-panel-border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 22,
                }}
              >
                👤
                <span
                  style={{
                    position: 'absolute',
                    bottom: 2,
                    left: 4,
                    fontSize: 'var(--fs-xs)',
                    textShadow: '0 1px 2px #000',
                  }}
                >
                  {p.name}
                </span>
                {p.muted && <span style={{ position: 'absolute', top: 2, right: 4 }}>🔇</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={toggle}
        className="civa-panel"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 14px',
          borderRadius: 'var(--r-pill)',
          fontWeight: 600,
        }}
      >
        <span style={{ fontSize: 16 }}>🎙️</span>
        {open ? 'Hide caucus' : 'Diplomacy'}
      </button>
    </div>
  );
};
