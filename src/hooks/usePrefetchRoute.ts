import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

type PrefetchConfig = {
  queryKey: any[];
  queryFn: () => Promise<any>;
};

export function usePrefetchRoute() {
  const queryClient = useQueryClient();

  const prefetch = useCallback(
    (config: PrefetchConfig) => {
      // Only prefetch on desktop (hover is desktop-only behavior)
      if (window.innerWidth < 1024) return;

      queryClient.prefetchQuery({
        queryKey: config.queryKey,
        queryFn: config.queryFn,
        staleTime: 60 * 1000, // 60s
      });
    },
    [queryClient]
  );

  return { prefetch };
}
