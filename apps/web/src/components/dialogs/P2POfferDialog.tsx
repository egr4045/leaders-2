import { useState, type ReactNode } from 'react';
import type { ResourceKind } from '@civa/shared-types';
import { useClientStore, type OfferLine } from '../../state/clientStore.js';
import { diploPlayers } from '../../mock/diplomacy.js';
import { RESOURCE_ICON } from '../../mock/market.js';

const RESOURCES: ResourceKind[] = ['money', 'food', 'materials', 'fuel', 'science'];

/**
 * Peer-to-peer shadow-market trade (section 7.2). Direct resource swap negotiated outside the
 * exchange — no commission, delivery fuel paid by agreement. Either compose an offer to a nation
 * or review an incoming one. Phase 1 mock.
 */
export const P2POfferDialog = (): JSX.Element | null => {
  const offer = useClientStore((s) => s.p2pOffer);
  const close = useClientStore((s) => s.closeP2P);

  const [give, setGive] = useState<OfferLine[]>(offer?.give ?? [{ resource: 'materials', qty: 30 }]);
  const [receive, setReceive] = useState<OfferLine[]>(offer?.receive ?? [{ resource: 'fuel', qty: 50 }]);

  if (!offer) return null;
  const counterpart = diploPlayers.find((p) => p.id === offer.withId);

  return (
    <Backdrop onClose={close}>
      <div
        className="civa-panel civa-fade-in"
        style={{ width: 520, padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}
        onClick={(e) => e.stopPropagation()}
      >
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: 'var(--fs-lg)', fontWeight: 700 }}>
            🕶️ Shadow trade {counterpart && `· ${counterpart.flag} ${counterpart.name}`}
          </h2>
          <button onClick={close} style={{ fontSize: 20, color: 'var(--c-text-muted)' }}>
            ×
          </button>
        </header>

        <div style={{ display: 'flex', gap: 12 }}>
          <Column
            title={offer.incoming ? 'They give' : 'You give'}
            color="var(--c-negative)"
            lines={give}
            editable={!offer.incoming}
            onChange={setGive}
          />
          <div style={{ alignSelf: 'center', fontSize: 24, color: 'var(--c-accent)' }}>⇄</div>
          <Column
            title={offer.incoming ? 'You give' : 'You receive'}
            color="var(--c-positive)"
            lines={receive}
            editable={!offer.incoming}
            onChange={setReceive}
          />
        </div>

        <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--c-text-muted)' }}>
          ⛽ No exchange commission — delivery fuel is paid by agreement between both sides.
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          {offer.incoming ? (
            <>
              <button onClick={close} style={btn('ghost')}>
                Decline
              </button>
              <button onClick={close} style={btn('primary')}>
                Accept deal
              </button>
            </>
          ) : (
            <>
              <button onClick={close} style={btn('ghost')}>
                Cancel
              </button>
              <button onClick={close} style={btn('primary')}>
                Send offer
              </button>
            </>
          )}
        </div>
      </div>
    </Backdrop>
  );
};

const Column = ({
  title,
  color,
  lines,
  editable,
  onChange,
}: {
  title: string;
  color: string;
  lines: OfferLine[];
  editable: boolean;
  onChange: (lines: OfferLine[]) => void;
}): JSX.Element => {
  const update = (i: number, patch: Partial<OfferLine>) =>
    onChange(lines.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ fontSize: 'var(--fs-xs)', fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: 0.5 }}>
        {title}
      </div>
      {lines.map((l, i) => (
        <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <select
            value={l.resource}
            disabled={!editable}
            onChange={(e) => update(i, { resource: e.target.value as ResourceKind })}
            style={inputStyle}
          >
            {RESOURCES.map((r) => (
              <option key={r} value={r}>
                {RESOURCE_ICON[r]} {r}
              </option>
            ))}
          </select>
          <input
            type="number"
            min={0}
            value={l.qty}
            disabled={!editable}
            onChange={(e) => update(i, { qty: Number(e.target.value) })}
            style={{ ...inputStyle, width: 70 }}
          />
          {editable && lines.length > 1 && (
            <button onClick={() => onChange(lines.filter((_, idx) => idx !== i))} style={{ color: 'var(--c-text-muted)' }}>
              ×
            </button>
          )}
        </div>
      ))}
      {editable && (
        <button
          onClick={() => onChange([...lines, { resource: 'money', qty: 100 }])}
          style={{ fontSize: 'var(--fs-xs)', color: 'var(--c-accent)', alignSelf: 'flex-start' }}
        >
          + add
        </button>
      )}
    </div>
  );
};

const inputStyle = {
  flex: 1,
  padding: '7px 8px',
  borderRadius: 'var(--r-md)',
  background: 'var(--c-panel-solid)',
  color: 'var(--c-text-primary)',
  border: '1px solid var(--c-panel-border)',
  textTransform: 'capitalize' as const,
};

const btn = (kind: 'ghost' | 'primary') => ({
  padding: '9px 18px',
  borderRadius: 'var(--r-md)',
  fontWeight: 700,
  background: kind === 'primary' ? 'var(--c-accent)' : 'rgba(255,255,255,0.06)',
  color: kind === 'primary' ? 'var(--c-text-inverse)' : 'var(--c-text-primary)',
});

const Backdrop = ({ children, onClose }: { children: ReactNode; onClose: () => void }): JSX.Element => (
  <div
    onClick={onClose}
    style={{
      position: 'absolute',
      inset: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 410,
      pointerEvents: 'auto',
    }}
  >
    {children}
  </div>
);
