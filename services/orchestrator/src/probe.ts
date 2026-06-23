/**
 * ActivityProbe over HTTP — polls a game's `activityUrl` (its lobby `/metrics`) for the live
 * player count. A failed/timed-out poll throws; the orchestrator treats that as "empty".
 */
import type { ActivityProbe } from './ports.js';

export const httpProbe: ActivityProbe = {
  async players(g) {
    const res = await fetch(g.activityUrl, { signal: AbortSignal.timeout(4000) });
    if (!res.ok) throw new Error(`activity ${res.status}`);
    const body = (await res.json()) as { players?: number };
    return typeof body.players === 'number' ? body.players : 0;
  },
};
