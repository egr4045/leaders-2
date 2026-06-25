import { useClientStore } from '../state/clientStore.js';
import { ErrorBoundary } from './ErrorBoundary.js';
import { PixiMap } from '../map/PixiMap.js';
import { LobbyScreen } from '../screens/LobbyScreen.js';
import { YearScreen } from '../screens/YearScreen.js';
import { AssemblyScreen } from '../screens/AssemblyScreen.js';
import { FinaleScreen } from '../screens/FinaleScreen.js';
import { DevPhaseSwitcher } from './DevPhaseSwitcher.js';

/**
 * The fixed 100vw/100vh root. A PixiJS map fills the background during gameplay; translucent
 * React panels float over it. The visible overlay is chosen by the authoritative phase.
 */
export const GameShell = (): JSX.Element => {
  const phase = useClientStore((s) => s.phase);

  // The map is the backdrop for the year (interactive) and assembly (locked) phases.
  const showMap = phase === 'year' || phase === 'assembly';

  return (
    <>
      <div className="civa-canvas-layer">
        {showMap && (
          <ErrorBoundary label="Map">
            <PixiMap locked={phase === 'assembly'} />
          </ErrorBoundary>
        )}
      </div>

      <div className="civa-overlay-layer">
        {phase === 'lobby' && <LobbyScreen />}
        {phase === 'year' && <YearScreen />}
        {phase === 'assembly' && <AssemblyScreen />}
        {phase === 'finale' && <FinaleScreen />}
      </div>
    </>
  );
};
