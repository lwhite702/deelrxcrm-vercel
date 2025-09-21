#!/usr/bin/env bash
set -euo pipefail

# Prefer gh auth; unset env token so gh uses stored auth with project scopes
unset GITHUB_TOKEN || true

# Auto-detect owner if not provided
if [[ -z "${GH_PROJECT_OWNER:-}" ]]; then
	GH_PROJECT_OWNER="$(gh repo view --json owner --jq .owner.login 2>/dev/null || true)"
	export GH_PROJECT_OWNER
fi

# Use title-based resolution by default; let the Node script find/create the project
: "${GH_PROJECT_TITLE:=DeelRxCRM Roadmap}"
: "${GH_PROJECT_CREATE:=1}"
: "${GH_PROJECT_ENSURE_PHASE:=1}"
export GH_PROJECT_TITLE GH_PROJECT_CREATE GH_PROJECT_ENSURE_PHASE

# If caller provided a number, pass it through; otherwise rely on title detection
if [[ -n "${GH_PROJECT_NUMBER:-}" ]]; then
	export GH_PROJECT_NUMBER
fi

# Run the sync
npm run -s issues:sync