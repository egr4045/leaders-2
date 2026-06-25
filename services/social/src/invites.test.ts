import { describe, expect, it } from 'vitest';
import { createMemoryInviteStore } from './invites.js';

const input = {
  game: 'civa',
  gameName: 'CIVA',
  room: 'room-7',
  role: 'player' as const,
  inviter: 'a1',
  inviterName: 'Mara',
};

describe('invite store', () => {
  it('mints a code that resolves back to the room + role', () => {
    const s = createMemoryInviteStore();
    const rec = s.create(input);
    expect(rec.code).toMatch(/^[A-Z2-9]{6}$/);
    expect(s.resolve(rec.code)).toMatchObject({ room: 'room-7', role: 'player', inviterName: 'Mara' });
  });

  it('returns undefined for an unknown code', () => {
    const s = createMemoryInviteStore();
    expect(s.resolve('ZZZZZZ')).toBeUndefined();
  });

  it('expires codes past their ttl', () => {
    let t = 0;
    const s = createMemoryInviteStore({ ttlMs: 1000, now: () => t });
    const rec = s.create(input);
    t = 999;
    expect(s.resolve(rec.code)).toBeDefined();
    t = 1001;
    expect(s.resolve(rec.code)).toBeUndefined();
  });
});
