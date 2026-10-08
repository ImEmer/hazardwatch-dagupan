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
  const mapPreferences = { showResolved: false, defaultZoom: 13, mapStyle: 'streets', markerStyle: 'danger', ...user?.preferences?.map };
  const { reports: mapReports, loading, error: fetchError, onBoundsChange, retry } = useViewportReports({ endpoint: '/reports/public', includeResolved: mapPreferences.showResolved });
  const visibleStatuses = mapPreferences.showResolved ? ['Pending', 'In Progress', 'Resolved'] : ['Pending', 'In Progress'];
  const visibleReports = mapReports.filter((report) => visibleStatuses.includes(report.status));
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [selectedBarangay, setSelectedBarangay] = useState('');
  const [flyTo, setFlyTo] = useState(null);

  useEffect(() => {
    AOS.init({ duration: 800, easing: 'ease-in-out', once: true });
    AOS.refresh();
  }, []);

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
            <Link to="/submit" className="absolute right-5 top-5 z-10 rounded-lg border border-blue-400 bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-lg transition-colors hover:bg-blue-500">
              Submit a Report
            </Link>
          )}
          <div className={`absolute bottom-5 left-5 z-10 w-[min(18rem,calc(100%-2.5rem))] rounded-xl border p-3 shadow-lg ${isDark ? 'border-[#2e303a] bg-[#14151d]/95 text-white' : 'border-slate-200 bg-white/95 text-slate-900'}`}>
            <div className="mb-2 flex items-center justify-between gap-3">
              <label htmlFor="public-map-barangay" className="block text-xs font-semibold uppercase tracking-[0.12em] text-[#60a5fa]">Find Barangay</label>
              <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${isDark ? 'border-[#2e303a] bg-[#0a0b0f] text-gray-300' : 'border-slate-200 bg-slate-100 text-slate-600'}`}>Select</span>
            </div>
            <select id="public-map-barangay" value={selectedBarangay} onChange={handleBarangayChange} className={`public-map-select mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none ${isDark ? 'border-[#2e303a] bg-[#0a0b0f] text-white' : 'border-slate-200 bg-white text-slate-900'}`}>
              <option value="">Select a barangay...</option>
              {DAGUPAN_BARANGAYS.map((barangay) => <option key={barangay} value={barangay}>{barangay}</option>)}
            </select>
          </div>
          <div className={`absolute left-5 top-5 z-10 rounded-xl border p-3 shadow-lg ${isDark ? 'border-[#2e303a] bg-[#14151d]/95 text-white' : 'border-slate-200 bg-white/95 text-slate-900'}`}>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#60a5fa]">Report status</p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm"><span className="h-3 w-3 rounded-full bg-[#eab308]" aria-hidden="true" /><span className="text-gray-200">Pending</span></div>
              <div className="flex items-center gap-2 text-sm"><span className="h-3 w-3 rounded-full bg-[#3b82f6]" aria-hidden="true" /><span className="text-gray-200">In Progress</span></div>
              <div className="flex items-center gap-2 text-sm"><span className="h-3 w-3 rounded-full bg-[#10b981]" aria-hidden="true" /><span className="text-gray-200">Resolved</span></div>
            </div>
          </div>
          <InteractiveMap reports={visibleReports} height="100%" colorBy="status" showHeatmap={false} flyTo={flyTo} onBoundsChange={onBoundsChange} mapPreferences={mapPreferences} />
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
