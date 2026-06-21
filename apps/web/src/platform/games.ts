/**
 * Front-end game registry for the platform hub. Mirrors the server-side game manifest the
 * orchestrator will use (id, how to wake the game, idle policy). Adding a game = one entry here
 * plus its services — that's the scalability story (point 3). Only `playable` games can be entered.
 */
export interface GameInfo {
  id: string;
  name: string;
  tagline: string;
  status: 'playable' | 'soon';
  accent: string;
  emoji: string;
}

export const GAMES: GameInfo[] = [
  {
    id: 'civa',
    name: 'CIVA',
    tagline: 'Real-time 4X · diplomacy · UN elections',
    status: 'playable',
    accent: '#3da9fc',
    emoji: '🌍',
  },
  {
    id: 'leaders',
    name: 'Leaders',
    tagline: 'Political decisions · live anchor',
    status: 'soon',
    accent: '#c9a23d',
    emoji: '🏛️',
  },
  {
    id: 'detective',
    name: 'Detective',
    tagline: 'Social deduction',
    status: 'soon',
    accent: '#b0492e',
    emoji: '🕵️',
  },
];
