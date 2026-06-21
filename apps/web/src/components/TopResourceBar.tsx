import { useClientStore } from '../state/clientStore.js';
import { mockInfluence, mockResources, RESOURCE_ICON, RESOURCE_LABEL, type ResourceRow } from '../mock/playerState.js';

const fmt = (n: number): string =>
  n >= 1000 ? (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k' : String(n);

const Chip = ({ row }: { row: ResourceRow }): JSX.Element => (
  <div
    title={RESOURCE_LABEL[row.kind]}
    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 11px', height: '100%' }}
  >
    <span style={{ fontSize: 15, lineHeight: 1 }}>{RESOURCE_ICON[row.kind]}</span>
    <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>{fmt(row.amount)}</span>
    {row.delta !== 0 && (
      <span
        style={{
          fontSize: 'var(--fs-xs)',
          color: row.delta > 0 ? 'var(--c-positive)' : 'var(--c-negative)',
        }}
      >
        {row.delta > 0 ? '+' : ''}
        {row.delta}
      </span>
    )}
  </div>
);

/** The horizontal Paradox-style resource strip across the top (5 resources + a prominent Influence). */
export const TopResourceBar = (): JSX.Element => {
  const setOverlay = useClientStore((s) => s.setOverlay);
  return (
    <div
      className="civa-panel"
      style={{
        position: 'absolute',
        top: 8,
        left: '50%',
        transform: 'translateX(-50%)',
        height: 40,
        display: 'flex',
        alignItems: 'center',
        borderRadius: 'var(--r-pill)',
        padding: '0 6px',
        maxWidth: 'calc(100vw - 32px)',
        overflowX: 'auto',
      }}
    >
      {mockResources.map((r, i) => (
        <div key={r.kind} style={{ display: 'flex', height: '62%', alignItems: 'center' }}>
          {i > 0 && <span style={{ width: 1, height: '100%', background: 'var(--c-panel-border)' }} />}
          <Chip row={r} />
        </div>
      ))}
      {/* Influence — the victory currency. Click to open the standings. */}
      <button
        onClick={() => setOverlay('standings')}
        title="Influence — wins the election after 5 years (click for standings)"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          marginLeft: 4,
          padding: '0 12px',
          height: '76%',
          borderRadius: 'var(--r-pill)',
          background: 'rgba(124,108,240,0.18)',
          border: '1px solid rgba(124,108,240,0.5)',
        }}
      >
        <span style={{ fontSize: 15 }}>⭐</span>
        <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 700, color: 'var(--c-science)' }}>
          {mockInfluence.amount}
        </span>
        {mockInfluence.delta !== 0 && (
          <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--c-positive)' }}>+{mockInfluence.delta}</span>
        )}
      </button>
    </div>
  );
};
