import { TOTAL_YEARS } from '@civa/shared-types';

/**
 * Top-left year indicator + countdown to the UN assembly (section 3). Phase 1 shows static mock
 * values; the engine drives the real tick clock later.
 */
export const YearClock = (): JSX.Element => {
  const year = 2;
  const secondsLeft = 7 * 60 + 12;
  const mm = Math.floor(secondsLeft / 60);
  const ss = String(secondsLeft % 60).padStart(2, '0');

  return (
    <div
      className="civa-panel"
      style={{
        position: 'absolute',
        top: 8,
        left: 12,
        padding: '6px 14px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        borderRadius: 'var(--r-lg)',
      }}
    >
      <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--c-text-muted)', letterSpacing: 1 }}>
        YEAR {year} / {TOTAL_YEARS}
      </span>
      <span style={{ fontSize: 'var(--fs-lg)', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
        {mm}:{ss}
      </span>
      <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--c-text-muted)' }}>until assembly</span>
    </div>
  );
};
