import { useState, type CSSProperties, type ReactNode } from 'react';
import { influenceConfig } from '@civa/game-config';
import { useClientStore } from '../../state/clientStore.js';
import {
  RELATION_META,
  REQUEST_META,
  alliances,
  diploPlayers,
  incomingRequests,
  type DiploPlayer,
} from '../../mock/diplomacy.js';

/**
 * Advanced diplomacy (sections 3, 7.2). Manage relations with every nation; propose trades,
 * defensive alliances and private calls; and answer incoming requests. Phase 1 is a mock;
 * Phase 7 wires call requests to LiveKit and trades/alliances to engine commands.
 */
export const DiplomacyPanel = (): JSX.Element => {
  const close = useClientStore((s) => s.setOverlay);
  const openP2P = useClientStore((s) => s.openP2P);
  const [selected, setSelected] = useState<DiploPlayer>(diploPlayers[0]!);

  return (
    <Overlay onClose={() => close(null)}>
      <div
        className="civa-panel civa-fade-in"
        style={{ width: 820, maxWidth: '95vw', height: '80vh', display: 'flex', flexDirection: 'column' }}
        onClick={(e) => e.stopPropagation()}
      >
        <header
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '14px 18px',
            borderBottom: '1px solid var(--c-panel-border)',
          }}
        >
          <h2 style={{ fontSize: 'var(--fs-lg)', fontWeight: 700 }}>🕊️ Diplomacy</h2>
          <button onClick={() => close(null)} style={{ fontSize: 22, color: 'var(--c-text-muted)' }}>
            ×
          </button>
        </header>

        <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
          {/* Nations list */}
          <div style={{ width: 280, borderRight: '1px solid var(--c-panel-border)', overflowY: 'auto', padding: 10 }}>
            <SectionLabel>Nations</SectionLabel>
            {diploPlayers.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelected(p)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 10px',
                  borderRadius: 'var(--r-md)',
                  marginBottom: 4,
                  background: selected.id === p.id ? 'var(--c-accent-muted)' : 'transparent',
                  textAlign: 'left',
                }}
              >
                <span style={{ fontSize: 22 }}>{p.flag}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600 }}>
                    {p.name} <span style={{ color: 'var(--c-text-muted)', fontWeight: 400 }}>· {p.nation}</span>
                  </div>
                  <div style={{ fontSize: 'var(--fs-xs)', color: RELATION_META[p.relation].color }}>
                    {RELATION_META[p.relation].label} · aggr {p.aggression}
                  </div>
                </div>
                <span
                  title={p.online ? 'online' : 'offline'}
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: p.online ? 'var(--c-positive)' : 'var(--c-text-muted)',
                  }}
                />
              </button>
            ))}
          </div>

          {/* Selected nation + requests + alliances */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <span style={{ fontSize: 34 }}>{selected.flag}</span>
                <div>
                  <div style={{ fontSize: 'var(--fs-lg)', fontWeight: 700 }}>
                    {selected.name} · {selected.nation}
                  </div>
                  <div style={{ color: RELATION_META[selected.relation].color, fontSize: 'var(--fs-sm)' }}>
                    {RELATION_META[selected.relation].label} · aggression {selected.aggression}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <Action icon="📞" label="Request call" />
                <Action
                  icon="💱"
                  label="Propose trade"
                  onClick={() =>
                    openP2P({
                      withId: selected.id,
                      incoming: false,
                      give: [{ resource: 'materials', qty: 30 }],
                      receive: [{ resource: 'fuel', qty: 50 }],
                    })
                  }
                />
                <Action icon="🤝" label="Defensive pact" />
                <Action icon="💰" label={`Buy votes · ${influenceConfig.moneyPerVote}💰 ⭐`} />
                <Action icon="👑" label="Offer vassalage" />
                <Action icon="⚠️" label="Declare hostility" danger />
              </div>
            </div>

            <div>
              <SectionLabel>Incoming requests · {incomingRequests.length}</SectionLabel>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                {incomingRequests.map((r) => {
                  const from = diploPlayers.find((p) => p.id === r.from)!;
                  return (
                    <div
                      key={r.id}
                      className="civa-panel"
                      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px' }}
                    >
                      <span style={{ fontSize: 18 }}>{REQUEST_META[r.kind].icon}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 'var(--fs-sm)', fontWeight: 600 }}>
                          {from.flag} {REQUEST_META[r.kind].label}
                        </div>
                        <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--c-text-muted)' }}>{r.detail}</div>
                      </div>
                      <button
                        style={pill('var(--c-positive)')}
                        onClick={() => {
                          if (r.kind === 'trade')
                            openP2P({
                              withId: r.from,
                              incoming: true,
                              give: [{ resource: 'fuel', qty: 50 }],
                              receive: [{ resource: 'materials', qty: 30 }],
                            });
                        }}
                      >
                        Accept
                      </button>
                      <button style={pill('rgba(255,255,255,0.08)', true)}>Decline</button>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <SectionLabel>Defensive pacts</SectionLabel>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
                {alliances.length === 0 && (
                  <span style={{ color: 'var(--c-text-muted)', fontSize: 'var(--fs-sm)' }}>none yet</span>
                )}
                {alliances.map((a) => {
                  const p = diploPlayers.find((x) => x.id === a.with)!;
                  return (
                    <div
                      key={a.with}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '8px 12px',
                        borderRadius: 'var(--r-md)',
                        background: 'rgba(70,196,106,0.12)',
                        border: '1px solid rgba(70,196,106,0.3)',
                      }}
                    >
                      🤝 <span style={{ fontWeight: 600 }}>{p.flag} {p.name}</span>
                      <span style={{ color: 'var(--c-text-muted)', fontSize: 'var(--fs-xs)' }}>
                        defensive · since year {a.sinceYear}
                      </span>
                      <button style={{ ...pill('rgba(255,255,255,0.08)', true), marginLeft: 'auto' }}>Break</button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Overlay>
  );
};

const Action = ({
  icon,
  label,
  danger,
  onClick,
}: {
  icon: string;
  label: string;
  danger?: boolean;
  onClick?: () => void;
}): JSX.Element => (
  <button
    onClick={onClick}
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      padding: '9px 14px',
      borderRadius: 'var(--r-md)',
      fontWeight: 600,
      fontSize: 'var(--fs-sm)',
      background: danger ? 'rgba(224,82,74,0.15)' : 'rgba(255,255,255,0.06)',
      color: danger ? 'var(--c-negative)' : 'var(--c-text-primary)',
      border: danger ? '1px solid rgba(224,82,74,0.4)' : '1px solid var(--c-panel-border)',
    }}
  >
    {icon} {label}
  </button>
);

const SectionLabel = ({ children }: { children: ReactNode }): JSX.Element => (
  <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--c-text-muted)', letterSpacing: 0.5, textTransform: 'uppercase' }}>
    {children}
  </div>
);

const pill = (bg: string, muted = false): CSSProperties => ({
  padding: '6px 12px',
  borderRadius: 'var(--r-pill)',
  fontWeight: 600,
  fontSize: 'var(--fs-sm)',
  background: bg,
  color: muted ? 'var(--c-text-primary)' : 'var(--c-text-inverse)',
});

const Overlay = ({ children, onClose }: { children: ReactNode; onClose: () => void }): JSX.Element => (
  <div
    onClick={onClose}
    style={{
      position: 'absolute',
      inset: 0,
      background: 'rgba(0,0,0,0.55)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 400,
      pointerEvents: 'auto',
    }}
  >
    {children}
  </div>
);
