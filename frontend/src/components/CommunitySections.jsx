import React from 'react';
import { Link } from 'react-router-dom';

const benefits = [
  { title: 'Report Hazards', description: 'Submit detailed reports with photos and location.' },
  { title: 'Provide Evidence', description: 'Attach photos and information to support your report.' },
  { title: 'Pinpoint Locations', description: 'Mark exact locations on the interactive map.' },
  { title: 'Monitor Report Status', description: 'Track your report from submission to resolution.' },
];

const communityFeatures = [
  { title: 'Real-Time Reporting', description: 'Receive hazard reports as they happen.', icon: <svg className="h-8 w-8 text-[#3b82f6]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
  { title: 'Location-Based', description: 'Every report is associated with a specific location.', icon: <svg className="h-8 w-8 text-[#3b82f6]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
  { title: 'Centralized Monitoring', description: 'Manage reports and incidents from one platform.', icon: <svg className="h-8 w-8 text-[#3b82f6]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" /></svg> },
  { title: 'Community-Driven', description: 'Residents actively contribute to community safety.', icon: <svg className="h-8 w-8 text-[#3b82f6]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
];

export const CommunityParticipationSection = () => (
  <section className="rounded-2xl border border-[#2e303a] bg-[#14151d] p-6 md:p-8" data-aos="fade-up" data-aos-delay="100">
    <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
      <div data-aos="fade-right" data-aos-delay="200">
        <h2 className="text-3xl font-bold text-white md:text-4xl">Your Report Can Help Make Your <span className="text-[#3b82f6]">Community Safer</span></h2>
        <p className="mb-6 mt-4 text-lg leading-relaxed text-gray-300">Citizens can help identify hazards by reporting incidents, providing photos and information, and sharing accurate locations. Every report helps build better awareness of community safety issues.</p>
        <div className="grid grid-cols-2 gap-4">
          {benefits.map((benefit, index) => (
            <div key={benefit.title} className="rounded-lg border border-[#2e303a] bg-[#0a0b0f] p-4 transition hover:border-[#3b82f6]/30" data-aos="fade-up" data-aos-delay={150 + index * 100}>
              <h4 className="mb-1 text-sm font-semibold text-white">{benefit.title}</h4>
              <p className="text-xs text-gray-500">{benefit.description}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-xl border border-[#2e303a] bg-[#0a0b0f] p-8" data-aos="fade-left" data-aos-delay="300">
        <div className="text-center">
          <svg className="mx-auto mb-4 h-16 w-16 text-[#3b82f6]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          <h3 className="mb-2 text-xl font-bold text-white">Join the Community</h3>
          <p className="mb-4 text-sm text-gray-400">Be part of the solution. Report hazards and help keep your community safe.</p>
          <Link to="/submit" className="inline-block rounded-lg bg-[#3b82f6] px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#3b82f6]/25 transition hover:bg-[#2563eb]">Report a Hazard</Link>
        </div>
      </div>
    </div>
  </section>
);

export const SaferCommunitiesSection = () => (
  <section className="overflow-hidden rounded-2xl border border-[#2e303a] bg-[#14151d] p-6 md:p-8" data-aos="fade-up" data-aos-delay="100">
    <div className="text-center" data-aos="fade-down" data-aos-delay="200">
      <h2 className="text-3xl font-bold text-white md:text-4xl">Built for <span className="text-[#3b82f6]">Safer Communities</span></h2>
      <p className="mx-auto mt-4 max-w-2xl text-center text-gray-400">Empowering citizens and authorities with real-time hazard intelligence.</p>
    </div>
    <div className="relative mt-8 overflow-hidden">
      <div className="flex gap-6 animate-marquee-faster hover:pause">
        {[...communityFeatures, ...communityFeatures].map((feature, index) => (
          <div key={`${feature.title}-${index}`} className="w-64 shrink-0 rounded-xl border border-[#2e303a] bg-[#0a0b0f] p-6 transition hover:border-[#3b82f6]/30 hover:shadow-lg hover:shadow-[#3b82f6]/5 md:w-72" style={{ width: '280px' }}>
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-[#3b82f6]/15">{feature.icon}</div>
            <h4 className="mb-2 font-semibold text-white">{feature.title}</h4>
            <p className="text-sm leading-relaxed text-gray-400">{feature.description}</p>
          </div>
        ))}
      </div>
    </div>
    <style>{`@keyframes marquee-faster { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } } .animate-marquee-faster { display: flex; animation: marquee-faster 10s linear infinite; gap: 1.5rem; } .animate-marquee-faster:hover { animation-play-state: paused; }`}</style>
  </section>
);
