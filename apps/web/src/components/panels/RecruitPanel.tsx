import { units } from '@civa/game-config';
import { UNIT_LABEL } from '../../mock/locations.js';
import { Panel, CostList } from './Panel.js';

/** Phase 1.6 — recruit menu (4 roles). Range/loot/fuel read from @civa/game-config (section 6). */
export const RecruitPanel = ({ onClose }: { onClose: () => void }): JSX.Element => (
  <Panel title="Recruit" onClose={onClose} width={380}>
    {Object.values(units).map((u) => {
      const meta = UNIT_LABEL[u.kind];
      return (
        <div
          key={u.kind}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            padding: '8px 10px',
            borderRadius: 'var(--r-md)',
            background: 'rgba(255,255,255,0.03)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
            <span style={{ fontWeight: 600 }}>
              {meta.icon} {meta.label}
              <span style={{ color: 'var(--c-text-muted)', fontSize: 'var(--fs-xs)', marginLeft: 8 }}>
                range {u.range} · {u.fuelPerHex}⛽/hex
                {u.lootFraction > 0 && ` · loot ${Math.round(u.lootFraction * 100)}%`}
                {u.disposable && ' · one-shot'}
              </span>
            </span>
            <button
              style={{
                padding: '6px 12px',
                borderRadius: 'var(--r-md)',
                background: 'var(--c-accent)',
                color: 'var(--c-text-inverse)',
                fontWeight: 600,
                fontSize: 'var(--fs-sm)',
              }}
            >
              Recruit
            </button>
          </div>
          <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--c-text-muted)' }}>{u.summary}</div>
          <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--c-text-muted)' }}>
            cost: <CostList cost={u.cost} />
          </div>
        </div>
      );
    })}
  </Panel>
);
