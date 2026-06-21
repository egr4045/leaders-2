/**
 * Mock influence standings — the heart of the victory model (single Influence score from four
 * sources). Drives the on-map StandingsPanel and the FinaleScreen blocs. Vassals secretly feed
 * part of their Influence to their overlord; the bloc total is what wins the election.
 */
import { influenceConfig } from '@civa/game-config';

/** The four Influence sources (one per official strategy). */
export interface InfluenceSources {
  /** Tribute + vassal income (military). */
  conquest: number;
  /** Bought votes (wealth/money). */
  votes: number;
  /** Tech-race bounties (technology). */
  tech: number;
  /** Pacts, reputation, brokering (diplomacy). */
  diplomacy: number;
}

export interface Standing {
  id: number;
  name: string;
  nation: string;
  flag: string;
  /** Own influence (sum of sources). */
  influence: number;
  sources: InfluenceSources;
  /** Overlord's player id if this player is a secret vassal, else null. */
  vassalOf: number | null;
  perTick: number;
}

const sum = (s: InfluenceSources): number => s.conquest + s.votes + s.tech + s.diplomacy;

const mk = (
  id: number,
  name: string,
  nation: string,
  flag: string,
  sources: InfluenceSources,
  vassalOf: number | null,
  perTick: number,
): Standing => ({ id, name, nation, flag, influence: sum(sources), sources, vassalOf, perTick });

/** id 0 is the local player. Two blocs: You⊃Brazil, China⊃Russia. */
export const standings: Standing[] = [
  mk(0, 'You', 'USA', '🇺🇸', { conquest: 18, votes: 12, tech: 20, diplomacy: 8 }, null, 3),
  mk(2, 'Wei', 'China', '🇨🇳', { conquest: 40, votes: 6, tech: 10, diplomacy: 8 }, null, 4),
  mk(4, 'Otto', 'Germany', '🇩🇪', { conquest: 4, votes: 34, tech: 8, diplomacy: 12 }, null, 3),
  mk(5, 'Asha', 'India', '🇮🇳', { conquest: 6, votes: 10, tech: 18, diplomacy: 10 }, null, 2),
  mk(1, 'Mara', 'Brazil', '🇧🇷', { conquest: 4, votes: 6, tech: 6, diplomacy: 6 }, 0, 1),
  mk(3, 'Ivan', 'Russia', '🇷🇺', { conquest: 8, votes: 2, tech: 4, diplomacy: 4 }, 2, 1),
];

export const MY_ID = 0;

export interface Bloc {
  overlord: Standing;
  vassals: Standing[];
  /** Overlord influence + share of each vassal's influence. */
  blocInfluence: number;
}

/** Group standings into blocs (overlord + vassals) and compute effective bloc influence. */
export const computeBlocs = (): Bloc[] => {
  const overlords = standings.filter((s) => s.vassalOf === null);
  return overlords
    .map((overlord) => {
      const vassals = standings.filter((s) => s.vassalOf === overlord.id);
      const blocInfluence =
        overlord.influence +
        vassals.reduce((a, v) => a + v.influence * influenceConfig.vassalInfluenceShare, 0);
      return { overlord, vassals, blocInfluence };
    })
    .sort((a, b) => b.blocInfluence - a.blocInfluence);
};
