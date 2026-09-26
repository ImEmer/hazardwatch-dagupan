import React, { useMemo, useState } from 'react';
import InteractiveMap from '../../components/InteractiveMap';
import useAuth from '../../hooks/useAuth';
import useTheme from '../../hooks/useTheme';
import useViewportReports from '../../hooks/useViewportReports';
import { DAGUPAN_BARANGAYS, DAGUPAN_BARANGAY_COORDINATES } from '../../services/reportOptions';

const statuses = ['all', 'Pending', 'In Progress'];

const BarangayMapPage = () => {
  const { user, token } = useAuth();
  const mapPreferences = { showResolved: false, showClusters: true, defaultView: 'city', defaultZoom: 13, mapStyle: 'streets', markerStyle: 'circle', ...user?.preferences?.map };
  const { reports, loading, error, onBoundsChange, retry } = useViewportReports({
    endpoint: '/reports',
    token,
    scopeParam: 'barangay',
    scopeValue: user?.barangay,
    includeResolved: mapPreferences.showResolved,
    enabled: Boolean(token && user?.barangay),
  });
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [status, setStatus] = useState('all');
  const [heatmap, setHeatmap] = useState(() => localStorage.getItem('hazardwatch_heatmap') === 'true');
  const [selectedBarangay, setSelectedBarangay] = useState('');
  const [flyTo, setFlyTo] = useState(null);

  const filtered = useMemo(() => {
    const visibleStatuses = mapPreferences.showResolved ? ['Pending', 'In Progress', 'Resolved'] : ['Pending', 'In Progress'];
    const visible = reports.filter((report) => visibleStatuses.includes(report.status));
    return status === 'all' ? visible : visible.filter((report) => report.status === status);
  }, [mapPreferences.showResolved, reports, status]);
  const defaultCenter = useMemo(() => mapPreferences.defaultView === 'barangay' && user?.barangay
    ? (DAGUPAN_BARANGAY_COORDINATES[user.barangay] || [120.3333, 16.0433])
    : [120.3333, 16.0433], [mapPreferences.defaultView, user?.barangay]);
  const toggleHeatmap = () => setHeatmap((value) => { localStorage.setItem('hazardwatch_heatmap', String(!value)); return !value; });
  const handleBarangayChange = (event) => {
    const name = event.target.value;
    setSelectedBarangay(name);
    setFlyTo(name ? { center: DAGUPAN_BARANGAY_COORDINATES[name], zoom: 15 } : null);
  };
  const panel = isDark ? 'border-[#2e303a] bg-[#14151d]' : 'border-slate-200 bg-white';

  return (
    <div className="flex h-[calc(100vh-64px)] min-h-0 flex-col gap-6">
      <section className={`rounded-2xl border p-4 shadow-xl ${panel}`}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div><p className="text-xs uppercase tracking-[0.25em] text-[#3b82f6]">{user?.barangay} response map</p><h1 className={`mt-2 text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Map View</h1></div>
          <div className="flex flex-wrap gap-2">{statuses.map((item) => <button type="button" key={item} onClick={() => setStatus(item)} className={`rounded-lg px-3 py-1.5 text-sm ${status === item ? 'bg-[#3b82f6] text-white' : isDark ? 'bg-[#0a0b0f] text-gray-300' : 'bg-slate-100 text-slate-700'}`}>{item === 'all' ? 'All' : item}</button>)}</div>
        </div>
      </section>

      <div className="grid min-h-0 flex-1 gap-6 overflow-hidden xl:grid-cols-[2fr_1fr]">
        <div className={`relative min-h-0 overflow-hidden rounded-2xl border p-2 shadow-xl ${panel}`}>
          <div className={`absolute left-5 top-5 z-10 rounded-xl border p-3 shadow-lg ${isDark ? 'border-[#2e303a] bg-[#14151d]/95 text-white' : 'border-slate-200 bg-white/95 text-slate-900'}`}>
            <label htmlFor="barangay-map-barangay" className="block text-xs font-semibold">Find Barangay</label>
            <select id="barangay-map-barangay" value={selectedBarangay} onChange={handleBarangayChange} className={`mt-2 w-52 rounded-lg border px-3 py-2 text-sm outline-none ${isDark ? 'border-[#2e303a] bg-[#0a0b0f] text-white' : 'border-slate-200 bg-white text-slate-900'}`}>
              <option value="">Select a barangay...</option>
              {DAGUPAN_BARANGAYS.map((barangay) => <option key={barangay} value={barangay}>{barangay}</option>)}
            </select>
          </div>
          <button type="button" onClick={toggleHeatmap} className="absolute right-5 top-5 z-10 rounded-lg bg-[#14151d]/95 px-3 py-2 text-sm text-white">{heatmap ? 'Show Markers' : 'Show Heatmap'}</button>
          <InteractiveMap reports={filtered} height="100%" colorBy="status" showHeatmap={heatmap} flyTo={flyTo} onBoundsChange={onBoundsChange} mapPreferences={mapPreferences} defaultCenter={defaultCenter} />
          {loading && <div className="pointer-events-none absolute right-5 top-16 z-20 rounded-lg border border-[#2e303a] bg-[#14151d]/95 px-4 py-3 text-sm text-white shadow-lg">Loading reports...</div>}
          {error && <div role="alert" className="absolute right-5 top-16 z-20 max-w-sm rounded-lg bg-red-600 px-4 py-3 text-sm text-white shadow-lg"><p>{error}</p><button type="button" className="mt-2 rounded border border-white/70 px-3 py-1 font-semibold hover:bg-white/10" onClick={retry}>Retry</button></div>}
          {!loading && !error && !filtered.length && <div className="pointer-events-none absolute inset-0 flex items-center justify-center"><div className="rounded-2xl border border-slate-700 bg-slate-950/80 px-6 py-5 text-center text-slate-200 shadow-xl"><div className="text-2xl" aria-hidden="true">⚠</div><h3 className="mt-2 font-semibold">No reports to show</h3><p className="mt-1 text-sm text-slate-400">There are no active reports in this map view.</p></div></div>}
        </div>
        <div className="min-h-0 space-y-4 overflow-y-auto pr-1">
          {loading ? <p className="text-gray-400">Loading reports...</p> : filtered.map((report) => <div key={report._id} className={`rounded-2xl border p-4 shadow-xl ${panel}`}><p className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{report.title || `${report.category} report`}</p><p className="mt-1 text-xs text-[#60a5fa]">{report.status}</p><p className={`mt-3 text-sm ${isDark ? 'text-gray-300' : 'text-slate-600'}`}>{report.address || 'Dagupan City area'}</p></div>)}
        </div>
      </div>
    </div>
  );
};

export default BarangayMapPage;
