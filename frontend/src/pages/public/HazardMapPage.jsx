import React, { useEffect, useState } from 'react';
import InteractiveMap from '../../components/InteractiveMap';
import { useReports } from '../../context/ReportContext';
import AOS from 'aos';
import 'aos/dist/aos.css';
import useTheme from '../../hooks/useTheme';
import { DAGUPAN_BARANGAYS, DAGUPAN_BARANGAY_COORDINATES } from '../../services/reportOptions';

const HazardMapPage = () => {
  const { publicReports, reports } = useReports();
  const mapReports = publicReports.length > 0 ? publicReports : reports;
  const visibleReports = mapReports.filter((report) => ['Pending', 'In Progress', 'Resolved'].includes(report.status));
  console.log('[HazardMapPage] reports loaded:', { publicReports: publicReports.length, allReports: reports.length, visibleReports: visibleReports.length, mapReports: mapReports.length });
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
          <div className="absolute left-5 top-5 z-10 max-w-sm rounded-xl border border-[#2e303a] bg-[#14151d]/90 p-3 text-sm text-gray-200 shadow-lg">
            <p className="font-semibold text-white">See a hazard? Log in to report it.</p>
            <p className="mt-1 text-gray-400">Public map view shows live reports already submitted by the community.</p>
          </div>
          <div className={`absolute left-5 top-28 z-10 rounded-xl border p-3 shadow-lg ${isDark ? 'border-[#2e303a] bg-[#14151d]/95 text-white' : 'border-slate-200 bg-white/95 text-slate-900'}`}>
            <label htmlFor="public-map-barangay" className="block text-xs font-semibold">Find Barangay</label>
            <select id="public-map-barangay" value={selectedBarangay} onChange={handleBarangayChange} className={`mt-2 w-52 rounded-lg border px-3 py-2 text-sm outline-none ${isDark ? 'border-[#2e303a] bg-[#0a0b0f] text-white' : 'border-slate-200 bg-white text-slate-900'}`}>
              <option value="">Select a barangay...</option>
              {DAGUPAN_BARANGAYS.map((barangay) => <option key={barangay} value={barangay}>{barangay}</option>)}
            </select>
          </div>
          <button type="button" onClick={toggleHeatmap} className="absolute right-5 top-5 z-10 rounded-lg border border-[#2e303a] bg-[#14151d]/95 px-3 py-2 text-sm text-white shadow-lg">{showHeatmap ? 'Show Markers' : 'Show Heatmap'}</button>
          <InteractiveMap reports={visibleReports} height="100%" colorBy="status" showHeatmap={showHeatmap} flyTo={flyTo} />
          {visibleReports.length === 0 && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-slate-950/40 backdrop-blur-[1px]">
              <div className="rounded-2xl border border-slate-700 bg-slate-900/80 px-6 py-5 text-center text-slate-200 shadow-xl">
                <div className="text-2xl" aria-hidden="true">⚠</div>
                <h2 className="mt-2 font-semibold">No reports to show</h2>
                <p className="mt-1 text-sm text-slate-400">There are no hazard reports yet.</p>
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
