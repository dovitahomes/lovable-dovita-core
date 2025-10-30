import { useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { appSignOut } from '@/lib/auth/logout';
import { useNavigate } from 'react-router-dom';

interface BootstrapGuardProps {
  children: ReactNode;
}

type BootstrapStatus = 'idle' | 'loading' | 'ready' | 'error' | 'unconfirmed';

export function BootstrapGuard({ children }: BootstrapGuardProps) {
  const [status, setStatus] = useState<BootstrapStatus>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const navigate = useNavigate();

  const runBootstrap = async () => {
    try {
      setStatus('loading');
      setErrorMsg(null);
      console.info('[BootstrapGuard] Starting...');

      // ✅ CACHE-FIRST: Check localStorage before making RPC
      const cachedRoles = localStorage.getItem('dv_roles_v1');
      const cachedPerms = localStorage.getItem('dv_permissions_v1');

      if (cachedRoles && cachedPerms) {
        try {
          const roles = JSON.parse(cachedRoles);
          const perms = JSON.parse(cachedPerms);
          
          if (roles.length > 0 && perms.length > 0) {
            console.info('[BootstrapGuard] ✅ Cache hit - skipping RPC');
            console.info(`[BootstrapGuard] Loaded from cache: roles=${JSON.stringify(roles)}, modules=${perms.length}`);
            setStatus('ready');
            setRetryCount(0);
            return; // ⚠️ Skip RPC if valid cache exists
          }
        } catch (err) {
          console.warn('[BootstrapGuard] Cache corrupto, limpiando...', err);
          localStorage.removeItem('dv_roles_v1');
          localStorage.removeItem('dv_permissions_v1');
        }
      }

      // If we reach here, NO valid cache → run bootstrap
      console.info('[BootstrapGuard] Cache miss → ejecutando bootstrap RPC');

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('No user found');
      }

      console.info(`[BootstrapGuard] Bootstrapping user: ${user.email}`);

      // Single attempt - if it fails, user clicks "Retry"
      const { error: bootstrapErr } = await supabase.rpc('bootstrap_user_access', { 
        target_user_id: user.id 
      });

      if (bootstrapErr) {
        // Check for unconfirmed email
        if (bootstrapErr.message?.includes('Email no confirmado')) {
          console.warn('[BootstrapGuard] Email no confirmado');
          setStatus('unconfirmed');
          navigate('/auth/login?status=unconfirmed');
          return;
        }
        throw bootstrapErr;
      }

      console.info('[BootstrapGuard] ✓ bootstrap_user_access');

      // Cargar roles y permisos
      const { data: roles, error: rolesErr } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      if (rolesErr) throw rolesErr;

      const { data: permissions, error: permsErr } = await supabase
        .from('user_module_permissions')
        .select('*')
        .eq('user_id', user.id);

      if (permsErr) throw permsErr;

      console.info(`[BootstrapGuard] ✅ Bootstrap complete - roles=${JSON.stringify(roles?.map(r => r.role))}, modules=${permissions?.length}`);
      
      // Persistir a localStorage
      try {
        localStorage.setItem('dv_roles_v1', JSON.stringify(roles?.map(r => r.role) || []));
        localStorage.setItem('dv_permissions_v1', JSON.stringify(permissions || []));
      } catch (err) {
        console.warn('[BootstrapGuard] Could not persist to localStorage:', err);
      }

      setStatus('ready');
      setRetryCount(0);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      console.error('[BootstrapGuard] ❌ Bootstrap failed:', msg);
      setErrorMsg(msg);
      setStatus('error');
    }
  };

  useEffect(() => {
    runBootstrap();
    
    // Timeout de 15s - suficiente incluso para conexiones lentas
    const timeout = setTimeout(async () => {
      if (status === 'loading') {
        console.error('[BootstrapGuard] TIMEOUT después de 15s');
        
        // Log debug info
        const { data: { user } } = await supabase.auth.getUser();
        console.error('[BootstrapGuard] Estado:', { 
          user: user?.email,
          cachedRoles: localStorage.getItem('dv_roles_v1'),
          cachedPerms: localStorage.getItem('dv_permissions_v1')
        });

        setErrorMsg(`El sistema no respondió a tiempo (15s).

Posibles causas:
• Conexión lenta
• Error en Supabase
• Configuración de permisos incorrecta

Intenta de nuevo o contacta al administrador.`);
        setStatus('error');
      }
    }, 15000);

    return () => clearTimeout(timeout);
  }, [retryCount]);

  if (status === 'loading' || status === 'idle') {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Configurando tu cuenta...</p>
      </div>
    );
  }

  if (status === 'unconfirmed') {
    return null; // Ya redirigió a /auth/login?status=unconfirmed
  }

  if (status === 'error') {
    return (
      <div className="flex items-center justify-center h-screen p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error al inicializar</AlertTitle>
          <AlertDescription className="space-y-3">
            <p>{errorMsg || 'No se pudo completar la configuración inicial'}</p>
            <div className="flex gap-2">
              <Button 
                onClick={() => {
                  setRetryCount(prev => prev + 1);
                }} 
                variant="outline" 
                size="sm"
              >
                Reintentar
              </Button>
              <Button onClick={appSignOut} variant="outline" size="sm">
                Cerrar Sesión
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // status === 'ready'
  return <>{children}</>;
}
