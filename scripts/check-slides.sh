#!/usr/bin/env bash
# check-slides.sh — Automated visual QA for a generated deck.
#
# Loads the deck in a headless browser and measures the live DOM to catch the two
# failure modes the fixed 1920×1080 stage hides behind overflow:hidden:
#   • overflow — text/media clipped past the slide frame (looks fine in a screenshot)
#   • overlap  — flex/grid panels covering each other
#
# Usage:
#   bash scripts/check-slides.sh <deck.html|deck-dir> [--json] [--strict] [--slide N]
#
# Exit codes: 0 = clean · 1 = problems found · 2 = bad input / no slides.
#
# Self-contained: installs Playwright + Chromium into a temp dir on first run
# (mirrors export-pdf.sh), so there is nothing to set up in the repo.
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

# First positional arg is the deck path; resolve it to an absolute path. Every
# other arg is a flag passed straight through to the engine.
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

# Quiet mode for --json so the report stays machine-parseable on stdout.
# Guard empty-array expansion for bash 3.2 (macOS) under `set -u`.
QUIET=false
for a in "${PASS_ARGS[@]+"${PASS_ARGS[@]}"}"; do [[ "$a" == "--json" ]] && QUIET=true; done

TEMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TEMP_DIR"' EXIT

$QUIET || info "Setting up Playwright (first run downloads a headless browser, ~30-60s)..."
echo '{ "name": "slide-check", "private": true, "type": "module" }' > "$TEMP_DIR/package.json"
cp "$ENGINE" "$TEMP_DIR/check-slides.mjs"

( cd "$TEMP_DIR" && npm install playwright &>/dev/null ) || { err "Failed to install Playwright (try: npm install playwright)."; exit 2; }
( cd "$TEMP_DIR" && npx playwright install chromium &>/dev/null ) || { err "Failed to install Chromium (try: npx playwright install chromium)."; exit 2; }

# Run the engine from the temp dir so it resolves the locally-installed playwright.
node "$TEMP_DIR/check-slides.mjs" "$INPUT_ABS" "${PASS_ARGS[@]+"${PASS_ARGS[@]}"}"
