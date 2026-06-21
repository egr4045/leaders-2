import { GAME_PHASES, type GamePhase } from '@civa/shared-types';
import { useClientStore } from '../state/clientStore.js';

const LABELS: Record<GamePhase, string> = {
  lobby: 'Lobby',
  year: 'Year',
  assembly: 'UN',
  finale: 'Finale',
};

/**
 * Dev-only overlay to jump between phases while building screens on mocks. Removed (or gated
 * behind a debug flag) once the real phase flow from the engine drives transitions.
 */
export const DevPhaseSwitcher = (): JSX.Element => {
  const phase = useClientStore((s) => s.phase);
  const setPhase = useClientStore((s) => s.setPhase);

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 8,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 900,
        display: 'flex',
        gap: 4,
        padding: 4,
        background: 'rgba(0,0,0,0.5)',
        borderRadius: 'var(--r-pill)',
        pointerEvents: 'auto',
        fontSize: 'var(--fs-xs)',
      }}
    >
      <span style={{ alignSelf: 'center', padding: '0 8px', color: 'var(--c-text-muted)' }}>dev</span>
      {GAME_PHASES.map((p) => (
        <button
          key={p}
          onClick={() => setPhase(p)}
          style={{
            padding: '4px 12px',
            borderRadius: 'var(--r-pill)',
            background: p === phase ? 'var(--c-accent)' : 'transparent',
            color: p === phase ? 'var(--c-text-inverse)' : 'var(--c-text-muted)',
            fontWeight: 600,
          }}
        >
          {LABELS[p]}
        </button>
      ))}
    </div>
  );
};
