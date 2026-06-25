import { useEffect, useState, type ReactNode } from 'react';

export interface ContextMenuItem {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  color?: string;
}

interface ContextMenuState {
  x: number;
  y: number;
  items: ContextMenuItem[];
}

let openMenu: ((state: ContextMenuState | null) => void) | null = null;

export const showContextMenu = (e: React.MouseEvent, items: ContextMenuItem[]) => {
  e.preventDefault();
  e.stopPropagation();
  if (openMenu) {
    openMenu({ x: e.clientX, y: e.clientY, items });
  }
};

export const ContextMenuProvider = (): JSX.Element | null => {
  const [state, setState] = useState<ContextMenuState | null>(null);

  useEffect(() => {
    openMenu = setState;
    const close = () => setState(null);
    window.addEventListener('click', close);
    window.addEventListener('contextmenu', close);
    return () => {
      openMenu = null;
      window.removeEventListener('click', close);
      window.removeEventListener('contextmenu', close);
    };
  }, []);

  if (!state) return null;

  return (
    <div
      className="civa-fade-in"
      style={{
        position: 'fixed',
        left: Math.min(state.x, window.innerWidth - 200),
        top: Math.min(state.y, window.innerHeight - (state.items.length * 36 + 16)),
        zIndex: 9999,
        background: '#1a1f29', // Steam-like dark
        border: '1px solid #3d4450',
        boxShadow: '0 4px 16px rgba(0,0,0,0.8)',
        padding: '6px 0',
        minWidth: 160,
        display: 'flex',
        flexDirection: 'column',
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      {state.items.map((item, i) => (
        <button
          key={i}
          disabled={item.disabled}
          onClick={(e) => {
            e.stopPropagation();
            item.onClick();
            setState(null);
          }}
          style={{
            padding: '8px 16px',
            textAlign: 'left',
            color: item.disabled ? '#555' : (item.color || '#dcdedf'),
            background: 'transparent',
            border: 'none',
            fontSize: '13px',
            cursor: item.disabled ? 'default' : 'pointer',
            transition: 'background 0.1s',
          }}
          onMouseOver={(e) => {
            if (!item.disabled) e.currentTarget.style.background = '#3d4450';
          }}
          onMouseOut={(e) => {
            if (!item.disabled) e.currentTarget.style.background = 'transparent';
          }}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
};
