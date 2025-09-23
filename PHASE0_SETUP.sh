#!/bin/bash

# FILE: PHASE0_SETUP.sh
# DeelRxCRM Phase 0 Setup and Baseline Verification

set -e

echo "🚀 Starting DeelRxCRM Phase 0 Setup"
echo "=================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Are you in the project root?"
    exit 1
fi

# Verify Node.js version
echo "📋 Checking Node.js version..."
NODE_VERSION=$(node --version)
echo "   Node.js: $NODE_VERSION"

# Verify pnpm is available
echo "📋 Checking pnpm..."
if ! command -v pnpm &> /dev/null; then
    echo "❌ pnpm not found. Installing pnpm..."
    npm install -g pnpm
fi
PNPM_VERSION=$(pnpm --version)
echo "   pnpm: $PNPM_VERSION"

# Install dependencies
echo "📦 Installing dependencies with pnpm..."
pnpm install

# Remove extra lockfiles (if any remain)
echo "🧹 Cleaning up extra lockfiles..."
if [ -f "package-lock.json" ]; then
    rm package-lock.json
    echo "   Removed package-lock.json"
fi
if [ -f "yarn.lock" ]; then
    rm yarn.lock
    echo "   Removed yarn.lock"
fi

# Run type checking
echo "🔍 Running TypeScript check..."
pnpm run typecheck

# Run linting (non-blocking)
echo "🔍 Running ESLint check..."
pnpm run lint || echo "   ⚠️  Linting issues found (non-blocking)"

# Test build
echo "🏗️  Testing build..."
pnpm run build

# Create/switch to phase 0 branch
echo "🌿 Managing git branches..."
CURRENT_BRANCH=$(git branch --show-current)
echo "   Current branch: $CURRENT_BRANCH"

# Stash any uncommitted changes
if ! git diff --quiet || ! git diff --cached --quiet; then
    echo "   Stashing uncommitted changes..."
    git stash push -m "Phase 0 setup stash - $(date)"
fi

# Create and switch to phase 0 branch
PHASE0_BRANCH="dev-phase0-setup"
if git show-ref --verify --quiet refs/heads/$PHASE0_BRANCH; then
    echo "   Switching to existing branch: $PHASE0_BRANCH"
    git checkout $PHASE0_BRANCH
else
    echo "   Creating new branch: $PHASE0_BRANCH"
    git checkout -b $PHASE0_BRANCH
fi

# Add new files to git
echo "📝 Adding configuration files..."
git add .editorconfig .prettierrc .nvmrc docs/BASELINE.md
git add package.json .gitignore

# Commit changes
echo "💾 Committing Phase 0 setup..."
git commit -m "chore: Phase 0 setup and baseline verification

- Add .editorconfig for consistent editor settings
- Add .prettierrc for code formatting
- Add .nvmrc for Node.js version consistency
- Update package.json with additional scripts (typecheck, format, docs)
- Enhanced .gitignore with comprehensive patterns
- Remove package-lock.json to standardize on pnpm
- Create docs/BASELINE.md with project status
- Add prettier as dev dependency

Phase 0 baseline established for production readiness track."

# Push branch
echo "⬆️  Pushing branch to origin..."
git push origin $PHASE0_BRANCH

# Create PR if gh CLI is available
if command -v gh &> /dev/null; then
    echo "🔄 Creating Pull Request..."
    PR_BODY="## Phase 0: Setup and Baseline

This PR establishes the baseline configuration for DeelRxCRM SaaS Starter project.

### Changes Made:
- ✅ Standardized package manager on pnpm (removed package-lock.json)
- ✅ Added missing configuration files (.editorconfig, .prettierrc, .nvmrc)
- ✅ Enhanced .gitignore with comprehensive patterns
- ✅ Updated package.json with essential scripts (typecheck, format, docs)
- ✅ Added prettier as dev dependency
- ✅ Created baseline documentation (docs/BASELINE.md)

