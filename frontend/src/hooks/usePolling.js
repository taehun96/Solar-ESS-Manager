import { useState, useEffect, useRef } from 'react';

export function usePolling(fetchFn, interval = 5000, enabled = true) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const fetchFnRef = useRef(fetchFn);

  useEffect(() => {
    fetchFnRef.current = fetchFn;
  }, [fetchFn]);

  useEffect(() => {
    if (!enabled) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    const poll = async () => {
      try {
        const result = await fetchFnRef.current();
        if (isMounted) {
          setData(result);
          setError(null);
          setIsLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError(err);
          setIsLoading(false);
        }
      }
    };

    poll();
    const timer = setInterval(poll, interval);

    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, [interval, enabled]);

  const refetch = async () => {
    try {
      setIsLoading(true);
      const result = await fetchFnRef.current();
      setData(result);
      setError(null);
      setIsLoading(false);
    } catch (err) {
      setError(err);
      setIsLoading(false);
    }
  };

  return { data, error, isLoading, refetch };
}
