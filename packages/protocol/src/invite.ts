import { z } from 'zod';

/**
 * Invite / join-code contract. A *code* is an opaque, expiring capability that resolves to a room
 * and a role — share it as a link (`?invite=CODE`) or type it in. Codes are minted and resolved by
 * the social service (the game-agnostic platform layer); the target game's lobby then performs the
 * actual join. Friends can also be invited directly (the invite is pushed to their presence channel).
 */

export const inviteRole = z.enum(['player', 'spectator']);
export type InviteRole = z.infer<typeof inviteRole>;

export const invite = z.object({
  code: z.string(),
  game: z.string(), // game id, e.g. 'civa'
  gameName: z.string(),
  room: z.string(), // room/session id within that game
  role: inviteRole,
  inviter: z.string(), // inviter accountId
  inviterName: z.string(),
});
export type Invite = z.infer<typeof invite>;