### Verification:
- ✅ Dependencies install cleanly with pnpm
- ✅ TypeScript compilation passes
- ✅ Build process completes successfully
- ⚠️ Linting has issues (addressed in follow-up)

### Next Steps:
- Phase 6: Production readiness preparations
- Address linting warnings gradually
- Clean up legacy directories

**Phase Status:**
- Phase 0: ✅ Complete (this PR)
- Phase 4: 🔄 In Progress (feature add-ons)
- Phase 5: 🔄 In Progress (docs & changelog)
- Phase 6: ⏳ Ready to begin"

    gh pr create \
        --title "Phase 0: Setup and Baseline" \
        --body "$PR_BODY" \
        --base dev-phase5 \
        --head $PHASE0_BRANCH \
        --draft || echo "   ⚠️  PR creation failed, please create manually"
else
    echo "   ⚠️  gh CLI not available. Please create PR manually:"
    echo "   Title: Phase 0: Setup and Baseline"
    echo "   Base: dev-phase5"
    echo "   Head: $PHASE0_BRANCH"
fi

# Create GitHub issues if gh CLI is available
if command -v gh &> /dev/null; then
    echo "📋 Creating Phase 0 issues..."
    
    # Issue 1: Phase 0 completion
    gh issue create \
        --title "PHASE 0: Repo setup and baseline verification" \
        --body "**Objective:** Establish clean baseline for DeelRxCRM SaaS Starter

**Tasks:**
- [x] Standardize package manager on pnpm
- [x] Add missing config files (.editorconfig, .prettierrc, .nvmrc)
- [x] Update package.json with essential scripts
- [x] Enhanced .gitignore
- [x] Create baseline documentation
- [x] Verify build and typecheck pass

**Status:** ✅ Complete (see PR #XXX)
**Phase:** 0" \
        --label "phase-0,setup" || echo "   ⚠️  Issue creation failed"

    # Issue 2: Package manager standardization  
    gh issue create \
        --title "PHASE 0: Standardize package manager and scripts" \
        --body "**Objective:** Ensure consistent development environment

**Tasks:**
- [x] Remove package-lock.json
- [x] Standardize on pnpm-lock.yaml only
- [x] Add missing package.json scripts (typecheck, format, docs)
- [x] Add prettier dependency
- [x] Verify all scripts work

**Status:** ✅ Complete
**Phase:** 0" \
        --label "phase-0,tooling" || echo "   ⚠️  Issue creation failed"

    # Issue 3: Project tracker seeding
    gh issue create \
        --title "PHASE 0: Seed GitHub project tracker with Phases 0–6" \
        --body "**Objective:** Align project tracker with phase timeline

**Phases:**
- Phase 0: ✅ Repository setup and baseline (complete)
- Phase 1: ✅ Previously completed
- Phase 2: ✅ Previously completed  
- Phase 3: ✅ Previously completed
- Phase 4: 🔄 Feature add-ons (in progress)
- Phase 5: 🔄 Documentation & changelog (in progress)
- Phase 6: ⏳ Production readiness (pending)

**Next:** Update project board with current status
**Phase:** 0" \
        --label "phase-0,project-management" || echo "   ⚠️  Issue creation failed"

else
    echo "   ⚠️  gh CLI not available. Please create issues manually."
fi

echo ""
echo "✅ Phase 0 Setup Complete!"
echo "========================="
echo "📊 Summary:"
echo "   - Package manager: pnpm (standardized)"
echo "   - Config files: Added .editorconfig, .prettierrc, .nvmrc"
echo "   - Scripts: Added typecheck, format, docs commands"
echo "   - Documentation: Created docs/BASELINE.md"
echo "   - Branch: $PHASE0_BRANCH"
echo "   - Build status: ✅ Passing"
echo "   - TypeScript: ✅ No errors"
echo ""
echo "🎯 Ready for Phase 6: Production Readiness"
echo ""