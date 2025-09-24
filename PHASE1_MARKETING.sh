#!/bin/bash

# PHASE1_MARKETING.sh
# Marketing Copy Refresh - Phase 1
# Creates branch, commits changes, pushes, and opens PR

set -e

echo "🚀 PHASE 1: Marketing Copy Refresh"
echo "=================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Not in project root directory"
    exit 1
fi

# Create and switch to new branch
BRANCH_NAME="dev-phase1-marketing-copy"
echo "📋 Creating branch: $BRANCH_NAME"

git checkout -b "$BRANCH_NAME"

# Stage all changes
echo "📦 Staging changes..."
git add app/page.tsx

# Commit changes
echo "💾 Committing changes..."
git commit -m "Phase 1: Marketing Copy Refresh

- Create root landing page at app/page.tsx
- Update hero: 'Run the Block. Run the Business.'
- New subheadline emphasizing security, privacy, and hustle
- Primary CTA: 'Start Free Today', Secondary: 'See It in Action'
- 7 feature tiles: Dashboard, Product Control, Customer Loyalty, 
  Instant Payments, Privacy Locked, Untraceable Flow, Real Income Clarity
- WHY section: 'Built for Hustlers Who Act Like CEOs'
- Enhanced lawful use disclaimer in footer
- Maintain TOS/Privacy links"

# Push to remote
echo "🚀 Pushing to remote..."
git push -u origin "$BRANCH_NAME"

# Open PR using GitHub CLI if available
if command -v gh &> /dev/null; then
    echo "🔗 Opening Pull Request..."
    gh pr create \
        --title "Phase 1: Marketing Copy Refresh" \
        --body "## 🎯 Marketing Copy Refresh

### Changes Made
- ✅ Created root landing page at \`app/page.tsx\`
- ✅ Updated hero section with new messaging
- ✅ Refreshed feature tiles (7 total) with security/privacy focus
- ✅ Enhanced WHY section messaging
- ✅ Maintained prominent lawful use disclaimer

### Key Features
- **Hero**: 'Run the Block. Run the Business.'
- **Subheadline**: Emphasizes security, privacy, and business focus
- **CTAs**: Primary 'Start Free Today', Secondary 'See It in Action'
- **Features**: Dashboard, Product Control, Customer Loyalty, Instant Payments, Privacy Locked, Untraceable Flow, Real Income Clarity
- **WHY**: 'Built for Hustlers Who Act Like CEOs'

### Testing
- [ ] Verify landing page renders correctly
- [ ] Check responsive design on mobile/tablet
- [ ] Validate all CTAs link properly
- [ ] Confirm legal disclaimer is prominent

### Files Changed
- \`app/page.tsx\` - New root landing page

Addresses marketing refresh requirements with focus on lawful use, security, and business clarity." \
        --base main \
        --head "$BRANCH_NAME"
    
    echo "✅ Pull Request created successfully!"
else
    echo "⚠️  GitHub CLI not found. Please create PR manually at:"
    echo "   https://github.com/lwhite702/deelrxcrm-vercel/compare/main...$BRANCH_NAME"
fi

echo ""
echo "✅ PHASE 1 COMPLETE!"
echo "==================="
echo "🌿 Branch: $BRANCH_NAME"
echo "📁 Files changed: app/page.tsx"
echo "🔗 Next: Review and merge PR when ready"
echo ""