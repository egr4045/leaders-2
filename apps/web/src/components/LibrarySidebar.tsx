import { useState, type CSSProperties } from 'react';
import { GAMES, type GameInfo } from '../platform/games.js';

export const LibrarySidebar = ({ selectedGameId, onSelectGame }: { selectedGameId: string | null, onSelectGame: (id: string) => void }): JSX.Element => {
  const [search, setSearch] = useState('');

  const filteredGames = GAMES.filter(g => g.name.toLowerCase().includes(search.toLowerCase()));
  
  const inCategory = filteredGames.filter(g => g.status === 'playable');
  const soonCategory = filteredGames.filter(g => g.status === 'soon');

  return (
    <div style={{ width: 280, background: '#171a21', display: 'flex', flexDirection: 'column', borderRight: '1px solid #000' }}>
      
      {/* Search Bar */}
      <div style={{ padding: '12px 16px', background: '#1a1f29' }}>
        <input 
          placeholder="Поиск" 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: '100%',
            background: '#23262e',
            border: 'none',
            padding: '6px 12px',
            color: '#dcdedf',
            borderRadius: 2,
            fontSize: '13px'
          }}
        />
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
        <div style={{ fontSize: '11px', color: '#6c7784', textTransform: 'uppercase', padding: '4px 16px', fontWeight: 700, letterSpacing: 1 }}>
          ИГРЫ ({inCategory.length})
        </div>
        {inCategory.map(g => (
          <GameListItem 
            key={g.id} 
            game={g} 
            selected={selectedGameId === g.id} 
            onClick={() => onSelectGame(g.id)} 
          />
        ))}

        {soonCategory.length > 0 && (
          <>
            <div style={{ fontSize: '11px', color: '#6c7784', textTransform: 'uppercase', padding: '16px 16px 4px 16px', fontWeight: 700, letterSpacing: 1 }}>
              СКОРО ВЫЙДУТ
            </div>
            {soonCategory.map(g => (
              <GameListItem 
                key={g.id} 
                game={g} 
                selected={selectedGameId === g.id} 
                onClick={() => onSelectGame(g.id)} 
              />
            ))}
          </>
        )}
      </div>

    </div>
  );
};

const GameListItem = ({ game, selected, onClick }: { game: GameInfo, selected: boolean, onClick: () => void }) => {
  const playable = game.status === 'playable';
  return (
    <div 
      onClick={onClick}
      style={{
        padding: '6px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        cursor: 'pointer',
        background: selected ? '#3d4450' : 'transparent',
        color: selected ? '#fff' : (playable ? '#dcdedf' : '#6c7784'),
      }}
      onMouseOver={(e) => { if(!selected) e.currentTarget.style.background = '#23262e'; }}
      onMouseOut={(e) => { if(!selected) e.currentTarget.style.background = 'transparent'; }}
    >
      <div style={{ width: 16, height: 16, fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {game.emoji}
      </div>
      <div style={{ fontSize: '13px', fontWeight: selected ? 600 : 400 }}>
        {game.name}
      </div>
    </div>
  );
};
