/**
 * Role based access control.
 *
 * The spec defines Super Admin / Lab Owner / Manager / Receptionist /
 * Technician. The backend returns the signed-in user's permissions on login;
 * this module mirrors the matrix locally so the UI can hide what a role may
 * not touch even before the first API round trip.
 */
import { useAuth } from './auth';

export const PERMISSIONS = [
  'dashboard', 'patients', 'reports', 'reportValues', 'payments', 'expenses',
  'doctors', 'commissions', 'tests', 'staff', 'analytics', 'settings',
  'backup', 'subscription', 'labs',
] as const;

export type Permission = (typeof PERMISSIONS)[number];

export const ROLES: { name: string; description: string; permissions: Permission[] }[] = [
  {
    name: 'Super Admin',
    description: 'Manages all labs, subscriptions, templates and platform revenue.',
    permissions: [...PERMISSIONS],
  },
  {
    name: 'Lab Owner',
    description: 'Full access to this lab.',
    permissions: PERMISSIONS.filter((p) => p !== 'labs') as Permission[],
  },
  {
    name: 'Manager',
    description: 'Everything except subscription and backup.',
    permissions: ['dashboard', 'patients', 'reports', 'reportValues', 'payments', 'expenses', 'doctors', 'commissions', 'tests', 'staff', 'analytics'],
  },
  {
    name: 'Receptionist',
    description: 'Patient registration, payment entry and receipt print.',
    permissions: ['dashboard', 'patients', 'reports', 'payments'],
  },
  {
    name: 'Technician',
    description: 'Fill report values, edit report and generate PDF.',
    permissions: ['dashboard', 'reports', 'reportValues'],
  },
];

export const ROLE_NAMES = ROLES.map((r) => r.name);

export function permissionsForRole(role?: string | null): Permission[] {
  const found = ROLES.find((r) => r.name.toLowerCase() === String(role || '').toLowerCase());
  return found ? found.permissions : ROLES[1].permissions;
}

/** Permission check for the signed-in user (defaults to Lab Owner offline). */
export function useCan(): (p: Permission) => boolean {
  const user = useAuth((s) => s.user);
  const granted: string[] = (user as any)?.permissions?.length
    ? (user as any).permissions
    : permissionsForRole(user?.role);
  return (p: Permission) => granted.includes(p);
}

export function useRole(): string {
  const user = useAuth((s) => s.user);
  return user?.role || 'Lab Owner';
}
