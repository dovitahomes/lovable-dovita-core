import { useAuth } from '@/app/auth/AuthProvider';

export function useAuthSession() {
  return useAuth();
}
