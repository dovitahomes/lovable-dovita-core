import { Navigate } from "react-router-dom";
import { useAuthState } from "@/lib/auth/AuthContext";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

const ProtectedRoute = ({ children, requireAdmin = false }: ProtectedRouteProps) => {
  const { status } = useAuthState();

  if (status === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-center">
        <Loader2 className="w-6 h-6 animate-spin mb-3 text-primary" />
        <p className="text-sm text-muted-foreground">Verificando sesión…</p>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return <Navigate to="/auth/login" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
