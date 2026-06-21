import { useClientStore } from '../state/clientStore.js';
import { mockFeed, type FeedKind } from '../mock/playerState.js';

const KIND_STYLE: Record<FeedKind, { color: string; icon: string }> = {
  combat: { color: 'var(--c-aggression)', icon: '💥' },
  trade: { color: 'var(--c-money)', icon: '💱' },
  diplomacy: { color: 'var(--c-diplomacy)', icon: '🕊️' },
  world: { color: 'var(--c-warning)', icon: '🌍' },
};

/** Right-side event ribbon (section 8): combat results, intercepts, trade offers, world events. */
export const EventFeed = (): JSX.Element => {
  const openP2P = useClientStore((s) => s.openP2P);
  return (
    <div
      style={{
        position: 'absolute',
        right: 12,
        top: 100,
        width: 280,
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        maxHeight: 'calc(100vh - 140px)',
        overflowY: 'auto',
      }}
    >
      {mockFeed.map((e) => {
        const s = KIND_STYLE[e.kind];
        const clickable = e.kind === 'trade';
        return (
          <div
            key={e.id}
            className="civa-panel civa-fade-in"
            onClick={
              clickable
                ? () =>
                    openP2P({
                      withId: 2,
                      incoming: true,
                      give: [{ resource: 'fuel', qty: 50 }],
                      receive: [{ resource: 'materials', qty: 30 }],
                    })
                : undefined
            }
            style={{
              display: 'flex',
              gap: 8,
              padding: '8px 10px',
              borderLeft: `3px solid ${s.color}`,
              cursor: clickable ? 'pointer' : 'default',
            }}
          >
            <span style={{ fontSize: 16 }}>{s.icon}</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontSize: 'var(--fs-sm)', lineHeight: 1.3 }}>{e.text}</span>
              <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--c-text-muted)' }}>
                {e.ago} ticks ago{clickable ? ' · open ▸' : ''}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
