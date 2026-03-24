'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase-client';
import { useRequireAuth } from '@/utils/hooks';
import { Card, CardLg, Badge } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { useAppStore } from '@/utils/store';
import {
  ChevronLeft,
  Check,
  Settings,
  Loader,
  AlertCircle,
  CreditCard,
} from 'lucide-react';

interface Plan {
  id: string;
  name: string;
  price: number;
  features: string[];
  stripePriceId: string | null;
}

const PLANS: Record<string, Plan> = {
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
    price: 1999,
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO,
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
    price: 4999,
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_SQUAD,
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
    price: 9999,
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_TEAMS,
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

export default function BillingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useRequireAuth();

  const supabase = createClient();
  const addNotification = useAppStore((s) => s.addNotification);

  const [currentPlan, setCurrentPlan] = useState<string>('free');
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    if (!user) return;

    async function loadPlan() {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('plan')
          .eq('id', user.id)
          .single();

        if (profile) {
          setCurrentPlan(profile.plan || 'free');
        }

        setLoading(false);

        // Handle checkout success/cancel
        const success = searchParams.get('success');
        const canceled = searchParams.get('canceled');

        if (success) {
          addNotification(
            'Welcome to your new plan! Check your email for confirmation.',
            'success'
          );
        }
        if (canceled) {
          addNotification('Checkout canceled. No charges were made.', 'default');
        }
      } catch (err) {
        console.error('Failed to load plan:', err);
        addNotification('Failed to load billing information', 'error');
        setLoading(false);
      }
    }

    loadPlan();
  }, [user, supabase, addNotification, searchParams]);

  async function handleUpgrade(planId: string) {
    setCheckoutLoading(planId);

    try {
      const response = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId }),
      });

      const { data, error } = await response.json();

      if (error) {
        addNotification(error, 'error');
        return;
      }

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        addNotification('Plan updated successfully', 'success');
        window.location.reload();
      }
    } catch (err) {
      addNotification('Failed to process upgrade', 'error');
    } finally {
      setCheckoutLoading(null);
    }
  }

  async function handleOpenBillingPortal() {
    setPortalLoading(true);

    try {
      const response = await fetch('/api/billing/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const { data, error } = await response.json();

      if (error) {
        addNotification(error, 'error');
        return;
      }

      if (data.portalUrl) {
        window.location.href = data.portalUrl;
      }
    } catch (err) {
      addNotification('Failed to access billing portal', 'error');
    } finally {
      setPortalLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-2 text-text-secondary">
          <Loader className="w-5 h-5 animate-spin" />
          <span>Loading billing information...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <Button
        variant="secondary"
        size="sm"
        onClick={() => router.back()}
        className="gap-2 mb-8"
      >
        <ChevronLeft size={18} />
        Back
      </Button>

      <div className="mb-12">
        <div className="flex items-center gap-3 mb-2">
          <CreditCard size={32} className="text-brand" />
          <h1 className="text-4xl font-heading font-bold text-text-primary">
            Billing & Plans
          </h1>
        </div>
        <p className="text-text-secondary">
          Choose the perfect plan for your learning needs
        </p>
      </div>

      {/* Current Plan Alert */}
      {currentPlan !== 'free' && (
        <CardLg className="mb-8 bg-success/10 border-success/20">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <Check size={24} className="text-success flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-text-primary mb-1">
                  You're on the {PLANS[currentPlan]?.name} plan
                </h3>
                <p className="text-sm text-text-secondary">
                  Your subscription is active and all features are available.
                </p>
              </div>
            </div>
            {currentPlan !== 'free' && (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleOpenBillingPortal}
                isLoading={portalLoading}
                className="gap-2 flex-shrink-0"
              >
                <Settings size={16} />
                Manage Billing
              </Button>
            )}
          </div>
        </CardLg>
      )}

      {/* Pricing Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {Object.values(PLANS).map((plan) => {
          const isCurrentPlan = currentPlan === plan.id;
          const isPriceHigher = ['squad', 'teams'].includes(plan.id);
          const canDowngrade =
            ['free', 'pro'].includes(plan.id) &&
            ['squad', 'teams'].includes(currentPlan);

          return (
            <Card
              key={plan.id}
              className={`p-6 flex flex-col transition-all ${
                isCurrentPlan
                  ? 'ring-2 ring-brand bg-brand/5'
                  : 'hover:shadow-lg'
              }`}
            >
              {isCurrentPlan && (
                <Badge variant="brand" className="mb-3 w-fit">
                  Current Plan
                </Badge>
              )}

              <h3 className="text-xl font-bold text-text-primary mb-2">
                {plan.name}
              </h3>

              {plan.price > 0 ? (
                <div className="mb-6">
                  <span className="text-4xl font-bold text-text-primary">
                    ${(plan.price / 100).toFixed(2)}
                  </span>
                  <span className="text-text-secondary">/month</span>
                </div>
              ) : (
                <div className="mb-6">
                  <span className="text-4xl font-bold text-text-primary">
                    Free
                  </span>
                </div>
              )}

              {/* Features */}
              <ul className="flex-1 space-y-3 mb-6">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm">
                    <Check
                      size={16}
                      className="text-success flex-shrink-0 mt-0.5"
                    />
                    <span className="text-text-secondary">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* Action Button */}
              {isCurrentPlan ? (
                <Button variant="secondary" className="w-full" disabled>
                  Current Plan
                </Button>
              ) : (
                <Button
                  variant={isPriceHigher ? 'primary' : 'secondary'}
                  className="w-full"
                  onClick={() => handleUpgrade(plan.id)}
                  isLoading={checkoutLoading === plan.id}
                  disabled={canDowngrade}
                >
                  {canDowngrade ? 'Contact Support' : 'Choose Plan'}
                </Button>
              )}
            </Card>
          );
        })}
      </div>

      {/* FAQ */}
      <CardLg>
        <h2 className="text-2xl font-bold text-text-primary mb-6">
          Frequently Asked Questions
        </h2>

        <div className="space-y-6">
          <div>
            <h3 className="font-bold text-text-primary mb-2">
              Can I change my plan?
            </h3>
            <p className="text-text-secondary">
              Yes! You can upgrade or downgrade your plan at any time. Changes take
              effect immediately.
            </p>
          </div>

          <div>
            <h3 className="font-bold text-text-primary mb-2">
              Is there a free trial?
            </h3>
            <p className="text-text-secondary">
              The Free plan is always available to try. Upgrade to unlock premium
              features.
            </p>
          </div>

          <div>
            <h3 className="font-bold text-text-primary mb-2">
              What payment methods do you accept?
            </h3>
            <p className="text-text-secondary">
              We accept all major credit and debit cards through Stripe, our secure
              payment processor.
            </p>
          </div>

          <div>
            <h3 className="font-bold text-text-primary mb-2">
              Can I cancel anytime?
            </h3>
            <p className="text-text-secondary">
              Yes! Cancel your subscription anytime from your billing portal. No long-term
              commitments required.
            </p>
          </div>
        </div>
      </CardLg>
    </div>
  );
}
