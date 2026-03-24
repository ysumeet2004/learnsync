'use client';

import { CardLg } from '@/components/ui/Card';
import AssignmentCreationForm from '@/components/forms/AssignmentCreationForm';
import { ListTodo } from 'lucide-react';

export default function NewAssignmentPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-heading font-bold text-text-primary mb-2 gap-3 flex items-center">
          <ListTodo size={32} className="text-brand" />
          Create Assignment
        </h1>
        <p className="text-lg text-text-secondary">
          Set a task for your squad to complete
        </p>
      </div>

      {/* Info Cards */}
      <div className="grid sm:grid-cols-2 gap-4 mb-8">
        <CardLg>
          <h3 className="font-bold text-text-primary mb-2">📋 Task Description</h3>
          <p className="text-sm text-text-secondary">
            Clearly describe what members need to do
          </p>
        </CardLg>
        <CardLg>
          <h3 className="font-bold text-text-primary mb-2">📅 Deadline</h3>
          <p className="text-sm text-text-secondary">
            Set a due date to keep members on track
          </p>
        </CardLg>
      </div>

      {/* Form */}
      <CardLg>
        <AssignmentCreationForm />
      </CardLg>
    </div>
  );
}
