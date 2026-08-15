#!/usr/bin/env bash

set -euo pipefail

APP="${1:-}"
ALLOWED_APPS=(main training procurement inventory finance billing hr)
REPO_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
SSH_TARGET="${ARK_SSH_TARGET:-ark-api}"

is_allowed_app() {
  local candidate=$1
  local allowed
  for allowed in "${ALLOWED_APPS[@]}"; do
    if [[ "$candidate" == "$allowed" ]]; then return 0; fi
  done
  return 1
}

if [[ -z "$APP" ]] || ! is_allowed_app "$APP"; then
  echo "usage: bun run deploy:prod <${ALLOWED_APPS[*]}>" >&2
  exit 2
fi

cd "$REPO_DIR"

if [[ "$(git branch --show-current)" != "main" ]]; then
  echo "refusing production deploy: current branch is not main" >&2
  exit 1
fi

if [[ -n "$(git status --porcelain)" ]]; then
  echo "refusing production deploy: working tree is not clean" >&2
  exit 1
fi

echo "checking origin/main..."
git fetch --quiet origin main

LOCAL_SHA=$(git rev-parse HEAD)
REMOTE_SHA=$(git rev-parse origin/main)
if [[ "$LOCAL_SHA" != "$REMOTE_SHA" ]]; then
  echo "refusing production deploy: local HEAD is not origin/main" >&2
  echo "local:  $LOCAL_SHA" >&2
  echo "remote: $REMOTE_SHA" >&2
  exit 1
fi

echo "running targeted typecheck for ark-$APP-portal..."
bun run --filter "ark-$APP-portal" typecheck

echo "deploying $APP from $LOCAL_SHA through $SSH_TARGET..."
ssh \
  -o StrictHostKeyChecking=accept-new \
  -o ServerAliveInterval=30 \
  -o ServerAliveCountMax=20 \
  "$SSH_TARGET" bash -s -- "$LOCAL_SHA" <<'REMOTE'
set -euo pipefail

EXPECTED_SHA=$1
REPO_DIR=/opt/ark-portals/repo

cd "$REPO_DIR"
PREV_SHA=$(sudo -u ark git rev-parse HEAD)
sudo -u ark git pull --ff-only origin main
NEW_SHA=$(sudo -u ark git rev-parse HEAD)

if [[ "$NEW_SHA" != "$EXPECTED_SHA" ]]; then
  echo "server revision mismatch after pull" >&2
  echo "expected: $EXPECTED_SHA" >&2
  echo "actual:   $NEW_SHA" >&2
  exit 1
fi

PREV_SHA="$PREV_SHA" NEW_SHA="$NEW_SHA" bash infra/deploy.sh
REMOTE

if [[ "$APP" == "main" ]]; then
  HOST=portal.arkinstitutebc.com
else
  HOST="$APP.arkinstitutebc.com"
fi

echo "checking https://$HOST..."
curl -fsS --max-time 15 "https://$HOST" -o /dev/null
echo "deployed $APP at $LOCAL_SHA and verified https://$HOST"
