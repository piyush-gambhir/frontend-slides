#!/usr/bin/env bash
# sync.sh — Mirror the canonical skill into the Claude Code plugin copy.
#
# Single source of truth: the skill files at the repository ROOT.
# Generated mirror:        plugins/frontend-slides/skills/frontend-slides/
#
# The Claude Code plugin marketplace install reads the mirror, so it must stay
# committed and byte-identical to root. Edit skill files at the ROOT only, then
# run this script to regenerate the mirror before committing.
#
# Usage:
#   bash sync.sh          Copy root -> plugin mirror (run after editing skill files)
#   bash sync.sh --check  Exit non-zero if the mirror has drifted (for CI / pre-commit)

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MIRROR="$ROOT_DIR/plugins/frontend-slides/skills/frontend-slides"

# The shared core: canonical skill files consumed by the skill today, and by the
# planned CLI and web surfaces later. Add new top-level skill files/dirs here.
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

# Sync: rebuild each mirrored item from the canonical root copy.
for item in "${ITEMS[@]}"; do
  dest="$MIRROR/$item"
  rm -rf "$dest"
  mkdir -p "$(dirname "$dest")"
  cp -R "$ROOT_DIR/$item" "$dest"
done
echo "✓ synced ${#ITEMS[@]} items into plugins/frontend-slides/skills/frontend-slides/"
