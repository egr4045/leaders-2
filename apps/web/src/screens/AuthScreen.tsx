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
  borderRadius: 'var(--r-md)',
  background: 'rgba(0, 0, 0, 0.4)',
  color: 'var(--c-text-primary)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  fontSize: 'var(--fs-md)',
  outline: 'none',
  transition: 'border-color var(--motion-fast)',
};

const primaryBtn: CSSProperties = {
  padding: '14px 18px',
  borderRadius: 'var(--r-md)',
  background: 'linear-gradient(90deg, var(--c-accent), #60c5ff)',
  color: '#000',
  fontWeight: 800,
  fontSize: 'var(--fs-md)',
  boxShadow: '0 4px 12px rgba(61, 169, 252, 0.3)',
  transition: 'transform var(--motion-fast), box-shadow var(--motion-fast)',
};

const socialBtn: CSSProperties = {
  padding: '12px',
  borderRadius: 'var(--r-md)',
  background: 'rgba(255, 255, 255, 0.05)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  color: 'var(--c-text-primary)',
  fontWeight: 600,
  flex: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  transition: 'background var(--motion-fast)',
};

export const AuthScreen = (): JSX.Element => {
  const login = usePlatformStore((s) => s.login);
  const status = usePlatformStore((s) => s.status);
  const error = usePlatformStore((s) => s.error);
  const [name, setName] = useState('');

  const go = () => name.trim() && void login(name.trim());

  return (
    <div style={shell}>
      <div 
        className="civa-panel civa-fade-in" 
        style={{ 
          width: 440, 
          padding: '40px 32px', 
          textAlign: 'center',
          background: 'rgba(14, 20, 30, 0.6)',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 24px 48px rgba(0,0,0,0.5)',
          border: '1px solid rgba(255,255,255,0.05)'
        }}
      >
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 'var(--fs-xxl)', fontWeight: 900, letterSpacing: -1, margin: 0, background: 'linear-gradient(90deg, #fff, #9aa9bd)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            NEXUS
          </h1>
          <p style={{ color: 'var(--c-text-muted)', marginTop: 8, fontSize: 'var(--fs-md)' }}>
            Your gateway to the universe
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <input
            autoFocus
            value={name}
            placeholder="Account Name"
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && go()}
            style={inputStyle}
            onFocus={(e) => e.target.style.borderColor = 'var(--c-accent)'}
            onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
          />
          <button
            disabled={!name.trim() || status === 'logging-in'}
            onClick={go}
            style={{ 
              ...primaryBtn, 
              opacity: !name.trim() ? 0.5 : 1,
              cursor: !name.trim() ? 'not-allowed' : 'pointer'
            }}
            onMouseOver={(e) => { if(name.trim()) e.currentTarget.style.transform = 'translateY(-2px)' }}
            onMouseOut={(e) => { if(name.trim()) e.currentTarget.style.transform = 'translateY(0)' }}
          >
            {status === 'logging-in' ? 'Connecting...' : 'Sign In'}
          </button>
        </div>

        <div style={{ margin: '32px 0', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.1)' }} />
          <span style={{ color: 'var(--c-text-muted)', fontSize: 'var(--fs-sm)', textTransform: 'uppercase', letterSpacing: 1 }}>or recover via</span>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.1)' }} />
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <button 
            style={socialBtn}
            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
            onClick={() => alert('Telegram auth flow to be implemented')}
          >
            <span style={{ color: '#3da9fc' }}>✈</span> Telegram
          </button>
          <button 
            style={socialBtn}
            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
            onClick={() => alert('VK auth flow to be implemented')}
          >
            <span style={{ color: '#4c75a3' }}>V</span> VKontakte
          </button>
        </div>

        {error && (
          <div style={{ color: 'var(--c-negative)', fontSize: 'var(--fs-sm)', marginTop: 24, padding: '12px', background: 'rgba(224, 82, 74, 0.1)', borderRadius: 'var(--r-md)' }}>
            ⚠ {error}
          </div>
        )}
      </div>
    </div>
  );
};
