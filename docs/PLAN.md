# CIVA — Implementation Plan

> This mirrors the approved plan. Phases are built in order; each module is implemented in isolation,
> tested in isolation, then integrated.

## Stack & decisions

- **Frontend:** React + PixiJS + Vite + TypeScript. Map = PixiJS (hexes, zoom, pan); UI = React over Canvas.
- **Backend:** Node.js + TypeScript, authoritative tick server, Socket.io.
- **WebRTC:** LiveKit (self-hostable; caucus rooms + global conference).
- **UN announcer TTS:** reuse the `D:\dev\leaders\ml-box` pattern — local Silero v4 worker that polls a server
  job queue and pushes audio back (base64 + Bearer token). Offline pre-generation (`batch_generate.py`) + a live
  worker for on-the-fly "spy" events.
- **Repo:** pnpm workspaces + Turborepo monorepo; every game module is an isolated, standalone-runnable service/package.

## Isolation contract (every service/module)

1. **Boundary = schema.** All interaction is described by zod schemas in `packages/protocol`. No cross-service
   imports of internal logic — only via the contract.
2. **Standalone mode.** Each service has `dev:standalone` — runs in isolation against `test-harness` mocks/fixtures
   and in-memory adapters, with no dependency on neighbours.
3. **Ports & adapters.** Each service depends on abstractions (storage, event bus, clock); real (Postgres/Redis/
   system clock) and test (in-memory/fake clock) adapters are interchangeable.
4. **Determinism.** `sim-core` = pure `(state, commands, tick, seed) → (state', events[])`. No I/O, no direct
   `Date.now`/`Math.random` (injected clock + seeded RNG). Enables replay and unit tests.
5. **Three test tiers per module:** unit (pure logic) → contract (service-in-a-box vs fixtures) → integration
   (compose, real adapters, cross-service scenarios). Isolation stays green before integration.

## Phases

- **Phase 0 — Monorepo foundation & tooling.** pnpm+Turbo+TS, package skeletons, infra compose, service generator, conventions.
- **Phase 1 — Frontend on mocks.** Polish the entire UI against a mock-server (fixtures) through the `protocol` contract:
  design system, hex map, resource bar, city/base window, build & recruit panels, tech tree, combat UI, diplomacy widget,
  exchange, shadow market, event feed, UN screen, lobby, final screen, companion layout, polish.
- **Phase 2 — Realtime foundation.** Auth (JWT) → Gateway (Socket.io, seamless reconnect, multi-device) → Lobby
  (rooms, nation pick, start). Replace mock-server with the real stack; integration test the realtime core.
- **Phase 3 — Simulation core.** `sim-core` pure tick fn → game-engine service (authoritative clock, state store,
  getState) → map/territories (biomes, starting balance) → deterministic isolation runs.
- **Phase 4 — Economy & construction.** Resources & storage (electricity non-stored) → population & taxes →
  buildings & slots → science (3 branches × 3 tiers) → isolation tests.
- **Phase 5 — Military & logistics.** Units & ranges → attack resolution (loot/destroy, no capture) → logistics
  (ammo/fuel) → defender advantage → interceptions → hidden aggression index → isolation tests.
- **Phase 6 — Trade.** Exchange (order book, commission, fuel logistics, frozen deposit) → exchange vulnerability →
  shadow market (P2P) → isolation tests.
- **Phase 7 — Diplomacy & WebRTC.** Diplomacy service (LiveKit tokens, caucus + conference) → client streams →
  P2P deals tied to calls → isolation tests.
- **Phase 8 — UN phase & TTS.** tts-gateway (ml-box job-queue contract) → template pre-generation → live spy events →
  assembly service (year trigger, map lock, crisis bulletin) → debate & voting (diplomatic-representation double votes) →
  isolation tests.
- **Phase 9 — Finale & cycle.** Scoring/victory → full 5-year cycle → unified notifications → persistence (Postgres).
- **Phase 10 — Integration, load, deploy.** E2E (8 bots through all services) → load/resilience → observability →
  security (server-side validation) → deploy → balance tuning.

## Verification

- Per service: `corepack pnpm --filter <svc> dev:standalone` + `... test` (unit+contract), health endpoint responds.
- Frontend: `corepack pnpm --filter web dev` → walk every screen on the mock-server.
- Realtime: compose auth+gateway+lobby+redis → multi-client nation pick, disconnect/reconnect, start.
- Engine/mechanics: deterministic fixture runs (same seed → same state) + live client.
- WebRTC: LiveKit dev server, multiple caucuses + conference.
- UN/TTS: run `ml-box` `start.ps1` against tts-gateway; pre-gen via `batch_generate.py`; year-end → map lock →
  spoken bulletin → vote.
- Full cycle: `docker compose up` everything; e2e 8-bot game lobby → final screen.
