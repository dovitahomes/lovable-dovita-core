import { useState, useEffect, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Lock, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface FormData {
  password: string;
  confirmPassword: string;
}

const SetupPassword = () => {
  const [formData, setFormData] = useState<FormData>({ password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Verificar si hay errores en la URL (enlace expirado/inválido)
    const params = new URLSearchParams(window.location.search);
    const urlError = params.get('error');
    const errorCode = params.get('error_code');
    const errorDescription = params.get('error_description');

    if (urlError || errorCode) {
      // Enlace expirado o inválido
      setError(
        errorCode === 'otp_expired' 
          ? 'El enlace de invitación ha expirado o ya fue usado. Contacta al administrador para que te envíe un nuevo enlace.'
          : decodeURIComponent(errorDescription || 'Error al procesar la invitación')
      );
      return;
    }

    // Si no hay errores, verificar sesión
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth/login', { replace: true });
      }
    };
    checkSession();
  }, [navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (formData.password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No hay sesión activa');
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: formData.password
      });

      if (updateError) throw updateError;

      // Limpiar flag de needs_password_setup
      await supabase
        .from('user_metadata')
        .update({ needs_password_setup: false })
        .eq('user_id', session.user.id);

      toast.success('Contraseña establecida exitosamente');
      setTimeout(() => navigate('/auth/login', { replace: true }), 1500);
    } catch (err: any) {
      setError(err.message || 'Error al establecer contraseña');
    } finally {
      setLoading(false);
    }
  };

  // Si hay error de enlace expirado, mostrar UI especial
  if (error && (error.includes('expirado') || error.includes('expired'))) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="space-y-3 text-center">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center shadow-md">
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
            <CardTitle className="text-2xl font-bold">Enlace de invitación expirado</CardTitle>
            <CardDescription>
              El enlace de invitación ha expirado o ya fue utilizado.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            
            <div className="text-sm text-muted-foreground space-y-2">
              <p className="font-medium">Para continuar:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Contacta al administrador para que te reenvíe la invitación</li>
                <li>Si ya estableciste tu contraseña, puedes iniciar sesión normalmente</li>
              </ul>
            </div>
          </CardContent>
          
          <CardFooter>
            <Button variant="outline" className="w-full" onClick={() => navigate('/auth/login')}>
              Ir a inicio de sesión
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-md">
            <Lock className="h-8 w-8 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl font-bold">Crear tu contraseña</CardTitle>
          <CardDescription>
            Bienvenido a Dovita. Por favor crea tu contraseña para acceder al sistema.
          </CardDescription>
        </CardHeader>
        
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Mínimo 8 caracteres"
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                placeholder="Repite la contraseña"
                required
                disabled={loading}
              />
            </div>
          </CardContent>
          
          <CardFooter>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                'Crear contraseña'
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default SetupPassword;
