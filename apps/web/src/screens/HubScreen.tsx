import { useState } from 'react';
import { usePlatformStore } from '../platform/platformStore.js';
import { GAMES, type GameInfo } from '../platform/games.js';
import { FriendsWidget } from '../components/FriendsWidget.js';
import { LibrarySidebar } from '../components/LibrarySidebar.js';
import { GameDetailsView } from '../components/GameDetailsView.js';
import { enterGame } from '../net/orchestratorClient.js';
import { getHandoff } from '../net/authClient.js';
import { useSocialStore } from '../state/socialStore.js';

export const HubScreen = (): JSX.Element => {
  const selectGame = usePlatformStore((s) => s.selectGame);
  const logout = usePlatformStore((s) => s.logout);
  const me = useSocialStore((s) => s.me);
  
  // Local state for library navigation (doesn't start the game yet)
  const [viewedGameId, setViewedGameId] = useState<string | null>(GAMES[0].id);

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

  const viewedGame = GAMES.find(g => g.id === viewedGameId) || null;

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', background: '#1b2838', color: '#dcdedf', fontFamily: 'Motiva Sans, Arial, Helvetica, sans-serif' }} className="civa-fade-in">
      
      {/* Global Steam-like Nav Bar */}
      <div style={{ background: '#171a21', height: 104, display: 'flex', flexDirection: 'column' }}>
        
        {/* Top Row (System) */}
        <div style={{ height: 40, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', padding: '0 16px', fontSize: '11px', gap: 16 }}>
          <div style={{ background: '#3d4450', padding: '4px 8px', borderRadius: 2 }}>wallet: 0,00 ₽</div>
          <div style={{ cursor: 'pointer' }} onClick={logout}>{me?.displayName} ▼</div>
        </div>

        {/* Main Nav Row */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', padding: '0 24px', gap: 32 }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#fff', letterSpacing: 2, marginRight: 24 }}>NEXUS</div>
          <div style={{ fontSize: '20px', fontWeight: 600, color: '#dcdedf', textTransform: 'uppercase', cursor: 'pointer' }}>Store</div>
          <div style={{ fontSize: '20px', fontWeight: 600, color: '#1a9fff', textTransform: 'uppercase', cursor: 'pointer', borderBottom: '3px solid #1a9fff', paddingBottom: 4 }}>Library</div>
          <div style={{ fontSize: '20px', fontWeight: 600, color: '#dcdedf', textTransform: 'uppercase', cursor: 'pointer' }}>Community</div>
          <div style={{ fontSize: '20px', fontWeight: 600, color: '#dcdedf', textTransform: 'uppercase', cursor: 'pointer' }}>{me?.displayName}</div>
        </div>

      </div>

      {/* Library Sub-nav */}
      <div style={{ height: 40, background: 'linear-gradient(to right, #242c3d 0%, #1b2838 100%)', display: 'flex', alignItems: 'center', padding: '0 24px', gap: 24, fontSize: '13px', fontWeight: 600, color: '#dcdedf' }}>
        <span style={{ color: '#fff' }}>HOME</span>
        <span style={{ color: '#8f98a0' }}>COLLECTIONS</span>
      </div>

      {/* Split View Content */}
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        <LibrarySidebar selectedGameId={viewedGameId} onSelectGame={setViewedGameId} />
        <GameDetailsView game={viewedGame} onPlay={handlePlay} />
      </div>

      <FriendsWidget />
    </div>
  );
};
