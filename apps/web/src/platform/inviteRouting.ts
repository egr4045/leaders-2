/**
 * Route a resolved invite into its game. For CIVA (in-app) we set the selected game and a pending
 * room join — the lobby connects and drops you straight into that room. For external games (their
 * own SPA) we wake the game and redirect carrying the join code (`?join=`), plus a fresh SSO handoff
 * token; the game resolves the rest. Shared by the `?invite=` deep link and the "Join" button on a
 * pushed invite, so both paths behave identically.
 */
import type { Invite } from '@civa/protocol';
import { useLobbyStore } from '../state/lobbyStore.js';
import { usePlatformStore } from './platformStore.js';
import { GAMES } from './games.js';
import { enterGame } from '../net/orchestratorClient.js';
import { getHandoff } from '../net/authClient.js';

export const routeToInvite = async (inv: Invite): Promise<void> => {
  if (inv.game === 'civa') {
    useLobbyStore.getState().setPendingJoin(inv.room);
    usePlatformStore.getState().selectGame('civa');
    return;
  }
  // External game: wake it, then redirect with the join code (and an SSO handoff).
  const game = GAMES.find((g) => g.id === inv.game);
  await enterGame(inv.game);
  const handoff = await getHandoff();
  if (game?.externalPort) {
    const params = new URLSearchParams();
    if (handoff) params.set('pt', handoff);
    params.set('join', inv.room);
    if (inv.role === 'spectator') params.set('spectate', '1');
    window.location.href = `${window.location.protocol}//${window.location.hostname}:${game.externalPort}/?${params.toString()}`;
  }
};
