import type { WelcomeEmailProps } from './WelcomeEmail';

export function welcomeEmailText({
  userName,
  verifyUrl,
}: WelcomeEmailProps): string {
  return `
WELCOME TO DEELRXCRM - VERIFY YOUR EMAIL

Welcome to the Block, ${userName}! 👑

You've just joined the most street-smart CRM in the game. We're about to revolutionize how you manage your business, track your customers, and secure your profits.

But first, we need to verify you're the real deal. Click the link below to confirm your email and unlock your full DeelRxCRM potential:

VERIFY YOUR EMAIL:
${verifyUrl}

PRIVACY FIRST: Your data stays locked down tight. We don't sell, share, or leak your business intel. Period.

Ready to run your business like a boss?
Let's get this money. 💰

— The DeelRxCRM Team

---
Need help? Contact us at support@deelrxcrm.app

© 2025 DeelRxCRM. For lawful business use only. Users must comply with applicable laws.
`.trim();
}
