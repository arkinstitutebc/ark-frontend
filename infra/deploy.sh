#!/usr/bin/env bash
# Ark portals deploy script — invoked on the VPS by GitHub Actions over SSH
# as root. Mirrors the ark-services pattern: root SSHs in, runs build steps
# as the ark user, then restarts the affected systemd units.
#
# Expects (from env, set by the calling workflow):
#   PREV_SHA — git SHA before pull (for path-filter diff)
#   NEW_SHA  — git SHA after  pull (current HEAD)
# Optional:
#   BUILD_CONCURRENCY — number of parallel builds (default: 3)
# Falls back to HEAD~1..HEAD if SHAs missing (allows manual invocation).
#
# Path-filter rules:
#   - changes under packages/* → rebuild + restart ALL 7 portals
#   - changes under apps/<name>/ → rebuild + restart THAT portal only
#   - root-level / docs / infra-only changes → no rebuild
#
# Optimizations:
#   - bun install only when bun.lock or any package.json changed
#   - portal builds run in parallel, capped at $BUILD_CONCURRENCY (default 3)
#   - per-app build logs are written to a temp file then prefixed into the
#     main deploy log so concurrent output stays readable
#
# This script does NOT git-pull. The caller pulls first; we just inspect the
# diff. Keeps the script idempotent + safely re-executable.
{
set -euo pipefail
shopt -s nullglob

REPO_DIR="/opt/ark-portals/repo"
LOG_DIR="/var/log/ark-portals"
LOG_FILE="$LOG_DIR/deploy.log"
ALL_APPS=(main training procurement inventory finance billing hr)
BUN="/home/ark/.bun/bin/bun"
CONCURRENCY="${BUILD_CONCURRENCY:-3}"

mkdir -p "$LOG_DIR"
exec > >(tee -a "$LOG_FILE") 2>&1

echo "============================================================"
echo "[$(date -u '+%Y-%m-%dT%H:%M:%SZ')] deploy.sh start (uid=$EUID, concurrency=$CONCURRENCY)"
echo "============================================================"

cd "$REPO_DIR"

PREV_SHA="${PREV_SHA:-$(sudo -u ark git rev-parse HEAD~1)}"
NEW_SHA="${NEW_SHA:-$(sudo -u ark git rev-parse HEAD)}"
echo "prev sha: $PREV_SHA"
echo "new sha:  $NEW_SHA"

if [[ "$PREV_SHA" == "$NEW_SHA" ]]; then
  echo "no new commits, exiting clean"
  exit 0
fi

CHANGED_FILES=$(sudo -u ark git diff --name-only "$PREV_SHA" "$NEW_SHA")
echo "changed files:"
echo "$CHANGED_FILES" | sed 's/^/  /'

if echo "$CHANGED_FILES" | grep -qE '^packages/'; then
  echo "package change detected → rebuild + restart all 7 portals"
  APPS=("${ALL_APPS[@]}")
else
  mapfile -t APPS < <(
    echo "$CHANGED_FILES" |
      grep -oE '^apps/[^/]+/' |
      cut -d/ -f2 |
      sort -u
  )
fi

if [[ ${#APPS[@]} -eq 0 ]]; then
  echo "no apps/* or packages/* changes → skipping install + build + restart"
  exit 0
fi

echo "apps to rebuild: ${APPS[*]}"

# Skip bun install when lockfile + package manifests are unchanged. Saves
# ~30s on common deploys.
LOCK_CHANGED=0
if echo "$CHANGED_FILES" | grep -qE '^(bun\.lock|package\.json|apps/[^/]+/package\.json|packages/[^/]+/package\.json)$'; then
  LOCK_CHANGED=1
fi

echo ""
if (( LOCK_CHANGED )); then
  echo "[$(date -u '+%H:%M:%S')] bun.lock or package.json changed → bun install --frozen-lockfile (as ark)"
  sudo -u ark "$BUN" install --cwd "$REPO_DIR" --frozen-lockfile
else
  echo "[$(date -u '+%H:%M:%S')] lockfile + package manifests unchanged → skipping bun install"
fi

# Parallel build runner with bounded concurrency.
LOG_TMP=$(mktemp -d)
trap 'rm -rf "$LOG_TMP"' EXIT

build_app() {
  local app=$1
  local logfile="$LOG_TMP/$app.log"
  if [[ ! -d "$REPO_DIR/apps/$app" ]]; then
    echo "[$app] skip: apps/$app does not exist"
    return 0
  fi
  local start
  start=$(date +%s)
  if sudo -u ark bash -c "cd '$REPO_DIR/apps/$app' && '$BUN' run build" >"$logfile" 2>&1; then
    local elapsed=$(( $(date +%s) - start ))
    echo "[$app] OK in ${elapsed}s"
    sed "s/^/[$app] /" "$logfile" >> "$LOG_FILE"
    return 0
  else
    local elapsed=$(( $(date +%s) - start ))
    echo "[$app] FAIL after ${elapsed}s"
    # Emit the failed app's log inline so the workflow output captures it.
    sed "s/^/[$app] /" "$logfile"
    sed "s/^/[$app] /" "$logfile" >> "$LOG_FILE"
    return 1
  fi
}

echo ""
echo "------------------------------------------------------------"
echo "[$(date -u '+%H:%M:%S')] building ${#APPS[@]} app(s) with concurrency=$CONCURRENCY"
echo "------------------------------------------------------------"

# Cap concurrency using `wait -n` (bash 4.3+).
running=0
fail=0
for app in "${APPS[@]}"; do
  if (( running >= CONCURRENCY )); then
    if ! wait -n; then fail=1; fi
    running=$(( running - 1 ))
  fi
  build_app "$app" &
  running=$(( running + 1 ))
done
while (( running > 0 )); do
  if ! wait -n; then fail=1; fi
  running=$(( running - 1 ))
done

if (( fail )); then
  echo ""
  echo "[$(date -u '+%H:%M:%S')] one or more builds failed — NOT restarting any portals"
  exit 1
fi

# Restarts are quick and side-effecting; keep them sequential and serial so
# systemd / Caddy don't collide on burst SIGTERMs.
echo ""
echo "[$(date -u '+%H:%M:%S')] restarting affected portals"
for app in "${APPS[@]}"; do
  echo "[$(date -u '+%H:%M:%S')] $app: restart ark-portal-$app"
  systemctl restart "ark-portal-$app"
done

echo ""
echo "[$(date -u '+%Y-%m-%dT%H:%M:%SZ')] deploy.sh done"
exit 0
}
