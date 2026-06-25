import { GameShell } from './components/GameShell.js';
import { SteamOverlay } from './components/SteamOverlay.js';

export const App = (): JSX.Element => (
  <>
    <SteamOverlay />
    <GameShell />
  </>
);
