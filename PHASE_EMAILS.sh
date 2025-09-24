#!/bin/bash

# FILE: PHASE_EMAILS.sh
# DeelRxCRM Email Templates Integration with Resend

set -e  # Exit on any error

echo "🚀 Starting DeelRxCRM Email Templates Phase..."

# Create and switch to feature branch
echo "📝 Creating feature branch 'dev-email-templates'..."
git checkout -b dev-email-templates

# Install resend package if not already installed
echo "📦 Installing Resend package..."
if ! npm list resend &>/dev/null; then
    npm install resend --legacy-peer-deps
    echo "✅ Resend package installed"
else
    echo "✅ Resend package already installed"
fi

# Install @react-email/render for email rendering
echo "📦 Installing React Email render package..."
if ! npm list @react-email/render &>/dev/null; then
    npm install @react-email/render --legacy-peer-deps
    echo "✅ React Email render package installed"
else
    echo "✅ React Email render package already installed"
fi

# Add all created files to git
echo "📁 Adding email template files to git..."
git add emails/
git add lib/email/
git add PHASE_EMAILS.sh

# Create commit
echo "💾 Committing email templates..."
git commit -m "feat(emails): add Resend templates + plaintext fallbacks

- Add 5 production-ready email templates with Asphalt+Neon branding
- WelcomeEmail: user verification with street-smart copy  
- PasswordResetEmail: secure password reset with security tips
- PayoutConfirmationEmail: payout details with transaction info
- ChargebackAlertEmail: urgent dispute handling with evidence requirements
- ExportReadyEmail: data export notifications with security guidance
- All templates include JSX + plaintext fallbacks for accessibility
- Base components with DeelRxCRM brand colors and legal disclaimers
- Complete /lib/email/send.ts integration with Resend API
- Street-savvy, privacy-first copy matching DeelRxCRM brand tone"

# Push branch to remote
echo "📤 Pushing branch to remote..."
git push -u origin dev-email-templates

# Open pull request using GitHub CLI
echo "🔄 Creating pull request..."
gh pr create \
    --title "Phase: Email Templates (Resend)" \
    --body "## Email Templates Integration 📧

### Overview
Production-ready Resend email templates for DeelRxCRM with street-smart branding and privacy-first messaging.

### Templates Added
- **Welcome/Verify Email** - User onboarding with verification CTA
- **Password Reset** - Secure password reset with expiration warnings  
- **Payout Confirmation** - Payment details with transaction tracking
- **Chargeback Alert** - Urgent dispute handling with evidence requirements
- **Export Ready** - Data export notifications with security guidance

### Key Features
✅ **Asphalt+Neon Brand Palette** - Background #0B0F14, Neon accents (#A3E635, #22D3EE, #EF4444)
✅ **Street-Smart Copy** - Matches DeelRxCRM brand tone and messaging
✅ **JSX + Plaintext Fallbacks** - Full accessibility and email client compatibility  
✅ **Legal Compliance** - Required disclaimers for lawful business use
✅ **Resend API Integration** - Complete /lib/email/send.ts helper functions
✅ **Security Best Practices** - Privacy-first messaging and secure handling

### Technical Implementation
- React components with proper TypeScript interfaces
- Reusable base components for consistent branding
- Environment variable integration (RESEND_API_KEY)
- Error handling and logging for production use
- Bulk email sending capabilities

### Testing
- [ ] Test all 5 email templates in development
- [ ] Verify plaintext fallbacks render correctly
- [ ] Confirm Resend API integration works
- [ ] Validate email deliverability

### Production Readiness
All templates are production-ready with:
- Professional styling matching DeelRxCRM brand
- Mobile-responsive design
- Accessible plaintext alternatives
- Legal compliance footer
- Street-smart, privacy-first messaging

Ready to deploy and start sending professional emails that match the DeelRxCRM brand! 🎯" \
    --assignee @me \
    --label "feature,email,resend,phase"

echo ""
echo "✅ Phase: Email Templates (Resend) - COMPLETE!"
echo ""
echo "📧 Created 5 production-ready email templates:"
echo "   • WelcomeEmail.tsx (verification)"
echo "   • PasswordResetEmail.tsx (security)" 
echo "   • PayoutConfirmationEmail.tsx (payments)"
echo "   • ChargebackAlertEmail.tsx (disputes)"
echo "   • ExportReadyEmail.tsx (data export)"
echo ""
echo "🔧 Added complete Resend API integration:"
echo "   • /lib/email/send.ts with helper functions"
echo "   • JSX + plaintext fallbacks for all templates"
echo "   • DeelRxCRM branding with Asphalt+Neon palette"
echo ""
echo "🎯 Pull request created and ready for review!"
echo "   Branch: dev-email-templates"
echo "   Title: Phase: Email Templates (Resend)"
echo ""
echo "Next steps:"
echo "1. Review PR and test email templates"
echo "2. Configure RESEND_API_KEY in production environment"
echo "3. Merge to main when ready"
echo "4. Start sending professional DeelRxCRM emails! 📬"