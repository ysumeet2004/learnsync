'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { CardLg } from '@/components/ui/Card';
import { useAppStore } from '@/utils/store';
import { assignmentSchema } from '@/lib/validations';

export default function AssignmentCreationForm() {
  const router = useRouter();
  const params = useParams();
  const squadId = params.id as string;

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    due_date: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const addNotification = useAppStore((s) => s.addNotification);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Validate
    try {
      assignmentSchema.parse({
        squad_id: squadId,
        title: formData.title,
        description: formData.description,
        due_date: formData.due_date ? new Date(formData.due_date).toISOString() : undefined,
      });
      setErrors({});
    } catch (err: any) {
      const newErrors: Record<string, string> = {};
      err.errors?.forEach((e: any) => {
        newErrors[e.path[0]] = e.message;
      });
      setErrors(newErrors);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/squads/${squadId}/assignments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          due_date: formData.due_date ? new Date(formData.due_date).toISOString() : null,
        }),
      });

      const { data, error } = await response.json();

      if (error) {
        addNotification(error, 'error');
        return;
      }

      addNotification('Assignment created! 🎉', 'success');
      router.push(`/squad/${squadId}/assignments/${data.id}`);
    } catch (err) {
      addNotification('Failed to create assignment', 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Title */}
      <Input
        label="Assignment Title"
        value={formData.title}
        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        error={errors.title}
        placeholder="e.g., React Hooks Challenge"
        required
      />

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-2">
          Description (Optional)
        </label>
        <textarea
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          placeholder="Add assignment details, requirements, or resources..."
          className="w-full px-4 py-3 bg-bg-surface border border-border rounded-lg text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent resize-none"
          rows={6}
        />
        {errors.description && (
          <p className="text-sm text-danger mt-1">{errors.description}</p>
        )}
      </div>

      {/* Due Date */}
      <Input
        label="Due Date (Optional)"
        type="datetime-local"
        value={formData.due_date}
        onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
        error={errors.due_date}
      />

      {/* Submit */}
      <div className="flex gap-3 pt-4">
        <Button
          variant="secondary"
          type="button"
          onClick={() => router.back()}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          variant="primary"
          type="submit"
          isLoading={loading}
          className="flex-1"
        >
          Create Assignment
        </Button>
      </div>
    </form>
  );
}
