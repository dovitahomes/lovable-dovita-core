import { QueryClient } from "@tanstack/react-query";

// Caching strategies
export const CACHE_CONFIG = {
  // Catálogos estáticos (bancos, proveedores, etc.)
  catalogs: {
    staleTime: 60 * 1000, // 60s
    gcTime: 5 * 60 * 1000, // 5min
  },
  // Entidades activas (transacciones, OCs, mensajes)
  active: {
    staleTime: 15 * 1000, // 15s
    gcTime: 5 * 60 * 1000, // 5min
  },
  // Entidades de solo lectura frecuente
  readFrequent: {
    staleTime: 30 * 1000, // 30s
    gcTime: 5 * 60 * 1000, // 5min
  },
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      ...CACHE_CONFIG.active,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});
