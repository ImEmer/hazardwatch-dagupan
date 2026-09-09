import React, { useEffect } from 'react';
import AOS from 'aos';
import 'aos/dist/aos.css';
import { CommunityParticipationSection, SaferCommunitiesSection } from '../../components/CommunitySections';

const AboutPage = () => {
  useEffect(() => {
    AOS.init({ duration: 800, easing: 'ease-in-out', once: true });
    AOS.refresh();
  }, []);

  return (
    <main className="min-h-screen bg-[#0a0b0f] px-4 pb-16 pt-28 text-white">
      <div className="mx-auto max-w-6xl space-y-8">
        <section className="rounded-2xl border border-[#2e303a] bg-[#14151d] p-8 text-center md:p-12" data-aos="fade-up">
          <p className="text-sm uppercase tracking-[0.3em] text-[#3b82f6]">HazardWatch</p>
          <h1 className="mt-4 text-4xl font-bold md:text-5xl">About HazardWatch</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-400">Building safer communities through real-time hazard reporting.</p>
        </section>
        <section className="grid gap-6 md:grid-cols-2" data-aos="fade-up" data-aos-delay="100">
          <article className="rounded-2xl border border-[#2e303a] bg-[#14151d] p-6">
            <h2 className="text-2xl font-bold">What is HazardWatch?</h2>
            <p className="mt-3 leading-7 text-gray-400">HazardWatch is a community-based real-time hazard reporting and monitoring platform designed for Dagupan City. It connects citizens with local authorities to ensure faster response times and better awareness of community safety issues.</p>
          </article>
          <article className="rounded-2xl border border-[#2e303a] bg-[#14151d] p-6">
            <h2 className="text-2xl font-bold">Our Mission</h2>
            <p className="mt-3 leading-7 text-gray-400">HazardWatch is dedicated to empowering communities by providing a simple, accessible platform for reporting and monitoring hazards. We believe that informed communities are safer communities.</p>
          </article>
        </section>
        <CommunityParticipationSection />
        <SaferCommunitiesSection />
        <section className="rounded-2xl border border-[#2e303a] bg-[#14151d] p-6 text-center md:p-8" data-aos="fade-up">
          <h2 className="text-2xl font-bold">Our Commitment</h2>
          <p className="mx-auto mt-3 max-w-3xl leading-7 text-gray-400">We are committed to transparency, accountability, and community safety. Every report is treated with importance and handled with care.</p>
        </section>
      </div>
    </main>
  );
};

export default AboutPage;
