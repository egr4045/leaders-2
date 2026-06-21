import { useEffect, useRef } from 'react';
import { Application, Container, Graphics, Text } from 'pixi.js';
import {
  hexAdd,
  hexesInRange,
  hexKey,
  HEX_DIRECTIONS,
  pixelToHex,
  type Hex,
} from '@civa/hex-core';
import type { ResourceKind } from '@civa/shared-types';
import { useClientStore, type MapMode } from '../state/clientStore.js';
import { buildWorld, HEX_SIZE, OWNER_COLORS, type World } from './worldMap.js';
import { biomeColor, hexCorners, hexPolyPoints, mapColors } from './hexRender.js';

const OCEAN = 0x12314b;
const EDGE_FOR_DIR = [0, 5, 4, 3, 2, 1];
const REVEAL_RADIUS = 3;

const RESOURCE_GLYPH: Partial<Record<ResourceKind, string>> = {
  fuel: '⛽',
  materials: '🧱',
  food: '🌾',
};

interface SceneHandles {
  apply: (mode: MapMode, fog: boolean) => void;
}

interface PixiMapProps {
  /** Assembly phase locks the map: no interaction. */
  locked?: boolean;
}

/**
 * PixiJS map of the real Earth. Renders as independent layers (terrain, owner tint, borders,
 * resource icons, fog of war, markers) so the view mode and fog can be toggled instantly without
 * rebuilding the scene. Terrain = biome colour; resources shown as icons on top; borders are
 * conceptual (derived from which country each hex belongs to).
 */
export const PixiMap = ({ locked = false }: PixiMapProps): JSX.Element => {
  const hostRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<SceneHandles | null>(null);
  const selectHex = useClientStore((s) => s.selectHex);
  const mapMode = useClientStore((s) => s.mapMode);
  const fog = useClientStore((s) => s.fog);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const app = new Application();
    let cleanupScene = () => {};
    let initialized = false;
    let disposed = false;

    app
      .init({ resizeTo: host, backgroundAlpha: 0, antialias: true, autoDensity: true })
      .then(() => {
        if (disposed) {
          safeDestroy(app);
          return;
        }
        initialized = true;
        host.appendChild(app.canvas);
        const scene = mountScene(app, { locked, onSelect: selectHex });
        sceneRef.current = scene.handles;
        cleanupScene = scene.cleanup;
      })
      .catch((err) => console.error('[PixiMap] init failed', err));

    return () => {
      disposed = true;
      sceneRef.current = null;
      cleanupScene();
      if (initialized) safeDestroy(app);
    };
  }, [locked, selectHex]);

  // Toggle layers when the view mode / fog change — no scene rebuild.
  useEffect(() => {
    sceneRef.current?.apply(mapMode, fog);
  }, [mapMode, fog]);

  return <div ref={hostRef} style={{ width: '100%', height: '100%' }} />;
};

