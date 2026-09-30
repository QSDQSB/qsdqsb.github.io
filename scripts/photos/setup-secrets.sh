#!/usr/bin/env bash
# Store the photo pipeline's credentials where each one is used, without
# printing any of them. Run it yourself, in your own terminal: it asks for
# each value with the input hidden. Leave a prompt empty to skip that one.
#
#   R2 access key id + secret  → rclone remote `r2` (this machine); taken from
#                                R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY in .env
#                                when both are there, else asked for
#                              → GitHub secrets R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY,
#                                only on a yes: the processing workflow writes to
#                                both buckets, so a narrower key would stop it
#   account id                 → rclone endpoint (and GitHub secret R2_ACCOUNT_ID
#                                with the keys); the argument, else R2_ACCOUNT_ID in .env
#   Pages deploy hook URL      → GitHub secret CF_PAGES_DEPLOY_HOOK
#   GitHub fine-grained token  → Worker secret GITHUB_TOKEN (qsdqsb-photos-trigger)
#
# Values go to gh and wrangler on stdin. rclone takes its two keys as
# arguments, briefly visible to other processes on this machine. GitHub
# secrets go to QSDQSB/qsdqsb.github.io by name: this clone also has the
# academicpages upstream, and gh refuses to guess between them.
#
# Usage: bash scripts/photos/setup-secrets.sh [<cloudflare-account-id>]

set -euo pipefail
cd "$(dirname "$0")/../.."

# Homebrew's tools may not be on this shell's PATH (no brew shellenv in the
# profile): look in its prefixes too, and check everything before asking
# for a single secret, so a missing tool never leaves the setup half done.
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"
missing=()
for tool in rclone gh npx; do command -v "$tool" >/dev/null || missing+=("$tool"); done
if [ ${#missing[@]} -gt 0 ]; then
  echo "not found: ${missing[*]}. Install with: brew install rclone gh node" >&2
  exit 2
fi
gh auth status >/dev/null 2>&1 || { echo "gh is not signed in: run  gh auth login  first" >&2; exit 2; }

REPO=QSDQSB/qsdqsb.github.io

# One value from .env, unquoted; empty when the file or the name is missing.
from_env() {
  [ -f .env ] || return 0
  sed -nE "s/^[[:space:]]*(export[[:space:]]+)?$1[[:space:]]*=[[:space:]]*//p" .env | tail -1 | tr -d '\r' | sed -E "s/^[\"']//; s/[\"']$//"
}

account="${1:-$(from_env R2_ACCOUNT_ID)}"
if [[ ! "$account" =~ ^[0-9a-f]{32}$ ]]; then
  echo "usage: bash scripts/photos/setup-secrets.sh <cloudflare-account-id>  (32 hex characters; or R2_ACCOUNT_ID in .env)" >&2
  exit 2
fi

ask() { local v; read -r -s -p "$1: " v; echo >&2; printf '%s' "$v"; }
confirm() { local v; read -r -p "$1 [y/N] " v; [[ "$v" =~ ^[Yy] ]]; }

key_id=$(from_env R2_ACCESS_KEY_ID); secret=$(from_env R2_SECRET_ACCESS_KEY)
if [ -n "$key_id" ] && [ -n "$secret" ]; then
  echo "R2 keys: from .env"
else
  key_id=$(ask "R2 Access Key ID (Enter to skip)")
  [ -n "$key_id" ] && secret=$(ask "R2 Secret Access Key")
fi
if [ -n "$key_id" ]; then
  rclone config create r2 s3 provider=Cloudflare access_key_id="$key_id" secret_access_key="$secret" \
    endpoint="https://${account}.r2.cloudflarestorage.com" acl=private no_check_bucket=true --non-interactive >/dev/null
  echo "  rclone remote r2: configured"
  if confirm "Also replace the GitHub Actions R2 secrets with this key? Only if it can read and write both buckets"; then
    printf '%s' "$account" | gh secret set R2_ACCOUNT_ID --repo "$REPO"
    printf '%s' "$key_id"  | gh secret set R2_ACCESS_KEY_ID --repo "$REPO"
    printf '%s' "$secret"  | gh secret set R2_SECRET_ACCESS_KEY --repo "$REPO"
    echo "  GitHub secrets R2_*: set"
  fi
fi
unset secret

hook=$(ask "Pages deploy hook URL (Enter to skip)")
if [ -n "$hook" ]; then
  [[ "$hook" == https://api.cloudflare.com/* ]] || { echo "  that does not look like a deploy hook URL; skipped" >&2; hook=""; }
  [ -n "$hook" ] && printf '%s' "$hook" | gh secret set CF_PAGES_DEPLOY_HOOK --repo "$REPO"
fi

token=$(ask "GitHub fine-grained token for the Worker (Enter to skip)")
if [ -n "$token" ]; then
  (cd workers/photos-trigger && printf '%s' "$token" | npx --yes wrangler@4 secret put GITHUB_TOKEN >/dev/null)
  echo "  Worker secret GITHUB_TOKEN: set"
  unset token
fi

echo
echo "Done. Check with: npm run photos:status"
