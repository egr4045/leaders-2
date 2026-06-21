import { useClientStore } from '../state/clientStore.js';
import { TopResourceBar } from '../components/TopResourceBar.js';
import { MapControls } from '../components/MapControls.js';
import { BottomActionBar } from '../components/BottomActionBar.js';
import { EventFeed } from '../components/EventFeed.js';
import { DiplomacyWidget } from '../components/DiplomacyWidget.js';
import { IncomingCallQueue } from '../components/IncomingCallQueue.js';
import { LocationWindow } from '../components/LocationWindow.js';
import { TileWindow } from '../components/TileWindow.js';
import { YearClock } from '../components/YearClock.js';
import { TradePanel } from '../components/panels/TradePanel.js';
import { DiplomacyPanel } from '../components/panels/DiplomacyPanel.js';
import { StandingsPanel } from '../components/panels/StandingsPanel.js';
import { TransferDialog } from '../components/dialogs/TransferDialog.js';
import { AttackDialog } from '../components/dialogs/AttackDialog.js';
import { P2POfferDialog } from '../components/dialogs/P2POfferDialog.js';

/**
 * The main real-time management overlay (section 3.1). The PixiJS map renders behind this; here
 * we lay out the floating panels and the large trade/diplomacy overlays. Selecting a hex opens
 * either the city/base window or the found-a-structure tile window.
 */
export const YearScreen = (): JSX.Element => {
  const overlay = useClientStore((s) => s.overlay);
  const transferFrom = useClientStore((s) => s.transferFrom);
  const attackTargetKey = useClientStore((s) => s.attackTargetKey);
  const p2pOffer = useClientStore((s) => s.p2pOffer);

  return (
    <>
      <TopResourceBar />
      <YearClock />
      <MapControls />
      <LocationWindow />
      <TileWindow />
      <EventFeed />
      <BottomActionBar />
      <IncomingCallQueue />
      <DiplomacyWidget />

      {overlay === 'trade' && <TradePanel />}
      {overlay === 'diplomacy' && <DiplomacyPanel />}
      {overlay === 'standings' && <StandingsPanel />}
      {transferFrom && <TransferDialog />}
      {attackTargetKey && <AttackDialog />}
      {p2pOffer && <P2POfferDialog />}
    </>
  );
};
