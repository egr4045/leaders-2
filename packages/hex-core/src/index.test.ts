import { describe, expect, it } from 'vitest';
import {
  hex,
  hexAdd,
  hexDistance,
  hexesInRange,
  hexFromKey,
  hexInRange,
  hexKey,
  hexLine,
  hexNeighbors,
  hexToPixel,
  pixelToHex,
} from './index.js';

describe('hex coordinates', () => {
  it('round-trips through a key', () => {
    const h = hex(3, -5);
    expect(hexFromKey(hexKey(h))).toEqual(h);
  });

  it('adds componentwise', () => {
    expect(hexAdd(hex(1, 2), hex(-3, 4))).toEqual(hex(-2, 6));
  });
});

describe('hexDistance', () => {
  it('is zero to itself', () => {
    expect(hexDistance(hex(0, 0), hex(0, 0))).toBe(0);
  });

  it('counts steps to a neighbour as 1', () => {
    for (const n of hexNeighbors(hex(0, 0))) {
      expect(hexDistance(hex(0, 0), n)).toBe(1);
    }
  });

  it('is symmetric', () => {
    const a = hex(2, -1);
    const b = hex(-3, 4);
    expect(hexDistance(a, b)).toBe(hexDistance(b, a));
  });

  it('matches known values', () => {
    expect(hexDistance(hex(0, 0), hex(3, 0))).toBe(3);
    expect(hexDistance(hex(0, 0), hex(0, -2))).toBe(2);
    expect(hexDistance(hex(0, 0), hex(2, -1))).toBe(2);
  });
});

describe('ranges', () => {
  it('hexInRange respects unit reach (infantry R1 vs aircraft R5)', () => {
    const origin = hex(0, 0);
    const target = hex(0, 3);
    expect(hexInRange(origin, target, 1)).toBe(false); // infantry can't reach
    expect(hexInRange(origin, target, 5)).toBe(true); // aircraft can
  });

  it('hexesInRange has the right count (1 + 3*r*(r+1))', () => {
    for (let r = 0; r <= 4; r++) {
      expect(hexesInRange(hex(1, 1), r)).toHaveLength(1 + 3 * r * (r + 1));
    }
  });

  it('every hex returned by hexesInRange is actually within range', () => {
    const center = hex(-2, 3);
    for (const h of hexesInRange(center, 3)) {
      expect(hexDistance(center, h)).toBeLessThanOrEqual(3);
    }
  });
});

describe('hexLine', () => {
  it('starts and ends at the endpoints with length distance+1', () => {
    const a = hex(0, 0);
    const b = hex(3, -1);
    const line = hexLine(a, b);
    expect(line).toHaveLength(hexDistance(a, b) + 1);
    expect(line[0]).toEqual(a);
    expect(line[line.length - 1]).toEqual(b);
  });
});

describe('pixel layout', () => {
  it('round-trips hex -> pixel -> hex', () => {
    const size = 24;
    for (const h of hexesInRange(hex(0, 0), 3)) {
      expect(pixelToHex(hexToPixel(h, size), size)).toEqual(h);
    }
  });
});
