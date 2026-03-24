'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Card, CardLg } from '@/components/ui/Card';
import { squadSchema } from '@/lib/validations';
import { useAppStore } from '@/utils/store';

export function SquadCreationForm() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const addNotification = useAppStore((s) => s.addNotification);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    try {
      const validatedData = squadSchema.parse({ name, description: description || undefined });

      const response = await fetch('/api/squads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validatedData),
      });

      const { data, error } = await response.json();

      if (error) {
        setErrors({ form: error });
        addNotification(error, 'error');
        return;
      }

      addNotification(`Squad "${data.name}" created! 🎉`, 'success');
      router.push(`/squad/${data.id}`);
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
    <Card className="max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-text-primary mb-2">
            Squad Name
          </label>
          <Input
            id="name"
            type="text"
            placeholder="e.g., React Bootcamp Cohort 2024"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={errors.name}
            disabled={loading}
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-text-primary mb-2">
            Description (optional)
          </label>
          <textarea
            id="description"
            placeholder="What's this squad learning together?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="input-base min-h-[120px] resize-none"
            disabled={loading}
          />
          {errors.description && (
            <p className="mt-1 text-sm text-danger">{errors.description}</p>
          )}
        </div>

        {errors.form && (
          <div className="p-3 bg-danger/10 border border-danger rounded-lg text-sm text-danger">
            {errors.form}
          </div>
        )}

        <div className="flex gap-3 justify-end">
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.back()}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={loading}
          >
            Create Squad
          </Button>
        </div>
      </form>
    </Card>
  );
}
