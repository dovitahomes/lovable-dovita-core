import { useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { appSignOut } from '@/lib/auth/logout';

interface BootstrapGuardProps {
  children: ReactNode;
}

type BootstrapStatus = 'idle' | 'loading' | 'ready' | 'error';

export function BootstrapGuard({ children }: BootstrapGuardProps) {
  const [status, setStatus] = useState<BootstrapStatus>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const runBootstrap = async () => {
    try {
      setStatus('loading');
      setErrorMsg(null);
      console.info('[BootstrapGuard] Starting bootstrap...');

      // 1) Ensure profile exists
      try {
        await supabase.rpc('ensure_profile');
        console.info('[BootstrapGuard] ✓ ensure_profile');
      } catch (err) {
        console.warn('[BootstrapGuard] ensure_profile failed (non-blocking):', err);
      }

      // 2) Bootstrap user access (base role + permissions)
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('No user found');
      }

      try {
        await supabase.rpc('bootstrap_user_access', { target_user_id: user.id });
        console.info('[BootstrapGuard] ✓ bootstrap_user_access');
      } catch (err) {
        console.warn('[BootstrapGuard] bootstrap_user_access failed (non-blocking):', err);
      }

      // 3) Upsert admin email to whitelist
      try {
        await supabase.from('admin_emails').upsert({ email: 'e@dovitahomes.com' }, { onConflict: 'email' });
        console.info('[BootstrapGuard] ✓ admin email whitelisted');
      } catch (err) {
        console.warn('[BootstrapGuard] admin_emails upsert failed (non-blocking):', err);
      }

      // 4) Grant admin if whitelisted
      try {
        await supabase.rpc('grant_admin_if_whitelisted');
        console.info('[BootstrapGuard] ✓ grant_admin_if_whitelisted');
      } catch (err) {
        console.warn('[BootstrapGuard] grant_admin_if_whitelisted failed (non-blocking):', err);
      }

      // 5) Load roles and permissions
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
      
      // Persist to localStorage for quick access
      try {
        localStorage.setItem('dv_roles_v1', JSON.stringify(roles?.map(r => r.role) || []));
        localStorage.setItem('dv_permissions_v1', JSON.stringify(permissions || []));
      } catch (err) {
        console.warn('[BootstrapGuard] Could not persist to localStorage:', err);
      }

      setStatus('ready');
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      console.error('[BootstrapGuard] ❌ Bootstrap failed:', msg);
      setErrorMsg(msg);
      setStatus('error');
    }
  };

  useEffect(() => {
    runBootstrap();
  }, []);

  if (status === 'loading' || status === 'idle') {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Configurando tu cuenta...</p>
      </div>
    );
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
              <Button onClick={runBootstrap} variant="outline" size="sm">
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
