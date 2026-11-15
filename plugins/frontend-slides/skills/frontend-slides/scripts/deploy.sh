#!/usr/bin/env bash

















set -euo pipefail


RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
BOLD='\033[1m'
NC='\033[0m'

info()  { echo -e "${CYAN}ℹ${NC} $*"; }
ok()    { echo -e "${GREEN}✓${NC} $*"; }
warn()  { echo -e "${YELLOW}⚠${NC} $*"; }
err()   { echo -e "${RED}✗${NC} $*" >&2; }



if [[ $# -lt 1 ]]; then
    err "Usage: bash scripts/deploy.sh <path-to-slide-folder-or-html>"
    err ""
    err "Examples:"
    err "  bash scripts/deploy.sh ./my-pitch-deck/"
    err "  bash scripts/deploy.sh ./presentation.html"
    exit 1
fi

INPUT="$1"


if [[ -f "$INPUT" && "$INPUT" == *.html ]]; then
    DEPLOY_DIR=$(mktemp -d)
    cp "$INPUT" "$DEPLOY_DIR/index.html"
    PARENT_DIR=$(dirname "$INPUT")



    grep -oE '(src|href|url\()["'"'"']?[^"'"'"'>)]+' "$INPUT" 2>/dev/null | \
        sed "s/^src=//; s/^href=//; s/^url(//; s/[\"']//g" | \
        grep -v '^http' | grep -v '^data:' | grep -v '^#' | grep -v '^/' | \
        sort -u | while read -r ref; do

            SOURCE_FILE="$PARENT_DIR/$ref"
            if [[ -e "$SOURCE_FILE" ]]; then

                TARGET_DIR="$DEPLOY_DIR/$(dirname "$ref")"
                mkdir -p "$TARGET_DIR"
                cp -r "$SOURCE_FILE" "$TARGET_DIR/"
            fi
        done


    if [[ -d "$PARENT_DIR/assets" ]]; then
        cp -r "$PARENT_DIR/assets" "$DEPLOY_DIR/assets" 2>/dev/null || true
    fi

    CLEANUP_TEMP=true
    info "Single HTML file detected — preparing for deployment..."
elif [[ -d "$INPUT" ]]; then

    if [[ ! -f "$INPUT/index.html" ]]; then
        err "Folder '$INPUT' does not contain an index.html file."
        err "Make sure your presentation folder has an index.html."
        exit 1
    fi
    DEPLOY_DIR="$INPUT"
    CLEANUP_TEMP=false
else
    err "'$INPUT' is not a valid HTML file or directory."
    exit 1
fi



echo ""
echo -e "${BOLD}╔══════════════════════════════════════╗${NC}"
echo -e "${BOLD}║       Deploy Slides to Vercel         ║${NC}"
echo -e "${BOLD}╚══════════════════════════════════════╝${NC}"
echo ""

if ! command -v npx &>/dev/null; then
    err "Node.js is required but not installed."
    err ""
    err "Install Node.js:"
    err "  macOS:   brew install node"
    err "  or visit https://nodejs.org and download the installer"
    exit 1
fi

info "Checking Vercel CLI..."


if command -v vercel &>/dev/null; then
    VERCEL_CMD="vercel"
    ok "Vercel CLI found"
elif npx --yes vercel --version &>/dev/null 2>&1; then
    VERCEL_CMD="npx --yes vercel"
    ok "Vercel CLI available via npx"
else
    info "Installing Vercel CLI..."
    npm install -g vercel
    VERCEL_CMD="vercel"
    ok "Vercel CLI installed"
fi



echo ""
info "Checking Vercel login status..."


if ! $VERCEL_CMD whoami &>/dev/null 2>&1; then
    echo ""
    warn "You're not logged in to Vercel yet."
    echo ""
    echo -e "${BOLD}To log in, run this command and follow the prompts:${NC}"
    echo ""
    echo "    vercel login"
    echo ""
    echo "If you don't have a Vercel account yet:"
    echo "  1. Go to https://vercel.com/signup"
    echo "  2. Sign up with GitHub, GitLab, email, or any method"
    echo "  3. Come back here and run: vercel login"
    echo "  4. Then re-run this deploy script"
    echo ""


    echo -e "${YELLOW}Attempting interactive login now...${NC}"
    echo ""
    $VERCEL_CMD login || {
        err "Login failed. Please run 'vercel login' manually and try again."
        [[ "$CLEANUP_TEMP" == "true" ]] && rm -rf "$DEPLOY_DIR"
        exit 1
    }
    echo ""
    ok "Logged in to Vercel!"
fi

VERCEL_USER=$($VERCEL_CMD whoami 2>/dev/null || echo "unknown")
ok "Logged in as: $VERCEL_USER"



echo ""
info "Deploying slides..."
echo ""





DECK_NAME=$(basename "$DEPLOY_DIR")

if [[ "$CLEANUP_TEMP" == "true" ]]; then
    DECK_NAME=$(basename "$INPUT" .html)
fi




DECK_NAME=$(echo "$DECK_NAME" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9._-]/-/g' | sed 's/--*/-/g' | sed 's/^-//;s/-$//' | cut -c1-100)



if [[ "$CLEANUP_TEMP" == "true" ]]; then
    RENAMED_DIR="$(dirname "$DEPLOY_DIR")/$DECK_NAME"
    mv "$DEPLOY_DIR" "$RENAMED_DIR"
    DEPLOY_DIR="$RENAMED_DIR"
fi

DEPLOY_OUTPUT=$($VERCEL_CMD deploy "$DEPLOY_DIR" --yes --prod 2>&1) || {
    err "Deployment failed:"
    echo "$DEPLOY_OUTPUT"
    [[ "$CLEANUP_TEMP" == "true" ]] && rm -rf "$DEPLOY_DIR"
    exit 1
}


DEPLOY_URL=$(echo "$DEPLOY_OUTPUT" | grep -o 'https://[^ ]*' | tail -1)



echo ""
echo -e "${BOLD}════════════════════════════════════════${NC}"
ok "Slides deployed successfully!"
echo ""
echo -e "  ${BOLD}Live URL:${NC}  $DEPLOY_URL"
echo ""
echo "  This URL works on any device — phones, tablets, laptops."
echo "  Share it via Slack, email, text, or anywhere."
echo ""
echo -e "  ${CYAN}Tip:${NC} To take it down later, visit https://vercel.com/dashboard"
echo -e "       and delete the project '${DECK_NAME}'."
echo -e "${BOLD}════════════════════════════════════════${NC}"
echo ""



if [[ "$CLEANUP_TEMP" == "true" ]]; then
    rm -rf "$DEPLOY_DIR"
fi
