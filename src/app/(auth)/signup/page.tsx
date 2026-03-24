'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-client';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { signupSchema } from '@/lib/validations';
import { Mail, Lock, User } from 'lucide-react';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    try {
      const validatedData = signupSchema.parse({
        email,
        password,
        username,
        displayName: displayName || undefined,
      });

      const { error: signupError, data } = await supabase.auth.signUp({
        email: validatedData.email,
        password: validatedData.password,
        options: {
          data: {
            username: validatedData.username,
            display_name: validatedData.displayName || validatedData.email.split('@')[0],
          },
        },
      });

      if (signupError) {
        setErrors({ form: signupError.message });
        return;
      }

      if (data.user) {
        // Try to sign in immediately
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: validatedData.email,
          password: validatedData.password,
        });

        if (!signInError) {
          router.push('/dashboard');
        } else {
          // Sign up successful but sign in failed - ask user to log in
          setErrors({
            form: 'Account created! Please check your email or log in.',
          });
          setTimeout(() => router.push('/login'), 2000);
        }
      }
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

  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-heading font-bold text-text-primary mb-2">
            Join LearnSync
          </h1>
          <p className="text-text-secondary">Start learning with your squad</p>
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
              type="text"
              placeholder="Username"
              icon={<User size={18} />}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              error={errors.username}
              disabled={loading}
              helperText="3-30 characters, letters/numbers/dashes only"
            />

            <Input
              type="text"
              placeholder="Display name (optional)"
              icon={<User size={18} />}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              error={errors.displayName}
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
              helperText="At least 6 characters"
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
              Create Account
            </Button>
          </form>

          <div className="text-center text-sm">
            <span className="text-text-secondary">Already have an account? </span>
            <Link href="/login" className="text-brand hover:text-brand-light font-semibold">
              Sign in
            </Link>
          </div>
        </Card>

        <p className="text-center text-text-tertiary text-xs mt-4">
          By signing up, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}
