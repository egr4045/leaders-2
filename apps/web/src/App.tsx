import { GameShell } from './components/GameShell.js';
import { ContextMenuProvider } from './components/ContextMenu.js';
import { SteamOverlay } from './components/SteamOverlay.js';

export const App = (): JSX.Element => (
  <>
    <ContextMenuProvider />
    <SteamOverlay />
    <GameShell />
  </>
);
