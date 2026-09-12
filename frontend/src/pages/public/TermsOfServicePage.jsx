import React, { useEffect } from 'react';

const sections = [
  ['Acceptance of Terms', 'By using HazardWatch, you agree to these terms and to use the service responsibly.'],
  ['User Responsibilities', 'Submit accurate reports, avoid false claims, and keep descriptions, locations, and uploaded material respectful and useful.'],
  ['Prohibited Activities', 'Do not spam the service, upload malicious files, impersonate another person, or interfere with platform operations.'],
  ['Account Suspension & Termination', 'Accounts may be suspended or removed for abuse, fraud, repeated false reports, or violations of these terms.'],
  ['Intellectual Property', 'HazardWatch software, branding, and platform content are protected. You retain rights to material you submit while granting the service permission to process it for reporting.'],
  ['Disclaimer', 'HazardWatch supports community reporting and coordination. It is not an emergency response service. Contact emergency services for immediate danger.'],
  ['Limitation of Liability', 'The platform is provided to support communication and does not guarantee a particular response time or outcome from responders.'],
  ['Governing Law', 'These terms are governed by the laws of the Republic of the Philippines.'],
  ['Changes to Terms', 'We may update these terms as the service evolves. Continued use after an update means you accept the revised terms.'],
  ['Contact Information', 'Questions about these terms can be sent to hazardwatch@dagupan.gov.ph.'],
];

const TermsOfServicePage = () => { useEffect(() => { document.title = 'Terms of Service | HazardWatch'; }, []); return <main className="min-h-screen bg-[#0a0b0f] px-4 pb-16 pt-28 text-white"><div className="mx-auto max-w-4xl space-y-6"><header><p className="text-xs uppercase tracking-[0.25em] text-[#60a5fa]">HazardWatch</p><h1 className="mt-3 text-4xl font-bold">Terms of Service</h1><p className="mt-3 text-gray-400">The rules for using HazardWatch safely and responsibly.</p></header><article className="space-y-6 rounded-2xl border border-[#2e303a] bg-[#14151d] p-6 md:p-8">{sections.map(([title, text]) => <section key={title}><h2 className="text-xl font-semibold">{title}</h2><p className="mt-2 leading-7 text-gray-400">{text}</p></section>)}</article></div></main>; };
export default TermsOfServicePage;
