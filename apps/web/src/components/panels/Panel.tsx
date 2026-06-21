import type { ReactNode } from 'react';

interface PanelProps {
  title: string;
  onClose?: () => void;
  children: ReactNode;
  width?: number;
  footer?: ReactNode;
}

/** Shared floating window chrome: title bar, optional close button, scrollable body, footer. */
export const Panel = ({ title, onClose, children, width = 320, footer }: PanelProps): JSX.Element => (
  <div
    className="civa-panel civa-fade-in"
    style={{ width, display: 'flex', flexDirection: 'column', maxHeight: '70vh' }}
  >
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 14px',
        borderBottom: '1px solid var(--c-panel-border)',
      }}
    >
      <h2 style={{ fontSize: 'var(--fs-md)', fontWeight: 700, letterSpacing: 0.2 }}>{title}</h2>
      {onClose && (
        <button onClick={onClose} style={{ color: 'var(--c-text-muted)', fontSize: 18, lineHeight: 1 }}>
          ×
        </button>
      )}
    </header>
    <div style={{ overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
      {children}
    </div>
    {footer && <footer style={{ padding: 12, borderTop: '1px solid var(--c-panel-border)' }}>{footer}</footer>}
  </div>
);

/** Renders a resource cost map as a compact inline list of coloured chips. */
export const CostList = ({ cost }: { cost: Record<string, number | undefined> }): JSX.Element => {
  const entries = Object.entries(cost).filter(([, v]) => v);
  if (entries.length === 0) return <span style={{ color: 'var(--c-text-muted)' }}>free</span>;
  return (
    <span style={{ display: 'inline-flex', gap: 8, flexWrap: 'wrap' }}>
      {entries.map(([k, v]) => (
        <span key={k} style={{ fontSize: 'var(--fs-xs)', color: 'var(--c-text-muted)' }}>
          {v} {k}
        </span>
      ))}
    </span>
  );
};
