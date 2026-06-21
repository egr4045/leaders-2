import { useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import { hexDistance, hexFromKey } from '@civa/hex-core';
import { combatConfig, influenceConfig, units } from '@civa/game-config';
import type { UnitKind } from '@civa/shared-types';
import { useClientStore } from '../../state/clientStore.js';
import { UNIT_LABEL, getLocations, myLocations } from '../../mock/locations.js';

/**
 * Attack planner (section 6). Pick a source location, choose which in-range units to commit, and
 * preview the ammo/fuel cost, expected building damage and loot, plus defender advantages and
 * interception risk. Phase 1 mock — launching is a no-op.
 */
export const AttackDialog = (): JSX.Element | null => {
  const targetKey = useClientStore((s) => s.attackTargetKey);
  const close = useClientStore((s) => s.closeAttack);

  const target = targetKey ? getLocations().get(targetKey) : undefined;

  // Player's locations that can reach the target, with distance.
  const sources = useMemo(() => {
    if (!targetKey) return [];
    const t = hexFromKey(targetKey);
    return myLocations()
      .map((l) => ({ loc: l, distance: hexDistance(hexFromKey(l.key), t) }))
      .sort((a, b) => a.distance - b.distance);
  }, [targetKey]);

  const [sourceKey, setSourceKey] = useState<string>(sources[0]?.loc.key ?? '');
  const [chosen, setChosen] = useState<Partial<Record<UnitKind, number>>>({});
  const [outcome, setOutcome] = useState<'raze' | 'tribute' | 'vassal'>('raze');

  if (!target) return null;
  const source = sources.find((s) => s.loc.key === sourceKey) ?? sources[0];
  if (!source) {
    return (
      <Backdrop onClose={close}>
        <Frame onClose={close} title={`Attack ${target.name}`}>
          <p style={{ color: 'var(--c-text-muted)' }}>You have no locations in range of this target.</p>
        </Frame>
      </Backdrop>
    );
  }

  const D = source.distance;
  const g = source.loc.garrison;
  const eligible = (Object.keys(g.troops) as UnitKind[]).filter((k) => (g.troops[k] ?? 0) > 0);

  const fuelCost = eligible.reduce((a, k) => a + (chosen[k] ?? 0) * units[k].fuelPerHex * D, 0);
  const damage = eligible.reduce((a, k) => a + (chosen[k] ?? 0) * units[k].damage, 0);
  const lootPct = Math.max(0, ...eligible.filter((k) => (chosen[k] ?? 0) > 0).map((k) => units[k].lootFraction));
  const committed = eligible.reduce((a, k) => a + (chosen[k] ?? 0), 0);
  const hasAir = (chosen.aircraft ?? 0) > 0;
  const hasMissile = (chosen.missile ?? 0) > 0;
  const overFuel = fuelCost > g.fuel;

  const set = (k: UnitKind, v: number) =>
    setChosen((c) => ({ ...c, [k]: Math.max(0, Math.min(g.troops[k] ?? 0, Math.floor(v))) }));

  return (
    <Backdrop onClose={close}>
      <Frame onClose={close} title={`⚔️ Attack ${target.name}`}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <select
            value={source.loc.key}
            onChange={(e) => setSourceKey(e.target.value)}
            style={selectStyle}
          >
            {sources.map((s) => (
              <option key={s.loc.key} value={s.loc.key}>
                from {s.loc.name} · {s.distance} hex
              </option>
            ))}
          </select>
          <span style={{ color: 'var(--c-accent)' }}>→</span>
          <span style={{ fontWeight: 700 }}>
            {target.type === 'base' ? '★ ' : ''}
            {target.name}
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {eligible.map((k) => {
            const inRange = units[k].range >= D;
            const max = g.troops[k] ?? 0;
            return (
              <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 10, opacity: inRange ? 1 : 0.4 }}>
                <span style={{ width: 120, fontSize: 'var(--fs-sm)' }}>
                  {UNIT_LABEL[k].icon} {UNIT_LABEL[k].label}
                  <span style={{ color: 'var(--c-text-muted)', fontSize: 'var(--fs-xs)' }}> r{units[k].range}</span>
                </span>
                {inRange ? (
                  <>
                    <input
                      type="range"
                      min={0}
                      max={max}
                      value={chosen[k] ?? 0}
                      onChange={(e) => set(k, Number(e.target.value))}
                      style={{ flex: 1, accentColor: 'var(--c-negative)' }}
                    />
                    <span style={{ width: 54, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                      {chosen[k] ?? 0}/{max}
                    </span>
                  </>
                ) : (
                  <span style={{ flex: 1, fontSize: 'var(--fs-xs)', color: 'var(--c-text-muted)' }}>
                    out of range (need range ≥ {D})
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Cost + outcome */}
        <div style={{ display: 'flex', gap: 10 }}>
          <Stat label="⛽ Fuel (logistics)" value={`${Math.round(fuelCost)} / ${g.fuel}`} bad={overFuel} />
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            padding: 10,
            borderRadius: 'var(--r-md)',
            background: 'rgba(255,255,255,0.03)',
            fontSize: 'var(--fs-sm)',
          }}
        >
          <Row label="Est. structure damage" value={`~${Math.round(damage * (1 - combatConfig.garrisonArmorBonus))}`} />
          <Row label="Loot (defender stockpile)" value={lootPct > 0 ? `up to ${Math.round(lootPct * 100)}%` : 'none'} />
          <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--c-text-muted)', marginTop: 4 }}>
            Defender: +{Math.round(combatConfig.garrisonArmorBonus * 100)}% armor.
            {(hasAir || hasMissile) && ' Air Defense may intercept your aircraft & missiles.'}
          </div>
        </div>

        {/* What to demand on victory — the social/influence outcome (section: vassalage). */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--c-text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            On victory
          </span>
          <div style={{ display: 'flex', gap: 6 }}>
            <OutcomeChip active={outcome === 'raze'} onClick={() => setOutcome('raze')} icon="💥" label="Loot & raze" />
            <OutcomeChip
              active={outcome === 'tribute'}
              onClick={() => setOutcome('tribute')}
              icon="💰"
              label={`Demand tribute +${influenceConfig.tributeInfluence}⭐`}
            />
            <OutcomeChip active={outcome === 'vassal'} onClick={() => setOutcome('vassal')} icon="👑" label="Vassalize" />
          </div>
          {outcome === 'vassal' && (
            <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--c-accent)' }}>
              A vassal secretly joins your bloc — {Math.round(influenceConfig.vassalInfluenceShare * 100)}% of its
              influence flows to you, revealed only at the finale.
            </span>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button onClick={close} style={btn('ghost')}>
            Cancel
          </button>
          <button
            onClick={close}
            disabled={committed === 0 || overFuel}
            style={btn('danger', committed === 0 || overFuel)}
          >
            {outcome === 'vassal' ? 'Attack & vassalize' : outcome === 'tribute' ? 'Attack for tribute' : 'Launch attack'}
          </button>
        </div>
      </Frame>
    </Backdrop>
  );
};

const Stat = ({ label, value, bad }: { label: string; value: string; bad?: boolean }): JSX.Element => (
  <div style={{ flex: 1, padding: '6px 10px', borderRadius: 'var(--r-md)', background: 'rgba(255,255,255,0.04)' }}>
    <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--c-text-muted)' }}>{label}</div>
    <div style={{ fontWeight: 700, color: bad ? 'var(--c-negative)' : 'var(--c-text-primary)' }}>{value}</div>
  </div>
);

const Row = ({ label, value }: { label: string; value: string }): JSX.Element => (
  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
    <span style={{ color: 'var(--c-text-muted)' }}>{label}</span>
    <span style={{ fontWeight: 600 }}>{value}</span>
  </div>
);

const OutcomeChip = ({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: string;
  label: string;
}): JSX.Element => (
  <button
    onClick={onClick}
    style={{
      flex: 1,
      padding: '8px 6px',
      borderRadius: 'var(--r-md)',
      fontSize: 'var(--fs-xs)',
      fontWeight: 600,
      lineHeight: 1.2,
      background: active ? 'var(--c-accent-muted)' : 'rgba(255,255,255,0.05)',
      border: active ? '1px solid var(--c-accent)' : '1px solid transparent',
      color: 'var(--c-text-primary)',
    }}
  >
    <div style={{ fontSize: 16 }}>{icon}</div>
    {label}
  </button>
);

const Frame = ({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}): JSX.Element => (
  <div
    className="civa-panel civa-fade-in"
    style={{ width: 440, padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}
    onClick={(e) => e.stopPropagation()}
  >
    <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <h2 style={{ fontSize: 'var(--fs-lg)', fontWeight: 700 }}>{title}</h2>
      <button onClick={onClose} style={{ fontSize: 20, color: 'var(--c-text-muted)' }}>
        ×
      </button>
    </header>
    {children}
  </div>
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

const selectStyle = {
  flex: 1,
  padding: '8px 10px',
  borderRadius: 'var(--r-md)',
  background: 'var(--c-panel-solid)',
  color: 'var(--c-text-primary)',
  border: '1px solid var(--c-panel-border)',
} as const;

const btn = (kind: 'ghost' | 'danger', disabled = false): CSSProperties => ({
  padding: '9px 18px',
  borderRadius: 'var(--r-md)',
  fontWeight: 700,
  opacity: disabled ? 0.5 : 1,
  background: kind === 'danger' ? 'var(--c-negative)' : 'rgba(255,255,255,0.06)',
  color: kind === 'danger' ? 'var(--c-text-inverse)' : 'var(--c-text-primary)',
});
