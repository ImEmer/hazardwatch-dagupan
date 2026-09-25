import React, { useMemo, useState } from 'react';
import InteractiveMap from '../../components/InteractiveMap';
import { useReports } from '../../context/ReportContext';
import useTheme from '../../hooks/useTheme';
import { DAGUPAN_BARANGAYS, DAGUPAN_BARANGAY_COORDINATES } from '../../services/reportOptions';

const statusColors = {
  Pending: 'bg-yellow-500/10 text-yellow-300 border-yellow-500/30',
  'In Progress': 'bg-blue-500/10 text-blue-300 border-blue-500/30',
  Resolved: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
  Closed: 'bg-slate-500/10 text-slate-300 border-slate-500/30',
};

const statusColorsLight = {
  Pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  'In Progress': 'bg-blue-50 text-blue-700 border-blue-200',
  Resolved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Closed: 'bg-slate-100 text-slate-700 border-slate-200',
};

const AdminMapPage = () => {
  const { reports } = useReports();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [statusFilter, setStatusFilter] = useState('all');
  const [showHeatmap, setShowHeatmap] = useState(() => localStorage.getItem('hazardwatch_heatmap') === 'true');
  const [selectedBarangay, setSelectedBarangay] = useState('');
  const [flyTo, setFlyTo] = useState(null);

  const filteredReports = useMemo(() => {
    const visible = reports.filter((report) => ['Pending', 'In Progress'].includes(report.status));
    return statusFilter === 'all' ? visible : visible.filter((report) => report.status === statusFilter);
  }, [reports, statusFilter]);
  const toggleHeatmap = () => setShowHeatmap((value) => { localStorage.setItem('hazardwatch_heatmap', String(!value)); return !value; });
  const handleBarangayChange = (event) => {
    const name = event.target.value;
    setSelectedBarangay(name);
    setFlyTo(name ? { center: DAGUPAN_BARANGAY_COORDINATES[name], zoom: 15 } : null);
  };

  return (
    <div className="flex h-[calc(100vh-64px)] min-h-0 flex-col gap-6 overflow-hidden">
      <div className={`rounded-2xl border p-4 shadow-xl ${isDark ? 'border-[#2e303a] bg-[#14151d]' : 'border-slate-200 bg-white'}`}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className={`text-xs uppercase tracking-[0.25em] ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>Response map</p>
            <h2 className={`mt-2 text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Geo dashboard</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {['all', 'Pending', 'In Progress'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  statusFilter === status
                    ? 'bg-[#3b82f6] text-white'
                    : isDark ? 'bg-[#0a0b0f] text-gray-300 hover:text-white' : 'bg-slate-100 text-slate-700 hover:text-slate-900'
                }`}
              >
                {status === 'all' ? 'All' : status}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 gap-6 overflow-hidden xl:grid-cols-[2fr_1fr]">
        <div className={`relative min-h-0 overflow-hidden rounded-2xl border p-2 shadow-xl ${isDark ? 'border-[#2e303a] bg-[#14151d]' : 'border-slate-200 bg-white'}`}>
          <div className="relative h-full min-h-0 overflow-hidden rounded-xl">
            <div className={`absolute left-5 top-5 z-10 rounded-xl border p-3 shadow-lg ${isDark ? 'border-[#2e303a] bg-[#14151d]/95 text-white' : 'border-slate-200 bg-white/95 text-slate-900'}`}>
              <label htmlFor="admin-map-barangay" className="block text-xs font-semibold">Find Barangay</label>
              <select id="admin-map-barangay" value={selectedBarangay} onChange={handleBarangayChange} className={`mt-2 w-52 rounded-lg border px-3 py-2 text-sm outline-none ${isDark ? 'border-[#2e303a] bg-[#0a0b0f] text-white' : 'border-slate-200 bg-white text-slate-900'}`}>
                <option value="">Select a barangay...</option>
                {DAGUPAN_BARANGAYS.map((barangay) => <option key={barangay} value={barangay}>{barangay}</option>)}
              </select>
            </div>
            <button type="button" onClick={toggleHeatmap} className="absolute right-5 top-5 z-10 rounded-lg border border-[#2e303a] bg-[#14151d]/95 px-3 py-2 text-sm text-white shadow-lg">{showHeatmap ? 'Show Markers' : 'Show Heatmap'}</button>
            <InteractiveMap reports={filteredReports} height="100%" colorBy="status" showHeatmap={showHeatmap} flyTo={flyTo} />
            {!filteredReports.length && <div className="pointer-events-none absolute inset-0 flex items-center justify-center"><div className="rounded-2xl border border-slate-700 bg-slate-950/80 px-6 py-5 text-center text-slate-200 shadow-xl"><div className="text-2xl" aria-hidden="true">⚠</div><h3 className="mt-2 font-semibold">No reports to show</h3><p className="mt-1 text-sm text-slate-400">There are no hazard reports yet.</p></div></div>}
          </div>
        </div>

        <div className="min-h-0 space-y-4 overflow-y-auto pr-1">
          {filteredReports.map((report) => (
            <div key={report._id || report.id} className={`rounded-2xl border p-4 shadow-xl ${isDark ? 'border-[#2e303a] bg-[#14151d]' : 'border-slate-200 bg-white'}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{report.title}</p>
                  <p className={`mt-1 text-xs ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>{report.category}</p>
                </div>
                <span className={`inline-flex rounded-full border px-2 py-1 text-[10px] font-medium ${(isDark ? statusColors : statusColorsLight)[report.status] || (isDark ? statusColors : statusColorsLight).Pending}`}>
                  {report.status}
                </span>
              </div>
              <p className={`mt-3 text-sm ${isDark ? 'text-gray-300' : 'text-slate-600'}`}>{report.address || 'Dagupan City area'}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminMapPage;
