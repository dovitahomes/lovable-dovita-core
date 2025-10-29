import { useEffect, useState } from 'react';

export type QueryStatus = 'idle' | 'loading' | 'success' | 'empty' | 'error';

export type SafeQueryState<T> = {
  status: QueryStatus;
  data?: T;
  error?: any;
};

/**
 * A safe query hook that handles timeouts and empty states.
 * Prevents infinite loading spinners.
 * 
 * @param fn - Async function that returns data
 * @param deps - Dependencies array for useEffect
 * @param emptyCheck - Function to determine if data is empty
 * @param timeoutMs - Timeout in milliseconds (default: 15000)
 */
export function useSafeQuery<T>(
  fn: () => Promise<T>,
  deps: any[] = [],
  emptyCheck: (d: T) => boolean,
  timeoutMs: number = 15000
): SafeQueryState<T> {
  const [state, setState] = useState<SafeQueryState<T>>({ status: 'idle' });

  useEffect(() => {
    let isAlive = true;
    setState({ status: 'loading' });

    // Set timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      if (isAlive && state.status === 'loading') {
        console.error('[useSafeQuery] Query timeout after', timeoutMs, 'ms');
        setState({ status: 'empty' });
      }
    }, timeoutMs);

    fn()
      .then(data => {
        if (!isAlive) return;
        
        if (emptyCheck(data)) {
          setState({ status: 'empty', data });
        } else {
          setState({ status: 'success', data });
        }
      })
      .catch(error => {
        if (!isAlive) return;
        console.error('[useSafeQuery] Error:', error);
        setState({ status: 'error', error });
      })
      .finally(() => {
        clearTimeout(timeoutId);
      });

    return () => {
      isAlive = false;
      clearTimeout(timeoutId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return state;
}
