import { type CSSProperties } from 'react';
import { usePlatformStore } from '../platform/platformStore.js';
import { GAMES, type GameInfo } from '../platform/games.js';
import { FriendsSidebar } from '../platform/FriendsSidebar.js';
import { ProfileWidget } from '../components/ProfileWidget.js';
import { enterGame } from '../net/orchestratorClient.js';
import { getHandoff } from '../net/authClient.js';

const shell: CSSProperties = {
  position: 'absolute',
  inset: 0,
  display: 'flex',
  background: 'linear-gradient(135deg, #0b0f16 0%, #16243a 100%)',
  pointerEvents: 'auto',
};

const mainContent: CSSProperties = {
  flex: 1,
  padding: '40px 40px 40px 80px',
  display: 'flex',
  flexDirection: 'column',
  marginRight: 320, // space for sidebar
  overflowY: 'auto'
};

const navItem: CSSProperties = {
  fontSize: 'var(--fs-lg)',
  fontWeight: 700,
  color: 'var(--c-text-muted)',
  cursor: 'pointer',
  transition: 'color var(--motion-fast)',
  textTransform: 'uppercase',
  letterSpacing: 1
};

export const HubScreen = (): JSX.Element => {
  const selectGame = usePlatformStore((s) => s.selectGame);
  
  const handlePlay = (g: GameInfo): void => {
    if (g.externalPort) {
      void (async () => {
        await enterGame(g.id);
        const handoff = await getHandoff();
        const base = `${window.location.protocol}//${window.location.hostname}:${g.externalPort}`;
        window.location.href = handoff ? `${base}/?pt=${encodeURIComponent(handoff)}` : base;
      })();
    } else {
      selectGame(g.id);
    }
  };

  return (
    <div style={shell}>
      <div style={mainContent} className="civa-fade-in">
        <div style={{ display: 'flex', gap: 32, marginBottom: 40 }}>
          <div style={{ ...navItem, color: '#fff', borderBottom: '2px solid var(--c-accent)' }}>Library</div>
          <div style={{ ...navItem, opacity: 0.5 }}>Store</div>
          <div style={{ ...navItem, opacity: 0.5 }}>Community</div>
        </div>

        <ProfileWidget />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 24 }}>
          {GAMES.map((g) => (
            <GameTile key={g.id} game={g} onPlay={() => handlePlay(g)} />
          ))}
        </div>
      </div>
      
      <FriendsSidebar />
    </div>
  );
};

const GameTile = ({ game, onPlay }: { game: GameInfo; onPlay: () => void }): JSX.Element => {
  const playable = game.status === 'playable';
  return (
    <div
      onClick={() => playable && onPlay()}
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 'var(--r-lg)',
        overflow: 'hidden',
        minHeight: 320,
        background: playable ? `linear-gradient(180deg, ${game.accent}33 0%, rgba(20,30,45,0.9) 100%)` : 'rgba(255,255,255,0.02)',
        border: `1px solid ${playable ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.02)'}`,
        cursor: playable ? 'pointer' : 'default',
        transition: 'transform var(--motion-base), box-shadow var(--motion-base), border-color var(--motion-base)',
        boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
        opacity: playable ? 1 : 0.6,
      }}
      onMouseOver={(e) => {
        if(playable) {
          e.currentTarget.style.transform = 'translateY(-4px)';
          e.currentTarget.style.boxShadow = `0 16px 32px ${game.accent}44`;
          e.currentTarget.style.borderColor = game.accent;
        }
      }}
      onMouseOut={(e) => {
        if(playable) {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.4)';
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
        }
      }}
    >
      <div style={{ flex: 1, padding: 24, display: 'flex', flexDirection: 'column' }}>
        <span style={{ fontSize: 48, marginBottom: 16 }}>{game.emoji}</span>
        <h3 style={{ fontSize: 'var(--fs-xl)', fontWeight: 800, margin: '0 0 8px 0', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
          {game.name}
        </h3>
        <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--c-text-muted)', margin: 0, flex: 1 }}>
          {game.tagline}
        </p>
      </div>
      
      <div style={{ padding: '16px 24px', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(10px)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ color: 'var(--c-text-muted)', fontSize: 'var(--fs-xs)', textTransform: 'uppercase', letterSpacing: 1 }}>
          {playable ? 'Ready to play' : 'Coming soon'}
        </span>
        {playable && (
          <button style={{ background: game.accent, color: '#000', border: 'none', borderRadius: 'var(--r-md)', padding: '8px 16px', fontWeight: 800, cursor: 'pointer' }}>
            PLAY
          </button>
        )}
      </div>
    </div>
  );
};
