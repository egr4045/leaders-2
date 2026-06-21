import { describe, expect, it } from 'vitest';
import { asPlayerId } from '@civa/shared-types';
import { createInitialState, createRng, replay, rngForTick, tick, type Command } from './index.js';

const p1 = asPlayerId('p1');

const newState = () =>
  createInitialState({ seed: 1234, players: [{ id: p1, nationId: 'usa', warehouse: { money: 100 } }] });

describe('rng determinism', () => {
  it('two RNGs with the same seed produce the same sequence', () => {
    const a = createRng(42);
    const b = createRng(42);
    const seqA = Array.from({ length: 10 }, () => a.next());
    const seqB = Array.from({ length: 10 }, () => b.next());
    expect(seqA).toEqual(seqB);
  });

  it('rngForTick is stable per (seed, tick)', () => {
    expect(rngForTick(1, 5).next()).toBe(rngForTick(1, 5).next());
    expect(rngForTick(1, 5).next()).not.toBe(rngForTick(1, 6).next());
  });
});

describe('tick', () => {
  it('advances the tick counter and leaves the input state untouched (purity)', () => {
    const s0 = newState();
    const { state: s1 } = tick(s0, []);
    expect(s1.tick).toBe(1);
    expect(s0.tick).toBe(0); // original not mutated
  });

  it('applies a debug.grant command and emits a resourcesChanged event', () => {
    const cmd: Command = { type: 'debug.grant', playerId: p1, resources: { materials: 25 } };
    const { state, events } = tick(newState(), [cmd]);
    expect(state.players[p1]?.warehouse).toMatchObject({ money: 100, materials: 25 });
    expect(events).toEqual([{ type: 'resourcesChanged', playerId: p1, delta: { materials: 25 } }]);
  });

  it('ignores commands from unknown players', () => {
    const cmd: Command = { type: 'debug.grant', playerId: asPlayerId('ghost'), resources: { materials: 1 } };
    const { events } = tick(newState(), [cmd]);
    expect(events).toHaveLength(0);
  });
});

describe('replay', () => {
  it('reproduces the same final state from the same journal', () => {
    const journal: Command[][] = [
      [{ type: 'debug.grant', playerId: p1, resources: { materials: 10 } }],
      [],
      [{ type: 'debug.grant', playerId: p1, resources: { food: 5 } }],
    ];
    const a = replay(newState(), journal);
    const b = replay(newState(), journal);
    expect(a).toEqual(b);
    expect(a.tick).toBe(3);
    expect(a.players[p1]?.warehouse).toMatchObject({ money: 100, materials: 10, food: 5 });
  });
});
