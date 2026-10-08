    import React, { useEffect, useRef, useState } from 'react';
    import { Link, useNavigate } from 'react-router-dom';
    import AOS from 'aos';
    import 'aos/dist/aos.css';
    import StaticMap from '../../components/StaticMap';
    import api from '../../services/api';
    import useAuth from '../../hooks/useAuth';
    import useTheme from '../../hooks/useTheme';

    const CATEGORY_GROUPS = {
        Flooding: 'Flood', 'Clogged Drainage': 'Water and Drainage', 'Pothole': 'Road and Traffic',
        'Damaged Road': 'Road and Traffic', 'Broken Streetlight': 'Road and Traffic',
        'Waste Disposal': 'Waste and Sanitation', 'Illegal Dumping': 'Waste and Sanitation',
        'Damaged Public Facility': 'Public Safety', 'Fallen Electrical Wire': 'Public Safety',
    };

    const CATEGORY_DESCRIPTIONS = {
        Flooding: 'Flooding and rising water reports across Dagupan City.',
        'Clogged Drainage': 'Drainage issues affecting roads and neighborhoods.',
        Pothole: 'Road surface hazards reported by the community.',
        'Damaged Road': 'Damaged roads and unsafe traffic routes.',
        'Broken Streetlight': 'Streetlight outages and nighttime visibility concerns.',
    };

    const HomePage = () => {
    const { user, token, loading } = useAuth();
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const navigate = useNavigate();
    const sectionRefs = useRef([]);
    const [publicStats, setPublicStats] = useState({ totalReports: 0, activeHazards: 0, resolvedCases: 0, areasCovered: 0, topCategories: [] });
    const [statsLoading, setStatsLoading] = useState(true);

    useEffect(() => {
        if (loading || !token || !user) return;

        const role = user.role?.toLowerCase();
        const dashboardByRole = {
            superadmin: '/superadmin/dashboard',
            admin: '/admin/dashboard',
            barangay: '/barangay/dashboard',
        };
        const dashboard = dashboardByRole[role];
        if (dashboard) navigate(dashboard, { replace: true });
    }, [loading, navigate, token, user]);

    // Initialize AOS
    useEffect(() => {
        AOS.init({
        duration: 800,
        easing: 'ease-in-out',
        once: false,
        mirror: true,
        });
    }, []);

    useEffect(() => {
        let cancelled = false;
        api.get('/statistics/public')
            .then((response) => {
                if (!cancelled) setPublicStats(response.data || {});
            })
            .catch(() => {
                if (!cancelled) setPublicStats({ totalReports: 0, activeHazards: 0, resolvedCases: 0, areasCovered: 0, topCategories: [] });
            })
            .finally(() => {
                if (!cancelled) setStatsLoading(false);
            });
        return () => { cancelled = true; };
    }, []);

    // Scroll animation observer
    useEffect(() => {
        const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('opacity-100', 'translate-y-0');
                entry.target.classList.remove('opacity-0', 'translate-y-10');
            }
            });
        },
        { threshold: 0.1 }
        );

        sectionRefs.current.forEach((ref) => {
        if (ref) observer.observe(ref);
        });

        return () => observer.disconnect();
    }, []);

    const addToRefs = (el) => {
        if (el && !sectionRefs.current.includes(el)) {
        sectionRefs.current.push(el);
        }
    };

    const stats = [
        { value: publicStats.totalReports, label: 'Total Reports' },
        { value: publicStats.activeHazards, label: 'Active Hazards' },
        { value: publicStats.resolvedCases, label: 'Resolved Cases' },
        { value: publicStats.areasCovered, label: 'Areas Covered' }
    ];

    // How It Works steps
    const steps = [
        { number: '01', title: 'Report', description: 'Citizens submit a hazard report with its location, category, description, and photo.' },
        { number: '02', title: 'Verify', description: 'Authorized staff reviews and verifies submitted reports.' },
        { number: '03', title: 'Monitor', description: 'Verified hazards appear on the map and can be monitored in real time.' },
        { number: '04', title: 'Resolve', description: 'Staff updates the report once the hazard has been addressed.' }
    ];

    // ===== PROBLEM SECTION - WITH PROPER ICONS =====
        const problems = [
        {
            title: 'Too many channels',
            description: 'Phone, email, paper forms, social media — reports land everywhere, just not consolidated.',
            icon: (
            <svg className="w-5 h-5 text-[#3b82f6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            )
        },
        {
            title: 'Black box for citizens',
            description: 'What happens to my report? Without transparency, frustration grows.',
            icon: (
            <svg className="w-5 h-5 text-[#3b82f6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            )
        },
        {
            title: 'Manual assignment',
            description: 'Every report must be read, categorized, and forwarded. That takes time.',
            icon: (
            <svg className="w-5 h-5 text-[#3b82f6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            )
        },
        {
            title: 'No analysis',
            description: 'Where do problems cluster? Without structured data, planning is guesswork.',
            icon: (
            <svg className="w-5 h-5 text-[#3b82f6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            )
        }
        ];

    // Hazard Categories 
    const categories = [
        { 
        name: 'Traffic / Road', 
        description: 'Road damage, traffic accidents, and congestion.',
        icon: (
            <svg className="w-6 h-6 text-[#3b82f6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 11l1.5-4.5h11L19 11M5 11h14M5 11v6h2v-2h10v2h2v-6" />
            <circle cx="7" cy="17" r="2" />
            <circle cx="17" cy="17" r="2" />
            </svg>
        )
        },
        { 
        name: 'Fire', 
        description: 'Fire hazards, smoke, and fire-related incidents.',
        icon: (
            <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 2C12 2 8 6 8 10c0 2.2 1.8 4 4 4s4-1.8 4-4c0-4-4-8-4-8z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14c-3.3 0-6 2.7-6 6v2h12v-2c0-3.3-2.7-6-6-6z" />
            </svg>
        )
        },
        { 
        name: 'Flood', 
        description: 'Flooding, rising water levels, and drainage issues.',
        icon: (
            <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 2C12 2 6 10 6 14c0 3.3 2.7 6 6 6s6-2.7 6-6c0-4-6-12-6-12z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 16c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z" />
            </svg>
        )
        },
        { 
        name: 'Infrastructure', 
        description: 'Damaged buildings, bridges, and public structures.',
        icon: (
            <svg className="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
        )
        },
        { 
        name: 'Public Safety', 
        description: 'Crime, suspicious activities, and safety concerns.',
        icon: (
            <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
        )
        },
        { 
        name: 'Electrical / Streetlight', 
        description: 'Fallen lines, broken streetlights, and electrical hazards.',
        icon: (
            <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
        )
        },
        { 
        name: 'Waste / Sanitation', 
        description: 'Improper waste disposal and sanitation issues.',
        icon: (
            <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 11h14M5 11l2-7h10l2 7M5 11v10a2 2 0 002 2h10a2 2 0 002-2V11m-7 0v7m-3-7v7" />
            </svg>
        )
        },
        { 
        name: 'Environmental', 
        description: 'Pollution, deforestation, and environmental hazards.',
        icon: (
            <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v16h16M4 20l6-6 4 4 6-6" />
            <circle cx="18" cy="6" r="2" />
            </svg>
        )
        }
    ];

    const topHazards = publicStats.topCategories.map(({ category, count }, index) => ({
        id: category,
        title: category,
        category: CATEGORY_GROUPS[category] || 'Community hazard',
        reports: count,
        status: index === 0 ? 'Most Reported' : 'High',
        description: CATEGORY_DESCRIPTIONS[category] || `${count} reports recorded across Dagupan City.`,
    }));

    // ===== FEATURES FOR "Built for Safer Communities" =====
    const communityFeatures = [
        {
        title: 'Real-Time Reporting',
        description: 'Receive hazard reports as they happen.',
        icon: (
            <svg className="w-8 h-8 text-[#3b82f6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        )
        },
        {
        title: 'Location-Based',
        description: 'Every report is associated with a specific location.',
        icon: (
            <svg className="w-8 h-8 text-[#3b82f6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
        )
        },
        {
        title: 'Centralized Monitoring',
        description: 'Manage reports and incidents from one platform.',
        icon: (
            <svg className="w-8 h-8 text-[#3b82f6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
            </svg>
        )
        },
        {
        title: 'Community-Driven',
        description: 'Residents actively contribute to community safety.',
        icon: (
            <svg className="w-8 h-8 text-[#3b82f6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
        )
        }
    ];

    // Benefits
    const benefits = [
        { title: 'Report Hazards', description: 'Submit detailed reports with photos and location.' },
        { title: 'Provide Evidence', description: 'Attach photos and information to support your report.' },
        { title: 'Pinpoint Locations', description: 'Mark exact locations on the interactive map.' },
        { title: 'Monitor Report Status', description: 'Track your report from submission to resolution.' }
    ];

    // Background color classes for alternating sections
    const bgClasses = isDark
        ? ['bg-[#0d0d0f]', 'bg-[#0f1729]', 'bg-[#0a0b0f]', 'bg-[#111d33]']
        : ['bg-white', 'bg-slate-50', 'bg-white', 'bg-slate-50'];

    // Border colors for alternating sections
    const borderClasses = isDark
        ? ['border-[#1a1a1f]', 'border-[#1a2744]', 'border-[#14141a]', 'border-[#1f2f4a]']
        : ['border-gray-200', 'border-gray-200', 'border-gray-200', 'border-gray-200'];

    // Card background colors for alternating sections
    const cardBgClasses = isDark
        ? ['bg-[#14151d]', 'bg-[#1a233a]', 'bg-[#111218]', 'bg-[#1d2842]']
        : ['bg-white shadow-sm', 'bg-white shadow-sm', 'bg-white shadow-sm', 'bg-white shadow-sm'];

    const cardBorderClasses = isDark
        ? ['border-[#2e303a]', 'border-[#25334f]', 'border-[#22242c]', 'border-[#2a3a5a]']
        : ['border-gray-200', 'border-gray-200', 'border-gray-200', 'border-gray-200'];

    // Function to get background class based on index
    const getBgClass = (index) => bgClasses[index % bgClasses.length];
    const getBorderClass = (index) => borderClasses[index % borderClasses.length];
    const getCardBgClass = (index) => cardBgClasses[index % cardBgClasses.length];
    const getCardBorderClass = (index) => cardBorderClasses[index % cardBorderClasses.length];

    return (
        <div className="homepage-container min-h-screen relative overflow-x-clip">

        {/* ============================================================ */}
        {/* 1. HERO SECTION - DARK MAP BACKGROUND */}
        {/* ============================================================ */}
        <section className="relative min-h-screen overflow-hidden">
            <div className="absolute inset-0 z-0">
            <StaticMap />
            <div className={`absolute inset-0 backdrop-blur-[2px] ${isDark ? 'bg-[#0a0b0f]/60' : 'bg-white/80'}`}></div>
            </div>

            <div className="relative z-10 mx-auto flex min-h-screen max-w-7xl flex-col justify-center px-8 py-24 md:px-12 md:py-32">
            <div className="max-w-3xl" data-aos="fade-up" data-aos-duration="1000">
                <div className="mb-6 inline-block rounded-full border border-[#3b82f6]/30 bg-[#3b82f6]/10 px-4 py-1.5 text-sm font-medium tracking-wide text-[#60a5fa]">
                Dagupan City - Community Safety
                </div>

                <h1 className={`mb-6 text-5xl font-bold leading-[1.1] md:text-7xl ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Report Hazards.
                <br />
                Track Incidents.
                <br />
                <span className="text-[#3b82f6]">Keep Your Community Safe.</span>
                </h1>

                <p className={`mb-8 max-w-2xl text-lg leading-relaxed md:text-xl ${isDark ? 'text-white' : 'text-gray-600'}`}>
                Report hazards, track incidents, and keep your community informed in real time.
                HazardWatch connects citizens and local staff in one platform for faster reporting,
                monitoring, and response.
                </p>

                <div className="flex flex-wrap gap-4">
                <Link to="/submit" className="rounded-xl bg-[#3b82f6] px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-[#3b82f6]/30 transition hover:bg-[#2563eb] hover:shadow-[#3b82f6]/50">
                    Report a Hazard
                </Link>
                <Link to="/map" className={`rounded-xl border px-8 py-3.5 text-base font-semibold transition ${isDark ? 'border-[#2e303a] bg-[#14151d] text-white hover:bg-[#1f2028]' : 'border-gray-300 bg-white text-gray-900 hover:bg-gray-100'}`}>
                    View Hazard Map
                </Link>
                </div>
            </div>
            </div>
        </section>

        {/* ============================================================ */}
        {/* 2. WHY EMAIL AND PHONE ARE NO LONGER ENOUGH */}
        {/* ============================================================ */}
        <section 
            ref={addToRefs}
            className={`w-full px-4 sm:px-6 lg:px-8 py-20 md:py-24 opacity-0 translate-y-10 transition-all duration-700 ${getBgClass(0)} border-t ${getBorderClass(0)}`}
            data-aos="fade-up"
            data-aos-delay="100"
        >
            <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 gap-12 md:grid-cols-[2fr_3fr] md:gap-16">
            <header className="self-start md:sticky md:top-28" data-aos="fade-down" data-aos-delay="200">
                <h2 className="mb-4 text-3xl font-bold text-white md:text-4xl">
                Why email and social media are <span className="text-[#3b82f6]">no longer enough</span>
                </h2>
                <p className="text-lg leading-relaxed text-gray-400">
                Citizens expect digital services. Administrations struggle with fragmented channels and rising demands.
                </p>
            </header>
            <div className="divide-y divide-slate-200 dark:divide-slate-800">
                {problems.map((problem, index) => (
                <div
                    key={index}
                    className="flex gap-4 py-5 first:pt-0 last:pb-0"
                    data-aos="fade-up"
                    data-aos-delay={100 + index * 100}
                >
                    <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#3b82f6]/10">
                    {problem.icon}
                    </div>
                    <div>
                        <h3 className="mb-1 font-semibold text-white">{problem.title}</h3>
                        <p className="text-sm leading-relaxed text-gray-400">{problem.description}</p>
                    </div>
                </div>
                ))}
            </div>
            </div>
            <p className="mt-10 border-l-2 border-[#3b82f6] bg-[#3b82f6]/5 py-4 pl-5 text-sm font-medium leading-relaxed text-[#60a5fa] md:text-base" data-aos="fade-up" data-aos-delay="500">
                HazardWatch consolidates all channels, creates transparency, and delivers data for better decisions.
            </p>
            </div>
        </section>

        {/* ============================================================ */}
        {/* 3. HOW HAZARDWATCH WORKS*/}
        {/* ============================================================ */}
        <section 
            ref={addToRefs}
            className={`w-full px-4 sm:px-6 lg:px-8 py-20 md:py-24 opacity-0 translate-y-10 transition-all duration-700 ${getBgClass(1)} border-t ${getBorderClass(1)}`}
            data-aos="fade-up"
            data-aos-delay="100"
        >
            <div className="max-w-7xl mx-auto">
            <h2 className="mb-12 text-3xl font-bold text-white md:text-4xl" data-aos="fade-down" data-aos-delay="200">
                How <span className="text-[#3b82f6]">HazardWatch</span> Works
            </h2>
            <ol className="relative grid grid-cols-1 gap-8 before:absolute before:bottom-6 before:left-5 before:top-5 before:w-px before:bg-slate-300 dark:before:bg-slate-700 md:grid-cols-4 md:gap-6 md:before:bottom-auto md:before:left-[12.5%] md:before:right-[12.5%] md:before:top-5 md:before:h-px md:before:w-auto">
                {steps.map((step, index) => (
                <li key={index} className="relative z-10 flex gap-5 md:flex-col md:gap-5" data-aos="fade-up" data-aos-delay={100 + index * 150}>
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-[#3b82f6] ${isDark ? 'bg-[#0f1729]' : 'bg-slate-50'} text-sm font-bold tabular-nums text-[#3b82f6] md:mx-auto`}>
                        {step.number}
                    </div>
                    <div className="md:pt-1">
                        <h3 className="mb-2 text-lg font-semibold text-white">{step.title}</h3>
                        <p className="text-sm leading-relaxed text-gray-400">{step.description}</p>
                    </div>
                </li>
                ))}
            </ol>
            </div>
        </section>

        {/* ============================================================ */}
        {/* 4. WHAT CAN YOU REPORT? */}
        {/* ============================================================ */}
        <section 
            ref={addToRefs}
            className={`w-full px-4 sm:px-6 lg:px-8 py-20 md:py-24 opacity-0 translate-y-10 transition-all duration-700 ${getBgClass(2)} border-t ${getBorderClass(2)}`}
            data-aos="fade-up"
            data-aos-delay="100"
        >
            <div className="max-w-7xl mx-auto">
            <h2 className="mb-4 text-3xl font-bold text-white md:text-4xl" data-aos="fade-down" data-aos-delay="200">
                What Can You <span className="text-[#3b82f6]">Report</span>?
            </h2>
            <p className="mb-12 max-w-2xl text-gray-400" data-aos="fade-up" data-aos-delay="300">
                Browse the types of hazards you can report in your community.
            </p>
            <div className="grid grid-cols-1 gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-x-10">
                {categories.map((category, index) => (
                <article
                    key={index}
                    className="text-left"
                    data-aos={index < 4 ? 'fade-right' : 'fade-left'}
                    data-aos-delay={(index % 4) * 100}
                    data-aos-once="true"
                >
                    <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${isDark ? 'bg-slate-800/50' : 'bg-slate-100'}`}>
                    {category.icon}
                    </div>
                    <h3 className="mb-1 font-semibold text-white">{category.name}</h3>
                    <p className="text-sm leading-relaxed text-gray-400">{category.description}</p>
                </article>
                ))}
            </div>
            </div>
        </section>

        {/* ============================================================ */}
        {/* 5. MOST HAZARD REPORTS */}
        {/* ============================================================ */}
        <section 
            ref={addToRefs}
            className={`w-full px-4 sm:px-6 lg:px-8 py-20 md:py-24 opacity-0 translate-y-10 transition-all duration-700 ${getBgClass(3)} border-t ${getBorderClass(3)}`}
            data-aos="fade-up"
            data-aos-delay="100"
        >
            <div className="max-w-7xl mx-auto">
            <div className="mb-12" data-aos="fade-down" data-aos-delay="200">
                <h2 className="mb-4 text-3xl font-bold text-white md:text-4xl">
                Most <span className="text-[#3b82f6]">Hazard Reports</span>
                </h2>
                <p className="max-w-2xl text-gray-400">
                Overview of the most frequently reported hazards in Dagupan City.
                </p>
            </div>

            <div className="mb-12 grid grid-cols-2 gap-x-8 gap-y-8 border-b border-slate-200 pb-10 dark:border-slate-800 md:grid-cols-4 md:gap-x-6" aria-label="Report statistics">
                {statsLoading ? [1, 2, 3, 4].map((item) => (
                <div key={item} className="py-1">
                    <div className="h-9 w-24 animate-pulse rounded-md bg-slate-300/40 dark:bg-white/10" />
                    <div className="mt-2 h-4 w-28 animate-pulse rounded-md bg-slate-300/40 dark:bg-white/10" />
                </div>
                )) : stats.map((stat, index) => (
                <div
                    key={index}
                    className="py-1"
                    data-aos="fade-up"
                    data-aos-delay={100 + index * 100}
                >
                    <div className="text-3xl font-bold tracking-tight text-white tabular-nums md:text-4xl">{Number(stat.value || 0).toLocaleString()}</div>
                    <div className="mt-2 text-xs font-medium uppercase tracking-wide text-gray-400">{stat.label}</div>
                </div>
                ))}
            </div>

            {/* TOP HAZARDS LIST */}
            <div className="mb-5 flex items-center justify-between gap-4" data-aos="fade-right" data-aos-delay="200">
                <h3 className="text-xl font-semibold text-white">Top Reported Hazards</h3>
                <Link to="/map" className="shrink-0 text-sm font-medium text-[#60a5fa] transition hover:text-white">
                    View reports <span aria-hidden="true">→</span>
                </Link>
            </div>
            {statsLoading ? (
                <div className="divide-y divide-slate-200 dark:divide-slate-800">
                    {[1, 2, 3, 4].map((item) => <div key={item} className="flex items-center gap-4 py-5"><div className="h-4 w-8 animate-pulse rounded bg-slate-300/40 dark:bg-white/10" /><div className="h-4 w-40 animate-pulse rounded bg-slate-300/40 dark:bg-white/10" /></div>)}
                </div>
            ) : topHazards.length === 0 ? (
                <p className="py-8 text-gray-400">No data available yet.</p>
            ) : (
                <ol className="divide-y divide-slate-200 dark:divide-slate-800">
                {topHazards.map((hazard, index) => (
                <li key={hazard.id} className="grid grid-cols-[2rem_minmax(0,1fr)] items-center gap-x-4 gap-y-3 py-5 transition-colors hover:bg-slate-500/5 sm:grid-cols-[2.5rem_minmax(0,1fr)_auto]">
                    <span className="font-mono text-sm tabular-nums text-gray-500">{String(index + 1).padStart(2, '0')}</span>
                    <div className="min-w-0">
                        <h4 className="font-semibold text-white">{hazard.title}</h4>
                        <p className="mt-1 truncate text-sm text-gray-400">{hazard.category} · {hazard.description}</p>
                    </div>
                    <div className="col-start-2 flex flex-wrap items-center gap-3 sm:col-start-auto sm:justify-end">
                    <span className="text-sm tabular-nums text-gray-300">{Number(hazard.reports || 0).toLocaleString()} reports</span>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        hazard.status === 'Most Reported' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                        'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                    }`}>
                        {hazard.status}
                    </span>
                    </div>
                </li>
                ))}
                </ol>
            )}
            </div>
        </section>

        {false && (<>
        {/* ============================================================ */}
        {/* 6. COMMUNITY PARTICIPATION */}
        {/* ============================================================ */}
        <section 
            ref={addToRefs}
            className={`w-full px-8 md:px-12 py-16 md:py-20 opacity-0 translate-y-10 transition-all duration-700 ${getBgClass(0)} border-t ${getBorderClass(0)}`}
            data-aos="fade-up"
            data-aos-delay="100"
        >
            <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div data-aos="fade-right" data-aos-delay="200">
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                    Your Report Can Help Make Your <span className="text-[#3b82f6]">Community Safer</span>
                </h2>
                <p className="text-gray-300 text-lg leading-relaxed mb-6">
                    Citizens can help identify hazards by reporting incidents, providing photos and information, 
                    and sharing accurate locations. Every report helps build better awareness of community safety issues.
                </p>
                <div className="grid grid-cols-2 gap-4">
                    {benefits.map((benefit, index) => (
                    <div key={index} className={`${getCardBgClass(0)} border ${getCardBorderClass(0)} rounded-lg p-4 hover:border-[#3b82f6]/30 transition`} data-aos="fade-up" data-aos-delay={150 + index * 100}>
                        <h4 className="text-white font-semibold text-sm mb-1">{benefit.title}</h4>
                        <p className="text-xs text-gray-500">{benefit.description}</p>
                    </div>
                    ))}
                </div>
                </div>
                <div className={`${getCardBgClass(0)} border ${getCardBorderClass(0)} rounded-xl p-8`} data-aos="fade-left" data-aos-delay="300">
                <div className="text-center">
                    <div className="text-4xl mb-4 text-[#3b82f6]">
                    <svg className="w-16 h-16 mx-auto text-[#3b82f6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Join the Community</h3>
                    <p className="text-gray-400 text-sm mb-4">
                    Be part of the solution. Report hazards and help keep your community safe.
                    </p>
                    <Link 
                    to="/submit" 
                    className="inline-block px-6 py-2.5 bg-[#3b82f6] hover:bg-[#2563eb] text-white font-semibold rounded-lg transition shadow-lg shadow-[#3b82f6]/25 text-sm"
                    >
                    Report a Hazard
                    </Link>
                </div>
                </div>
            </div>
            </div>
        </section>

        {/* ============================================================ */}
        {/* 7. BUILT FOR SAFER COMMUNITIES  */}
        {/* ============================================================ */}
        <section 
            ref={addToRefs}
            className={`w-full px-8 md:px-12 py-16 md:py-20 opacity-0 translate-y-10 transition-all duration-700 ${getBgClass(1)} border-t ${getBorderClass(1)} overflow-hidden`}
            data-aos="fade-up"
            data-aos-delay="100"
        >
            <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12" data-aos="fade-down" data-aos-delay="200">
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Built for <span className="text-[#3b82f6]">Safer Communities</span>
                </h2>
                <p className="text-gray-400 text-center max-w-2xl mx-auto">
                Empowering citizens and authorities with real-time hazard intelligence.
                </p>
            </div>

            {/* Continuous Left-to-Right Scrolling Marquee  */}
            <div className="relative overflow-hidden">
                <div className="flex gap-6 animate-marquee-faster hover:pause">
                {[...communityFeatures, ...communityFeatures].map((feature, index) => (
                    <div 
                    key={index}
                    className={`flex-shrink-0 w-64 md:w-72 ${getCardBgClass(1)} border ${getCardBorderClass(1)} rounded-xl p-6 hover:border-[#3b82f6]/30 transition hover:shadow-lg hover:shadow-[#3b82f6]/5`}
                    style={{ width: '280px' }}
                    >
                    <div className="w-12 h-12 bg-[#3b82f6]/15 rounded-lg flex items-center justify-center mb-4">
                        {feature.icon}
                    </div>
                    <h4 className="text-white font-semibold mb-2">{feature.title}</h4>
                    <p className="text-sm text-gray-400 leading-relaxed">{feature.description}</p>
                    </div>
                ))}
                </div>
            </div>

            <style>{`
                @keyframes marquee-faster {
                0% { transform: translateX(0); }
                100% { transform: translateX(-50%); }
                }
                .animate-marquee-faster {
                display: flex;
                animation: marquee-faster 10s linear infinite;  
                gap: 1.5rem;
                }
                .animate-marquee-faster:hover {
                animation-play-state: paused;
                }
            `}</style>
            </div>
        </section>

        </>)}

        {/* ============================================================ */}
        {/* 8. EMERGENCY NOTICE  */}
        {/* ============================================================ */}
        <section 
            ref={addToRefs}
            className={`w-full px-8 md:px-12 py-8 md:py-10 opacity-0 translate-y-10 transition-all duration-700 ${getBgClass(2)} border-t ${getBorderClass(2)}`}
            data-aos="fade-up"
            data-aos-delay="100"
        >
            <div className="max-w-7xl mx-auto">
            <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4 md:p-6 flex flex-col md:flex-row items-center justify-between gap-4" data-aos="zoom-in" data-aos-delay="200">
                <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-red-500/20 rounded-full flex items-center justify-center text-red-400 font-bold text-sm">
                    <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
                <div>
                    <h4 className="text-white font-semibold text-sm">Emergency?</h4>
                    <p className="text-xs text-gray-400">
                    HazardWatch is designed for community hazard reporting and monitoring. For immediate emergencies, 
                    contact the appropriate emergency services.
                    </p>
                </div>
                </div>
                <div className="flex gap-2">
                <span className="px-3 py-1 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-xs font-medium">911</span>
                <span className="px-3 py-1 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-xs font-medium">Emergency</span>
                </div>
            </div>
            </div>
        </section>

        {/* ============================================================ */}
        {/* 9. FINAL CTA  */}
        {/* ============================================================ */}
        <section 
            ref={addToRefs}
            className={`w-full px-8 md:px-12 py-16 md:py-20 opacity-0 translate-y-10 transition-all duration-700 ${getBgClass(3)} border-t ${getBorderClass(3)}`}
            data-aos="fade-up"
            data-aos-delay="100"
        >
            <div className="max-w-7xl mx-auto">
            <div className={`${getCardBgClass(3)} border ${getCardBorderClass(3)} rounded-2xl p-12 text-center`} data-aos="zoom-in" data-aos-delay="200">
                <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
                See a Hazard? <span className="text-[#3b82f6]">Report It.</span>
                </h2>
                <p className="text-gray-400 text-lg max-w-2xl mx-auto mb-8">
                Help your community identify and monitor hazards in real time.
                </p>
                <div className="flex flex-wrap gap-4 justify-center">
                <Link 
                    to="/submit" 
                    className="px-8 py-3.5 bg-[#3b82f6] hover:bg-[#2563eb] text-white font-semibold rounded-xl transition shadow-lg shadow-[#3b82f6]/30 hover:shadow-[#3b82f6]/50 text-base"
                >
                    Report a Hazard
                </Link>
                <Link 
                    to="/map" 
                    className="px-8 py-3.5 bg-[#0f1729] border border-[#25334f] text-white font-semibold rounded-xl hover:bg-[#1a233a] transition text-base"
                >
                    Explore Hazard Map
                </Link>
                </div>
            </div>
            </div>
        </section>

        {/* ============================================================ */}
        {/* 10. FOOTER */}
        {/* ============================================================ */}
        <footer className={`hidden w-full px-8 md:px-12 border-t ${getBorderClass(0)} pt-12 pb-8 ${getBgClass(0)}`}>
            <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
                <div>
                <h3 className="text-xl font-bold text-white mb-3">HazardWatch</h3>
                <p className="text-sm text-gray-400">
                    Community-based hazard reporting and monitoring platform for Dagupan City.
                </p>
                </div>
                <div>
                <h4 className="text-white font-semibold mb-3">Navigation</h4>
                <ul className="space-y-2 text-sm">
                    <li><Link to="/" className="text-gray-400 hover:text-white transition">Home</Link></li>
                    <li><Link to="/submit" className="text-gray-400 hover:text-white transition">Report Hazard</Link></li>
                    <li><Link to="/map" className="text-gray-400 hover:text-white transition">Hazard Map</Link></li>
                    <li><Link to="/reports" className="text-gray-400 hover:text-white transition">Reports</Link></li>
                    <li><Link to="/about" className="text-gray-400 hover:text-white transition">About</Link></li>
                    <li><Link to="/contact" className="text-gray-400 hover:text-white transition">Contact</Link></li>
                </ul>
                </div>
                <div>
                <h4 className="text-white font-semibold mb-3">Legal</h4>
                <ul className="space-y-2 text-sm">
                    <li><Link to="/privacy" className="text-gray-400 hover:text-white transition">Privacy Policy</Link></li>
                    <li><Link to="/terms" className="text-gray-400 hover:text-white transition">Terms of Use</Link></li>
                </ul>
                </div>
                <div>
                <h4 className="text-white font-semibold mb-3">Connect</h4>
                <ul className="space-y-3 text-sm">
                    <li className="flex items-center gap-3 text-gray-400">
                    <svg className="w-5 h-5 text-[#3b82f6] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span>hazardwatch@dagupan.gov.ph</span>
                    </li>
                    <li className="flex items-center gap-3 text-gray-400">
                    <svg className="w-5 h-5 text-[#3b82f6] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <span>+63 (75) 123-4567</span>
                    </li>
                    <li className="text-gray-400">Dagupan City, Pangasinan</li>
                    <li className="text-gray-400">Philippines</li>
                </ul>
                </div>
            </div>
            <div className={`border-t ${getBorderClass(0)} pt-6 text-center`}>
                <p className="text-sm text-gray-500">&copy; 2026 HazardWatch. All rights reserved.</p>
            </div>
            </div>
        </footer>
        </div>
    );
    };

    export default HomePage;