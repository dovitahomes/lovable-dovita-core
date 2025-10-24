import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { handleMagicLinkExchange } from "@/auth/handleMagicLink";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

const Callback = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const processCallback = async () => {
      try {
        await handleMagicLinkExchange();
        setStatus('success');
        
        // Redirect after a short delay
        setTimeout(() => {
          navigate("/", { replace: true });
        }, 1500);
      } catch (error: any) {
        setStatus('error');
        setErrorMessage(error.message || 'Error al procesar el enlace de acceso');
      }
    };

    processCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-md">
            {status === 'loading' && <Loader2 className="h-8 w-8 text-primary-foreground animate-spin" />}
            {status === 'success' && <CheckCircle className="h-8 w-8 text-primary-foreground" />}
            {status === 'error' && <XCircle className="h-8 w-8 text-primary-foreground" />}
          </div>
          <CardTitle className="text-2xl font-bold">
            {status === 'loading' && 'Procesando acceso...'}
            {status === 'success' && '¡Acceso exitoso!'}
            {status === 'error' && 'Error de acceso'}
          </CardTitle>
          <CardDescription>
            {status === 'loading' && 'Por favor espera mientras verificamos tu enlace'}
            {status === 'success' && 'Redirigiendo a tu panel de control...'}
            {status === 'error' && errorMessage}
          </CardDescription>
        </CardHeader>

        {status === 'error' && (
          <CardContent>
            <Button
              className="w-full"
              onClick={() => navigate("/auth/login", { replace: true })}
            >
              Volver al inicio de sesión
            </Button>
          </CardContent>
        )}
      </Card>
    </div>
  );
};

export default Callback;
