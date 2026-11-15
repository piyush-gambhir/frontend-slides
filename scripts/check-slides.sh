#!/usr/bin/env bash














set -euo pipefail

RED='\033[0;31m'; CYAN='\033[0;36m'; NC='\033[0m'
info() { echo -e "${CYAN}ℹ${NC} $*"; }
err()  { echo -e "${RED}✗${NC} $*" >&2; }

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENGINE="$SCRIPT_DIR/check-slides.mjs"

if [[ $# -lt 1 ]]; then
  err "Usage: bash scripts/check-slides.sh <deck.html|deck-dir> [--json] [--strict] [--slide N]"
  exit 2
fi
if [[ ! -f "$ENGINE" ]]; then
  err "Engine not found: $ENGINE"
  exit 2
fi



INPUT=""
PASS_ARGS=()
for arg in "$@"; do
  if [[ -z "$INPUT" && "$arg" != --* ]]; then
    INPUT="$arg"
  else
    PASS_ARGS+=("$arg")
  fi
done

if [[ ! -e "$INPUT" ]]; then
  err "Not found: $INPUT"
  exit 2
fi
INPUT_ABS="$(cd "$(dirname "$INPUT")" && pwd)/$(basename "$INPUT")"

if ! command -v npx &>/dev/null; then
  err "Node.js is required but not installed (install: brew install node, or https://nodejs.org)."
  exit 2
fi



QUIET=false
for a in "${PASS_ARGS[@]+"${PASS_ARGS[@]}"}"; do [[ "$a" == "--json" ]] && QUIET=true; done

TEMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TEMP_DIR"' EXIT

$QUIET || info "Setting up Playwright (first run downloads a headless browser, ~30-60s)..."
echo '{ "name": "slide-check", "private": true, "type": "module" }' > "$TEMP_DIR/package.json"
cp "$ENGINE" "$TEMP_DIR/check-slides.mjs"

( cd "$TEMP_DIR" && npm install playwright &>/dev/null ) || { err "Failed to install Playwright (try: npm install playwright)."; exit 2; }
( cd "$TEMP_DIR" && npx playwright install chromium &>/dev/null ) || { err "Failed to install Chromium (try: npx playwright install chromium)."; exit 2; }


node "$TEMP_DIR/check-slides.mjs" "$INPUT_ABS" "${PASS_ARGS[@]+"${PASS_ARGS[@]}"}"
