import { toast } from "sonner";
import { useCallback } from "react";

interface ToastErrorOptions {
  title?: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * Standardized error toast hook
 * Provides consistent error messaging with optional retry
 */
export function useToastError() {
  const showError = useCallback((error: Error | string, options?: ToastErrorOptions) => {
    const message = error instanceof Error ? error.message : error;
    
    toast.error(options?.title || "Error", {
      description: options?.description || message,
      action: options?.action ? {
        label: options.action.label,
        onClick: options.action.onClick,
      } : undefined,
    });
  }, []);

  const showErrorWithRetry = useCallback((
    error: Error | string,
    retryFn: () => void,
    title?: string
  ) => {
    const message = error instanceof Error ? error.message : error;
    
    toast.error(title || "Error", {
      description: message,
      action: {
        label: "Reintentar",
        onClick: retryFn,
      },
    });
  }, []);

  return {
    showError,
    showErrorWithRetry,
  };
}
