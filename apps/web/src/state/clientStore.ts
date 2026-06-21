/**
 * Client-side UI store. It holds only *view* state and the latest authoritative snapshot
 * received from the server (the mock-server in Phase 1). The client never computes game
 * outcomes — it renders what the server sends and dispatches commands back.
 */
import { create } from 'zustand';
import type { GamePhase, ResourceKind } from '@civa/shared-types';
import type { Hex } from '@civa/hex-core';

/** Large overlay panels that open over the map. */
export type OverlayPanel = 'trade' | 'diplomacy' | 'standings' | null;

/** Map rendering mode: terrain only / borders+owners / everything. */
export type MapMode = 'geographic' | 'political' | 'combined';

/** One line in a peer-to-peer (shadow-market) trade offer. */
export interface OfferLine {
  resource: ResourceKind;
  qty: number;
}

export interface P2POffer {
  /** Counterpart player id (from the diplomacy roster). */
  withId: number;
  /** True if this is a received offer to review/accept; false if we're composing one. */
  incoming: boolean;
  give: OfferLine[];
  receive: OfferLine[];
}

export interface ClientState {
  /** Which top-level screen is shown — mirrors the server's authoritative phase. */
  phase: GamePhase;
  /** Currently selected hex on the map (city/base/tile), if any. */
  selectedHex: Hex | null;
  /** Whether the diplomacy (WebRTC) widget is expanded. */
  diplomacyOpen: boolean;
  /** Which large overlay panel is open, if any. */
  overlay: OverlayPanel;
  /** Location (hexKey) whose garrison transfer dialog is open, if any. */
  transferFrom: string | null;
  /** Map view mode. */
  mapMode: MapMode;
  /** Fog of war on/off. */
  fog: boolean;
  /** Enemy location (hexKey) whose attack planner is open, if any. */
  attackTargetKey: string | null;
  /** Active peer-to-peer (shadow-market) trade offer, if any. */
  p2pOffer: P2POffer | null;

  setPhase: (phase: GamePhase) => void;
  selectHex: (hex: Hex | null) => void;
  toggleDiplomacy: () => void;
  setOverlay: (overlay: OverlayPanel) => void;
  openTransfer: (key: string) => void;
  closeTransfer: () => void;
  setMapMode: (mode: MapMode) => void;
  toggleFog: () => void;
  openAttack: (key: string) => void;
  closeAttack: () => void;
  openP2P: (offer: P2POffer) => void;
  closeP2P: () => void;
}

export const useClientStore = create<ClientState>((set) => ({
  phase: 'lobby',
  selectedHex: null,
  diplomacyOpen: false,
  overlay: null,
  transferFrom: null,
  mapMode: 'combined',
  fog: true,
  attackTargetKey: null,
  p2pOffer: null,

  setPhase: (phase) => set({ phase }),
  selectHex: (selectedHex) => set({ selectedHex }),
  toggleDiplomacy: () => set((s) => ({ diplomacyOpen: !s.diplomacyOpen })),
  setOverlay: (overlay) => set({ overlay }),
  openTransfer: (transferFrom) => set({ transferFrom }),
  closeTransfer: () => set({ transferFrom: null }),
  setMapMode: (mapMode) => set({ mapMode }),
  toggleFog: () => set((s) => ({ fog: !s.fog })),
  openAttack: (attackTargetKey) => set({ attackTargetKey }),
  closeAttack: () => set({ attackTargetKey: null }),
  openP2P: (p2pOffer) => set({ p2pOffer }),
  closeP2P: () => set({ p2pOffer: null }),
}));
