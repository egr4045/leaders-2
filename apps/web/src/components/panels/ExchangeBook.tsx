import { useMemo, useState } from 'react';
import type { MarketResource } from '@civa/shared-types';
import {
  COMMISSION,
  RESOURCE_ICON,
  TRADABLE,
  fuelCost,
  marketOrders,
  type MarketOrder,
} from '../../mock/market.js';

/**
 * The international exchange order book (section 7.1) — content only, embedded in the Trade panel.
 * A public book per resource; posting/taking a lot costs fuel (~distance) + the owner's commission.
 */
export const ExchangeBook = (): JSX.Element => {
  const [resource, setResource] = useState<MarketResource>('fuel');
  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  const [qty, setQty] = useState(50);
  const [price, setPrice] = useState(4);

  const { asks, bids } = useMemo(() => {
    const forRes = marketOrders.filter((o) => o.resource === resource);
    return {
      asks: forRes.filter((o) => o.side === 'sell').sort((a, b) => a.price - b.price),
      bids: forRes.filter((o) => o.side === 'buy').sort((a, b) => b.price - a.price),
    };
  }, [resource]);

  const estFuel = fuelCost(12, qty);
  const estCommission = Math.round(qty * price * COMMISSION * 10) / 10;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--c-text-muted)', marginBottom: 8 }}>
        Public order book · owner Germany · commission {Math.round(COMMISSION * 100)}%
      </div>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
        {TRADABLE.map((r) => (
          <button
            key={r}
            onClick={() => setResource(r)}
            style={{
              padding: '6px 12px',
              borderRadius: 'var(--r-pill)',
              background: r === resource ? 'var(--c-accent)' : 'rgba(255,255,255,0.05)',
              color: r === resource ? 'var(--c-text-inverse)' : 'var(--c-text-primary)',
              fontWeight: 600,
              fontSize: 'var(--fs-sm)',
              textTransform: 'capitalize',
            }}
          >
            {RESOURCE_ICON[r]} {r}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 12, overflowY: 'auto' }}>
        <OrderColumn title="Asks (sell)" color="var(--c-negative)" orders={asks} />
        <OrderColumn title="Bids (buy)" color="var(--c-positive)" orders={bids} />
      </div>

      <div
        style={{
          display: 'flex',
          gap: 10,
          alignItems: 'flex-end',
          marginTop: 14,
          paddingTop: 14,
          borderTop: '1px solid var(--c-panel-border)',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', borderRadius: 'var(--r-md)', overflow: 'hidden', border: '1px solid var(--c-panel-border)' }}>
          {(['buy', 'sell'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSide(s)}
              style={{
                padding: '8px 16px',
                fontWeight: 700,
                textTransform: 'capitalize',
                background: side === s ? (s === 'buy' ? 'var(--c-positive)' : 'var(--c-negative)') : 'transparent',
                color: side === s ? 'var(--c-text-inverse)' : 'var(--c-text-muted)',
              }}
            >
              {s}
            </button>
          ))}
        </div>
        <Field label="Quantity" value={qty} onChange={setQty} />
        <Field label="Price /unit" value={price} step={0.1} onChange={setPrice} />
        <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--c-text-muted)', lineHeight: 1.5 }}>
          total <b style={{ color: 'var(--c-money)' }}>{Math.round(qty * price)}💰</b>
          <br />⛽ {estFuel} fuel · 💰 {estCommission} fee
        </div>
        <button
          style={{
            marginLeft: 'auto',
            padding: '10px 22px',
            borderRadius: 'var(--r-md)',
            background: 'var(--c-accent)',
            color: 'var(--c-text-inverse)',
            fontWeight: 700,
          }}
        >
          Post {side} order
        </button>
      </div>
    </div>
  );
};

const OrderColumn = ({
  title,
  color,
  orders,
}: {
  title: string;
  color: string;
  orders: MarketOrder[];
}): JSX.Element => (
  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
    <div style={{ fontSize: 'var(--fs-xs)', color, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
      {title}
    </div>
    {orders.length === 0 && <div style={{ color: 'var(--c-text-muted)', fontSize: 'var(--fs-sm)' }}>no orders</div>}
    {orders.map((o) => (
      <div
        key={o.id}
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto auto',
          gap: 8,
          alignItems: 'center',
          padding: '7px 10px',
          borderRadius: 'var(--r-md)',
          background: 'rgba(255,255,255,0.04)',
          borderLeft: `3px solid ${color}`,
        }}
      >
        <span style={{ fontSize: 'var(--fs-sm)' }}>
          {o.owner}
          <span style={{ color: 'var(--c-text-muted)', marginLeft: 6, fontSize: 'var(--fs-xs)' }}>{o.distance} hex</span>
        </span>
        <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>{o.qty}</span>
        <span style={{ fontVariantNumeric: 'tabular-nums', color: 'var(--c-money)' }}>{o.price}💰</span>
      </div>
    ))}
  </div>
);

const Field = ({
  label,
  value,
  step = 1,
  onChange,
}: {
  label: string;
  value: number;
  step?: number;
  onChange: (v: number) => void;
}): JSX.Element => (
  <label style={{ display: 'flex', flexDirection: 'column', gap: 3, fontSize: 'var(--fs-xs)', color: 'var(--c-text-muted)' }}>
    {label}
    <input
      type="number"
      value={value}
      step={step}
      min={0}
      onChange={(e) => onChange(Number(e.target.value))}
      style={{
        width: 90,
        padding: '8px 10px',
        borderRadius: 'var(--r-md)',
        background: 'var(--c-panel-solid)',
        color: 'var(--c-text-primary)',
        border: '1px solid var(--c-panel-border)',
        fontVariantNumeric: 'tabular-nums',
      }}
    />
  </label>
);
