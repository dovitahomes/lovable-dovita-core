import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";
import { bootstrapUserAfterLogin } from "@/lib/auth/bootstrap";
import { isWebAuthnSupported, authenticateWithBiometric } from "@/lib/webauthn";
import { SignInPage } from "@/components/auth/SignInPage";
import { useActiveAuthHeroImage } from "@/hooks/useAuthHeroImage";
import { getSignedUrl } from "@/lib/storage-helpers";

const loginSchema = z.object({
  email: z.string().email("Correo inválido"),
  password: z.string().min(1, "La contraseña es requerida"),
});

const Login = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [heroImageUrl, setHeroImageUrl] = useState<string>("");

  const biometricSupported = isWebAuthnSupported();
  const { data: activeImage } = useActiveAuthHeroImage();

  // Generar signed URL cuando hay imagen activa
  useEffect(() => {
    if (activeImage?.image_path) {
      getSignedUrl({
        bucket: 'auth-hero-images',
        path: activeImage.image_path,
        expiresInSeconds: 3600,
      }).then(({ url }) => {
        setHeroImageUrl(url);
      });
    } else {
      // Fallback a imagen por defecto
      setHeroImageUrl("https://images.unsplash.com/photo-1497366216548-37526070297c?w=2160&q=80");
    }
  }, [activeImage]);

  const handleBiometricLogin = async () => {
    setIsLoading(true);
    try {
      console.log('[biometric-login] Starting local biometric authentication...');
      
      // Step 1: Local biometric authentication (WebAuthn)
      const result = await authenticateWithBiometric();
      
      if (!result.success || !result.userId || !result.credentialId) {
        throw new Error('Autenticación biométrica cancelada o fallida');
      }

      console.log('[biometric-login] Local auth successful, calling edge function...');

      // Step 2: Call edge function to verify credential and get session token
      const { data, error: fnError } = await supabase.functions.invoke('biometric-login', {
        body: { 
          userId: result.userId, 
          credentialId: result.credentialId,
        },
      });

      if (fnError) {
        console.error('[biometric-login] Edge function error:', fnError);
        throw new Error(fnError.message || 'Error al verificar credenciales');
      }

      if (!data?.token || !data?.email) {
        console.error('[biometric-login] Invalid response from edge function:', data);
        throw new Error('Respuesta inválida del servidor');
      }

      console.log('[biometric-login] Got token, verifying OTP...');

      // Step 3: Verify the magic link token to create session
      const { error: otpError } = await supabase.auth.verifyOtp({
        token_hash: data.token,
        type: 'magiclink',
      });

      if (otpError) {
        console.error('[biometric-login] OTP verification error:', otpError);
        throw new Error('Error al crear sesión: ' + otpError.message);
      }

      console.log('[biometric-login] Session created, calling bootstrap...');

      // Step 4: Bootstrap user
      const bootstrapOk = await bootstrapUserAfterLogin();
      if (!bootstrapOk) {
        console.warn('[biometric-login] Bootstrap falló, pero permitir navegación');
      }

      // Invalidar cache de permisos
      const { queryClient } = await import('@/lib/queryConfig');
      await queryClient.invalidateQueries({ queryKey: ['user-module-permissions'] });
      await new Promise(resolve => setTimeout(resolve, 300));

      toast.success('Inicio de sesión exitoso');
      navigate('/', { replace: true });
    } catch (error: any) {
      console.error('[biometric-login] Error:', error);
      toast.error(error.message || 'Error al iniciar sesión con biométricos');
    } finally {
      setIsLoading(false);
    }
  };

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
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;
      
      // 🆕 LLAMAR BOOTSTRAP
      console.log('[login] Calling bootstrap...');
      const bootstrapOk = await bootstrapUserAfterLogin();
      if (!bootstrapOk) {
        console.warn('[login] Bootstrap falló, pero permitir navegación');
      }
      
      // Invalidar cache de permisos para forzar refetch
      const { queryClient } = await import('@/lib/queryConfig');
      console.log('[login] Invalidating permissions cache...');
      await queryClient.invalidateQueries({ queryKey: ['user-module-permissions'] });
      
      // Esperar 300ms para que las queries se refresquen
      await new Promise(resolve => setTimeout(resolve, 300));
      
      console.log('[login] ✅ Login complete, navigating to dashboard');
      toast.success('Inicio de sesión exitoso');
      navigate('/', { replace: true });
    } catch (error: any) {
      console.error('[auth] Login error:', error);
      toast.error(error.message || "Error al iniciar sesión");
    } finally {
      setIsLoading(false);
    }
  };

  const handleMagicLink = async () => {
    if (!email) {
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

  return (
    <SignInPage
      title={
        <span className="font-light text-foreground tracking-tighter">
          Bienvenido a <span className="font-semibold text-primary">Dovita</span>
        </span>
      }
      description="Accede a tu cuenta y gestiona tus proyectos"
      heroImageSrc={heroImageUrl || undefined}
      showLogo={true}
      email={email}
      password={password}
      onEmailChange={setEmail}
      onPasswordChange={setPassword}
      onSignIn={handleLogin}
      onMagicLink={handleMagicLink}
      onBiometricLogin={biometricSupported ? handleBiometricLogin : undefined}
      onResetPassword={handleForgotPassword}
      isLoading={isLoading}
      magicLinkSent={magicLinkSent}
      biometricSupported={biometricSupported}
    />
  );
};

export default Login;
