    import React, { useEffect, useRef, useState } from 'react';
    import { Link } from 'react-router-dom';
    import AOS from 'aos';
    import 'aos/dist/aos.css';
    import StaticMap from '../components/StaticMap';

    const HomePage = () => {
    const sectionRefs = useRef([]);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    // Initialize AOS
    useEffect(() => {
        AOS.init({
        duration: 800,
        easing: 'ease-in-out',
        once: false,
        mirror: true,
        });
    }, []);

    // Mouse move handler for cursor glow
    useEffect(() => {
        const handleMouseMove = (e) => {
        setMousePos({ x: e.clientX, y: e.clientY });
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
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

    // Statistics data
    const stats = [
        { value: '1,240+', label: 'Total Reports' },
        { value: '86', label: 'Active Hazards' },
        { value: '1,154', label: 'Resolved Cases' },
        { value: '24', label: 'Areas Covered' }
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
            description: 'Phone, email, mail, social media – reports land everywhere, just not consolidated.',
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

    // Hazard Categories with improved icons
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

    // Most Hazard Reports with stats included
    const topHazards = [
        {
        id: 1,
        title: 'Flooding',
        category: 'Flood',
        reports: 342,
        status: 'Most Reported',
        description: 'Flooding is the most frequently reported hazard in Dagupan City.'
        },
        {
        id: 2,
        title: 'Damaged Roads',
        category: 'Traffic / Road',
        reports: 218,
        status: 'High',
        description: 'Road damage and potholes are a recurring issue across the city.'
        },
        {
        id: 3,
        title: 'Waste Disposal',
        category: 'Waste / Sanitation',
        reports: 156,
        status: 'High',
        description: 'Improper waste disposal is a major concern in several barangays.'
        }
    ];

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
    const bgClasses = [
        'bg-[#0d0d0f]',      // Dark Gray
        'bg-[#0f1729]',      // Dark Blue 1
        'bg-[#0a0b0f]',      // Black
        'bg-[#111d33]'       // Dark Blue 2
    ];

    // Border colors for alternating sections
    const borderClasses = [
        'border-[#1a1a1f]',
        'border-[#1a2744]',
        'border-[#14141a]',
        'border-[#1f2f4a]'
    ];

    // Card background colors for alternating sections
    const cardBgClasses = [
        'bg-[#14151d]',
        'bg-[#1a233a]',
        'bg-[#111218]',
        'bg-[#1d2842]'
    ];

    const cardBorderClasses = [
        'border-[#2e303a]',
        'border-[#25334f]',
        'border-[#22242c]',
        'border-[#2a3a5a]'
    ];

    // Function to get background class based on index
    const getBgClass = (index) => bgClasses[index % bgClasses.length];
    const getBorderClass = (index) => borderClasses[index % borderClasses.length];
    const getCardBgClass = (index) => cardBgClasses[index % cardBgClasses.length];
    const getCardBorderClass = (index) => cardBorderClasses[index % cardBorderClasses.length];

    return (
        <div className="min-h-screen relative overflow-x-hidden">
        {/* ============================================================ */}
        {/* CURSOR GLOW EFFECT - follows mouse */}
        {/* ============================================================ */}
        <div
            className="fixed pointer-events-none z-[9999] rounded-full"
            style={{
            left: mousePos.x - 350,
            top: mousePos.y - 350,
            width: '700px',
            height: '700px',
            background: 'radial-gradient(circle, rgba(59, 130, 246, 0.12) 0%, rgba(59, 130, 246, 0.04) 40%, transparent 70%)',
            transition: 'left 0.05s ease-out, top 0.05s ease-out',
            willChange: 'transform',
            transform: 'translateZ(0)',
            }}
        />

        {/* ============================================================ */}
        {/* 1. HERO SECTION - DARK MAP BACKGROUND */}
        {/* ============================================================ */}
        <section className="relative overflow-hidden min-h-screen">
            <div className="absolute inset-0 z-0">
            <StaticMap />
            <div className="absolute inset-0 bg-[#0a0b0f]/60 backdrop-blur-[2px]"></div>
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-8 md:px-12 py-24 md:py-32 min-h-screen flex flex-col justify-center">
            <div className="max-w-3xl" data-aos="fade-up" data-aos-duration="1000">
                <div className="inline-block mb-6 px-4 py-1.5 border border-[#3b82f6]/30 rounded-full bg-[#3b82f6]/10 text-[#60a5fa] text-sm font-medium tracking-wide">
                Dagupan City • Community Safety
                </div>
                
                <h1 className="text-5xl md:text-7xl font-bold text-white leading-[1.1] mb-6">
                Report Hazards.
                <br />
                Track Incidents.
                <br />
                <span className="text-[#3b82f6]">Keep Your Community Safe.</span>
                </h1>
                
                <p className="text-lg md:text-xl text-white max-w-2xl mb-8 leading-relaxed">
                Report hazards, track incidents, and keep your community informed in real time. 
                HazardWatch connects citizens and local staff in one platform for faster reporting, 
                monitoring, and response.
                </p>
                
                <div className="flex flex-wrap gap-4">
                <Link 
                    to="/submit" 
                    className="px-8 py-3.5 bg-[#3b82f6] hover:bg-[#2563eb] text-white font-semibold rounded-xl transition shadow-lg shadow-[#3b82f6]/30 hover:shadow-[#3b82f6]/50 text-base"
                >
                    Report a Hazard →
                </Link>
                <Link 
                    to="/map" 
                    className="px-8 py-3.5 bg-[#14151d] border border-[#2e303a] text-white font-semibold rounded-xl hover:bg-[#1f2028] transition text-base"
                >
                    View Hazard Map
                </Link>
                </div>
            </div>
            </div>
        </section>

        {/* ============================================================ */}
        {/* 2. WHY EMAIL AND PHONE ARE NO LONGER ENOUGH - UPDATED ICONS */}
        {/* ============================================================ */}
        <section 
            ref={addToRefs}
            className={`w-full px-8 md:px-12 py-16 md:py-20 opacity-0 translate-y-10 transition-all duration-700 ${getBgClass(0)} border-t ${getBorderClass(0)}`}
            data-aos="fade-up"
            data-aos-delay="100"
        >
            <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12" data-aos="fade-down" data-aos-delay="200">
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Why email and phone are <span className="text-[#3b82f6]">no longer enough</span>
                </h2>
                <p className="text-gray-400 text-lg max-w-3xl mx-auto">
                Citizens expect digital services. Administrations struggle with fragmented channels and rising demands.
                </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {problems.map((problem, index) => (
                <div 
                    key={index}
                    className={`${getCardBgClass(0)} border ${getCardBorderClass(0)} rounded-xl p-6 hover:border-[#3b82f6]/30 transition hover:shadow-lg hover:shadow-[#3b82f6]/5`}
                    data-aos="fade-up"
                    data-aos-delay={100 + index * 100}
                >
                    <div className="w-10 h-10 bg-[#3b82f6]/10 rounded-lg flex items-center justify-center mb-3">
                    {problem.icon}  {/* <-- UPDATED: uses problem.icon */}
                    </div>
                    <h4 className="text-white font-semibold text-sm mb-2">{problem.title}</h4>
                    <p className="text-xs text-gray-400 leading-relaxed">{problem.description}</p>
                </div>
                ))}
            </div>
            <div className="text-center mt-8" data-aos="fade-up" data-aos-delay="500">
                <p className="text-sm text-[#3b82f6] font-medium border border-[#3b82f6]/20 rounded-full px-6 py-2 inline-block bg-[#3b82f6]/5">
                HazardWatch consolidates all channels, creates transparency, and delivers data for better decisions.
                </p>
            </div>
            </div>
        </section>

        {/* ============================================================ */}
        {/* 3. HOW HAZARDWATCH WORKS - DARK BLUE 1 */}
        {/* ============================================================ */}
        <section 
            ref={addToRefs}
            className={`w-full px-8 md:px-12 py-16 md:py-20 opacity-0 translate-y-10 transition-all duration-700 ${getBgClass(1)} border-t ${getBorderClass(1)}`}
            data-aos="fade-up"
            data-aos-delay="100"
        >
            <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-12" data-aos="fade-down" data-aos-delay="200">
                How <span className="text-[#3b82f6]">HazardWatch</span> Works
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
                <div className="hidden lg:block absolute top-16 left-0 right-0 h-0.5 bg-[#1a2744] z-0"></div>
                {steps.map((step, index) => (
                <div key={index} className="relative z-10" data-aos="fade-up" data-aos-delay={100 + index * 150}>
                    <div className={`${getCardBgClass(1)} border ${getCardBorderClass(1)} rounded-xl p-6 text-center hover:border-[#3b82f6]/30 transition h-full`}>
                    <div className="w-12 h-12 bg-[#3b82f6]/15 rounded-full flex items-center justify-center mx-auto mb-4 text-[#3b82f6] font-bold text-lg">
                        {step.number}
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">{step.title}</h3>
                    <p className="text-sm text-gray-400 leading-relaxed">{step.description}</p>
                    </div>
                </div>
                ))}
            </div>
            </div>
        </section>

        {/* ============================================================ */}
        {/* 4. WHAT CAN YOU REPORT? - BLACK */}
        {/* ============================================================ */}
        <section 
            ref={addToRefs}
            className={`w-full px-8 md:px-12 py-16 md:py-20 opacity-0 translate-y-10 transition-all duration-700 ${getBgClass(2)} border-t ${getBorderClass(2)}`}
            data-aos="fade-up"
            data-aos-delay="100"
        >
            <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-4" data-aos="fade-down" data-aos-delay="200">
                What Can You <span className="text-[#3b82f6]">Report</span>?
            </h2>
            <p className="text-gray-400 text-center max-w-2xl mx-auto mb-12" data-aos="fade-up" data-aos-delay="300">
                Browse the types of hazards you can report in your community.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {categories.map((category, index) => (
                <div 
                    key={index}
                    className={`${getCardBgClass(2)} border ${getCardBorderClass(2)} rounded-xl p-6 hover:border-[#3b82f6]/30 transition hover:shadow-lg hover:shadow-[#3b82f6]/5`}
                    data-aos="zoom-in"
                    data-aos-delay={100 + index * 80}
                >
                    <div className="w-12 h-12 bg-[#3b82f6]/10 rounded-lg flex items-center justify-center mb-3">
                    {category.icon}
                    </div>
                    <h4 className="text-white font-semibold text-sm mb-1">{category.name}</h4>
                    <p className="text-xs text-gray-500 leading-relaxed">{category.description}</p>
                </div>
                ))}
            </div>
            </div>
        </section>

        {/* ============================================================ */}
        {/* 5. MOST HAZARD REPORTS - DARK BLUE 2 */}
        {/* ============================================================ */}
        <section 
            ref={addToRefs}
            className={`w-full px-8 md:px-12 py-16 md:py-20 opacity-0 translate-y-10 transition-all duration-700 ${getBgClass(3)} border-t ${getBorderClass(3)}`}
            data-aos="fade-up"
            data-aos-delay="100"
        >
            <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12" data-aos="fade-down" data-aos-delay="200">
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Most <span className="text-[#3b82f6]">Hazard Reports</span>
                </h2>
                <p className="text-gray-400 max-w-2xl mx-auto">
                Overview of the most frequently reported hazards in Dagupan City.
                </p>
            </div>

            {/* STATISTICS CARDS */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
                {stats.map((stat, index) => (
                <div 
                    key={index}
                    className={`${getCardBgClass(3)} border ${getCardBorderClass(3)} rounded-xl p-6 text-center hover:border-[#3b82f6]/30 transition hover:shadow-lg hover:shadow-[#3b82f6]/5`}
                    data-aos="fade-up"
                    data-aos-delay={100 + index * 100}
                >
                    <div className="text-2xl md:text-3xl font-bold text-white">{stat.value}</div>
                    <div className="text-sm text-gray-400 mt-1">{stat.label}</div>
                </div>
                ))}
            </div>

            {/* TOP HAZARDS LIST */}
            <div className="flex justify-between items-center mb-6" data-aos="fade-right" data-aos-delay="200">
                <h3 className="text-xl font-semibold text-white">Top Reported Hazards</h3>
                <Link to="/reports" className="text-[#3b82f6] hover:text-[#2563eb] text-sm font-medium transition">
                View All →
                </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {topHazards.map((hazard, index) => (
                <div key={hazard.id} className={`${getCardBgClass(3)} border ${getCardBorderClass(3)} rounded-xl p-6 hover:border-[#3b82f6]/30 transition hover:shadow-lg hover:shadow-[#3b82f6]/5`} data-aos="fade-up" data-aos-delay={100 + index * 150}>
                    <div className="flex justify-between items-start mb-2">
                    <h4 className="text-white font-semibold">{hazard.title}</h4>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                        hazard.status === 'Most Reported' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                        'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                    }`}>
                        {hazard.status}
                    </span>
                    </div>
                    <div className="text-xs text-gray-400 mb-2">{hazard.category}</div>
                    <div className="text-sm text-gray-300 mb-3">{hazard.description}</div>
                    <div className="flex justify-between items-center">
                    <span className="text-sm text-[#3b82f6] font-medium">{hazard.reports} reports</span>
                    <button className="text-xs text-[#3b82f6] hover:text-[#2563eb] transition">View Details →</button>
                    </div>
                </div>
                ))}
            </div>
            </div>
        </section>

        {/* ============================================================ */}
        {/* 6. COMMUNITY PARTICIPATION - DARK GRAY */}
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
        {/* 7. BUILT FOR SAFER COMMUNITIES - DARK BLUE 1 (FASTER ANIMATION) */}
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

            {/* Continuous Left-to-Right Scrolling Marquee - FASTER (15s) */}
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

        {/* ============================================================ */}
        {/* 8. EMERGENCY NOTICE - BLACK */}
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
        {/* 9. FINAL CTA - DARK BLUE 2 */}
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
                    Report a Hazard →
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
        {/* 10. FOOTER - DARK GRAY */}
        {/* ============================================================ */}
        <footer className={`w-full px-8 md:px-12 border-t ${getBorderClass(0)} pt-12 pb-8 ${getBgClass(0)}`}>
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