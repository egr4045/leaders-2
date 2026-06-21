import type { ReactNode } from 'react';
import { hexKey } from '@civa/hex-core';
import { useClientStore } from '../state/clientStore.js';
import { buildWorld } from '../map/worldMap.js';
import { getLocations } from '../mock/locations.js';
import { Panel } from './panels/Panel.js';

const world = buildWorld();
const locations = getLocations();

interface Structure {
  id: string;
  icon: string;
  name: string;
  desc: string;
  cost: string;
  coastalOnly?: boolean;
}

/** Expensive standalone structures ("mini-cities") that can be founded on an empty tile. */
const STRUCTURES: Structure[] = [
  { id: 'military_base', icon: '⭐', name: 'Military Base', desc: 'Garrison hub: store troops, ammo & fuel and project power.', cost: '500💰 200⛏️ 60💡' },
  { id: 'warehouse', icon: '📦', name: 'Warehouse', desc: 'Adds global storage capacity for stored resources.', cost: '250💰 120🪵' },
  { id: 'airfield', icon: '🛫', name: 'Airfield', desc: 'Base & refuel aircraft; extends your air strike range.', cost: '400💰 80⛏️ 40💡' },
  { id: 'farm_estate', icon: '🌾', name: 'Farm Estate', desc: 'Large food production — best on plains.', cost: '200💰 80🪵' },
  { id: 'port', icon: '⚓', name: 'Port', desc: 'Sea trade & naval logistics; cheaper exchange delivery.', cost: '450💰 150🪵 40⛏️', coastalOnly: true },
];

const territoryLabel = (owner: number): { text: string; color: string; canBuild: boolean } => {
  if (owner === 0) return { text: 'Your territory', color: 'var(--c-positive)', canBuild: true };
  if (owner < 0) return { text: 'Neutral territory', color: 'var(--c-text-muted)', canBuild: true };
  return { text: 'Enemy territory', color: 'var(--c-negative)', canBuild: false };
};

/**
 * Tile window: opens when an empty land hex (no city/base) is selected. Shows the tile's terrain,
 * resource and ownership, and lets the player found an expensive standalone structure. Ports are
 * only offered on coastal tiles. Phase 1 mock — building is a no-op.
 */
export const TileWindow = (): JSX.Element | null => {
  const selectedHex = useClientStore((s) => s.selectedHex);
  const selectHex = useClientStore((s) => s.selectHex);
  if (!selectedHex) return null;

  const key = hexKey(selectedHex);
  if (locations.has(key)) return null; // a city/base — LocationWindow handles it
  const wh = world.byKey.get(key);
  if (!wh || !wh.land) return null;

  const terr = territoryLabel(wh.owner);
  const options = STRUCTURES.filter((s) => !s.coastalOnly || wh.coastal);

  return (
    <div style={{ position: 'absolute', left: 12, top: 60 }}>
      <Panel title="Found a structure" onClose={() => selectHex(null)} width={320}>
        {/* Tile info */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', fontSize: 'var(--fs-xs)' }}>
          <Tag>🌍 {wh.biome}</Tag>
          {wh.resource && <Tag>💎 {wh.resource}</Tag>}
          {wh.coastal && <Tag>⚓ coastal</Tag>}
          <Tag color={terr.color}>{terr.text}</Tag>
        </div>

        {!terr.canBuild && (
          <div style={{ color: 'var(--c-negative)', fontSize: 'var(--fs-sm)' }}>
            You can’t build on enemy territory.
          </div>
        )}

        {terr.canBuild &&
          options.map((s) => (
            <div
              key={s.id}
              style={{
                display: 'flex',
                gap: 10,
                alignItems: 'center',
                padding: '8px 10px',
                borderRadius: 'var(--r-md)',
                background: 'rgba(255,255,255,0.03)',
              }}
            >
              <span style={{ fontSize: 22 }}>{s.icon}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600 }}>{s.name}</div>
                <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--c-text-muted)', lineHeight: 1.3 }}>{s.desc}</div>
                <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--c-money)', marginTop: 2 }}>{s.cost}</div>
              </div>
              <button
                style={{
                  padding: '6px 12px',
                  borderRadius: 'var(--r-md)',
                  background: 'var(--c-accent)',
                  color: 'var(--c-text-inverse)',
                  fontWeight: 600,
                  fontSize: 'var(--fs-sm)',
                  alignSelf: 'flex-start',
                }}
              >
                Found
              </button>
            </div>
          ))}
      </Panel>
    </div>
  );
};

const Tag = ({ children, color }: { children: ReactNode; color?: string }): JSX.Element => (
  <span
    style={{
      padding: '3px 9px',
      borderRadius: 'var(--r-pill)',
      background: 'rgba(255,255,255,0.06)',
      color: color ?? 'var(--c-text-primary)',
      textTransform: 'capitalize',
    }}
  >
    {children}
  </span>
);
