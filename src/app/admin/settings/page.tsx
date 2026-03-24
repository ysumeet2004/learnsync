'use client';

import { useState } from 'react';
import { Card, CardLg } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Settings, Bell, Lock, Database, Mail } from 'lucide-react';

export default function AdminSettingsPage() {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [systemNotifications, setSystemNotifications] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-bold text-text-primary mb-2">
          Admin Settings
        </h1>
        <p className="text-text-secondary">
          Configure system settings and preferences
        </p>
      </div>

      {/* Notifications */}
      <CardLg className="mb-8">
        <div className="flex items-center gap-3 mb-6">
          <Bell size={24} className="text-brand" />
          <h2 className="text-2xl font-bold text-text-primary">Notifications</h2>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-bg-base rounded-lg">
            <div>
              <p className="font-semibold text-text-primary">
                Email Notifications
              </p>
              <p className="text-sm text-text-tertiary">
                Receive email alerts for important system events
              </p>
            </div>
            <button
              onClick={() => setEmailNotifications(!emailNotifications)}
              className={`w-12 h-6 rounded-full transition-colors ${
                emailNotifications ? 'bg-brand' : 'bg-text-tertiary'
              }`}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full transition-transform ${
                  emailNotifications ? 'translate-x-6' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-4 bg-bg-base rounded-lg">
            <div>
              <p className="font-semibold text-text-primary">
                System Notifications
              </p>
              <p className="text-sm text-text-tertiary">
                Receive in-app notifications for system events
              </p>
            </div>
            <button
              onClick={() => setSystemNotifications(!systemNotifications)}
              className={`w-12 h-6 rounded-full transition-colors ${
                systemNotifications ? 'bg-brand' : 'bg-text-tertiary'
              }`}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full transition-transform ${
                  systemNotifications ? 'translate-x-6' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>
        </div>
      </CardLg>

      {/* System Status */}
      <CardLg className="mb-8">
        <div className="flex items-center gap-3 mb-6">
          <Database size={24} className="text-brand" />
          <h2 className="text-2xl font-bold text-text-primary">System Status</h2>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-bg-base rounded-lg">
            <div>
              <p className="font-semibold text-text-primary">
                Maintenance Mode
              </p>
              <p className="text-sm text-text-tertiary">
                Take the system offline for maintenance
              </p>
            </div>
            <button
              onClick={() => setMaintenanceMode(!maintenanceMode)}
              className={`w-12 h-6 rounded-full transition-colors ${
                maintenanceMode ? 'bg-danger' : 'bg-text-tertiary'
              }`}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full transition-transform ${
                  maintenanceMode ? 'translate-x-6' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          <div className="p-4 bg-success/10 border border-success/20 rounded-lg">
            <p className="text-sm text-success font-semibold">
              ✓ All systems operational
            </p>
          </div>
        </div>
      </CardLg>

      {/* Email Configuration */}
      <CardLg className="mb-8">
        <div className="flex items-center gap-3 mb-6">
          <Mail size={24} className="text-brand" />
          <h2 className="text-2xl font-bold text-text-primary">
            Email Configuration
          </h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-text-primary mb-2">
              From Email Address
            </label>
            <input
              type="email"
              placeholder="noreply@learnsync.app"
              className="w-full px-4 py-2 border border-border rounded-lg bg-bg-base text-text-primary focus:outline-none focus:border-brand"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-text-primary mb-2">
              Support Email
            </label>
            <input
              type="email"
              placeholder="support@learnsync.app"
              className="w-full px-4 py-2 border border-border rounded-lg bg-bg-base text-text-primary focus:outline-none focus:border-brand"
            />
          </div>

          <Button variant="primary" className="w-full">
            Save Email Settings
          </Button>
        </div>
      </CardLg>

      {/* Security */}
      <CardLg>
        <div className="flex items-center gap-3 mb-6">
          <Lock size={24} className="text-brand" />
          <h2 className="text-2xl font-bold text-text-primary">Security</h2>
        </div>

        <div className="space-y-4">
          <div className="p-4 bg-bg-base rounded-lg">
            <p className="font-semibold text-text-primary mb-2">2FA Status</p>
            <p className="text-sm text-text-secondary">
              Two-factor authentication is enabled for all admin accounts
            </p>
          </div>

          <div className="p-4 bg-bg-base rounded-lg">
            <p className="font-semibold text-text-primary mb-2">
              SSL Certificate
            </p>
            <p className="text-sm text-text-secondary">
              Valid until December 31, 2025
            </p>
          </div>

          <Button variant="secondary" className="w-full">
            View Security Log
          </Button>
        </div>
      </CardLg>
    </div>
  );
}
