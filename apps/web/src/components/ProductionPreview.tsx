import type { ResourceBag, ResourceKind } from '@civa/shared-types';
import { RESOURCE_ICON } from '../mock/playerState.js';

interface Props {
  summary?: string;
  produces?: ResourceBag;
  consumes?: ResourceBag;
  upkeep?: ResourceBag;
  workers?: number;
}

const entries = (bag?: ResourceBag): [ResourceKind, number][] =>
  Object.entries(bag ?? {}).filter(([, v]) => v) as [ResourceKind, number][];

const Flow = ({
  bag,
  sign,
  color,
}: {
  bag: ResourceBag | undefined;
  sign: '+' | '−';
  color: string;
}): JSX.Element | null => {
  const e = entries(bag);
  if (e.length === 0) return null;
  return (
    <>
      {e.map(([k, v]) => (
        <span key={k} style={{ color, fontSize: 'var(--fs-xs)', whiteSpace: 'nowrap' }}>
          {sign}
          {v} {RESOURCE_ICON[k]}
        </span>
      ))}
    </>
  );
};

/**
 * Shows exactly what a building/unit does — per-tick output, inputs, upkeep and worker need —
 * so consequences are obvious before committing (criterion 3). Data comes straight from
 * @civa/game-config defs.
 */
export const ProductionPreview = ({ summary, produces, consumes, upkeep, workers }: Props): JSX.Element => {
  const hasFlows = entries(produces).length + entries(consumes).length + entries(upkeep).length > 0;
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        padding: '6px 8px',
        borderRadius: 'var(--r-md)',
        background: 'rgba(255,255,255,0.04)',
      }}
    >
      {summary && (
        <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--c-text-muted)', lineHeight: 1.3 }}>{summary}</span>
      )}
      {(hasFlows || workers) && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--c-text-muted)' }}>per tick</span>
          <Flow bag={produces} sign="+" color="var(--c-positive)" />
          <Flow bag={consumes} sign="−" color="var(--c-warning)" />
          <Flow bag={upkeep} sign="−" color="var(--c-negative)" />
          {workers ? (
            <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--c-population)' }}>👥 {workers} jobs</span>
          ) : null}
        </div>
      )}
    </div>
  );
};
