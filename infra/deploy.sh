#!/usr/bin/env bash
# Ark portals deploy script — invoked on the VPS by GitHub Actions over SSH
# as root. Mirrors the ark-services pattern: root SSHs in, runs build steps
# as the ark user, then restarts the affected systemd units.
#
# Expects (from env, set by the calling workflow):
#   PREV_SHA — git SHA before pull (for path-filter diff)
#   NEW_SHA  — git SHA after  pull (current HEAD)
# Falls back to HEAD~1..HEAD if missing (allows manual invocation).
#
# Path-filter rules:
#   - changes under packages/* → rebuild + restart ALL 7 portals
#   - changes under apps/<name>/ → rebuild + restart THAT portal only
#   - root-level / docs / infra-only changes → no rebuild
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

mkdir -p "$LOG_DIR"
exec > >(tee -a "$LOG_FILE") 2>&1

echo "============================================================"
echo "[$(date -u '+%Y-%m-%dT%H:%M:%SZ')] deploy.sh start (uid=$EUID)"
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

echo ""
echo "[$(date -u '+%H:%M:%S')] bun install --frozen-lockfile (as ark)"
sudo -u ark "$BUN" install --cwd "$REPO_DIR" --frozen-lockfile

for app in "${APPS[@]}"; do
  if [[ ! -d "$REPO_DIR/apps/$app" ]]; then
    echo "skip: apps/$app does not exist"
    continue
  fi
  echo ""
  echo "------------------------------------------------------------"
  echo "[$(date -u '+%H:%M:%S')] $app: build (as ark)"
  echo "------------------------------------------------------------"
  sudo -u ark bash -c "cd '$REPO_DIR/apps/$app' && '$BUN' run build"

  echo "[$(date -u '+%H:%M:%S')] $app: restart ark-portal-$app"
  systemctl restart "ark-portal-$app"
done

echo ""
echo "[$(date -u '+%Y-%m-%dT%H:%M:%SZ')] deploy.sh done"
exit 0
}
