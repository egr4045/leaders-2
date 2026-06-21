import { useState } from 'react';
import { useClientStore } from '../state/clientStore.js';
import { TechPanel } from './panels/TechPanel.js';

/**
 * Bottom-left command bar (section 8). Nation-wide actions: Trade, Research, Diplomacy.
 * Build & recruit are per-location and live inside the city/base window instead.
 */
export const BottomActionBar = (): JSX.Element => {
  const [research, setResearch] = useState(false);
  const setOverlay = useClientStore((s) => s.setOverlay);

  return (
    <div style={{ position: 'absolute', left: 12, bottom: 48 }}>
      {research && <TechPanel onClose={() => setResearch(false)} />}

      <div
        className="civa-panel"
        style={{ display: 'flex', gap: 4, padding: 6, marginTop: 8, borderRadius: 'var(--r-lg)' }}
      >
        <ActionButton icon="💱" label="Trade" onClick={() => setOverlay('trade')} />
        <ActionButton icon="🔬" label="Research" active={research} onClick={() => setResearch((v) => !v)} />
        <ActionButton icon="🕊️" label="Diplomacy" onClick={() => setOverlay('diplomacy')} />
      </div>
    </div>
  );
};

const ActionButton = ({
  icon,
  label,
  active,
  onClick,
}: {
  icon: string;
  label: string;
  active?: boolean;
  onClick: () => void;
}): JSX.Element => (
  <button
    onClick={onClick}
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 2,
      padding: '8px 16px',
      borderRadius: 'var(--r-md)',
      background: active ? 'var(--c-accent-muted)' : 'transparent',
      color: 'var(--c-text-primary)',
      transition: 'background var(--motion-fast)',
    }}
  >
    <span style={{ fontSize: 18 }}>{icon}</span>
    <span style={{ fontSize: 'var(--fs-xs)' }}>{label}</span>
  </button>
);
