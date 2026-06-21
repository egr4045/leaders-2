# @civa/lobby

A CIVA backend service. Isolated module — talks to the outside only through `@civa/protocol`.

```sh
corepack pnpm --filter @civa/lobby dev:standalone   # run in isolation (fake adapters)
corepack pnpm --filter @civa/lobby test             # unit + contract tests
corepack pnpm --filter @civa/lobby dev              # run with real adapters
```

Port: `LOBBY_PORT` (default 8080).
