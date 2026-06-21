import { z } from 'zod';

/**
 * Contract version. Bump on any breaking change to a message schema. The gateway rejects
 * connections whose `CONTRACT_VERSION` major does not match, so clients fail loud, not silent.
 */
export const CONTRACT_VERSION = '0.1.0';

/**
 * Every WebSocket message — in both directions — is wrapped in this envelope.
 * `type` routes the message; `seq` lets each side detect gaps/duplicates and supports
 * idempotent command handling; `ts` is the sender's clock (informational only — the
 * server's tick clock is authoritative).
 */
export const envelopeSchema = z.object({
  v: z.string().default(CONTRACT_VERSION),
  type: z.string().min(1),
  seq: z.number().int().nonnegative(),
  ts: z.number().int().nonnegative(),
  /** Correlates a command with its ack/result and threads through logs. */
  traceId: z.string().optional(),
  payload: z.unknown(),
});

export type Envelope = z.infer<typeof envelopeSchema>;

/** Build a well-formed envelope. `ts` is injected (never read from a global clock here). */
export const makeEnvelope = (
  type: string,
  seq: number,
  ts: number,
  payload: unknown,
  traceId?: string,
): Envelope => ({
  v: CONTRACT_VERSION,
  type,
  seq,
  ts,
  ...(traceId !== undefined ? { traceId } : {}),
  payload,
});
