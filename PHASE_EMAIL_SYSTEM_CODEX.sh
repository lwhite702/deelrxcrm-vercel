#!/usr/bin/env bash
set -euo pipefail

# Switch to working branch for email system rollout
git checkout -B dev-email-system

# Ensure required dependencies are present
npm install resend jose

# Validate project builds cleanly
npm run typecheck
npm run build

# Commit and push changes
git add -A
git commit -m "feat(email): templates + send helpers + webhook + admin skeleton + jwt guards"
git push --set-upstream origin dev-email-system

gh pr create --fill
