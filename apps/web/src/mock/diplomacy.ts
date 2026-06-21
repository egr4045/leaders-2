/**
 * Mock diplomacy state: other nations and our relations, the queue of incoming requests
 * (call invites, trade offers, alliance proposals) and active defensive pacts. Phase 7 wires
 * the call requests to real LiveKit rooms; the trades/alliances become real engine actions.
 */
import type { DiplomaticRelation } from '@civa/shared-types';

export type Relation = DiplomaticRelation;

export interface DiploPlayer {
  id: number;
  name: string;
  nation: string;
  flag: string;
  relation: Relation;
  /** Aggression index in credits (revealed at the assembly; shown here as intel). */
  aggression: number;
  online: boolean;
}

export const RELATION_META: Record<Relation, { label: string; color: string }> = {
  ally: { label: 'Ally', color: 'var(--c-positive)' },
  neutral: { label: 'Neutral', color: 'var(--c-text-muted)' },
  tension: { label: 'Tension', color: 'var(--c-warning)' },
  hostile: { label: 'Hostile', color: 'var(--c-negative)' },
  vassal: { label: 'Vassal', color: 'var(--c-accent)' },
  overlord: { label: 'Overlord', color: 'var(--c-warning)' },
};

export const diploPlayers: DiploPlayer[] = [
  { id: 1, name: 'Mara', nation: 'Brazil', flag: '🇧🇷', relation: 'vassal', aggression: 120, online: true },
  { id: 2, name: 'Wei', nation: 'China', flag: '🇨🇳', relation: 'hostile', aggression: 540, online: true },
  { id: 3, name: 'Ivan', nation: 'Russia', flag: '🇷🇺', relation: 'tension', aggression: 310, online: false },
  { id: 4, name: 'Otto', nation: 'Germany', flag: '🇩🇪', relation: 'neutral', aggression: 80, online: true },
  { id: 5, name: 'Asha', nation: 'India', flag: '🇮🇳', relation: 'neutral', aggression: 60, online: true },
];

export type RequestKind = 'call' | 'trade' | 'alliance';

export interface DiploRequest {
  id: string;
  from: number; // player id
  kind: RequestKind;
  detail: string;
}

export const REQUEST_META: Record<RequestKind, { label: string; icon: string }> = {
  call: { label: 'Call request', icon: '📞' },
  trade: { label: 'Trade offer', icon: '💱' },
  alliance: { label: 'Alliance', icon: '🤝' },
};

export const incomingRequests: DiploRequest[] = [
  { id: 'r1', from: 1, kind: 'call', detail: 'Mara wants to talk privately.' },
  { id: 'r2', from: 2, kind: 'trade', detail: 'China: 50 oil ⇄ 30 ore' },
  { id: 'r3', from: 4, kind: 'alliance', detail: 'Germany proposes a defensive pact.' },
  { id: 'r4', from: 5, kind: 'call', detail: 'Asha wants to talk.' },
];

export interface Alliance {
  with: number; // player id
  type: 'defensive';
  sinceYear: number;
}

export const alliances: Alliance[] = [{ with: 1, type: 'defensive', sinceYear: 1 }];
