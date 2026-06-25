import { useState, type CSSProperties } from 'react';
import { usePlatformStore } from '../platform/platformStore.js';

const shell: CSSProperties = {
  position: 'absolute',
  inset: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'linear-gradient(135deg, #0b0f16 0%, #16243a 100%)',
  pointerEvents: 'auto',
};

const inputStyle: CSSProperties = {
  width: '100%',
  padding: '14px 18px',
  borderRadius: '4px',
  background: 'rgba(0, 0, 0, 0.4)',
  color: '#fff',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  fontSize: '14px',
  outline: 'none',
  transition: 'border-color 0.2s',
};

const primaryBtn: CSSProperties = {
  padding: '14px 18px',
  borderRadius: '4px',
  background: '#3d4450',
  color: '#fff',
  fontWeight: 800,
  fontSize: '14px',
  border: 'none',
  cursor: 'pointer',
  transition: 'background 0.2s',
};

const socialBtn = (bgColor: string): CSSProperties => ({
  padding: '14px 18px',
  borderRadius: '4px',
  background: bgColor,
  color: '#fff',
  fontWeight: 700,
  fontSize: '15px',
  border: 'none',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '12px',
  transition: 'transform 0.1s, box-shadow 0.1s',
  width: '100%',
  boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
});

export const AuthScreen = (): JSX.Element => {
  const login = usePlatformStore((s) => s.login);
  const status = usePlatformStore((s) => s.status);
  const error = usePlatformStore((s) => s.error);
  
  const [activeMode, setActiveMode] = useState<'secure' | 'guest'>('secure');
  const [name, setName] = useState('');

  const goGuest = () => name.trim() && void login(name.trim());
  const goMockAuth = (provider: string) => {
    // Fake auth logic for design mock
    const mockName = provider === 'Telegram' ? 'TG_User' : 'VK_User';
    void login(mockName);
  };

  return (
    <div style={shell}>
      <div 
        className="civa-panel civa-fade-in" 
        style={{ 
          width: 480, 
          padding: '40px', 
          background: '#1b2838',
          boxShadow: '0 24px 48px rgba(0,0,0,0.5)',
          border: '1px solid #2a3f5a',
          borderRadius: 8
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1 style={{ fontSize: '32px', fontWeight: 900, letterSpacing: 2, margin: 0, color: '#fff' }}>
            NEXUS
          </h1>
          <p style={{ color: '#8f98a0', marginTop: 8, fontSize: '14px' }}>
            Авторизация в хабе
          </p>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', marginBottom: 24, borderBottom: '1px solid #2a3f5a' }}>
          <div 
            onClick={() => setActiveMode('secure')}
            style={{ 
              flex: 1, textAlign: 'center', paddingBottom: 12, cursor: 'pointer',
              color: activeMode === 'secure' ? '#1a9fff' : '#8f98a0',
              fontWeight: activeMode === 'secure' ? 700 : 400,
              borderBottom: activeMode === 'secure' ? '3px solid #1a9fff' : '3px solid transparent'
            }}
          >
            Безопасный вход
          </div>
          <div 
            onClick={() => setActiveMode('guest')}
            style={{ 
              flex: 1, textAlign: 'center', paddingBottom: 12, cursor: 'pointer',
              color: activeMode === 'guest' ? '#fff' : '#8f98a0',
              fontWeight: activeMode === 'guest' ? 700 : 400,
              borderBottom: activeMode === 'guest' ? '3px solid #fff' : '3px solid transparent'
            }}
          >
            Играть как гость
          </div>
        </div>

        {activeMode === 'secure' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }} className="civa-fade-in">
            <p style={{ color: '#8f98a0', fontSize: '13px', textAlign: 'center', marginBottom: 8 }}>
              Привяжите свой аккаунт к социальной сети, чтобы не потерять прогресс и друзей.
            </p>
            
            <button 
              onClick={() => goMockAuth('Telegram')}
              style={socialBtn('#2AABEE')}
              onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
              onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              <span style={{ fontSize: '20px' }}>✈</span>
              Войти через Telegram
            </button>

            <button 
              onClick={() => goMockAuth('VK')}
              style={socialBtn('#4C75A3')}
              onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
              onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              <span style={{ fontSize: '20px', fontWeight: 900 }}>K</span>
              Войти через ВКонтакте
            </button>
          </div>
        )}

        {activeMode === 'guest' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }} className="civa-fade-in">
            <div style={{ background: 'rgba(255, 150, 0, 0.1)', border: '1px solid rgba(255, 150, 0, 0.3)', padding: 12, borderRadius: 4, color: '#ffb347', fontSize: '12px', marginBottom: 8 }}>
              ⚠ Гостевой аккаунт привязан к кэшу вашего браузера. Вы можете потерять прогресс и список друзей.
            </div>
            
            <input
              autoFocus
              value={name}
              placeholder="Введите никнейм"
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && goGuest()}
              style={inputStyle}
              onFocus={(e) => e.target.style.borderColor = '#1a9fff'}
              onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
            />
            
            <button
              disabled={!name.trim() || status === 'logging-in'}
              onClick={goGuest}
              style={{ 
                ...primaryBtn, 
                opacity: !name.trim() ? 0.5 : 1,
                cursor: !name.trim() ? 'not-allowed' : 'pointer',
                background: name.trim() ? '#1a9fff' : '#3d4450'
              }}
            >
              {status === 'logging-in' ? 'Заходим...' : 'Начать играть'}
            </button>
          </div>
        )}

        {error && (
          <div style={{ color: '#ff5c5c', fontSize: '13px', marginTop: 24, padding: '12px', background: 'rgba(255, 92, 92, 0.1)', borderRadius: '4px', textAlign: 'center' }}>
            ⚠ {error}
          </div>
        )}
      </div>
    </div>
  );
};
