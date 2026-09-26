import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import InteractiveMap from '../../components/InteractiveMap';
import api from '../../services/api';
import AOS from 'aos';
import 'aos/dist/aos.css';
import useAuth from '../../hooks/useAuth';
import useTheme from '../../hooks/useTheme';
import { DAGUPAN_BARANGAYS, DAGUPAN_BARANGAY_COORDINATES } from '../../services/reportOptions';

const HazardMapPage = () => {
  const [mapReports, setMapReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const { token } = useAuth();
  const latestBoundsRef = useRef(null);
  const fetchTimerRef = useRef(null);
  const requestControllerRef = useRef(null);

  const fetchReportsByBounds = useCallback(async (bounds) => {
    if (!bounds) return;
    requestControllerRef.current?.abort();
    const controller = new AbortController();
    requestControllerRef.current = controller;
    const boundsParam = `${bounds.getSouth()},${bounds.getWest()},${bounds.getNorth()},${bounds.getEast()}`;

    setLoading(true);
    setFetchError('');
    try {
      const { data } = await api.get('/reports/public', {
        params: { bounds: boundsParam, limit: 500, includeResolved: 'true' },
        timeout: 30000,
        signal: controller.signal,
      });
      if (!controller.signal.aborted) {
        const nextReports = data.reports || [];
        setMapReports(nextReports);
        console.log('[user map] Reports loaded for viewport:', nextReports.length);
      }
    } catch (error) {
      if (!controller.signal.aborted && error.code !== 'ERR_CANCELED') {
        console.error('[user map] Error:', error.response?.data || error.message);
        setFetchError('Unable to load reports. Please try again.');
      }
    } finally {
      if (requestControllerRef.current === controller) {
        requestControllerRef.current = null;
        setLoading(false);
      }
    }
  }, []);

  const handleBoundsChange = useCallback((bounds) => {
    latestBoundsRef.current = bounds;
    window.clearTimeout(fetchTimerRef.current);
    requestControllerRef.current?.abort();
    requestControllerRef.current = null;
    setLoading(true);
    setFetchError('');
    fetchTimerRef.current = window.setTimeout(() => fetchReportsByBounds(bounds), 500);
  }, [fetchReportsByBounds]);

  useEffect(() => {
    return () => {
      window.clearTimeout(fetchTimerRef.current);
      const controller = requestControllerRef.current;
      requestControllerRef.current = null;
      controller?.abort();
    };
  }, []);
  const visibleReports = mapReports.filter((report) => ['Pending', 'In Progress', 'Resolved'].includes(report.status));
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [showHeatmap, setShowHeatmap] = useState(() => localStorage.getItem('hazardwatch_heatmap') === 'true');
  const [selectedBarangay, setSelectedBarangay] = useState('');
  const [flyTo, setFlyTo] = useState(null);

  useEffect(() => {
    AOS.init({ duration: 800, easing: 'ease-in-out', once: true });
    AOS.refresh();
  }, []);

  const toggleHeatmap = () => setShowHeatmap((value) => { localStorage.setItem('hazardwatch_heatmap', String(!value)); return !value; });
  const handleBarangayChange = (event) => {
    const name = event.target.value;
    setSelectedBarangay(name);
    setFlyTo(name ? { center: DAGUPAN_BARANGAY_COORDINATES[name], zoom: 15 } : null);
  };

  return (
    <main className="min-h-screen bg-[#0a0b0f] px-4 pb-12 pt-24 text-white">
      <div className="mx-auto max-w-7xl">
        <div data-aos="fade-up" className="mb-6">
          <p className="text-xs uppercase tracking-[0.25em] text-[#60a5fa]">Dagupan City</p>
          <h1 className="mt-2 text-3xl font-bold">Hazard Map</h1>
          <p className="mt-2 text-gray-400">Explore reported hazards and their locations across the city.</p>
        </div>
        <div data-aos="zoom-in" data-aos-delay="100" className="relative h-[calc(100vh-220px)] min-h-[480px] overflow-hidden rounded-2xl border border-[#2e303a] bg-[#14151d] p-2 shadow-xl">
          {!token ? (
            <div className="absolute left-5 top-5 z-10 max-w-sm rounded-xl border border-[#2e303a] bg-[#14151d]/90 p-3 text-sm text-gray-200 shadow-lg">
              <p className="font-semibold text-white">See a hazard? Log in to report it.</p>
              <p className="mt-1 text-gray-400">Public map view shows live reports already submitted by the community.</p>
            </div>
          ) : (
            <Link to="/submit" className="absolute left-5 top-5 z-10 rounded-lg border border-blue-400 bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-lg transition-colors hover:bg-blue-500">
              Report a Hazard
            </Link>
          )}
          <div className={`absolute left-5 top-28 z-10 rounded-xl border p-3 shadow-lg ${isDark ? 'border-[#2e303a] bg-[#14151d]/95 text-white' : 'border-slate-200 bg-white/95 text-slate-900'}`}>
            <label htmlFor="public-map-barangay" className="block text-xs font-semibold">Find Barangay</label>
            <select id="public-map-barangay" value={selectedBarangay} onChange={handleBarangayChange} className={`mt-2 w-52 rounded-lg border px-3 py-2 text-sm outline-none ${isDark ? 'border-[#2e303a] bg-[#0a0b0f] text-white' : 'border-slate-200 bg-white text-slate-900'}`}>
              <option value="">Select a barangay...</option>
              {DAGUPAN_BARANGAYS.map((barangay) => <option key={barangay} value={barangay}>{barangay}</option>)}
            </select>
          </div>
          <button type="button" onClick={toggleHeatmap} className="absolute right-5 top-5 z-10 rounded-lg border border-[#2e303a] bg-[#14151d]/95 px-3 py-2 text-sm text-white shadow-lg">{showHeatmap ? 'Show Markers' : 'Show Heatmap'}</button>
          <InteractiveMap reports={visibleReports} height="100%" colorBy="status" showHeatmap={showHeatmap} flyTo={flyTo} onBoundsChange={handleBoundsChange} />
          {loading && (
            <div className="pointer-events-none absolute right-5 top-16 z-20 rounded-lg border border-[#2e303a] bg-[#14151d]/95 px-4 py-3 text-sm text-white shadow-lg">
              Loading reports...
            </div>
          )}
          {fetchError && (
            <div role="alert" className="absolute right-5 top-16 z-20 max-w-sm rounded-lg bg-red-600 px-4 py-3 text-sm text-white shadow-lg">
              <p>{fetchError}</p>
              <button
                type="button"
                className="mt-2 rounded border border-white/70 px-3 py-1 font-semibold hover:bg-white/10"
                onClick={() => latestBoundsRef.current && fetchReportsByBounds(latestBoundsRef.current)}
              >
                Retry
              </button>
            </div>
          )}
          {!loading && !fetchError && visibleReports.length === 0 && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-slate-950/40 backdrop-blur-[1px]">
              <div className="rounded-2xl border border-slate-700 bg-slate-900/80 px-6 py-5 text-center text-slate-200 shadow-xl">
                <div className="text-2xl" aria-hidden="true">⚠</div>
                <h2 className="mt-2 font-semibold">No reports to show</h2>
                <p className="mt-1 text-sm text-slate-400">There are no hazard reports in this map view.</p>
              </div>
            </div>
          )}
        </div>
        <p className="mt-3 text-sm text-gray-500">{visibleReports.length} reports displayed. Select a marker for details.</p>
      </div>
    </main>
  );
};

export default HazardMapPage;
