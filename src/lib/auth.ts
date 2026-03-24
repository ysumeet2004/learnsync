import { Database } from '@/types/database';

type Plan = Database['public']['Enums']['plan_type'];
type Role = Database['public']['Enums']['role_type'];

export const PLAN_LIMITS = {
  free: {
    squads: 1,
    membersPerSquad: 3,
    coursesPerSquad: 1,
    sources: ['youtube'] as const,
    aiFeatures: false,
    whisperHours: 0,
  },
  pro: {
    squads: null,
    membersPerSquad: null,
    coursesPerSquad: null,
    sources: ['youtube', 'udemy', 'custom'] as const,
    aiFeatures: true,
    whisperHours: 5,
  },
  squad: {
    squads: null,
    membersPerSquad: null,
    coursesPerSquad: null,
    sources: ['youtube', 'udemy', 'custom'] as const,
    aiFeatures: true,
    whisperHours: 5,
  },
  teams: {
    squads: null,
    membersPerSquad: null,
    coursesPerSquad: null,
    sources: ['youtube', 'udemy', 'custom'] as const,
    aiFeatures: true,
    whisperHours: 50,
  },
};

export function checkPlan(
  plan: Plan,
  feature: keyof typeof PLAN_LIMITS[Plan]
): { allowed: boolean; requiredPlan?: Plan } {
  const limits = PLAN_LIMITS[plan];
  const value = limits[feature];

  if (feature === 'aiFeatures' || feature === 'sources') {
    // @ts-ignore - type safety handled at runtime
    return { allowed: value === true || (Array.isArray(value) && value.length > 0) };
  }

  if (value === null) {
    return { allowed: true };
  }

  return { allowed: false, requiredPlan: 'pro' };
}

export function isSuperAdmin(email: string): boolean {
  const superAdminEmails = process.env.SUPER_ADMIN_EMAILS?.split(',').map((e) =>
    e.trim()
  ) || [];
  return superAdminEmails.includes(email);
}

export function hasRole(
  userRole: Role,
  requiredRole: Role | Role[],
  isSuperAdminUser?: boolean
): boolean {
  if (isSuperAdminUser) return true;

  const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
  const roleHierarchy: Record<Role, number> = {
    learner: 0,
    lead: 1,
    instructor: 2,
  };

  const userLevel = roleHierarchy[userRole];
  const minRequired = Math.min(...roles.map((r) => roleHierarchy[r]));

  return userLevel >= minRequired;
}

export function formatDuration(seconds: number): string {
  if (!seconds) return '0s';

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const parts = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0 && !hours) parts.push(`${secs}s`);

  return parts.join(' ');
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return formatDate(d);
}
