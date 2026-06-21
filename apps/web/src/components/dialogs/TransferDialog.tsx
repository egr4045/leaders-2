import { useState, type CSSProperties, type ReactNode } from 'react';
import type { UnitKind } from '@civa/shared-types';
import { useClientStore } from '../../state/clientStore.js';
import { UNIT_LABEL, getLocations, myLocations } from '../../mock/locations.js';

/**
 * Logistics transfer (section 6): move troops, ammo and fuel from one of the player's locations
 * to another. Moving over distance costs fuel — shown as a hint here; the engine charges it for
 * real later. Phase 1 is a faithful mock (no persistence).
 */
export const TransferDialog = (): JSX.Element | null => {
  const transferFrom = useClientStore((s) => s.transferFrom);
  const close = useClientStore((s) => s.closeTransfer);

  const source = transferFrom ? getLocations().get(transferFrom) : undefined;
  const targets = myLocations().filter((l) => l.key !== transferFrom);

  const [targetKey, setTargetKey] = useState<string>(targets[0]?.key ?? '');
  const [amounts, setAmounts] = useState<Record<string, number>>({});

  if (!source) return null;

  const set = (key: string, value: number, max: number) =>
    setAmounts((a) => ({ ...a, [key]: Math.max(0, Math.min(max, Math.floor(value || 0))) }));

  const troops = Object.entries(source.garrison.troops).filter(([, n]) => n) as [UnitKind, number][];
  const moving = Object.values(amounts).reduce((a, b) => a + b, 0) > 0;

  return (
    <Backdrop onClose={close}>
      <div
        className="civa-panel civa-fade-in"
        style={{ width: 420, padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}
        onClick={(e) => e.stopPropagation()}
      >
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: 'var(--fs-lg)', fontWeight: 700 }}>Transfer logistics</h2>
          <button onClick={close} style={{ fontSize: 20, color: 'var(--c-text-muted)' }}>
            ×
          </button>
        </header>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Pill>{source.name}</Pill>
          <span style={{ color: 'var(--c-accent)' }}>→</span>
          <select
            value={targetKey}
            onChange={(e) => setTargetKey(e.target.value)}
            style={{
              flex: 1,
              padding: '8px 10px',
              borderRadius: 'var(--r-md)',
              background: 'var(--c-panel-solid)',
              color: 'var(--c-text-primary)',
              border: '1px solid var(--c-panel-border)',
            }}
          >
            {targets.map((t) => (
              <option key={t.key} value={t.key}>
                {t.name} ({t.type})
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <Row label="⛽ Fuel" max={source.garrison.fuel} value={amounts.fuel ?? 0} onChange={(v) => set('fuel', v, source.garrison.fuel)} />
          {troops.map(([kind, n]) => (
            <Row
              key={kind}
              label={`${UNIT_LABEL[kind].icon} ${UNIT_LABEL[kind].label}`}
              max={n}
              value={amounts[kind] ?? 0}
              onChange={(v) => set(kind, v, n)}
            />
          ))}
        </div>

        <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--c-text-muted)' }}>
          ⛽ Moving over distance consumes fuel proportional to the hex distance.
        </div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={close} style={btn('ghost')}>
            Cancel
          </button>
          <button onClick={close} disabled={!moving || !targetKey} style={btn('primary', !moving || !targetKey)}>
            Transfer
          </button>
        </div>
      </div>
    </Backdrop>
  );
};

const Row = ({
  label,
  max,
  value,
  onChange,
}: {
  label: string;
  max: number;
  value: number;
  onChange: (v: number) => void;
}): JSX.Element => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
    <span style={{ width: 110, fontSize: 'var(--fs-sm)' }}>{label}</span>
    <input
      type="range"
      min={0}
      max={max}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      style={{ flex: 1, accentColor: 'var(--c-accent)' }}
    />
    <span style={{ width: 64, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
      {value} / {max}
    </span>
  </div>
);

const Pill = ({ children }: { children: ReactNode }): JSX.Element => (
  <span
    style={{
      padding: '6px 12px',
      borderRadius: 'var(--r-pill)',
      background: 'rgba(255,255,255,0.06)',
      fontWeight: 600,
      fontSize: 'var(--fs-sm)',
    }}
  >
    {children}
  </span>
);

const Backdrop = ({
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
      background: 'rgba(0,0,0,0.5)',
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

const btn = (kind: 'ghost' | 'primary', disabled = false): CSSProperties => ({
  padding: '9px 18px',
  borderRadius: 'var(--r-md)',
  fontWeight: 600,
  opacity: disabled ? 0.5 : 1,
  background: kind === 'primary' ? 'var(--c-accent)' : 'rgba(255,255,255,0.06)',
  color: kind === 'primary' ? 'var(--c-text-inverse)' : 'var(--c-text-primary)',
});
