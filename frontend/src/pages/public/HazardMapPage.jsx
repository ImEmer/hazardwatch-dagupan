import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import InteractiveMap from '../../components/InteractiveMap';
import AOS from 'aos';
import 'aos/dist/aos.css';
import useAuth from '../../hooks/useAuth';
import useTheme from '../../hooks/useTheme';
import useViewportReports from '../../hooks/useViewportReports';
import { DAGUPAN_BARANGAYS, DAGUPAN_BARANGAY_COORDINATES } from '../../services/reportOptions';

const HazardMapPage = () => {
  const { token, user } = useAuth();
  const mapPreferences = { showResolved: false, showClusters: true, defaultView: 'city', defaultZoom: 13, mapStyle: 'streets', markerStyle: 'circle', ...user?.preferences?.map };
  const { reports: mapReports, loading, error: fetchError, onBoundsChange, retry } = useViewportReports({ endpoint: '/reports/public', includeResolved: mapPreferences.showResolved });
  const visibleStatuses = mapPreferences.showResolved ? ['Pending', 'In Progress', 'Resolved'] : ['Pending', 'In Progress'];
  const visibleReports = mapReports.filter((report) => visibleStatuses.includes(report.status));
  const defaultCenter = useMemo(() => mapPreferences.defaultView === 'barangay' && user?.barangay
    ? (DAGUPAN_BARANGAY_COORDINATES[user.barangay] || [120.3333, 16.0433])
    : [120.3333, 16.0433], [mapPreferences.defaultView, user?.barangay]);
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
          <InteractiveMap reports={visibleReports} height="100%" colorBy="status" showHeatmap={showHeatmap} flyTo={flyTo} onBoundsChange={onBoundsChange} mapPreferences={mapPreferences} defaultCenter={defaultCenter} />
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
                onClick={retry}
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
