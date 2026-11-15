#!/usr/bin/env bash













set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MIRROR="$ROOT_DIR/plugins/frontend-slides/skills/frontend-slides"



ITEMS=(
  SKILL.md
  STYLE_PRESETS.md
  viewport-base.css
  html-template.md
  animation-patterns.md
  bold-template-pack
  scripts
)

check_only=false
[[ "${1:-}" == "--check" ]] && check_only=true

if $check_only; then
  status=0
  for item in "${ITEMS[@]}"; do
    if ! diff -rq "$ROOT_DIR/$item" "$MIRROR/$item" >/dev/null 2>&1; then
      echo "✗ drift: $item differs between root and plugin mirror"
      status=1
    fi
  done
  if [[ $status -eq 0 ]]; then
    echo "✓ plugin mirror is in sync with root"
  else
    echo "→ run 'bash sync.sh' to update the mirror, then commit."
  fi
  exit $status
fi


for item in "${ITEMS[@]}"; do
  dest="$MIRROR/$item"
  rm -rf "$dest"
  mkdir -p "$(dirname "$dest")"
  cp -R "$ROOT_DIR/$item" "$dest"
done
echo "✓ synced ${#ITEMS[@]} items into plugins/frontend-slides/skills/frontend-slides/"
