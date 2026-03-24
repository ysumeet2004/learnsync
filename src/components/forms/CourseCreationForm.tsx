'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAppStore } from '@/utils/store';
import { courseSchema } from '@/lib/validations';
import { AlertCircle, Link as LinkIcon } from 'lucide-react';

export default function CourseCreationForm() {
  const router = useRouter();
  const params = useParams();
  const squadId = params.id as string;

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    source: 'youtube' as const,
    source_url: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const addNotification = useAppStore((s) => s.addNotification);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Validate
    try {
      courseSchema.parse(formData);
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
      const response = await fetch(`/api/squads/${squadId}/courses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const { data, error } = await response.json();

      if (error) {
        addNotification(error, 'error');
        return;
      }

      addNotification('Course added successfully! 🎉', 'success');
      router.push(`/squad/${squadId}`);
    } catch (err) {
      addNotification('Failed to create course', 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Title */}
      <Input
        label="Course Title"
        value={formData.title}
        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        error={errors.title}
        placeholder="e.g., Advanced React Patterns"
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
          placeholder="What will learners cover in this course?"
          className="w-full px-4 py-3 bg-bg-surface border border-border rounded-lg text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent resize-none"
          rows={4}
        />
      </div>

      {/* Source Selection */}
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-3">
          Source Type
        </label>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setFormData({ ...formData, source: 'youtube' })}
            className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
              formData.source === 'youtube'
                ? 'border-brand bg-brand/5'
                : 'border-border hover:border-text-tertiary'
            }`}
          >
            <p className="font-medium text-text-primary">🎬 YouTube</p>
            <p className="text-xs text-text-tertiary">Playlist or Channel</p>
          </button>
          <button
            type="button"
            onClick={() => setFormData({ ...formData, source: 'custom' })}
            disabled
            className="flex-1 px-4 py-3 rounded-lg border-2 border-border opacity-50 cursor-not-allowed"
          >
            <p className="font-medium text-text-primary">🔗 Custom URL</p>
            <p className="text-xs text-text-tertiary">Coming Soon</p>
          </button>
        </div>
      </div>

      {/* Source URL */}
      <Input
        label={
          formData.source === 'youtube'
            ? 'YouTube Playlist URL'
            : 'Course URL'
        }
        value={formData.source_url}
        onChange={(e) =>
          setFormData({ ...formData, source_url: e.target.value })
        }
        error={errors.source_url}
        placeholder="https://www.youtube.com/playlist?list=..."
        icon={LinkIcon}
      />

      {/* Info Box */}
      {formData.source === 'youtube' && (
        <Card className="p-4 bg-info/5 border-info/20">
          <div className="flex gap-3">
            <AlertCircle size={20} className="text-info flex-shrink-0 mt-0.5" />
            <div className="text-sm text-text-secondary">
              <p className="font-medium mb-1">How to get your YouTube Playlist URL:</p>
              <ol className="space-y-1 list-decimal list-inside">
                <li>Go to your YouTube Channel</li>
                <li>Click on a playlist</li>
                <li>Copy the URL from your browser address bar</li>
              </ol>
            </div>
          </div>
        </Card>
      )}

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
          Add Course
        </Button>
      </div>
    </form>
  );
}
