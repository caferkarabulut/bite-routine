#!/bin/zsh
# Runs the whole suite on one simulator. Usage: .maestro/run.sh <simulator-udid> [flow-name ...]
# Artifacts (screenshots, logs) go to .maestro/screenshots/<timestamp>/ (git-ignored).
set -u
cd "$(dirname "$0")/.."
UDID="${1:?usage: .maestro/run.sh <simulator-udid> [flow ...]}"; shift
FLOWS=("$@"); [ ${#FLOWS[@]} -eq 0 ] && FLOWS=(onboarding add-food search-turkish edit-delete-entry custom-food water history-weight settings)
OUT=".maestro/screenshots/$(date +%Y%m%d-%H%M%S)"; mkdir -p "$OUT"
fail=0
for f in $FLOWS; do
  if maestro test --device "$UDID" --test-output-dir "$OUT" ".maestro/$f.yaml" < /dev/null > "$OUT/$f.log" 2>&1; then
    echo "PASS $f"
  else
    echo "FAIL $f (see $OUT/$f.log)"; fail=1
  fi
done
exit $fail
