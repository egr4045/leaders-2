import { buildings } from '@civa/game-config';
import { BUILDING_LABEL } from '../../mock/locations.js';
import { ProductionPreview } from '../ProductionPreview.js';
import { Panel, CostList } from './Panel.js';

/** Phase 1.6 — build menu. Costs AND production preview come from real @civa/game-config. */
export const BuildPanel = ({ onClose }: { onClose: () => void }): JSX.Element => (
  <Panel title="Build" onClose={onClose} width={360}>
    {Object.values(buildings).map((b) => {
      const meta = BUILDING_LABEL[b.kind];
      return (
        <div
          key={b.kind}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            padding: '8px 10px',
            borderRadius: 'var(--r-md)',
            background: 'rgba(255,255,255,0.03)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
            <span style={{ fontWeight: 600 }}>
              {meta?.icon} {meta?.label ?? b.kind}
              {b.unique && (
                <span style={{ color: 'var(--c-warning)', fontSize: 'var(--fs-xs)', marginLeft: 6 }}>unique</span>
              )}
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
              Build
            </button>
          </div>
          <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--c-text-muted)' }}>
            cost: <CostList cost={b.cost} />
          </div>
          <ProductionPreview
            summary={b.summary}
            produces={b.produces}
            consumes={b.consumes}
            upkeep={b.upkeep}
            workers={b.workers}
          />
        </div>
      );
    })}
  </Panel>
);
