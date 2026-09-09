    import React, { useEffect, useState } from 'react';
    import { Link } from 'react-router-dom';
    import AOS from 'aos';
    import 'aos/dist/aos.css';

    const faqs = [
    ['How do I submit a report?', 'Sign in, open Submit Report, choose a hazard type, describe what happened, upload photo evidence, and select the location on the map.'],
    ['What do the statuses mean?', 'Pending means the report is newly submitted. In Progress means staff are working on it. Resolved means the issue was addressed. Closed means the case is complete.'],
    ['Can I see my submitted reports?', 'Yes. Open My Reports from the navigation to search and filter your submissions.'],
    ['What should I do in an emergency?', 'HazardWatch is for community reporting. For immediate danger, contact the appropriate emergency service, including 911.'],
    ['How can I get support?', 'Contact the HazardWatch team at hazardwatch@dagupan.gov.ph or +63 (75) 123-4567.'],
    ];

    const HelpPage = () => {
    const [activeFAQ, setActiveFAQ] = useState(null);

    useEffect(() => {
        AOS.init({ duration: 800, easing: 'ease-in-out', once: true });
        AOS.refresh();
    }, []);

    return (
    <>
    <main className="min-h-screen bg-[#0a0b0f] px-4 pb-16 pt-28 text-white">
        <div className="mx-auto max-w-5xl space-y-8">
        <header data-aos="fade-up" className="rounded-2xl border border-[#2e303a] bg-[#14151d] p-8">
            <p className="text-xs uppercase tracking-[0.25em] text-[#60a5fa]">Support center</p>
            <h1 className="mt-3 text-3xl font-bold">Help & FAQ</h1>
            <p className="mt-3 max-w-2xl text-gray-400">Learn how to report hazards, follow progress, and get help using HazardWatch.</p>
        </header>
        <section data-aos="fade-up" data-aos-delay="100" className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-[#2e303a] bg-[#14151d] p-5 transition hover:border-[#3b82f6]/60">
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-[#3b82f6]/10 text-[#60a5fa]" aria-hidden="true"><svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" /></svg></div>
                <h2 className="font-semibold">Submit a report</h2>
                <p className="mt-2 text-sm text-gray-400">Share a hazard with its location, details, and photo evidence.</p>
                <Link to="/submit" className="mt-4 inline-block text-sm font-semibold text-[#60a5fa] hover:text-white">Start a report</Link>
            </div>
            <div className="rounded-2xl border border-[#2e303a] bg-[#14151d] p-5 transition hover:border-[#3b82f6]/60">
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400" aria-hidden="true"><svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M7 4h10v16H7zM9 8h6M9 12h6M9 16h3" /></svg></div>
                <h2 className="font-semibold">Track progress</h2>
                <p className="mt-2 text-sm text-gray-400">Check status updates and priorities for your submissions.</p>
                <Link to="/my-reports" className="mt-4 inline-block text-sm font-semibold text-[#60a5fa] hover:text-white">View my reports</Link>
            </div>
            <div className="rounded-2xl border border-[#2e303a] bg-[#14151d] p-5 transition hover:border-[#3b82f6]/60">
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400" aria-hidden="true"><svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M4 5h16v11H8l-4 3V5zM9 9h6M9 12h3" /></svg></div>
                <h2 className="font-semibold">Contact support</h2>
                <p className="mt-2 text-sm text-gray-400">Need help with a report or your account?</p>
                <a href="mailto:hazardwatch@dagupan.gov.ph" className="mt-4 inline-block text-sm font-semibold text-[#60a5fa] hover:text-white">Email the team</a>
            </div>
        </section>
        <section data-aos="fade-up" data-aos-delay="150" className="rounded-2xl border border-[#2e303a] bg-[#14151d] p-6">
            <h2 className="text-xl font-semibold">Getting started</h2>
            <ol className="mt-4 list-decimal space-y-3 pl-5 text-gray-300"><li>Sign in or create a citizen account.</li><li>Submit a report with a category, detailed description, photo, and map location.</li><li>Use My Reports to follow status and priority updates.</li></ol>
        </section>
        <section data-aos="fade-up" data-aos-delay="200" className="rounded-2xl border border-[#2e303a] bg-[#14151d] p-6">
            <h2 className="text-xl font-semibold">Frequently asked questions</h2>
            <div className="mt-4 space-y-2">{faqs.map(([question, answer], index) => (
                <div key={question} className="overflow-hidden rounded-xl border border-[#2e303a]">
                    <button type="button" onClick={() => setActiveFAQ(activeFAQ === index ? null : index)} aria-expanded={activeFAQ === index} className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left font-semibold text-white hover:bg-[#1a1a1f]">
                        <span>{question}</span><span className="text-xl text-gray-400" aria-hidden="true">{activeFAQ === index ? '-' : '+'}</span>
                    </button>
                    {activeFAQ === index && <p className="border-t border-[#2e303a] px-4 py-3 text-sm leading-6 text-gray-400">{answer}</p>}
                </div>
            ))}</div>
        </section>
        <section className="rounded-2xl border border-[#3b82f6]/30 bg-[#3b82f6]/5 p-6"><h2 className="text-xl font-semibold">Contact support</h2><p className="mt-2 text-gray-300">Email hazardwatch@dagupan.gov.ph or call +63 (75) 123-4567.</p></section>
        </div>
    </main>
    </>
    );
    };

    export default HelpPage;
