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
  const [activeTab, setActiveTab] = useState<'store' | 'library' | 'community' | 'contact'>('library');

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
          <div style={{ cursor: 'pointer' }} onClick={logout}>{me?.displayName} ▼</div>
        </div>

        {/* Main Nav Row */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', padding: '0 24px', gap: 32 }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#fff', letterSpacing: 2, marginRight: 24 }}>NEXUS</div>
          <NavTab label="МАГАЗИН" active={activeTab === 'store'} onClick={() => setActiveTab('store')} />
          <NavTab label="БИБЛИОТЕКА" active={activeTab === 'library'} onClick={() => setActiveTab('library')} />
          <NavTab label="СООБЩЕСТВО" active={activeTab === 'community'} onClick={() => setActiveTab('community')} />
          <NavTab label="СВЯЗЬ С АВТОРОМ" active={activeTab === 'contact'} onClick={() => setActiveTab('contact')} />
          <NavTab label={me?.displayName?.toUpperCase() || 'ПРОФИЛЬ'} active={false} onClick={() => {}} />
        </div>

      </div>

      {activeTab === 'library' && (
        <>
          {/* Library Sub-nav */}
          <div style={{ height: 40, background: 'linear-gradient(to right, #242c3d 0%, #1b2838 100%)', display: 'flex', alignItems: 'center', padding: '0 24px', gap: 24, fontSize: '13px', fontWeight: 600, color: '#dcdedf' }}>
            <span style={{ color: '#fff', cursor: 'pointer' }}>ГЛАВНАЯ</span>
            <span style={{ color: '#8f98a0', cursor: 'pointer' }}>КОЛЛЕКЦИИ</span>
          </div>

          {/* Split View Content */}
          <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
            <LibrarySidebar selectedGameId={viewedGameId} onSelectGame={setViewedGameId} />
            <GameDetailsView game={viewedGame} onPlay={handlePlay} />
          </div>
        </>
      )}

      {activeTab === 'contact' && (
        <ContactAuthorView />
      )}

      {(activeTab === 'store' || activeTab === 'community') && (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8f98a0', fontSize: 24 }}>
          В разработке...
        </div>
      )}

      <FriendsWidget />
    </div>
  );
};

const NavTab = ({ label, active, onClick }: { label: string, active: boolean, onClick: () => void }) => (
  <div 
    onClick={onClick}
    style={{ 
      fontSize: '20px', 
      fontWeight: 600, 
      color: active ? '#1a9fff' : '#dcdedf', 
      cursor: 'pointer', 
      borderBottom: active ? '3px solid #1a9fff' : '3px solid transparent', 
      paddingBottom: 4,
      transition: 'color 0.1s'
    }}
    onMouseOver={(e) => !active && (e.currentTarget.style.color = '#fff')}
    onMouseOut={(e) => !active && (e.currentTarget.style.color = '#dcdedf')}
  >
    {label}
  </div>
);

const ContactAuthorView = () => (
  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 40, overflowY: 'auto' }}>
    <h1 style={{ fontSize: 32, fontWeight: 800, color: '#fff', marginBottom: 32 }}>Связь с автором</h1>
    
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
      <div style={{ background: 'rgba(0,0,0,0.3)', padding: 24, borderRadius: 8, border: '1px solid #3d4450' }}>
        <h2 style={{ fontSize: 24, color: '#fff', marginBottom: 12 }}>Предложить идею</h2>
        <p style={{ color: '#8f98a0', marginBottom: 24 }}>Есть крутая идея для новой механики или игры? Напиши мне напрямую в Telegram, мы это обсудим!</p>
        <a href="https://t.me/your_telegram_here" target="_blank" rel="noreferrer" style={{ display: 'inline-block', background: '#3d4450', color: '#fff', padding: '10px 20px', borderRadius: 4, textDecoration: 'none', fontWeight: 600 }}>Написать в Telegram</a>
      </div>

      <div style={{ background: 'rgba(0,0,0,0.3)', padding: 24, borderRadius: 8, border: '1px solid #3d4450' }}>
        <h2 style={{ fontSize: 24, color: '#fff', marginBottom: 12 }}>Поддержать автора</h2>
        <p style={{ color: '#8f98a0', marginBottom: 24 }}>Проект разрабатывается на энтузиазме. Любая поддержка поможет оплачивать сервера и двигаться быстрее!</p>
        <button style={{ background: '#5c7e10', border: 'none', color: '#fff', padding: '10px 20px', borderRadius: 4, fontWeight: 600, cursor: 'pointer' }}>Задонатить (Boosty)</button>
      </div>
    </div>
  </div>
);
