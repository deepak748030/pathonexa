/** Indian locale helpers — currency, phones, and digit-only inputs. */

export function digitsOnly(value: string, max = 10): string {
  return String(value || '').replace(/\D/g, '').slice(0, max);
}

/** Indian mobile: exactly 10 digits starting with 6–9. */
export function isIndianMobile(value: string): boolean {
  return /^[6-9]\d{9}$/.test(digitsOnly(value, 10));
}

export function formatMobile(value: string): string {
  const d = digitsOnly(value, 10);
  if (d.length <= 5) return d;
  return `${d.slice(0, 5)} ${d.slice(5)}`;
}

export function displayMobile(value: string): string {
  const d = digitsOnly(value, 10);
  if (!d) return '—';
  if (d.length === 10) return `+91 ${d.slice(0, 5)} ${d.slice(5)}`;
  return `+91 ${d}`;
}

export function inr(amount: number | string | undefined | null): string {
  const n = Number(amount || 0);
  return `₹${n.toLocaleString('en-IN')}`;
}

export function inNum(amount: number | string | undefined | null): string {
  return Number(amount || 0).toLocaleString('en-IN');
}

export function isIndianPin(value: string): boolean {
  return /^[1-9]\d{5}$/.test(digitsOnly(value, 6));
}

export function clampAge(value: string): string {
  const d = digitsOnly(value, 3);
  if (!d) return '';
  const n = Math.min(120, parseInt(d, 10));
  return String(n);
}

export function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
}

export function firstName(full?: string | null): string {
  const n = (full || '').trim();
  return n.split(/\s+/)[0] || 'Ravi';
}

export function initials(name?: string): string {
  return (name || 'U')
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'U';
}

export function todayLabel(d = new Date()): string {
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function timeLabel(d = new Date()): string {
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

export function testTone(name?: string): 'primary' | 'green' | 'purple' | 'orange' | 'red' | 'teal' {
  const n = (name || '').toLowerCase();
  if (n.includes('cbc') || n.includes('blood count')) return 'primary';
  if (n.includes('lft') || n.includes('liver')) return 'green';
  if (n.includes('kft') || n.includes('kidney')) return 'purple';
  if (n.includes('thyroid')) return 'orange';
  if (n.includes('lipid')) return 'teal';
  if (n.includes('sugar') || n.includes('glucose')) return 'red';
  return 'primary';
}

export const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Delhi', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan',
  'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh',
  'Uttarakhand', 'West Bengal',
];

export const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
export const GENDERS = ['Male', 'Female', 'Other'] as const;
