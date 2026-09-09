import React, { useEffect } from 'react';
import InteractiveMap from '../../components/InteractiveMap';
import { useReports } from '../../context/ReportContext';
import AOS from 'aos';
import 'aos/dist/aos.css';

const HazardMapPage = () => {
  const { reports } = useReports();

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
        <div data-aos="zoom-in" data-aos-delay="100" className="overflow-hidden rounded-2xl border border-[#2e303a] bg-[#14151d] p-2 shadow-xl">
          <InteractiveMap reports={reports} height="650px" />
        </div>
        <p className="mt-3 text-sm text-gray-500">{reports.length} reports displayed. Select a marker for details.</p>
      </div>
    </main>
  );
};

export default HazardMapPage;
