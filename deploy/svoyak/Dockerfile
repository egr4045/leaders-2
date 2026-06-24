# syntax=docker/dockerfile:1
# Builds svoyak (Vue SPA + Express/Socket.io server) into one container. The server serves the
# built SPA, its own auth/api and socket.io on PORT. Native modules (bcrypt, sqlite3) need toolchain.
# Build with --network=host on this server (IPv6/registry quirk).
FROM node:22-bookworm-slim
ENV NODE_OPTIONS=--dns-result-order=ipv4first
RUN apt-get update \
  && apt-get install -y --no-install-recommends git python3 make g++ ca-certificates \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app

ARG SVOYAK_REPO=https://github.com/egr4045/svoyak
RUN git clone --depth 1 "$SVOYAK_REPO" .

# Frontend build -> /app/dist (served by the server from ../dist).
RUN npm ci && npm run build
# Backend deps (native modules compiled with the toolchain above).
RUN cd server && npm ci --omit=dev

ENV NODE_ENV=production
ENV PORT=8089
WORKDIR /app/server
CMD ["node", "index.js"]
