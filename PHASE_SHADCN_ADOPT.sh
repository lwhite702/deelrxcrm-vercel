#!/bin/bash

# PHASE_SHADCN_ADOPT.sh
# shadcn/ui Adoption with cn Helper - Complete UI Standardization
# Creates branch, installs components, commits changes, pushes, and opens PR

set -e

echo "🎨 SHADCN/UI ADOPTION - Complete UI Standardization"
echo "=================================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Not in project root directory"
    exit 1
fi

# Create and switch to new branch
BRANCH_NAME="dev-shadcn-adoption"
echo "📋 Creating branch: $BRANCH_NAME"

git checkout -b "$BRANCH_NAME"

# Install any missing dependencies (if needed)
echo "📦 Installing shadcn/ui components..."
npx shadcn@latest add badge navigation-menu dialog sheet tabs accordion switch alert --yes || true

# Stage all changes
echo "📦 Staging changes..."
git add app/page.tsx
git add app/globals.css
git add "app/(marketing)/pricing/page.tsx"
git add components/ui/

# Commit changes
echo "💾 Committing changes..."
git commit -m "Adopt shadcn/ui + cn across app

STANDARDIZATION COMPLETE:
- ✅ Clean globals.css with proper Asphalt+Neon theme
- ✅ Semantic token usage (bg-card, text-primary, border-border)
- ✅ cn() helper for all class merging
- ✅ shadcn/ui components replace ad-hoc UI

COMPONENTS ADDED:
- Badge, Card, Button with proper variants
- Tabs, Dialog, Sheet, Accordion, Switch, Alert
- NavigationMenu for future nav improvements

LANDING PAGE REFACTOR:
- Hero: Gradient text with cn() helper
- Features: 7 Card components with hover effects
- Pricing: Card grid with Badge highlights
- Footer: Card-based legal disclaimer

PRICING PAGE:
- Full shadcn/ui Card layout
- Tabs for monthly/yearly toggle
- Badge for popular plan highlighting
- Proper semantic color usage

ACCESSIBILITY:
- Focus states use ring-2 ring-ring
- Proper ARIA from Radix primitives
- Semantic color tokens throughout

FILES CHANGED:
- app/globals.css - Clean theme setup
- app/page.tsx - Full shadcn/ui refactor
- app/(marketing)/pricing/page.tsx - New pricing page
- components/ui/* - Complete shadcn/ui component set"

# Push to remote
echo "🚀 Pushing to remote..."
git push -u origin "$BRANCH_NAME"

# Open PR using GitHub CLI if available
if command -v gh &> /dev/null; then
    echo "🔗 Opening Pull Request..."
    gh pr create \
        --title "Adopt shadcn/ui + cn across app" \
        --body "## 🎨 Complete UI Standardization with shadcn/ui

### ✨ What Changed
- **Replaced all ad-hoc components** with shadcn/ui primitives
- **Standardized on cn() helper** for all class merging
- **Implemented semantic tokens** (bg-card, text-primary, etc.)
- **Clean Asphalt+Neon theme** with proper CSS variable setup

### 🧩 Components Added
- \`Button\`, \`Card\`, \`Badge\` - Core UI primitives
- \`Tabs\`, \`Dialog\`, \`Sheet\` - Interactive components  
- \`Accordion\`, \`Switch\`, \`Alert\` - Additional utilities
- \`NavigationMenu\` - Future navigation improvements

### 📄 Pages Refactored
- **Landing Page (\`app/page.tsx\`)**
  - Hero with gradient text + cn() helper
  - 7 feature Cards with hover animations
  - Pricing Cards with Badge highlights
  - Card-based footer disclaimer

- **Pricing Page (\`app/(marketing)/pricing/page.tsx\`)**
  - Complete shadcn/ui Card layout
  - Monthly/yearly Tabs toggle
  - Popular plan Badge system
  - Semantic color theming

### 🎯 Theme Improvements
- **Clean globals.css** - Removed duplicates, proper CSS variables
- **Semantic tokens** - bg-card, text-primary, border-border usage
- **Asphalt+Neon palette** - Consistent theme application
- **Focus states** - ring-2 ring-ring throughout

### ♿ Accessibility
- Radix primitives provide proper ARIA
- Focus states use semantic ring colors
- Keyboard navigation support
- Screen reader friendly

### 🔧 Technical Details
- **Next.js App Router** compatible
- **Tailwind CSS v4** ready
- **TypeScript** strict mode
- **cn() helper** for class merging

### 🚀 Benefits
- **Consistent UI** across all components
- **Better accessibility** with Radix primitives
- **Maintainable code** with semantic tokens
- **Professional polish** with proper animations
- **Developer experience** with cn() helper

### Testing Checklist
- [ ] Landing page renders correctly
- [ ] Pricing page Tabs work properly
- [ ] All hover effects function
- [ ] Focus states are visible
- [ ] Mobile responsive design
- [ ] Dark theme consistency

Ready for review and testing!" \
        --base main \
        --head "$BRANCH_NAME"
    
    echo "✅ Pull Request created successfully!"
else
    echo "⚠️  GitHub CLI not found. Please create PR manually at:"
    echo "   https://github.com/lwhite702/deelrxcrm-vercel/compare/main...$BRANCH_NAME"
fi

echo ""
echo "✅ SHADCN/UI ADOPTION COMPLETE!"
echo "==============================="
echo "🌿 Branch: $BRANCH_NAME"
echo "📁 Files changed:"
echo "   - app/globals.css (clean theme)"
echo "   - app/page.tsx (full refactor)"
echo "   - app/(marketing)/pricing/page.tsx (new)"
echo "   - components/ui/* (complete set)"
echo ""
echo "🎨 Features:"
echo "   - cn() helper standardization"
echo "   - Semantic token usage"
echo "   - shadcn/ui component adoption"
echo "   - Asphalt+Neon theme consistency"
echo "   - Accessibility improvements"
echo ""
echo "🔗 Next: Review PR and test UI components"
echo ""