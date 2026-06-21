import { useState, type ReactNode } from 'react';
import { hexKey } from '@civa/hex-core';
import { combatConfig } from '@civa/game-config';
import type { UnitKind } from '@civa/shared-types';
import { useClientStore } from '../state/clientStore.js';
import {
  BUILDING_LABEL,
  UNIT_LABEL,
  getLocations,
  totalTroops,
  type LocationInfo,
} from '../mock/locations.js';
import { Panel } from './panels/Panel.js';
import { BuildPanel } from './panels/BuildPanel.js';
import { RecruitPanel } from './panels/RecruitPanel.js';

const locations = getLocations();

const SlotGrid = ({ loc }: { loc: LocationInfo }): JSX.Element => (
  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
    {loc.slots.map((slot, i) => {
      const meta = slot.building ? BUILDING_LABEL[slot.building] : null;
      return (
        <div
          key={i}
          style={{
            height: 54,
            borderRadius: 'var(--r-md)',
            border: slot.building ? '1px solid var(--c-panel-border)' : '1px dashed var(--c-panel-border)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 2,
            background: slot.building ? 'rgba(255,255,255,0.04)' : 'transparent',
            cursor: loc.mine ? 'pointer' : 'default',
          }}
        >
          {meta ? (
            <>
              <span style={{ fontSize: 18 }}>{meta.icon}</span>
              <span style={{ fontSize: 'var(--fs-xs)' }}>{meta.label}</span>
            </>
          ) : (
            <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--c-text-muted)' }}>
              {loc.mine ? '+ build' : 'empty'}
            </span>
          )}
        </div>
      );
    })}
  </div>
);

const Garrison = ({ loc }: { loc: LocationInfo }): JSX.Element => {
  const troops = Object.entries(loc.garrison.troops).filter(([, n]) => n) as [UnitKind, number][];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', gap: 8 }}>
        <Stat icon="⛽" label="Fuel" value={loc.garrison.fuel} color="var(--c-fuel)" />
        <Stat icon="🪖" label="Troops" value={totalTroops(loc.garrison)} color="var(--c-text-primary)" />
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {troops.map(([kind, n]) => (
          <span
            key={kind}
            title={UNIT_LABEL[kind].label}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: '3px 8px',
              borderRadius: 'var(--r-pill)',
              background: 'rgba(255,255,255,0.05)',
              fontSize: 'var(--fs-sm)',
            }}
          >
            {UNIT_LABEL[kind].icon} {n}
          </span>
        ))}
      </div>
    </div>
  );
};

const Stat = ({
  icon,
  label,
  value,
  color,
}: {
  icon: string;
  label: string;
  value: number;
  color: string;
}): JSX.Element => (
  <div
    style={{
      flex: 1,
      padding: '6px 8px',
      borderRadius: 'var(--r-md)',
      background: 'rgba(255,255,255,0.04)',
      textAlign: 'center',
    }}
  >
    <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--c-text-muted)' }}>
      {icon} {label}
    </div>
    <div style={{ fontWeight: 700, color }}>{value}</div>
  </div>
);

/**
 * City/base window (sections 6 & 8). Opens on selecting a hex that holds a city or a military
 * base. Shows building slots, the stationed garrison (troops / ammo / fuel), and the actions
 * available: transfer logistics, build, or attack (enemy locations).
 */
export const LocationWindow = (): JSX.Element | null => {
  const selectedHex = useClientStore((s) => s.selectedHex);
  const selectHex = useClientStore((s) => s.selectHex);
  const openTransfer = useClientStore((s) => s.openTransfer);
  const openAttack = useClientStore((s) => s.openAttack);
  const [sub, setSub] = useState<'build' | 'recruit' | null>(null);

  if (!selectedHex) return null;
  const loc = locations.get(hexKey(selectedHex));
  if (!loc) return null;

  return (
    <div style={{ position: 'absolute', left: 12, top: 60 }}>
      {sub && (
        <SubBackdrop onClose={() => setSub(null)}>
          {sub === 'build' ? (
            <BuildPanel onClose={() => setSub(null)} />
          ) : (
            <RecruitPanel onClose={() => setSub(null)} />
          )}
        </SubBackdrop>
      )}
      <Panel
        title={
          `${loc.type === 'base' ? '★ ' : ''}${loc.name}` + (loc.mine ? '' : ' · enemy')
        }
        onClose={() => selectHex(null)}
        width={320}
        footer={
          <div style={{ display: 'flex', gap: 8 }}>
            {loc.mine ? (
              <>
                <FooterButton label="🏗️ Build" onClick={() => setSub('build')} />
                <FooterButton label="🪖 Recruit" onClick={() => setSub('recruit')} />
                <FooterButton label="🚚 Move" primary onClick={() => openTransfer(loc.key)} />
              </>
            ) : (
              <FooterButton label="⚔️ Attack" danger onClick={() => openAttack(loc.key)} />
            )}
          </div>
        }
      >
        <SectionLabel>{loc.type === 'base' ? 'Base facilities' : 'City buildings'}</SectionLabel>
        <SlotGrid loc={loc} />
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <SectionLabel>Garrison</SectionLabel>
          <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--c-positive)' }}>
            armor +{Math.round(combatConfig.garrisonArmorBonus * 100)}%
          </span>
        </div>
        <Garrison loc={loc} />

        {loc.mine && loc.queue.length > 0 && (
          <>
            <SectionLabel>Construction · {loc.queue.length}</SectionLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {loc.queue.map((task, i) => {
                const meta = BUILDING_LABEL[task.building];
                const pct = Math.round(((task.ticksTotal - task.ticksLeft) / task.ticksTotal) * 100);
                return (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-sm)' }}>
                      <span>
                        {meta?.icon} {meta?.label ?? task.building}
                      </span>
                      <span style={{ color: 'var(--c-text-muted)', fontSize: 'var(--fs-xs)' }}>
                        {task.ticksLeft} ticks left
                      </span>
                    </div>
                    <div style={{ height: 5, borderRadius: 'var(--r-pill)', background: 'rgba(255,255,255,0.08)' }}>
                      <div
                        style={{
                          width: `${pct}%`,
                          height: '100%',
                          borderRadius: 'var(--r-pill)',
                          background: 'var(--c-accent)',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </Panel>
    </div>
  );
};

const SectionLabel = ({ children }: { children: ReactNode }): JSX.Element => (
  <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--c-text-muted)', letterSpacing: 0.5, textTransform: 'uppercase' }}>
    {children}
  </div>
);

const SubBackdrop = ({ children, onClose }: { children: ReactNode; onClose: () => void }): JSX.Element => (
  <div
    onClick={onClose}
    style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 400,
    }}
  >
    <div onClick={(e) => e.stopPropagation()}>{children}</div>
  </div>
);

const FooterButton = ({
  label,
  onClick,
  primary,
  danger,
}: {
  label: string;
  onClick?: () => void;
  primary?: boolean;
  danger?: boolean;
}): JSX.Element => (
  <button
    onClick={onClick}
    style={{
      flex: 1,
      padding: '8px 10px',
      borderRadius: 'var(--r-md)',
      fontWeight: 600,
      fontSize: 'var(--fs-sm)',
      background: danger ? 'var(--c-negative)' : primary ? 'var(--c-accent)' : 'rgba(255,255,255,0.06)',
      color: danger || primary ? 'var(--c-text-inverse)' : 'var(--c-text-primary)',
    }}
  >
    {label}
  </button>
);
