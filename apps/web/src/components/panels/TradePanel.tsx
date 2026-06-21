import { useState, type ReactNode } from 'react';
import type { MarketResource } from '@civa/shared-types';
import { useClientStore } from '../../state/clientStore.js';
import {
  BASE_PRICE,
  DOMESTIC_BUY_RATE,
  DOMESTIC_SELL_RATE,
  RESOURCE_ICON,
} from '../../mock/market.js';
import { ExchangeBook } from './ExchangeBook.js';

type Tab = 'domestic' | 'exchange';

/**
 * Trade overlay (section 7). Two tabs: Domestic (instant resource⇄money at poor internal rates,
 * no fuel/counterpart) and Exchange (the public international order book). Phase 1 mock.
 */
export const TradePanel = (): JSX.Element => {
  const close = useClientStore((s) => s.setOverlay);
  const [tab, setTab] = useState<Tab>('domestic');

  return (
    <Overlay onClose={() => close(null)}>
      <div
        className="civa-panel civa-fade-in"
        style={{ width: 780, maxWidth: '95vw', maxHeight: '88vh', display: 'flex', flexDirection: 'column' }}
        onClick={(e) => e.stopPropagation()}
      >
        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            padding: '14px 18px',
            borderBottom: '1px solid var(--c-panel-border)',
          }}
        >
          <h2 style={{ fontSize: 'var(--fs-lg)', fontWeight: 700 }}>💱 Trade</h2>
          <div style={{ display: 'flex', gap: 4, marginLeft: 8 }}>
            <TabButton active={tab === 'domestic'} onClick={() => setTab('domestic')}>
              Domestic
            </TabButton>
            <TabButton active={tab === 'exchange'} onClick={() => setTab('exchange')}>
              Int. Exchange
            </TabButton>
          </div>
          <button onClick={() => close(null)} style={{ marginLeft: 'auto', fontSize: 22, color: 'var(--c-text-muted)' }}>
            ×
          </button>
        </header>

        <div style={{ padding: 16, overflowY: 'auto' }}>{tab === 'domestic' ? <Domestic /> : <ExchangeBook />}</div>
      </div>
    </Overlay>
  );
};

const Domestic = (): JSX.Element => {
  const resources = Object.keys(BASE_PRICE) as MarketResource[];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--c-text-muted)' }}>
        Instant internal conversion — no fuel, no counterpart, but the rates are deliberately poor.
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto auto',
          gap: 8,
          alignItems: 'center',
          fontSize: 'var(--fs-xs)',
          color: 'var(--c-text-muted)',
          padding: '0 8px',
        }}
      >
        <span>Resource</span>
        <span style={{ width: 120, textAlign: 'center' }}>Sell → money</span>
        <span style={{ width: 120, textAlign: 'center' }}>Buy ← money</span>
      </div>
      {resources.map((r) => {
        const base = BASE_PRICE[r]!;
        const sell = Math.round(base * DOMESTIC_SELL_RATE * 100) / 100;
        const buy = Math.round(base * DOMESTIC_BUY_RATE * 100) / 100;
        return (
          <div
            key={r}
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr auto auto',
              gap: 8,
              alignItems: 'center',
              padding: '8px 10px',
              borderRadius: 'var(--r-md)',
              background: 'rgba(255,255,255,0.03)',
            }}
          >
            <span style={{ textTransform: 'capitalize', fontWeight: 600 }}>
              {RESOURCE_ICON[r]} {r}
              <span style={{ color: 'var(--c-text-muted)', fontWeight: 400, marginLeft: 8, fontSize: 'var(--fs-xs)' }}>
                base {base}💰
              </span>
            </span>
            <button style={rateBtn('var(--c-positive)')}>{sell}💰 ×10</button>
            <button style={rateBtn('var(--c-negative)')}>{buy}💰 ×10</button>
          </div>
        );
      })}
    </div>
  );
};

const rateBtn = (color: string) => ({
  width: 120,
  padding: '7px 10px',
  borderRadius: 'var(--r-md)',
  background: 'rgba(255,255,255,0.06)',
  color,
  fontWeight: 700,
  fontVariantNumeric: 'tabular-nums' as const,
});

const TabButton = ({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}): JSX.Element => (
  <button
    onClick={onClick}
    style={{
      padding: '7px 14px',
      borderRadius: 'var(--r-md)',
      fontWeight: 600,
      fontSize: 'var(--fs-sm)',
      background: active ? 'var(--c-accent-muted)' : 'transparent',
      color: 'var(--c-text-primary)',
    }}
  >
    {children}
  </button>
);

const Overlay = ({ children, onClose }: { children: ReactNode; onClose: () => void }): JSX.Element => (
  <div
    onClick={onClose}
    style={{
      position: 'absolute',
      inset: 0,
      background: 'rgba(0,0,0,0.55)',
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
