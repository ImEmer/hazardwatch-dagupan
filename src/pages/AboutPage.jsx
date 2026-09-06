import React from 'react';
import { Link } from 'react-router-dom';

const steps = [
  ['Report', 'Citizens submit hazard reports with location, category, description, and photo.'],
  ['Verify', 'Authorized staff reviews and verifies submitted reports.'],
  ['Monitor', 'Verified hazards appear on the map for real-time monitoring.'],
  ['Resolve', 'Staff updates the report once the hazard has been addressed.'],
];

const features = ['Real-Time Reporting', 'Interactive Map', 'Status Tracking', 'Photo Evidence', 'Community Participation', 'Staff Dashboard'];

const AboutPage = () => (
  <main className="min-h-screen bg-[#0a0b0f] px-4 pb-16 pt-28 text-white">
    <div className="mx-auto max-w-6xl space-y-8">
      <section className="rounded-2xl border border-[#2e303a] bg-[#14151d] p-8 text-center md:p-12">
        <p className="text-sm uppercase tracking-[0.3em] text-[#3b82f6]">HazardWatch</p>
        <h1 className="mt-4 text-4xl font-bold md:text-5xl">About HazardWatch</h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-400">Building safer communities through real-time hazard reporting.</p>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <article className="rounded-2xl border border-[#2e303a] bg-[#14151d] p-6">
          <h2 className="text-2xl font-bold">Our Mission</h2>
          <p className="mt-3 leading-7 text-gray-400">HazardWatch is dedicated to empowering communities by providing a simple, accessible platform for reporting and monitoring hazards. We believe that informed communities are safer communities.</p>
        </article>
        <article className="rounded-2xl border border-[#2e303a] bg-[#14151d] p-6">
          <h2 className="text-2xl font-bold">What is HazardWatch?</h2>
          <p className="mt-3 leading-7 text-gray-400">HazardWatch is a community-based real-time hazard reporting and monitoring platform designed for Dagupan City. It connects citizens with local authorities to ensure faster response times and better awareness of community safety issues.</p>
        </article>
      </section>

      <section className="rounded-2xl border border-[#2e303a] bg-[#14151d] p-6 md:p-8">
        <h2 className="text-2xl font-bold">How It Works</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-4">
          {steps.map(([title, description], index) => (
            <article key={title} className="rounded-xl border border-[#2e303a] bg-[#0a0b0f] p-4">
              <p className="text-sm font-semibold text-[#3b82f6]">0{index + 1}</p>
              <h3 className="mt-3 font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-gray-400">{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-[#2e303a] bg-[#14151d] p-6 md:p-8">
        <h2 className="text-2xl font-bold">Key Features</h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
          {features.map((feature) => <div key={feature} className="rounded-xl border border-[#2e303a] px-4 py-3 text-gray-300">{feature}</div>)}
        </div>
      </section>

      <section className="rounded-2xl border border-[#3b82f6]/30 bg-[#14151d] p-6 md:p-8">
        <h2 className="text-2xl font-bold">For the Community</h2>
        <p className="mt-3 max-w-3xl leading-7 text-gray-400">HazardWatch is built for the people of Dagupan City. Whether you're a resident reporting a hazard or a staff member managing incidents, HazardWatch provides the tools you need to keep your community safe.</p>
        <Link to="/submit" className="mt-6 inline-block rounded-lg bg-[#3b82f6] px-5 py-3 font-semibold text-white hover:bg-[#2563eb]">Report a Hazard</Link>
      </section>

      <section className="rounded-2xl border border-[#2e303a] bg-[#14151d] p-6 text-center md:p-8">
        <h2 className="text-2xl font-bold">Our Commitment</h2>
        <p className="mx-auto mt-3 max-w-3xl leading-7 text-gray-400">We are committed to transparency, accountability, and community safety. Every report is treated with importance and handled with care.</p>
      </section>

      <footer className="border-t border-[#2e303a] pt-6 text-center text-sm text-gray-500">© 2026 HazardWatch. All rights reserved.</footer>
    </div>
  </main>
);

export default AboutPage;
