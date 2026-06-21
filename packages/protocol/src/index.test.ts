import { describe, expect, it } from 'vitest';
import { CONTRACT_VERSION, ContractError, envelopeSchema, makeEnvelope } from './index.js';

describe('envelope', () => {
  it('accepts a well-formed envelope and defaults the version', () => {
    const parsed = envelopeSchema.parse({ type: 'ping', seq: 1, ts: 1000, payload: null });
    expect(parsed.v).toBe(CONTRACT_VERSION);
  });

  it('rejects an envelope with no type', () => {
    expect(() => envelopeSchema.parse({ type: '', seq: 1, ts: 0, payload: null })).toThrow();
  });

  it('makeEnvelope omits traceId when not provided', () => {
    const e = makeEnvelope('cmd', 2, 5, { a: 1 });
    expect(e).toMatchObject({ type: 'cmd', seq: 2, ts: 5, payload: { a: 1 } });
    expect(e.traceId).toBeUndefined();
  });
});

describe('ContractError', () => {
  it('serialises to a protocol error', () => {
    const err = new ContractError('conflict', 'nation taken', { details: { nation: 'usa' } });
    expect(err.toProtocol()).toEqual({
      code: 'conflict',
      message: 'nation taken',
      details: { nation: 'usa' },
    });
  });
});
