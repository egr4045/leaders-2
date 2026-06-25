import { useState } from 'react';
import { useChatStore } from '../state/chatStore.js';
import { useSocialStore } from '../state/socialStore.js';

export const ChatWidget = (): JSX.Element | null => {
  const isOpen = useChatStore(s => s.isOpen);
  const sessions = useChatStore(s => s.sessions);
  const activeChatId = useChatStore(s => s.activeChatId);
  const openChat = useChatStore(s => s.openChat);
  const toggleChat = useChatStore(s => s.toggleChat);
  const sendMessage = useChatStore(s => s.sendMessage);

  const me = useSocialStore(s => s.me);
  
  const [inputText, setInputText] = useState('');
  
  // Call States: 'none', 'audio', 'video'
  const [callState, setCallState] = useState<'none' | 'audio' | 'video'>('none');
  const [micMuted, setMicMuted] = useState(false);
  const [camMuted, setCamMuted] = useState(false);

  if (!isOpen) return null;

  const activeSession = sessions.find(s => s.id === activeChatId);

  const handleSend = () => {
    if (!inputText.trim() || !activeChatId || !me) return;
    sendMessage(activeChatId, inputText, me.accountId);
    setInputText('');
  };

  return (
    <div 
      className="civa-fade-in"
      style={{
        position: 'fixed',
        right: 300, // Left of Friends widget
        bottom: 24,
        width: 600,
        height: 450,
        background: '#1b2838',
        border: '1px solid #3d4450',
        borderRadius: '8px 8px 0 0',
        boxShadow: '0 -4px 16px rgba(0,0,0,0.5)',
        display: 'flex',
        overflow: 'hidden',
        zIndex: 1000
      }}
    >
      {/* Sidebar: Dialogs */}
      <div style={{ width: 200, background: '#171a21', borderRight: '1px solid #3d4450', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: 16, borderBottom: '1px solid #3d4450', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontWeight: 700, fontSize: '14px', color: '#fff' }}>Мессенджер</div>
          <button onClick={toggleChat} style={{ background: 'none', border: 'none', color: '#8f98a0', cursor: 'pointer', fontSize: 16 }}>×</button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {sessions.map(s => (
            <div 
              key={s.id} 
              onClick={() => { openChat(s.id); setCallState('none'); }}
              style={{
                padding: '12px 16px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                background: s.id === activeChatId ? '#2a475e' : 'transparent',
                borderBottom: '1px solid rgba(255,255,255,0.05)'
              }}
              onMouseOver={e => { if(s.id !== activeChatId) e.currentTarget.style.background = '#23262e'; }}
              onMouseOut={e => { if(s.id !== activeChatId) e.currentTarget.style.background = 'transparent'; }}
            >
              <div style={{ width: 32, height: 32, borderRadius: s.type === 'group' ? 4 : '50%', background: '#3d4450', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>
                {s.avatar || '👤'}
              </div>
              <div style={{ fontSize: '13px', color: '#dcdedf', fontWeight: 600, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {s.name}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#1b2838' }}>
        {activeSession ? (
          <>
            {/* Header */}
            <div style={{ height: 60, padding: '0 16px', borderBottom: '1px solid #3d4450', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#23262e' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 32, height: 32, borderRadius: activeSession.type === 'group' ? 4 : '50%', background: '#3d4450', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {activeSession.avatar || '👤'}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '14px', color: '#fff' }}>{activeSession.name}</div>
                  <div style={{ fontSize: '12px', color: '#8f98a0' }}>{activeSession.type === 'group' ? `${activeSession.participants.length} участников` : 'В сети'}</div>
                </div>
              </div>
              
              {/* Call Action Buttons */}
              <div style={{ display: 'flex', gap: 8 }}>
                <button 
                  onClick={() => setCallState(callState === 'audio' ? 'none' : 'audio')}
                  style={{ background: callState === 'audio' ? '#5c7e10' : '#3d4450', border: 'none', width: 36, height: 36, borderRadius: '50%', color: '#fff', cursor: 'pointer' }}
                  title="Аудиозвонок"
                >
                  📞
                </button>
                <button 
                  onClick={() => setCallState(callState === 'video' ? 'none' : 'video')}
                  style={{ background: callState === 'video' ? '#5c7e10' : '#3d4450', border: 'none', width: 36, height: 36, borderRadius: '50%', color: '#fff', cursor: 'pointer' }}
                  title="Видеозвонок"
                >
                  📹
                </button>
              </div>
            </div>

            {/* Content Area: Chat OR Call */}
            <div style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column' }}>
              
              {callState !== 'none' ? (
                /* --- CALL VIEW MOCK --- */
                <div style={{ flex: 1, background: '#000', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ flex: 1, padding: 16, display: 'grid', gridTemplateColumns: activeSession.type === 'group' ? '1fr 1fr' : '1fr', gap: 16 }}>
                    {/* Remote User */}
                    <div style={{ background: '#1a1f29', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #5c7e10', position: 'relative', overflow: 'hidden' }}>
                      {callState === 'video' ? (
                        <div style={{ color: '#8f98a0' }}>[ Веб-камера {activeSession.name} ]</div>
                      ) : (
                        <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#3d4450', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, boxShadow: '0 0 20px rgba(92,126,16,0.5)' }}>
                          👤
                        </div>
                      )}
                      <div style={{ position: 'absolute', bottom: 8, left: 8, background: 'rgba(0,0,0,0.6)', padding: '4px 8px', borderRadius: 4, fontSize: '12px' }}>{activeSession.name}</div>
                    </div>
                    {/* Local User (if group or video) */}
                    {(activeSession.type === 'group' || callState === 'video') && (
                       <div style={{ background: '#1a1f29', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #3d4450', position: 'relative', overflow: 'hidden' }}>
                       {callState === 'video' ? (
                         camMuted ? <div style={{ color: '#ff5c5c' }}>Камера выключена</div> : <div style={{ color: '#8f98a0' }}>[ Моя камера ]</div>
                       ) : (
                         <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#3d4450', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>
                           👤
                         </div>
                       )}
                       <div style={{ position: 'absolute', bottom: 8, left: 8, background: 'rgba(0,0,0,0.6)', padding: '4px 8px', borderRadius: 4, fontSize: '12px' }}>Вы</div>
                     </div>
                    )}
                  </div>
                  
                  {/* Call Controls */}
                  <div style={{ height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, padding: '0 16px', background: 'rgba(23,26,33,0.8)' }}>
                    <button onClick={() => setMicMuted(!micMuted)} style={{ background: micMuted ? '#ff5c5c' : '#3d4450', border: 'none', width: 44, height: 44, borderRadius: '50%', color: '#fff', cursor: 'pointer', fontSize: 20 }}>
                      {micMuted ? '🔇' : '🎤'}
                    </button>
                    {callState === 'video' && (
                      <button onClick={() => setCamMuted(!camMuted)} style={{ background: camMuted ? '#ff5c5c' : '#3d4450', border: 'none', width: 44, height: 44, borderRadius: '50%', color: '#fff', cursor: 'pointer', fontSize: 20 }}>
                        {camMuted ? '🚫' : '📹'}
                      </button>
                    )}
                    <button onClick={() => setCallState('none')} style={{ background: '#ff5c5c', border: 'none', width: 44, height: 44, borderRadius: '50%', color: '#fff', cursor: 'pointer', fontSize: 20 }}>
                      📞
                    </button>
                  </div>
                </div>
              ) : (
                /* --- CHAT VIEW --- */
                <>
                  <div style={{ flex: 1, padding: 16, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {activeSession.messages.map(m => {
                      const isMe = m.senderId === me?.accountId;
                      const isSys = m.senderId === 'system';
                      if (isSys) {
                        return <div key={m.id} style={{ textAlign: 'center', color: '#6c7784', fontSize: '12px', margin: '8px 0' }}>{m.text}</div>;
                      }
                      return (
                        <div key={m.id} style={{ alignSelf: isMe ? 'flex-end' : 'flex-start', maxWidth: '70%' }}>
                          {!isMe && activeSession.type === 'group' && <div style={{ fontSize: '11px', color: '#8f98a0', marginBottom: 2 }}>{m.senderId}</div>}
                          <div style={{ background: isMe ? '#2a475e' : '#3d4450', padding: '8px 12px', borderRadius: isMe ? '8px 8px 0 8px' : '8px 8px 8px 0', fontSize: '13px', color: '#fff' }}>
                            {m.text}
                          </div>
                          <div style={{ fontSize: '10px', color: '#6c7784', textAlign: isMe ? 'right' : 'left', marginTop: 4 }}>{m.timestamp}</div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Input */}
                  <div style={{ padding: 12, background: '#23262e', borderTop: '1px solid #3d4450', display: 'flex', gap: 8 }}>
                    <input 
                      type="text" 
                      placeholder="Написать сообщение..." 
                      value={inputText}
                      onChange={e => setInputText(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSend()}
                      style={{ flex: 1, background: '#1b2838', border: '1px solid #3d4450', borderRadius: 4, padding: '8px 12px', color: '#fff', outline: 'none' }}
                    />
                    <button 
                      onClick={handleSend}
                      style={{ background: '#2AABEE', color: '#fff', border: 'none', padding: '0 16px', borderRadius: 4, cursor: 'pointer', fontWeight: 600 }}
                    >
                      Отправить
                    </button>
                  </div>
                </>
              )}
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6c7784' }}>
            Выберите диалог из списка
          </div>
        )}
      </div>
    </div>
  );
};
