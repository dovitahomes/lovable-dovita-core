import { useCallback } from 'react';
import { toast } from 'sonner';
import { mapSupabaseError, AppError } from '@/lib/errors';

/**
 * Hook especializado para manejo de errores en Client App
 * Proporciona mensajes contextuales y recovery options
 */
export function useClientError() {
  const handleError = useCallback((
    error: any,
    context: 'documents' | 'photos' | 'financial' | 'appointments' | 'chat' | 'schedule' | 'general' = 'general',
    onRetry?: () => void
  ) => {
    const appError = error instanceof AppError ? error : mapSupabaseError(error);
    
    // Mensajes contextuales según el módulo
    const contextMessages: Record<string, string> = {
      documents: 'Error al cargar documentos',
      photos: 'Error al cargar fotos',
      financial: 'Error al cargar información financiera',
      appointments: 'Error al cargar citas',
      chat: 'Error al cargar mensajes',
      schedule: 'Error al cargar cronograma',
      general: 'Ocurrió un error'
    };

    const title = contextMessages[context] || contextMessages.general;

    // Mostrar toast con opción de retry si está disponible
    if (onRetry) {
      toast.error(title, {
        description: appError.message,
        action: {
          label: 'Reintentar',
          onClick: onRetry
        }
      });
    } else {
      toast.error(title, {
        description: appError.message
      });
    }

    // Log para debugging
    console.error(`[Client App - ${context}]`, appError);

    return appError;
  }, []);

  const handleSuccess = useCallback((
    message: string,
    context?: string
  ) => {
    toast.success(message);
  }, []);

  return {
    handleError,
    handleSuccess
  };
}
