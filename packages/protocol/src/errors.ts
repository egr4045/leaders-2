import { z } from 'zod';

/**
 * Canonical error codes used across every service. Keep this list small and stable;
 * services map their internal failures onto these so the client can react uniformly.
 */
export const ERROR_CODES = [
  'unauthorized', // bad/expired JWT or token
  'forbidden', // authenticated but not allowed
  'not_found',
  'validation', // payload failed schema validation
  'conflict', // e.g. nation already taken, room full
  'rate_limited',
  'illegal_action', // valid schema but illegal given game state (server-authority rejects)
  'internal',
] as const;

export type ErrorCode = (typeof ERROR_CODES)[number];

export const errorSchema = z.object({
  code: z.enum(ERROR_CODES),
  message: z.string(),
  /** Optional machine-readable details (e.g. which field failed validation). */
  details: z.record(z.unknown()).optional(),
  /** Echoes the offending command's traceId when applicable. */
  traceId: z.string().optional(),
});

export type ProtocolError = z.infer<typeof errorSchema>;

export class ContractError extends Error {
  readonly code: ErrorCode;
  readonly details?: Record<string, unknown>;
  readonly traceId?: string;

  constructor(code: ErrorCode, message: string, opts?: { details?: Record<string, unknown>; traceId?: string }) {
    super(message);
    this.name = 'ContractError';
    this.code = code;
    if (opts?.details !== undefined) this.details = opts.details;
    if (opts?.traceId !== undefined) this.traceId = opts.traceId;
  }

  toProtocol(): ProtocolError {
    return {
      code: this.code,
      message: this.message,
      ...(this.details !== undefined ? { details: this.details } : {}),
      ...(this.traceId !== undefined ? { traceId: this.traceId } : {}),
    };
  }
}
