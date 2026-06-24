#!/usr/bin/env bash
# Build the CIVA images with the HOST network so the build reaches the npm registry.
# (This host resolves the registry to IPv6 with no IPv6 route inside the default bridge network;
#  --network=host uses the host's working IPv4 DNS. The host itself can reach the registry fine.)
set -euo pipefail
cd "$(dirname "$0")/../.."   # repo root (build context)

docker build --network=host --target service -t civa-service:latest .
docker build --network=host --target web -t civa-web:latest .
docker build --network=host --target orchestrator -t civa-orchestrator:latest .
# On-demand games (their own images):
docker build --network=host -t svoyak:latest deploy/svoyak
echo "Built civa-service / civa-web / civa-orchestrator / svoyak (latest)"
