import { useEffect, useRef } from "react";

/**
 * Hook to check if component is mounted
 * Useful to prevent state updates on unmounted components
 */
export function useIsMounted() {
  const isMounted = useRef(false);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  return isMounted;
}
