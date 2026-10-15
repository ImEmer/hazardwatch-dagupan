import { useEffect, useRef } from 'react';

const POLL_INTERVAL_MS = 30_000;

const useVisibleReportPolling = (refresh, paused) => {
  const refreshRef = useRef(refresh);

  useEffect(() => {
    refreshRef.current = refresh;
  }, [refresh]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      if (!paused && document.visibilityState === 'visible') refreshRef.current();
    }, POLL_INTERVAL_MS);

    return () => window.clearInterval(interval);
  }, [paused]);
};

export default useVisibleReportPolling;
