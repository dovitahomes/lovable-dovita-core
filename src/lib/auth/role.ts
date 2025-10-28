import { Session } from '@supabase/supabase-js';

export function isClient(role: string | null): boolean {
  return role === 'cliente';
}

export function isStaff(role: string | null): boolean {
  return ['admin', 'user', 'colaborador', 'contador'].includes(role || '');
}

export function isAdmin(role: string | null): boolean {
  return role === 'admin';
}

export function getEffectiveClientMode(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('dovita_view_as_client') === '1';
}

export function setClientViewMode(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  if (enabled) {
    localStorage.setItem('dovita_view_as_client', '1');
  } else {
    localStorage.removeItem('dovita_view_as_client');
  }
}

export function shouldUseClientShell(role: string | null): boolean {
  return isClient(role) || getEffectiveClientMode();
}
