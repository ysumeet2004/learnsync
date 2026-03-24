'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-client';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { loginSchema } from '@/lib/validations';
import { Mail, Lock } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [isOAuthLoading, setIsOAuthLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    try {
      const validatedData = loginSchema.parse({ email, password });

      const { error } = await supabase.auth.signInWithPassword({
        email: validatedData.email,
        password: validatedData.password,
      });

      if (error) {
        setErrors({ form: error.message });
        return;
      }

      router.push('/dashboard');
    } catch (err: any) {
      if (err.errors) {
        const formErrors: Record<string, string> = {};
        err.errors.forEach((e: any) => {
          formErrors[e.path[0]] = e.message;
        });
        setErrors(formErrors);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    setIsOAuthLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
        },
      });

      if (error) {
        setErrors({ form: error.message });
      }
    } finally {
      setIsOAuthLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-heading font-bold text-text-primary mb-2">
            LearnSync
          </h1>
          <p className="text-text-secondary">Learn together with your squad</p>
        </div>

        <Card className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="email"
              placeholder="Email address"
              icon={<Mail size={18} />}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
              disabled={loading}
            />

            <Input
              type="password"
              placeholder="Password"
              icon={<Lock size={18} />}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errors.password}
              disabled={loading}
            />

            {errors.form && (
              <div className="p-3 bg-danger/10 border border-danger rounded-lg text-sm text-danger">
                {errors.form}
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={loading}
              className="w-full"
            >
              Sign In
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-bg-surface text-text-tertiary">Or continue with</span>
            </div>
          </div>

          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={handleGoogleSignIn}
            disabled={isOAuthLoading}
            className="w-full"
          >
            Google
          </Button>

          <div className="text-center text-sm">
            <span className="text-text-secondary">Don't have an account? </span>
            <Link href="/signup" className="text-brand hover:text-brand-light font-semibold">
              Sign up
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
