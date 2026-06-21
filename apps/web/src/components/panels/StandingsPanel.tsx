import type { ReactNode } from 'react';
import { TOTAL_YEARS } from '@civa/shared-types';
import { useClientStore } from '../../state/clientStore.js';
import { computeBlocs, MY_ID, standings, type InfluenceSources } from '../../mock/standings.js';

const SOURCE_META: { key: keyof InfluenceSources; label: string; icon: string; color: string }[] = [
  { key: 'conquest', label: 'Conquest / vassals', icon: '⚔️', color: 'var(--c-aggression)' },
  { key: 'votes', label: 'Bought votes', icon: '💰', color: 'var(--c-money)' },
  { key: 'tech', label: 'Tech races', icon: '🔬', color: 'var(--c-science)' },
  { key: 'diplomacy', label: 'Diplomacy', icon: '🕊️', color: 'var(--c-diplomacy)' },
];

/**
 * On-map influence standings (the victory model is visible without the UN screen). Shows the
 * bloc leaderboard (overlord + secret vassals), and a breakdown of the local player's four
 * Influence sources. Most influence after 5 years is elected UN Leader.
 */
export const StandingsPanel = (): JSX.Element => {
  const close = useClientStore((s) => s.setOverlay);
  const blocs = computeBlocs();
  const me = standings.find((s) => s.id === MY_ID)!;
  const maxSource = Math.max(...SOURCE_META.map((s) => me.sources[s.key]), 1);

  return (
    <Overlay onClose={() => close(null)}>
      <div
        className="civa-panel civa-fade-in"
        style={{ width: 720, maxWidth: '94vw', maxHeight: '88vh', display: 'flex', flexDirection: 'column' }}
        onClick={(e) => e.stopPropagation()}
      >
        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '14px 18px',
            borderBottom: '1px solid var(--c-panel-border)',
          }}
        >
          <h2 style={{ fontSize: 'var(--fs-lg)', fontWeight: 700 }}>⭐ Influence Standings</h2>
          <span style={{ color: 'var(--c-text-muted)', fontSize: 'var(--fs-sm)' }}>
            Year 2 / {TOTAL_YEARS} · most influence → UN Leader
          </span>
          <button onClick={() => close(null)} style={{ marginLeft: 'auto', fontSize: 22, color: 'var(--c-text-muted)' }}>
            ×
          </button>
        </header>

        <div style={{ display: 'flex', gap: 16, padding: 16, overflowY: 'auto' }}>
          {/* Bloc leaderboard */}
          <div style={{ flex: 1.2, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <SectionLabel>Blocs (overlord + vassals)</SectionLabel>
            {blocs.map((bloc, i) => {
              const isMine = bloc.overlord.id === MY_ID;
              return (
                <div
                  key={bloc.overlord.id}
                  className="civa-panel"
                  style={{ padding: 10, border: isMine ? '1px solid var(--c-accent)' : undefined }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ width: 18, fontWeight: 700, color: 'var(--c-text-muted)' }}>{i + 1}</span>
                    <span style={{ fontSize: 22 }}>{bloc.overlord.flag}</span>
                    <span style={{ flex: 1, fontWeight: 600 }}>
                      {bloc.overlord.name}
                      <span style={{ color: 'var(--c-text-muted)', fontWeight: 400 }}> · {bloc.overlord.nation}</span>
                    </span>
                    <span style={{ fontWeight: 700, color: 'var(--c-science)', fontVariantNumeric: 'tabular-nums' }}>
                      {Math.round(bloc.blocInfluence)} ⭐
                    </span>
                  </div>
                  {bloc.vassals.map((v) => (
                    <div
                      key={v.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        marginLeft: 28,
                        marginTop: 4,
                        fontSize: 'var(--fs-sm)',
                        color: 'var(--c-text-muted)',
                      }}
                    >
                      <span>↳ {v.flag}</span>
                      <span style={{ flex: 1 }}>
                        {v.name} <span style={{ color: 'var(--c-accent)' }}>· vassal</span>
                      </span>
                      <span style={{ fontVariantNumeric: 'tabular-nums' }}>{v.influence} ⭐</span>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>

          {/* Your sources */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <SectionLabel>Your influence · +{me.perTick}/tick</SectionLabel>
            {SOURCE_META.map((s) => {
              const v = me.sources[s.key];
              return (
                <div key={s.key} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-sm)' }}>
                    <span>
                      {s.icon} {s.label}
                    </span>
                    <span style={{ fontWeight: 700, color: s.color }}>{v} ⭐</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 'var(--r-pill)', background: 'rgba(255,255,255,0.08)' }}>
                    <div
                      style={{ width: `${(v / maxSource) * 100}%`, height: '100%', borderRadius: 'var(--r-pill)', background: s.color }}
                    />
                  </div>
                </div>
              );
            })}
            <div
              style={{
                marginTop: 4,
                paddingTop: 8,
                borderTop: '1px solid var(--c-panel-border)',
                display: 'flex',
                justifyContent: 'space-between',
                fontWeight: 700,
              }}
            >
              <span>Total</span>
              <span style={{ color: 'var(--c-science)' }}>{me.influence} ⭐</span>
            </div>
            <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--c-text-muted)', lineHeight: 1.4 }}>
              Four paths to the top: vassalize rivals, buy votes with money, win tech races, or build a diplomatic
              coalition. Vassals' influence feeds your bloc — the final screen reveals the teams.
            </p>
          </div>
        </div>
      </div>
    </Overlay>
  );
};

const SectionLabel = ({ children }: { children: ReactNode }): JSX.Element => (
  <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--c-text-muted)', letterSpacing: 0.5, textTransform: 'uppercase' }}>
    {children}
  </div>
);

const Overlay = ({
  children,
  onClose,
}: {
  children: ReactNode;
  onClose: () => void;
}): JSX.Element => (
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
