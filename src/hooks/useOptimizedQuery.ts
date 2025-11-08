import { useQuery, UseQueryOptions, QueryKey } from "@tanstack/react-query";
import { CACHE_CONFIG } from "@/lib/queryConfig";

/**
 * Hook optimizado para queries frecuentes con caching inteligente
 */
export function useOptimizedQuery<TData = unknown, TError = Error>(
  options: UseQueryOptions<TData, TError> & {
    queryKey: QueryKey;
    queryFn: () => Promise<TData>;
    cacheStrategy?: keyof typeof CACHE_CONFIG;
  }
) {
  const { cacheStrategy = "active", ...restOptions } = options;
  const cacheConfig = CACHE_CONFIG[cacheStrategy];

  return useQuery<TData, TError>({
    ...cacheConfig,
    ...restOptions,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}
