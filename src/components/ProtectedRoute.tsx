// This file is kept for backward compatibility
// New code should use RequireAuth from @/routes/guards
import { RequireAuth } from '@/routes/guards';
import { ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  return <RequireAuth>{children}</RequireAuth>;
}
