/**
 * Deterministic, seedable PRNG (mulberry32). The simulation never touches Math.random;
 * all randomness flows from a seed so a match can be replayed bit-for-bit from its command
 * journal. Fast, tiny, good enough for game events (not cryptographic).
 */
export interface Rng {
  /** Next float in [0, 1). */
  next(): number;
  /** Integer in [min, max] inclusive. */
  int(min: number, max: number): number;
  /** Uniformly pick an element (throws on empty). */
  pick<T>(items: readonly T[]): T;
  /** Current internal state — lets the engine snapshot/restore RNG across ticks. */
  state(): number;
}

export const createRng = (seed: number): Rng => {
  let a = seed >>> 0;
  const next = (): number => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    int: (min, max) => min + Math.floor(next() * (max - min + 1)),
    pick: (items) => {
      if (items.length === 0) throw new Error('rng.pick on empty array');
      return items[Math.floor(next() * items.length)]!;
    },
    state: () => a >>> 0,
  };
};

/**
 * Derive an independent stream for a given (seed, tick) so each tick's randomness is
 * reproducible regardless of how many numbers earlier ticks consumed.
 */
export const rngForTick = (seed: number, tick: number): Rng =>
  createRng((Math.imul(seed, 0x9e3779b1) ^ Math.imul(tick + 1, 0x85ebca77)) >>> 0);
