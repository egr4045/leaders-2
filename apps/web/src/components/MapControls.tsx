import { useClientStore, type MapMode } from '../state/clientStore.js';

const MODES: { id: MapMode; label: string; icon: string }[] = [
  { id: 'geographic', label: 'Geographic', icon: '🌍' },
  { id: 'political', label: 'Political', icon: '🏳️' },
  { id: 'combined', label: 'Combined', icon: '🗺️' },
];

/**
 * Map view controls (top-right): switch between geographic (terrain + resources), political
 * (borders + owners) and combined, and toggle the fog of war.
 */
export const MapControls = (): JSX.Element => {
  const mode = useClientStore((s) => s.mapMode);
  const setMode = useClientStore((s) => s.setMapMode);
  const fog = useClientStore((s) => s.fog);
  const toggleFog = useClientStore((s) => s.toggleFog);

  return (
    <div style={{ position: 'absolute', top: 54, right: 12, display: 'flex', gap: 6 }}>
      <div className="civa-panel" style={{ display: 'flex', gap: 2, padding: 4, borderRadius: 'var(--r-pill)' }}>
        {MODES.map((m) => (
          <button
            key={m.id}
            title={m.label}
            onClick={() => setMode(m.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              padding: '6px 12px',
              borderRadius: 'var(--r-pill)',
              background: mode === m.id ? 'var(--c-accent)' : 'transparent',
              color: mode === m.id ? 'var(--c-text-inverse)' : 'var(--c-text-muted)',
              fontWeight: 600,
              fontSize: 'var(--fs-xs)',
            }}
          >
            <span style={{ fontSize: 14 }}>{m.icon}</span>
            {m.label}
          </button>
        ))}
      </div>
      <button
        onClick={toggleFog}
        title="Toggle fog of war"
        className="civa-panel"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 5,
          padding: '6px 12px',
          borderRadius: 'var(--r-pill)',
          color: fog ? 'var(--c-text-primary)' : 'var(--c-text-muted)',
          fontWeight: 600,
          fontSize: 'var(--fs-xs)',
        }}
      >
        🌫️ Fog {fog ? 'on' : 'off'}
      </button>
    </div>
  );
};
