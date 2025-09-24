export interface PricingPlan {
  id: string;
  name: string;
  price: string;
  period: string;
  description: string;
  popular?: boolean;
  features: string[];
  limitations: string[];
  paymentsNote: string;
  cta: {
    text: string;
    variant: 'default' | 'secondary' | 'outline';
  };
}

export interface FeeSchedule {
  comingSoon: true;
  baseRate: string;
  streetTax: string;
  instantPayout: string;
  chargebackFee: string;
  description: string;
}

export const pricingPlans: PricingPlan[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: 'Free',
    period: 'forever',
    description: 'Perfect for getting started with basic CRM features',
    features: [
      '1 user account',
      'Up to 25 customers',
      'Manual inventory tracking',
      'Basic dashboard',
      'MFA + encryption',
      'Profit snapshots (limited)',
      'Manual payment reconciliation',
    ],
    limitations: [
      'Manual payments only (Zelle, Apple Pay, Cash App, Cash, custom)',
      'Limited profit reports',
      'Basic support',
    ],
    paymentsNote:
      'Manual reconciliation only (Zelle, Apple Pay, Cash App, Cash, custom)',
    cta: {
      text: 'Start Free Today',
      variant: 'outline',
    },
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$29',
    period: 'per month',
    description: 'Most popular plan for growing businesses',
    popular: true,
    features: [
      '3 user accounts',
      'Up to 250 customers',
      'Unlimited inventory entries',
      'Loyalty programs & referrals',
      'Full profit reports',
      'Privacy Pack (auto-logout, masked IDs, logs)',
      'Mobile-ready interface',
      'Self-destruct notes',
      'Priority support',
    ],
    limitations: [],
    paymentsNote: 'Manual payments now. Card processing Coming Soon',
    cta: {
      text: 'Upgrade to Pro',
      variant: 'default',
    },
  },
  {
    id: 'business',
    name: 'Business',
    price: '$99',
    period: 'per month',
    description: 'Advanced features for established businesses',
    features: [
      '10 user accounts',
      'Up to 500 customers',
      'Multi-location support',
      'Enforced 2FA for all users',
      'Encrypted automated backups',
      'Role-based permissions',
      'White-label branding',
      'Advanced analytics (trends/exports)',
      'Fraud & chargeback monitoring',
      'Dedicated account manager',
    ],
    limitations: [],
    paymentsNote: 'Manual payments now. Card processing Coming Soon',
    cta: {
      text: 'Talk to Sales',
      variant: 'secondary',
    },
  },
];

export const feeSchedule: FeeSchedule = {
  comingSoon: true,
  baseRate: '3.5% + $0.30',
  streetTax: '+0.5%',
  instantPayout: '+1%',
  chargebackFee: '$15',
  description:
    'Transaction fees apply only when card processing launches. Manual reconciliation has no platform fees.',
};

export const pricingFAQs = [
  {
    question: 'Can I process cards now?',
    answer:
      'Not yet. Manual reconciliation is supported today for Zelle, Apple Pay, Cash App, Cash, and custom payment methods. Card processing is **Coming Soon** with transparent fee disclosure.',
  },
  {
    question: 'Are there fees today?',
    answer:
      'No platform fee for manual reconciliation. Transaction fees will only apply when card processing launches, with full transparency on our fee schedule.',
  },
  {
    question: 'Which manual methods are supported?',
    answer:
      'You can reconcile payments from Zelle, Apple Pay, Cash App, Cash transactions, or any custom payment method. Simply log the payment details in your dashboard.',
  },
  {
    question: 'When will card processing be available?',
    answer:
      "We're working hard to launch card processing capabilities. All users will be notified when this feature becomes available, with clear fee disclosure before activation.",
  },
  {
    question: 'Can I upgrade or downgrade my plan?',
    answer:
      'Yes, you can change your plan at any time. Upgrades take effect immediately, while downgrades take effect at the next billing cycle.',
  },
];
