# Deploying CIVA next to the existing Leaders (one server)

The server (186.246.11.239, Ubuntu 24.04) already runs **Leaders**: a `docker compose` stack
(Caddy on 80/443, LiveKit, Postgres, Redis) plus the NestJS `leaders.service` on :3000. Caddy
serves `mygame-quiz.ru`. **We add CIVA additively and never touch the running Leaders.**

CIVA ships as two compose stacks sharing a `civa-net` network:
- **Platform** (`deploy/civa`, always-on): `auth` + `orchestrator` + the gateway Caddy (`web`, host
  port **8088**). The gateway fronts the SPA, auth, the orchestrator and the on-demand lobby.
- **Game** (`deploy/civa-game`, on-demand): `lobby`. The orchestrator starts it on player entry and
  stops it after 10 min idle. The host (Leaders) Caddy later proxies a subdomain to :8088.

## 1. Get the code on the server

```sh
git clone https://github.com/egr4045/leaders-2.git /root/civa   # or: git -C /root/civa pull
```

## 2. Build & start the platform

```sh
docker network create civa-net 2>/dev/null || true
cd /root/civa/deploy/civa
SECRET=$(openssl rand -hex 32)
cp .env.example .env;           sed -i "s/change-me-to-a-long-random-string/$SECRET/" .env
cp ../civa-game/.env.example ../civa-game/.env
sed -i "s/change-me-to-a-long-random-string/$SECRET/" ../civa-game/.env   # SAME secret
bash build-images.sh            # builds service/web/orchestrator with --network=host (IPv4 registry)
docker compose up -d            # auth + orchestrator + web (always-on); lobby starts on demand
docker compose ps
```

> Why the build script? On this host the npm registry resolves to IPv6 (no IPv6 route) inside the
> default Docker build network, so the build must use `--network=host` (the host reaches the
> registry over IPv4).

The orchestrator brings the lobby up on the first `enter`. To check on-demand + idle:

```sh
curl -s -XPOST localhost:8088/orchestrator/games/civa/enter   # -> {"ready":true}; lobby starts
docker ps --format '{{.Names}}' | grep civa-game              # lobby now running
# ...with nobody connected for 10 min, the reaper stops it (watch: docker logs civa-orchestrator-1)
```

Verify locally (no DNS needed):

```sh
curl -s localhost:8088/ | head -c 80                       # SPA html
curl -s -XPOST localhost:8088/auth/login \
  -H 'content-type: application/json' -d '{"displayName":"smoke"}' | head -c 120   # JWT json
```

## 3. Expose on a subdomain (TLS, real entry point)

1. Add DNS: **`civa.mygame-quiz.ru` A `186.246.11.239`** (your DNS provider).
2. Append the CIVA block to the Leaders Caddyfile and reload (no Leaders downtime):

```sh
cp /root/leaders/deploy/Caddyfile /root/leaders/deploy/Caddyfile.bak
cat /root/civa/deploy/civa/leaders-caddy-civa.snippet >> /root/leaders/deploy/Caddyfile
docker exec leaders-caddy-1 caddy reload --config /etc/caddy/Caddyfile
```

Caddy auto-provisions the certificate. CIVA is then live at **https://civa.mygame-quiz.ru**.

## Updating

```sh
git -C /root/civa pull && cd /root/civa/deploy/civa && docker compose up -d --build
```

## Rollback (CIVA only — Leaders untouched)

```sh
cd /root/civa/deploy/civa && docker compose down
# and, if the Caddy block was added:
cp /root/leaders/deploy/Caddyfile.bak /root/leaders/deploy/Caddyfile
docker exec leaders-caddy-1 caddy reload --config /etc/caddy/Caddyfile
```

## Notes
- Resource use: auth/lobby are tiny Node processes; the web is static. The on-demand orchestrator
  (start games on entry, stop idle games) lands next — important on this box (~2.4 GB free RAM).
- The lobby uses in-memory state for now; Postgres/Redis adapters come with the engine phase.
