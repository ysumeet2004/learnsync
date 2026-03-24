import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing STRIPE_SECRET_KEY environment variable');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

export const PLANS = {
  free: {
    id: 'free',
    name: 'Free',
    price: 0,
    stripePriceId: null,
    features: [
      'Up to 1 squad',
      'Basic course hosting',
      'Assignment tracking',
      'Manual quizzes',
      'Up to 10 members',
    ],
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 1999, // $19.99/month in cents
    stripePriceId: process.env.STRIPE_PRICE_ID_PRO || 'price_pro',
    features: [
      'Unlimited squads',
      'Full course hosting',
      'AI-powered quizzes',
      'Advanced analytics',
      'Up to 100 members per squad',
      'Priority support',
      'Custom branding',
    ],
  },
  squad: {
    id: 'squad',
    name: 'Squad',
    price: 4999, // $49.99/month in cents
    stripePriceId: process.env.STRIPE_PRICE_ID_SQUAD || 'price_squad',
    features: [
      'Everything in Pro',
      'Unlimited members',
      'Team management',
      'Advanced reporting',
      'API access',
      'Dedicated support',
      'SSO integration',
    ],
  },
  teams: {
    id: 'teams',
    name: 'Teams',
    price: 9999, // $99.99/month in cents
    stripePriceId: process.env.STRIPE_PRICE_ID_TEAMS || 'price_teams',
    features: [
      'Everything in Squad',
      'Unlimited everything',
      'Custom integrations',
      'Advanced permissions',
      'White label option',
      '24/7 dedicated support',
      'SLA guarantee',
    ],
  },
};