function mountScene(
  app: Application,
  opts: { locked: boolean; onSelect: (h: Hex | null) => void },
): { cleanup: () => void; handles: SceneHandles } {
  const world = buildWorld();
  if (import.meta.env.DEV) (window as unknown as { civaWorld?: World }).civaWorld = world;

  const camera = new Container();
  app.stage.addChild(camera);

  // --- Layer 1: terrain (biome colour) ----------------------------------
  const terrain = new Graphics();
  camera.addChild(terrain);
  for (const wh of world.hexes) {
    const pts = hexPolyPoints(wh.hex, HEX_SIZE);
    terrain.poly(pts).fill({ color: wh.land ? biomeColor(wh.biome) : OCEAN });
    if (wh.land) terrain.stroke({ color: 0x0a1018, width: 0.5, alpha: 0.4 });
  }

  // --- Layer 2: owner tint (political) ----------------------------------
  const ownerTint = new Graphics();
  camera.addChild(ownerTint);
  for (const wh of world.hexes) {
    if (wh.owner < 0) continue;
    ownerTint.poly(hexPolyPoints(wh.hex, HEX_SIZE)).fill({ color: OWNER_COLORS[wh.owner]!, alpha: 0.4 });
  }

  // --- Layer 3: borders -------------------------------------------------
  const borders = new Graphics();
  camera.addChild(borders);
  for (const wh of world.hexes) {
    if (!wh.land) continue;
    const corners = hexCorners(wh.hex, HEX_SIZE);
    for (let d = 0; d < 6; d++) {
      const nb = world.byKey.get(hexKey(hexAdd(wh.hex, HEX_DIRECTIONS[d]!)));
      if (nb && nb.land && nb.countryId === wh.countryId) continue;
      if (!nb || !nb.land) continue;
      if ((wh.countryId ?? -1) > (nb.countryId ?? -1)) continue;
      const ownerSide = wh.owner >= 0 ? wh.owner : nb.owner >= 0 ? nb.owner : -1;
      const e = EDGE_FOR_DIR[d]!;
      const a = corners[e]!;
      const b = corners[(e + 1) % 6]!;
      borders
        .moveTo(a.x, a.y)
        .lineTo(b.x, b.y)
        .stroke({
          color: ownerSide >= 0 ? OWNER_COLORS[ownerSide]! : 0x99a6b8,
          width: ownerSide >= 0 ? 2.4 : 1,
          alpha: ownerSide >= 0 ? 0.95 : 0.45,
        });
    }
  }

  // --- Layer 4: resource icons ------------------------------------------
  const resourceIcons = new Container();
  camera.addChild(resourceIcons);
  for (const wh of world.hexes) {
    const glyph = wh.resource ? RESOURCE_GLYPH[wh.resource] : undefined;
    if (!glyph) continue;
    const t = new Text({ text: glyph, style: { fontSize: HEX_SIZE, fontFamily: 'sans-serif' } });
    t.anchor.set(0.5);
    t.position.set(wh.pixel.x, wh.pixel.y);
    t.scale.set(0.85);
    resourceIcons.addChild(t);
  }

  // --- Highlight + selection (above content, below fog edges) -----------
  const highlight = new Graphics();
  camera.addChild(highlight);
  const selection = new Graphics();
  camera.addChild(selection);

  // --- Markers: cities + bases ------------------------------------------
  const markerLayer = new Container();
  camera.addChild(markerLayer);
  for (const city of world.cities) {
    drawCity(markerLayer, city.pixel.x, city.pixel.y, OWNER_COLORS[city.owner]!);
    addLabel(markerLayer, city.name, city.pixel.x, city.pixel.y + HEX_SIZE * 0.6);
  }
  for (const base of world.bases) {
    drawBase(markerLayer, base.pixel.x, base.pixel.y, OWNER_COLORS[base.owner]!);
    addLabel(markerLayer, base.name, base.pixel.x, base.pixel.y + HEX_SIZE * 0.6, 0xd8e0ea);
  }

  // --- Layer: fog of war (covers unrevealed tiles) ----------------------
  const revealed = computeRevealed(world);
  const fogLayer = new Graphics();
  camera.addChild(fogLayer);
  for (const wh of world.hexes) {
    if (revealed.has(hexKey(wh.hex))) continue;
    fogLayer.poly(hexPolyPoints(wh.hex, HEX_SIZE)).fill({ color: 0x05080d, alpha: 0.72 });
  }

  const handles: SceneHandles = {
    apply: (mode, fog) => {
      ownerTint.visible = mode !== 'geographic';
      borders.visible = mode !== 'geographic';
      resourceIcons.visible = mode !== 'political';
      fogLayer.visible = fog;
    },
  };
  handles.apply(useClientStore.getState().mapMode, useClientStore.getState().fog);

  // --- Camera fit -------------------------------------------------------
  const { minX, minY, maxX, maxY } = world.bounds;
  const worldW = maxX - minX;
  const worldH = maxY - minY;
  const cx = minX + worldW / 2;
  const cy = minY + worldH / 2;
  const fitScale = () => Math.min(app.screen.width / worldW, app.screen.height / worldH) * 0.97;
  const fit = () => {
    const s = fitScale();
    camera.scale.set(s);
    camera.position.set(app.screen.width / 2 - cx * s, app.screen.height / 2 - cy * s);
  };
  fit();
  let baseScale = fitScale();
  const onResize = () => {
    baseScale = fitScale();
    fit();
  };
  window.addEventListener('resize', onResize);

  // --- Interaction ------------------------------------------------------
  let dragging = false;
  let moved = 0;
  let last = { x: 0, y: 0 };
  app.stage.eventMode = 'static';
  app.stage.hitArea = app.screen;

  const toHex = (gx: number, gy: number): Hex => {
    const local = camera.toLocal({ x: gx, y: gy });
    return pixelToHex({ x: local.x, y: local.y }, HEX_SIZE);
  };

  const onDown = (e: { global: { x: number; y: number } }) => {
    if (opts.locked) return;
    dragging = true;
    moved = 0;
    last = { x: e.global.x, y: e.global.y };
  };
  const onUp = (e: { global: { x: number; y: number } }) => {
    if (opts.locked) return;
    dragging = false;
    if (moved < 5) {
      const h = toHex(e.global.x, e.global.y);
      const wh = world.byKey.get(hexKey(h));
      if (wh && wh.land) {
        drawHex(selection, h, mapColors.selection, 2.5);
        opts.onSelect(h);
      }
    }
  };
  const onMove = (e: { global: { x: number; y: number } }) => {
    if (opts.locked) return;
    if (dragging) {
      const dx = e.global.x - last.x;
      const dy = e.global.y - last.y;
      moved += Math.abs(dx) + Math.abs(dy);
      camera.position.x += dx;
      camera.position.y += dy;
      last = { x: e.global.x, y: e.global.y };
      return;
    }
    const h = toHex(e.global.x, e.global.y);
    const wh = world.byKey.get(hexKey(h));
    if (wh && wh.land) drawHex(highlight, h, mapColors.hover, 1.5, 0.6);
    else highlight.clear();
  };

  app.stage.on('pointerdown', onDown);
  app.stage.on('pointerup', onUp);
  app.stage.on('pointerupoutside', () => (dragging = false));
  app.stage.on('pointermove', onMove);

  const onWheel = (ev: WheelEvent) => {
    if (opts.locked) return;
    ev.preventDefault();
    const factor = ev.deltaY < 0 ? 1.12 : 1 / 1.12;
    const next = clamp(camera.scale.x * factor, baseScale * 0.9, baseScale * 9);
    const mouse = { x: ev.offsetX, y: ev.offsetY };
    const local = camera.toLocal(mouse);
    camera.scale.set(next);
    camera.position.set(mouse.x - local.x * next, mouse.y - local.y * next);
  };
  app.canvas.addEventListener('wheel', onWheel, { passive: false });

  const cleanup = () => {
    window.removeEventListener('resize', onResize);
    app.canvas.removeEventListener('wheel', onWheel);
  };
  return { cleanup, handles };
}

