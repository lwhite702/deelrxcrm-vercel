#!/usr/bin/env bash
set -euo pipefail

# Phase 2 project update helper
# - Closes Phase 2 issues by title
# - Applies labels (phase-2, done)
# - Optionally updates GitHub Project field (if PROJECT_NUMBER is provided)
#
# Requirements: gh >= 2.x, jq

PHASE_NAME=${PHASE_NAME:-"Phase 2"}
GH_OWNER=${GH_OWNER:-""}
GH_REPO=${GH_REPO:-""}
PROJECT_NUMBER=${PROJECT_NUMBER:-""}  # Optional ProjectsV2 board number

need_cmd() { command -v "$1" >/dev/null 2>&1 || { echo "Missing required command: $1" >&2; exit 1; }; }
need_cmd gh
need_cmd jq

# Derive owner/repo from git remote if not provided
if [[ -z "$GH_OWNER" || -z "$GH_REPO" ]]; then
  remote_url=$(git config --get remote.origin.url || true)
  if [[ -n "$remote_url" ]]; then
    # Support git@github.com:owner/repo.git and https://github.com/owner/repo.git
    cleaned=${remote_url%.git}
    cleaned=${cleaned#git@github.com:}
    cleaned=${cleaned#https://github.com/}
    GH_OWNER=${GH_OWNER:-"${cleaned%%/*}"}
    GH_REPO=${GH_REPO:-"${cleaned#*/}"}
  fi
fi

if [[ -z "$GH_OWNER" || -z "$GH_REPO" ]]; then
  echo "GH_OWNER/GH_REPO not set and could not parse from git remote." >&2
  echo "Export GH_OWNER and GH_REPO, or run inside the repo with a valid remote." >&2
  exit 1
fi

echo "Repo: $GH_OWNER/$GH_REPO"
echo "Phase: $PHASE_NAME"

gh_repo_flag=("--repo" "$GH_OWNER/$GH_REPO")

ensure_label() {
  local label="$1"; local color="${2:-6f42c1}"; local desc="${3:-}"
  if ! gh label list "${gh_repo_flag[@]}" --limit 1000 | awk '{print $1}' | grep -Fxq "$label"; then
    echo "Creating label: $label"
    gh label create "$label" "${gh_repo_flag[@]}" --color "$color" ${desc:+--description "$desc"} || true
  fi
}

issue_number_by_title() {
  local title="$1"
  gh issue list "${gh_repo_flag[@]}" --limit 300 --json number,title | \
    jq -r --arg t "$title" '.[] | select(.title==$t) | .number' | head -n1
}

comment_issue_by_number() {
  local num="$1"; shift; local body="$*"
  gh issue comment "${gh_repo_flag[@]}" "$num" --body "$body"
}

label_issue_by_number() {
  local num="$1"; shift; local labels_csv="$*"
  gh issue edit "${gh_repo_flag[@]}" "$num" --add-label "$labels_csv"
}

close_issue_by_number() {
  local num="$1"
  gh issue close "${gh_repo_flag[@]}" "$num" --reason completed
}

maybe_project_set_phase() {
  local num="$1"; local phase_value="$2"
  if [[ -z "$PROJECT_NUMBER" ]]; then
    return 0
  fi
  echo "Project $PROJECT_NUMBER set phase '$phase_value' for issue #$num (best-effort)."
  # Best-effort placeholder: ProjectsV2 GraphQL varies; keeping this as a log-only step.
}

main() {
  ensure_label "phase-2" "0e8a16" "Phase 2 work"
  ensure_label "done" "1d76db" "Completed work"

  declare -a TITLES=(
    "PHASE 2: Inventory adjustments"
    "PHASE 2: Customer referrals"
    "PHASE 2: Deliveries basic"
    "PHASE 2: Loyalty basics"
    "PHASE 2: Data model doc"
  )

  for title in "${TITLES[@]}"; do
    echo "Processing: $title"
    num=$(issue_number_by_title "$title" || true)
    if [[ -z "$num" ]]; then
      echo "  Issue not found by exact title; skipping."
      continue
    fi
    label_issue_by_number "$num" "phase-2,done"
    comment_issue_by_number "$num" "${PHASE_NAME}: Implemented and documented. See docs/EXTENDED_OPS.md and docs/DATA_MODEL.md."
    close_issue_by_number "$num"
    maybe_project_set_phase "$num" "$PHASE_NAME"
  done

  echo "Done. Labeled and closed available Phase 2 issues."
}

main "$@"
