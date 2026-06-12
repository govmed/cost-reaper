#!/usr/bin/env bash
# Run the test suites inside a throwaway container (no host Node required) (FE-1, NFR-7).
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

echo "[test] Running monorepo test suites (turbo run test)…"
docker compose run --rm --no-deps api sh -lc "cd /repo && pnpm test"
echo "[test] Done."
