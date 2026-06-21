import { victoryConfig } from '@civa/game-config';
import { computeBlocs } from '../mock/standings.js';

/**
 * Phase 1.15 — final screen (section 3.3). After 5 years the bloc with the most Influence wins;
 * its overlord is elected UN Leader. Secret vassal blocs are revealed here — the "team" reveal.
 */
export const FinaleScreen = (): JSX.Element => {
  const blocs = computeBlocs();
  const winner = blocs[0]!;

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        background: 'radial-gradient(120% 120% at 50% 0%, #1d2a1a 0%, #0b0f16 70%)',
        pointerEvents: 'auto',
        overflowY: 'auto',
        padding: 24,
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 'var(--fs-xs)', letterSpacing: 2, color: 'var(--c-text-muted)' }}>
          ELECTED {victoryConfig.title.toUpperCase()}
        </div>
        <div style={{ fontSize: 54 }}>{winner.overlord.flag}</div>
        <h1 style={{ fontSize: 'var(--fs-xxl)', fontWeight: 800 }}>
          {winner.overlord.name} · {winner.overlord.nation}
        </h1>
        <div style={{ color: 'var(--c-warning)', fontWeight: 700 }}>
          {Math.round(winner.blocInfluence)} ⭐ bloc influence
        </div>
        {winner.vassals.length > 0 && (
          <div style={{ color: 'var(--c-accent)', fontSize: 'var(--fs-sm)', marginTop: 4 }}>
            secret bloc revealed: {winner.vassals.map((v) => `${v.flag} ${v.name}`).join(', ')}
          </div>
        )}
      </div>

      <div className="civa-panel civa-fade-in" style={{ width: 520, maxWidth: '94vw', padding: 12 }}>
        <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--c-text-muted)', padding: '4px 8px' }}>
          FINAL BLOC STANDINGS
        </div>
        {blocs.map((bloc, i) => (
          <div
            key={bloc.overlord.id}
            style={{
              padding: '10px 12px',
              borderRadius: 'var(--r-md)',
              background: i === 0 ? 'var(--c-accent-muted)' : 'transparent',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ width: 22, fontWeight: 700, color: 'var(--c-text-muted)' }}>{i + 1}</span>
              <span style={{ fontSize: 22 }}>{bloc.overlord.flag}</span>
              <span style={{ flex: 1, fontWeight: 600 }}>
                {bloc.overlord.name}{' '}
                <span style={{ color: 'var(--c-text-muted)', fontWeight: 400 }}>· {bloc.overlord.nation}</span>
              </span>
              <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 700 }}>
                {Math.round(bloc.blocInfluence)} ⭐
              </span>
            </div>
            {bloc.vassals.map((v) => (
              <div
                key={v.id}
                style={{ marginLeft: 34, fontSize: 'var(--fs-sm)', color: 'var(--c-text-muted)' }}
              >
                ↳ {v.flag} {v.name} <span style={{ color: 'var(--c-accent)' }}>· vassal ({v.influence} ⭐)</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};
