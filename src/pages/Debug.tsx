import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';

export default function Debug() {
  const [info, setInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const { data: { user } } = await supabase.auth.getUser();
        
        let roles = null;
        let permissions = null;
        
        if (user) {
          const { data: r } = await supabase
            .from('user_roles')
            .select('*')
            .eq('user_id', user.id);
          roles = r;
          
          const { data: p } = await supabase
            .from('user_module_permissions')
            .select('*')
            .eq('user_id', user.id);
          permissions = p;
        }
        
        setInfo({
          timestamp: new Date().toISOString(),
          hasSession: !!session,
          user: user ? {
            id: user.id,
            email: user.email,
            emailConfirmed: user.email_confirmed_at,
            createdAt: user.created_at
          } : null,
          roles,
          permissions,
          cache: {
            roles: localStorage.getItem('dv_roles_v1'),
            permissions: localStorage.getItem('dv_permissions_v1')
          }
        });
      } catch (error) {
        console.error('Debug load error:', error);
        setInfo({ error: String(error) });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Cargando información de debug...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Debug - Estado del Sistema</h1>
      
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Información de Autenticación</h2>
        <pre className="bg-muted p-4 rounded-lg overflow-auto text-sm">
          {JSON.stringify(info, null, 2)}
        </pre>
      </Card>

      <div className="mt-6 flex gap-4">
        <button
          onClick={() => window.location.href = '/auth/login'}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          Ir a Login
        </button>
        <button
          onClick={() => {
            localStorage.clear();
            window.location.reload();
          }}
          className="px-4 py-2 bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90"
        >
          Limpiar Cache y Recargar
        </button>
      </div>
    </div>
  );
}
