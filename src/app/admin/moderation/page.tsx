'use client';

import { Card, CardLg } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import {
  AlertTriangle,
  Flag,
  Trash2,
  CheckCircle,
  Shield,
} from 'lucide-react';

export default function ModerationPage() {
  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-bold text-text-primary mb-2">
          Moderation & Safety
        </h1>
        <p className="text-text-secondary">
          Monitor and manage reported content
        </p>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <Card className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm text-text-tertiary mb-1">Pending Reports</p>
              <p className="text-3xl font-bold text-text-primary">0</p>
            </div>
            <AlertTriangle size={24} className="text-warning opacity-20" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm text-text-tertiary mb-1">Resolved This Week</p>
              <p className="text-3xl font-bold text-text-primary">0</p>
            </div>
            <CheckCircle size={24} className="text-success opacity-20" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm text-text-tertiary mb-1">Banned Users</p>
              <p className="text-3xl font-bold text-text-primary">0</p>
            </div>
            <Shield size={24} className="text-danger opacity-20" />
          </div>
        </Card>
      </div>

      {/* Guidelines */}
      <CardLg className="mb-8">
        <h2 className="text-2xl font-bold text-text-primary mb-6">
          Community Guidelines
        </h2>

        <div className="space-y-4">
          <div className="p-4 bg-bg-base rounded-lg">
            <h3 className="font-semibold text-text-primary mb-2">
              Be Respectful
            </h3>
            <p className="text-sm text-text-secondary">
              Treat all users with respect. No harassment, hate speech, or
              discrimination.
            </p>
          </div>

          <div className="p-4 bg-bg-base rounded-lg">
            <h3 className="font-semibold text-text-primary mb-2">
              Keep Content Appropriate
            </h3>
            <p className="text-sm text-text-secondary">
              Ensure course content, assignments, and discussions are
              educational and appropriate.
            </p>
          </div>

          <div className="p-4 bg-bg-base rounded-lg">
            <h3 className="font-semibold text-text-primary mb-2">
              No Spam or Exploitation
            </h3>
            <p className="text-sm text-text-secondary">
              Do not promote external products, services, or engage in spam or
              exploitation.
            </p>
          </div>

          <div className="p-4 bg-bg-base rounded-lg">
            <h3 className="font-semibold text-text-primary mb-2">
              Respect Privacy
            </h3>
            <p className="text-sm text-text-secondary">
              Do not share personal information of other users without consent.
            </p>
          </div>
        </div>
      </CardLg>

      {/* Recent Activity */}
      <CardLg>
        <h2 className="text-2xl font-bold text-text-primary mb-6">
          Recent Moderation Activity
        </h2>

        <div className="text-center py-12 text-text-tertiary">
          <Flag size={48} className="mx-auto mb-4 opacity-20" />
          <p>No recent reports or moderation actions</p>
        </div>
      </CardLg>
    </div>
  );
}
