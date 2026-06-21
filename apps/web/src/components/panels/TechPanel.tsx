import { techConfig } from '@civa/game-config';
import { TECH_BRANCHES, type TechBranch } from '@civa/shared-types';
import { Panel } from './Panel.js';

const BRANCH_LABEL: Record<TechBranch, string> = {
  economy: 'Economy',
  logistics: 'Logistics',
  military: 'Military',
};

const BRANCH_ICON: Record<TechBranch, string> = {
  economy: '💰',
  logistics: '🚚',
  military: '⚔️',
};

// In Phase 1 the first tier of each branch is "researched" for visual variety.
const RESEARCHED: Record<TechBranch, number> = { economy: 1, logistics: 0, military: 0 };

/** Phase 1.7 — tech tree: 3 branches × 3 tiers, science costs from @civa/game-config. */
export const TechPanel = ({ onClose }: { onClose: () => void }): JSX.Element => (
  <Panel title="Research" onClose={onClose} width={420}>
    <div style={{ display: 'flex', gap: 10 }}>
      {TECH_BRANCHES.map((branch) => (
        <div key={branch} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ textAlign: 'center', fontWeight: 700 }}>
            <div style={{ fontSize: 22 }}>{BRANCH_ICON[branch]}</div>
            {BRANCH_LABEL[branch]}
          </div>
          {techConfig[branch].tierScienceCost.map((cost, idx) => {
            const tier = idx + 1;
            const done = RESEARCHED[branch] >= tier;
            const next = RESEARCHED[branch] === idx;
            return (
              <div
                key={tier}
                style={{
                  padding: '10px 8px',
                  borderRadius: 'var(--r-md)',
                  textAlign: 'center',
                  border: '1px solid var(--c-panel-border)',
                  background: done
                    ? 'var(--c-accent-muted)'
                    : next
                      ? 'rgba(255,255,255,0.05)'
                      : 'transparent',
                  opacity: done || next ? 1 : 0.5,
                }}
              >
                <div style={{ fontWeight: 600, fontSize: 'var(--fs-sm)' }}>Tier {tier}</div>
                <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--c-science)' }}>{cost} science</div>
                {done && <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--c-positive)' }}>✓ done</div>}
                {next && <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--c-accent)' }}>research</div>}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  </Panel>
);
