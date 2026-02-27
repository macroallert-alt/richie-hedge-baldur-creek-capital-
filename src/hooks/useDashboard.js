'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchDashboard } from '@/lib/dashboard-fetch';
import { REFRESH_INTERVAL_MS, STALE_THRESHOLD_MS } from '@/lib/constants';

export function useDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastFetched, setLastFetched] = useState(null);
  const [isStale, setIsStale] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const intervalRef = useRef(null);
  const dashboardRef = useRef(null);

  const loadDashboard = useCallback(async (showToast = false) => {
    try {
      const data = await fetchDashboard();
      const isNew = !dashboardRef.current ||
        data.generated_at !== dashboardRef.current.generated_at;

      dashboardRef.current = data;
      setDashboard(data);
      setLastFetched(new Date());
      setError(null);

      // Stale check
      const generatedAt = new Date(data.generated_at);
      const age = Date.now() - generatedAt.getTime();
      setIsStale(age > STALE_THRESHOLD_MS);

      // Toast only on auto-refresh when new data arrives
      if (showToast && isNew) {
        setToastVisible(true);
        setTimeout(() => setToastVisible(false), 2000);
      }

      return data;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadDashboard(false);
  }, [loadDashboard]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      loadDashboard(true);
    }, REFRESH_INTERVAL_MS);

    return () => clearInterval(intervalRef.current);
  }, [loadDashboard]);

  // Pull-to-refresh handler
  const refresh = useCallback(async () => {
    setLoading(true);
    await loadDashboard(false);
  }, [loadDashboard]);

  return {
    dashboard,
    loading,
    error,
    lastFetched,
    isStale,
    toastVisible,
    refresh,
  };
}
