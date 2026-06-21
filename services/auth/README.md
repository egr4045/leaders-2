# @civa/auth

A CIVA backend service. Isolated module — talks to the outside only through `@civa/protocol`.

```sh
corepack pnpm --filter @civa/auth dev:standalone   # run in isolation (fake adapters)
corepack pnpm --filter @civa/auth test             # unit + contract tests
corepack pnpm --filter @civa/auth dev              # run with real adapters
```

Port: `AUTH_PORT` (default 8080).
