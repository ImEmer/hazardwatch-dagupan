import React, { useEffect } from 'react';
import InteractiveMap from '../../components/InteractiveMap';
import { useReports } from '../../context/ReportContext';
import AOS from 'aos';
import 'aos/dist/aos.css';

const HazardMapPage = () => {
  const { publicReports, reports } = useReports();
  const visibleReports = publicReports.length > 0 ? publicReports : reports;

  useEffect(() => {
    AOS.init({ duration: 800, easing: 'ease-in-out', once: true });
    AOS.refresh();
  }, []);

  return (
    <main className="min-h-screen bg-[#0a0b0f] px-4 pb-12 pt-24 text-white">
      <div className="mx-auto max-w-7xl">
        <div data-aos="fade-up" className="mb-6">
          <p className="text-xs uppercase tracking-[0.25em] text-[#60a5fa]">Dagupan City</p>
          <h1 className="mt-2 text-3xl font-bold">Hazard Map</h1>
          <p className="mt-2 text-gray-400">Explore reported hazards and their locations across the city.</p>
        </div>
        <div data-aos="zoom-in" data-aos-delay="100" className="relative overflow-hidden rounded-2xl border border-[#2e303a] bg-[#14151d] p-2 shadow-xl">
          <InteractiveMap reports={visibleReports} height="650px" colorBy="status" />
          {visibleReports.length === 0 && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-slate-950/40 backdrop-blur-[1px]">
              <div className="rounded-full border border-slate-700 bg-slate-900/80 px-4 py-2 text-sm font-medium text-slate-200 shadow-lg">
                No hazards reported yet.
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
