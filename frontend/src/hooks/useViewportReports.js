import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import api from '../services/api';

const useViewportReports = ({ endpoint, token, scopeParam, scopeValue, enabled = true }) => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const latestBoundsRef = useRef(null);
  const fetchTimerRef = useRef(null);
  const requestControllerRef = useRef(null);
  const scopeParams = useMemo(
    () => (scopeParam && scopeValue ? { [scopeParam]: scopeValue } : {}),
    [scopeParam, scopeValue],
  );

  const fetchReportsByBounds = useCallback(async (bounds) => {
    if (!bounds || !enabled) return;

    requestControllerRef.current?.abort();
    const controller = new AbortController();
    requestControllerRef.current = controller;
    const boundsParam = `${bounds.getSouth()},${bounds.getWest()},${bounds.getNorth()},${bounds.getEast()}`;
    setLoading(true);
    setError('');

    try {
      const response = await api.get(endpoint, {
        params: { ...scopeParams, bounds: boundsParam, limit: 500 },
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        timeout: 30000,
        signal: controller.signal,
      });
      if (!controller.signal.aborted) setReports(response.data?.reports || []);
    } catch (requestError) {
      if (!controller.signal.aborted && requestError.code !== 'ERR_CANCELED') {
        setError(requestError.response?.data?.message || 'Unable to load reports. Please try again.');
      }
    } finally {
      if (requestControllerRef.current === controller) {
        requestControllerRef.current = null;
        setLoading(false);
      }
    }
  }, [enabled, endpoint, scopeParams, token]);

  const onBoundsChange = useCallback((bounds) => {
    latestBoundsRef.current = bounds;
    window.clearTimeout(fetchTimerRef.current);
    requestControllerRef.current?.abort();
    requestControllerRef.current = null;
    if (!enabled) {
      setReports([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    fetchTimerRef.current = window.setTimeout(() => fetchReportsByBounds(bounds), 500);
  }, [enabled, fetchReportsByBounds]);

  const retry = useCallback(() => {
    if (latestBoundsRef.current) fetchReportsByBounds(latestBoundsRef.current);
  }, [fetchReportsByBounds]);

  useEffect(() => () => {
    window.clearTimeout(fetchTimerRef.current);
    const controller = requestControllerRef.current;
    requestControllerRef.current = null;
    controller?.abort();
  }, [fetchReportsByBounds]);

  useEffect(() => {
    if (!enabled) {
      setReports([]);
      setLoading(false);
    }
  }, [enabled]);

  return { reports, loading, error, onBoundsChange, retry };
};

export default useViewportReports;