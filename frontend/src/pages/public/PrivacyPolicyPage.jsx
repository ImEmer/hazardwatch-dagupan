import React, { useEffect } from 'react';

const sections = [
  ['Introduction', 'HazardWatch helps Dagupan City residents report community hazards and lets authorized responders coordinate follow-up.'],
  ['Information We Collect', 'We collect your name, email, barangay, report details, submitted photos, and report locations when you use the platform.'],
  ['How We Use Information', 'We use information to respond to reports, improve services, understand community trends, and provide status updates.'],
  ['Data Storage & Security', 'Account passwords are protected with bcrypt, sessions use JWT, report data is stored with MongoDB Atlas, and report photos are delivered through Cloudinary.'],
  ['Sharing of Information', 'Report information is shared only with authorized barangay officials and city responders who need it to address the reported issue.'],
  ['User Rights', 'You may access, correct, or request deletion of your personal data through your Profile settings or by contacting us.'],
  ['Cookies & Analytics', 'HazardWatch may use essential browser storage and privacy-conscious analytics to keep the service reliable and understand usage.'],
  ['Contact Information', 'For privacy questions, email hazardwatch@dagupan.gov.ph.'],
  ['Updates to this Policy', 'We may update this policy as the platform changes. The latest version will always be posted on this page.'],
];

const PrivacyPolicyPage = () => { useEffect(() => { document.title = 'Privacy Policy | HazardWatch'; }, []); return <main className="min-h-screen bg-[#0a0b0f] px-4 pb-16 pt-28 text-white"><div className="mx-auto max-w-4xl space-y-6"><header><p className="text-xs uppercase tracking-[0.25em] text-[#60a5fa]">HazardWatch</p><h1 className="mt-3 text-4xl font-bold">Privacy Policy</h1><p className="mt-3 text-gray-400">How HazardWatch handles information shared through the platform.</p></header><article className="space-y-6 rounded-2xl border border-[#2e303a] bg-[#14151d] p-6 md:p-8">{sections.map(([title, text]) => <section key={title}><h2 className="text-xl font-semibold">{title}</h2><p className="mt-2 leading-7 text-gray-400">{text}</p></section>)}</article></div></main>; };
export default PrivacyPolicyPage;
