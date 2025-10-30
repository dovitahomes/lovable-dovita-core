import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { LogIn, Mail } from "lucide-react";
import { z } from "zod";
import { bootstrapUser } from "@/lib/auth/bootstrapUser";
import { waitForSession } from "@/lib/authClient";

const loginSchema = z.object({
  email: z.string().email("Correo inválido"),
  password: z.string().min(1, "La contraseña es requerida"),
});

const Login = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isMagicLink, setIsMagicLink] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // Check user role and redirect accordingly
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user.id)
          .maybeSingle();
        
        const role = roleData?.role;
        
        // Redirect clients to their portal
        if (role === 'cliente') {
          navigate("/client/home", { replace: true });
        } else {
          navigate("/", { replace: true });
        }
      }
    };
    checkUser();
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      loginSchema.parse({ email, password });
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
        return;
      }
    }

    setIsLoading(true);

    try {
      console.log('[auth] 🔐 Attempting login...');
      
      // Step 1: Authentication
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;
      console.log('[auth] ✓ Authentication successful');

      // Step 2: Wait for session (non-blocking timeout)
      const session = await waitForSession({ timeoutMs: 20000 });
      if (!session) {
        console.warn('[auth] ⚠️ Session not ready, redirecting anyway');
      }

      // Step 3: Bootstrap user (BLOCKING - wait for completion)
      console.log('[auth] 🔧 Bootstrapping user...');
      const bootstrapResult = await bootstrapUser({ maxRetries: 3 });

      if (!bootstrapResult.ok) {
        console.error('[auth] ❌ Bootstrap failed:', bootstrapResult.reason);
        toast.error('Error al configurar tu cuenta. Contacta al administrador.');
        setIsLoading(false);
        return;
      }

      console.log('[auth] ✅ Bootstrap complete');
      const roles = bootstrapResult.roles.map(r => r.role);
      toast.success('Inicio de sesión exitoso');

      // Pure clients go to portal
      if (roles.includes('cliente')) {
        console.log('[auth] → Redirecting to client portal');
        navigate("/client/home", { replace: true });
      } else {
        console.log('[auth] → Redirecting to dashboard');
        navigate("/", { replace: true });
      }
    } catch (error: any) {
      console.error('[auth] ❌ Login error:', error);
      toast.error(error.message || "Error al iniciar sesión");
    } finally {
      setIsLoading(false);
    }
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !z.string().email().safeParse(email).success) {
      toast.error("Por favor ingresa un correo válido");
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { 
          emailRedirectTo: `${window.location.origin}/auth/callback` 
        }
      });

      if (error) throw error;

      setMagicLinkSent(true);
      toast.success("Se ha enviado un enlace de acceso a tu correo");
    } catch (error: any) {
      toast.error(error.message || "Error al enviar el enlace");
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast.error("Por favor ingresa tu correo electrónico");
      return;
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset`,
      });

      if (error) throw error;

      toast.success("Se ha enviado un enlace de recuperación a tu correo");
    } catch (error: any) {
      toast.error(error.message || "Error al enviar correo de recuperación");
    }
  };

  if (magicLinkSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="space-y-3 text-center">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-md">
              <Mail className="h-8 w-8 text-primary-foreground" />
            </div>
            <CardTitle className="text-2xl font-bold">Revisa tu correo</CardTitle>
            <CardDescription>
              Te hemos enviado un enlace de acceso a <strong>{email}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              El enlace expirará en 1 hora. Si no lo recibes, revisa tu carpeta de spam.
            </p>
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => setMagicLinkSent(false)}
            >
              Volver al inicio de sesión
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-md">
            <LogIn className="h-8 w-8 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl font-bold">Dovita CRM</CardTitle>
          <CardDescription>
            {isMagicLink ? "Ingresa tu correo para recibir un enlace de acceso" : "Ingresa a tu cuenta"}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={isMagicLink ? handleMagicLink : handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Correo Electrónico</Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@correo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {!isMagicLink && (
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Procesando..." : isMagicLink ? "Enviar enlace de acceso" : "Iniciar Sesión"}
            </Button>

            <div className="space-y-2">
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => setIsMagicLink(!isMagicLink)}
              >
                {isMagicLink ? "Usar contraseña" : "Usar enlace de acceso"}
              </Button>

              {!isMagicLink && (
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full text-muted-foreground"
                  onClick={handleForgotPassword}
                >
                  ¿Olvidaste tu contraseña?
                </Button>
              )}
            </div>

            <p className="text-center text-sm text-muted-foreground mt-4">
              El registro está cerrado. Solo usuarios invitados pueden acceder.
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