/** Reveal: the player's own territory + a radius around their cities and bases (section: fog). */
function computeRevealed(world: World): Set<string> {
  const revealed = new Set<string>();
  for (const wh of world.hexes) if (wh.owner === 0) revealed.add(hexKey(wh.hex));
  const mine = [...world.cities, ...world.bases].filter((m) => m.owner === 0);
  for (const m of mine) for (const h of hexesInRange(m.hex, REVEAL_RADIUS)) revealed.add(hexKey(h));
  return revealed;
}

/** Draw a small city glyph (three towers + shadow) centred on a hex. */
function drawCity(layer: Container, x: number, y: number, color: number): void {
  const s = HEX_SIZE;
  const g = new Graphics();
  g.ellipse(x, y + s * 0.32, s * 0.62, s * 0.2).fill({ color: 0x000000, alpha: 0.35 });
  g.rect(x - s * 0.45, y - s * 0.35, s * 0.26, s * 0.6).fill({ color });
  g.rect(x - s * 0.12, y - s * 0.62, s * 0.26, s * 0.9).fill({ color: lighten(color, 0.18) });
  g.rect(x + s * 0.2, y - s * 0.25, s * 0.26, s * 0.52).fill({ color });
  g.stroke({ color: 0xffffff, width: 1, alpha: 0.85 });
  layer.addChild(g);
}

/** Draw a military-base glyph (a star) centred on a hex. */
function drawBase(layer: Container, x: number, y: number, color: number): void {
  const s = HEX_SIZE * 0.62;
  const g = new Graphics();
  g.ellipse(x, y + s * 0.25, s * 0.7, s * 0.22).fill({ color: 0x000000, alpha: 0.3 });
  g.star(x, y, 5, s, s * 0.45).fill({ color }).stroke({ color: 0xffffff, width: 1, alpha: 0.9 });
  layer.addChild(g);
}

function addLabel(layer: Container, text: string, x: number, y: number, fill = 0xffffff): void {
  const label = new Text({
    text,
    style: { fill, fontSize: 11, fontFamily: 'Inter, sans-serif', fontWeight: '600' },
  });
  label.anchor.set(0.5, 0);
  label.position.set(x, y);
  label.resolution = 2;
  layer.addChild(label);
}

function drawHex(g: Graphics, h: Hex, lineColor: number, width: number, alpha = 1): void {
  g.clear();
  g.poly(hexPolyPoints(h, HEX_SIZE)).stroke({ color: lineColor, width, alpha });
}

/**
 * Pixi v8's ResizePlugin assigns its internal `_cancelResize` only after the first resize fires,
 * but `destroy()` calls it unconditionally — so tearing down an app that never resized throws a
 * benign `_cancelResize is not a function`. Swallow it so it never reaches the React tree.
 */
function safeDestroy(app: Application): void {
  try {
    app.destroy(true, { children: true });
  } catch {
    /* benign Pixi v8 teardown quirk */
  }
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function lighten(c: number, t: number): number {
  return blend(c, 0xffffff, t);
}

/** Blend two RGB colours by t (0 = a, 1 = b). */
function blend(a: number, b: number, t: number): number {
  const ar = (a >> 16) & 0xff;
  const ag = (a >> 8) & 0xff;
  const ab = a & 0xff;
  const br = (b >> 16) & 0xff;
  const bg = (b >> 8) & 0xff;
  const bb = b & 0xff;
  return (
    (Math.round(ar + (br - ar) * t) << 16) |
    (Math.round(ag + (bg - ag) * t) << 8) |
    Math.round(ab + (bb - ab) * t)
  );
}

export type { World };
