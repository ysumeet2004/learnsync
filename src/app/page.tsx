'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/utils/hooks';
import Button from '@/components/ui/Button';
import { ArrowRight, Play, BarChart3, Users, Zap, BookOpen, Brain } from 'lucide-react';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center">
        <div className="text-text-secondary">Loading...</div>
      </div>
    );
  }

  if (user) {
    router.push('/dashboard');
    return null;
  }

  return (
    <div className="min-h-screen bg-bg-base">
      {/* Navigation */}
      <nav className="border-b border-border sticky top-0 z-50 bg-bg-base/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="text-2xl font-heading font-bold text-brand">LearnSync</div>
          <div className="flex gap-4">
            <Link href="/login">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/signup">
              <Button variant="primary">Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-32">
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-block mb-6 px-3 py-1 bg-brand/10 border border-brand rounded-full">
            <span className="text-sm text-brand font-semibold">✨ Learn Together</span>
          </div>
          
          <h1 className="text-5xl sm:text-6xl font-heading font-bold text-text-primary mb-6">
            Master Any Video Course
            <span className="block text-brand mt-2">With Your Squad</span>
          </h1>
          
          <p className="text-xl text-text-secondary mb-8 leading-relaxed">
            Learn from YouTube playlists, Udemy courses, and custom videos together. 
            Auto-tracked progress, real-time analytics, and AI-powered learning tools.
          </p>

          <div className="flex gap-4 justify-center">
            <Link href="/signup">
              <Button variant="primary" size="lg" className="gap-2">
                Start Learning Free
                <ArrowRight size={20} />
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="secondary" size="lg">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-bg-surface border-y border-border py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-heading font-bold text-text-primary mb-4">
              Everything You Need
            </h2>
            <p className="text-text-secondary text-lg">
              Built for group learning with the features that matter
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Play,
                title: 'Auto-Tracked Progress',
                description: 'Never manually mark progress again. We track every second watched automatically.',
              },
              {
                icon: Users,
                title: 'Squad Learning',
                description: 'Create squads and invite friends, colleagues, or entire cohorts to learn together.',
              },
              {
                icon: BarChart3,
                title: 'Real-Time Analytics',
                description: 'See who\'s ahead, who needs help, and celebrate group milestones together.',
              },
              {
                icon: BookOpen,
                title: 'Distraction-Free Player',
                description: 'Clean, focused video player with no ads or recommendations. Just learning.',
              },
              {
                icon: Brain,
                title: 'AI-Powered Learning',
                description: 'Auto-generated quizzes, weekly digests, and smart learning recommendations.',
              },
              {
                icon: Zap,
                title: 'Notes & Social',
                description: 'Timestamped notes, group assignments, and live activity feeds.',
              },
            ].map((feature, i) => {
              const Icon = feature.icon;
              return (
                <div key={i} className="bg-bg-base border border-border rounded-xl p-6 hover:border-border-strong hover:bg-bg-elevated transition-all">
                  <Icon className="w-8 h-8 text-brand mb-4" />
                  <h3 className="text-lg font-semibold text-text-primary mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-text-secondary">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-heading font-bold text-text-primary mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-text-secondary text-lg">
              Start free. Upgrade when you need more
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {[
              {
                name: 'Free',
                price: '$0',
                features: ['1 Squad', '3 Members', '1 Course', 'YouTube only'],
              },
              {
                name: 'Pro',
                price: '$8/mo',
                features: ['Unlimited Squads', 'All Members', 'All Courses', 'All Sources', 'Full Analytics'],
              },
              {
                name: 'Squad',
                price: '$20/mo',
                features: [
                  'Everything in Pro',
                  'AI Quizzes',
                  'AI Coach',
                  '5h Transcription',
                  'Squad Control',
                ],
                highlight: true,
              },
              {
                name: 'Teams',
                price: '$299/mo',
                features: [
                  'Everything in Squad',
                  'SSO & SCIM',
                  'Advanced Reporting',
                  '50h Transcription',
                  'Priority Support',
                ],
              },
            ].map((plan, i) => (
              <div
                key={i}
                className={`border rounded-xl p-6 ${
                  plan.highlight
                    ? 'bg-brand/10 border-brand'
                    : 'border-border bg-bg-surface'
                }`}
              >
                <h3 className="text-xl font-semibold text-text-primary mb-2">{plan.name}</h3>
                <div className="mb-6">
                  <span className="text-3xl font-bold text-text-primary">{plan.price}</span>
                </div>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, j) => (
                    <li key={j} className="text-text-secondary text-sm flex items-start gap-2">
                      <span className="text-brand mt-1">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button variant={plan.highlight ? 'primary' : 'secondary'} className="w-full">
                  Get Started
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-brand/10 border-y border-brand py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-heading font-bold text-text-primary mb-6">
            Ready to Learn Together?
          </h2>
          <p className="text-xl text-text-secondary mb-8">
            Create your first squad in seconds. No credit card required.
          </p>
          <Link href="/signup">
            <Button variant="primary" size="lg" className="gap-2">
              Create Free Account
              <ArrowRight size={20} />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 bg-bg-surface/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="font-heading font-semibold text-text-primary mb-4">LearnSync</h4>
              <p className="text-text-secondary text-sm">
                Learn better together with your squad
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-text-primary mb-4">Product</h4>
              <ul className="space-y-2 text-text-secondary text-sm">
                <li><a href="#" className="hover:text-text-primary">Features</a></li>
                <li><a href="#" className="hover:text-text-primary">Pricing</a></li>
                <li><a href="#" className="hover:text-text-primary">Roadmap</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-text-primary mb-4">Company</h4>
              <ul className="space-y-2 text-text-secondary text-sm">
                <li><a href="#" className="hover:text-text-primary">About</a></li>
                <li><a href="#" className="hover:text-text-primary">Blog</a></li>
                <li><a href="#" className="hover:text-text-primary">Careers</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-text-primary mb-4">Legal</h4>
              <ul className="space-y-2 text-text-secondary text-sm">
                <li><a href="#" className="hover:text-text-primary">Privacy</a></li>
                <li><a href="#" className="hover:text-text-primary">Terms</a></li>
                <li><a href="#" className="hover:text-text-primary">Contact</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border pt-8 text-center text-text-tertiary text-sm">
            <p>&copy; 2024 LearnSync. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
