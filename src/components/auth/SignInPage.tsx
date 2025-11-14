import React, { useState } from 'react';
import { Eye, EyeOff, Mail, Fingerprint } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Logo from '@/components/Logo';

interface SignInPageProps {
  // Content
  title?: React.ReactNode;
  description?: React.ReactNode;
  heroImageSrc?: string;
  showLogo?: boolean;
  
  // Form state
  email: string;
  password: string;
  onEmailChange: (email: string) => void;
  onPasswordChange: (password: string) => void;
  
  // Handlers
  onSignIn: (e: React.FormEvent<HTMLFormElement>) => void;
  onMagicLink: () => void;
  onBiometricLogin?: () => void;
  onResetPassword: () => void;
  
  // States
  isLoading?: boolean;
  magicLinkSent?: boolean;
  biometricSupported?: boolean;
}

const GlassInputWrapper = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-2xl border border-border bg-foreground/5 backdrop-blur-sm transition-colors focus-within:border-primary/70 focus-within:bg-primary/10">
    {children}
  </div>
);

export const SignInPage: React.FC<SignInPageProps> = ({
  title = <span className="font-light text-foreground tracking-tighter">Bienvenido</span>,
  description = "Accede a tu cuenta y continúa tu trabajo",
  heroImageSrc,
  showLogo = true,
  email,
  password,
  onEmailChange,
  onPasswordChange,
  onSignIn,
  onMagicLink,
  onBiometricLogin,
  onResetPassword,
  isLoading = false,
  magicLinkSent = false,
  biometricSupported = false,
}) => {
  const [showPassword, setShowPassword] = useState(false);

  if (magicLinkSent) {
    return (
      <div className="h-[100dvh] flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
            <Mail className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-semibold text-foreground">Revisa tu correo</h1>
          <p className="text-muted-foreground">
            Te hemos enviado un enlace mágico a <strong className="text-foreground">{email}</strong>
          </p>
          <p className="text-sm text-muted-foreground">
            Haz clic en el enlace para iniciar sesión automáticamente
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] flex flex-col md:flex-row w-[100dvw] bg-background">
      {/* Left column: sign-in form */}
      <section className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="flex flex-col gap-6">
            {showLogo && (
              <div className="animate-element animate-delay-100 mb-2">
                <Logo size="large" />
              </div>
            )}
            
            <h1 className="animate-element animate-delay-100 text-4xl md:text-5xl font-semibold leading-tight text-foreground">
              {title}
            </h1>
            <p className="animate-element animate-delay-200 text-muted-foreground">{description}</p>

            <form className="space-y-5" onSubmit={onSignIn}>
              <div className="animate-element animate-delay-300">
                <label className="text-sm font-medium text-muted-foreground">Correo electrónico</label>
                <GlassInputWrapper>
                  <input
                    name="email"
                    type="email"
                    value={email}
                    onChange={(e) => onEmailChange(e.target.value)}
                    placeholder="Ingresa tu correo"
                    className="w-full bg-transparent text-sm text-foreground p-4 rounded-2xl focus:outline-none placeholder:text-muted-foreground"
                    disabled={isLoading}
                  />
                </GlassInputWrapper>
              </div>

              <div className="animate-element animate-delay-400">
                <label className="text-sm font-medium text-muted-foreground">Contraseña</label>
                <GlassInputWrapper>
                  <div className="relative">
                    <input
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => onPasswordChange(e.target.value)}
                      placeholder="Ingresa tu contraseña"
                      className="w-full bg-transparent text-sm text-foreground p-4 pr-12 rounded-2xl focus:outline-none placeholder:text-muted-foreground"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-3 flex items-center"
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" />
                      ) : (
                        <Eye className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" />
                      )}
                    </button>
                  </div>
                </GlassInputWrapper>
              </div>

              <div className="animate-element animate-delay-500 flex items-center justify-end text-sm">
                <button
                  type="button"
                  onClick={onResetPassword}
                  className="hover:underline text-primary transition-colors"
                  disabled={isLoading}
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="animate-element animate-delay-600 w-full rounded-2xl bg-primary py-6 font-medium text-primary-foreground hover:bg-primary-hover transition-colors"
              >
                {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
              </Button>
            </form>

            <div className="animate-element animate-delay-700 relative flex items-center justify-center">
              <span className="w-full border-t border-border"></span>
              <span className="px-4 text-sm text-muted-foreground bg-background absolute">O continuar con</span>
            </div>

            <div className="space-y-3">
              <Button
                type="button"
                variant="outline"
                onClick={onMagicLink}
                disabled={isLoading || !email}
                className="animate-element animate-delay-800 w-full flex items-center justify-center gap-3 border border-border rounded-2xl py-6 hover:bg-secondary/10 transition-colors"
              >
                <Mail className="w-5 h-5" />
                Enlace Mágico
              </Button>

              {biometricSupported && onBiometricLogin && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onBiometricLogin}
                  disabled={isLoading}
                  className="animate-element animate-delay-900 w-full flex items-center justify-center gap-3 border border-border rounded-2xl py-6 hover:bg-accent/10 transition-colors"
                >
                  <Fingerprint className="w-5 h-5" />
                  Autenticación Biométrica
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Right column: hero image */}
      {heroImageSrc && (
        <section className="hidden md:block flex-1 relative p-4">
          <div
            className="animate-slide-right animate-delay-300 absolute inset-4 rounded-3xl bg-cover bg-center shadow-2xl"
            style={{ backgroundImage: `url(${heroImageSrc})` }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-background/40 rounded-3xl" />
          </div>
        </section>
      )}
    </div>
  );
};
