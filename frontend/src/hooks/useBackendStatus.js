import { useState, useEffect } from 'react';
import { dataAPI } from '../api/dataAPI';

export function useBackendStatus(checkInterval = 30000) {
  const [status, setStatus] = useState({
    isOnline: false,
    lastCheck: null,
  });

  useEffect(() => {
    const checkHealth = async () => {
      try {
        await dataAPI.getLatest();
        setStatus({
          isOnline: true,
          lastCheck: new Date(),
        });
      } catch (err) {
        setStatus({
          isOnline: false,
          lastCheck: new Date(),
        });
      }
    };

    checkHealth();
    const timer = setInterval(checkHealth, checkInterval);

    return () => clearInterval(timer);
  }, [checkInterval]);

  return status;
}
