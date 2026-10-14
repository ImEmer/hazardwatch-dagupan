import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import StaticMap from '../../components/StaticMap';
import api from '../../services/api';
import useAuth from '../../hooks/useAuth';
import useTheme from '../../hooks/useTheme';

const CATEGORY_GROUPS = {
  Flooding: 'Flood',
  'Clogged Drainage': 'Water and Drainage',
  Pothole: 'Road and Traffic',
  'Damaged Road': 'Road and Traffic',
  'Broken Streetlight': 'Road and Traffic',
  'Waste Disposal': 'Waste and Sanitation',
  'Illegal Dumping': 'Waste and Sanitation',
  'Damaged Public Facility': 'Public Safety',
  'Fallen Electrical Wire': 'Public Safety',
};

const CATEGORY_DESCRIPTIONS = {
  Flooding: 'Flooding and rising water reports across Dagupan City.',
  'Clogged Drainage': 'Drainage issues affecting roads and neighborhoods.',
  Pothole: 'Road surface hazards reported by the community.',
  'Damaged Road': 'Damaged roads and unsafe traffic routes.',
  'Broken Streetlight': 'Streetlight outages and nighttime visibility concerns.',
};

const hazardTypes = [
  'Pothole',
  'Flooding',
  'Broken Streetlight',
  'Waste Disposal',
  'Damaged Road',
  'Fire Hazard',
  'Gas Leak',
  'Public Safety Hazard',
];

const problemItems = [
  {
    title: 'Too many channels',
    description: 'Reports get scattered across email, phone, and paper forms.',
    icon: (
      <svg className="h-5 w-5 text-[#3b82f6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    title: 'No status updates',
    description: 'Residents don\'t know whether a report was seen or fixed.',
    icon: (
      <svg className="h-5 w-5 text-[#3b82f6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
      </svg>
    ),
  },
  {
    title: 'Manual triage',
    description: 'Every case has to be read, checked, and forwarded by hand.',
    icon: (
      <svg className="h-5 w-5 text-[#3b82f6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    title: 'No trends',
    description: 'Without structured data, planners are guessing where to act first.',
    icon: (
      <svg className="h-5 w-5 text-[#3b82f6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
];

const steps = [
  {
    number: '01',
    title: 'Report',
    description: 'Residents submit hazards with location and photo evidence.',
  },
  {
    number: '02',
    title: 'Verify',
    description: 'Staff review and validate reports for accuracy and urgency.',
  },
  {
    number: '03',
    title: 'Monitor',
    description: 'Verified hazards appear on the live map for the public.',
  },
  {
    number: '04',
    title: 'Resolve',
    description: 'Teams update status once the issue is addressed.',
  },
];

const HomePage = () => {
  const { user, token, loading } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 1.4]);
  const heroRotateX = useTransform(scrollYProgress, [0, 1], [0, -8]);
  const heroY = useTransform(scrollYProgress, [0, 1], [0, -60]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.25], [1, 0.7]);

  const [publicStats, setPublicStats] = useState({
    totalReports: 0,
    activeHazards: 0,
    resolvedCases: 0,
    areasCovered: 0,
    topCategories: [],
  });
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsSectionVisible, setStatsSectionVisible] = useState(false);
  const [animatingStats, setAnimatingStats] = useState({
    totalReports: 0,
    activeHazards: 0,
    resolvedCases: 0,
    areasCovered: 0,
  });
  const statsRef = useRef(null);

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

  useEffect(() => {
    let cancelled = false;
    api.get('/statistics/public')
      .then((response) => {
        if (!cancelled) setPublicStats(response.data || {});
      })
      .catch(() => {
        if (!cancelled) {
          setPublicStats({
            totalReports: 0,
            activeHazards: 0,
            resolvedCases: 0,
            areasCovered: 0,
            topCategories: [],
          });
        }
      })
      .finally(() => {
        if (!cancelled) setStatsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (statsLoading) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setStatsSectionVisible(true);
        });
      },
      { threshold: 0.15 },
    );

    if (statsRef.current) observer.observe(statsRef.current);
    return () => observer.disconnect();
  }, [statsLoading]);

  useEffect(() => {
    if (!statsSectionVisible || statsLoading) return undefined;

    const animateTo = {
      totalReports: Number(publicStats.totalReports || 0),
      activeHazards: Number(publicStats.activeHazards || 0),
      resolvedCases: Number(publicStats.resolvedCases || 0),
      areasCovered: Number(publicStats.areasCovered || 0),
    };

    const duration = 900;
    const start = performance.now();

    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - (1 - progress) ** 3;

      setAnimatingStats({
        totalReports: Math.round(animateTo.totalReports * eased),
        activeHazards: Math.round(animateTo.activeHazards * eased),
        resolvedCases: Math.round(animateTo.resolvedCases * eased),
        areasCovered: Math.round(animateTo.areasCovered * eased),
      });

      if (progress < 1) requestAnimationFrame(tick);
    };

    const frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [statsSectionVisible, statsLoading, publicStats]);

  const statCards = [
    { label: 'Total Reports', value: animatingStats.totalReports },
    { label: 'Active Hazards', value: animatingStats.activeHazards },
    { label: 'Resolved Cases', value: animatingStats.resolvedCases },
    { label: 'Areas Covered', value: animatingStats.areasCovered },
  ];

  const topHazards = (publicStats.topCategories || []).map(({ category, count }, index) => ({
    id: category,
    title: category,
    category: CATEGORY_GROUPS[category] || 'Community hazard',
    reports: count,
    status: index === 0 ? 'Most Reported' : 'High',
    description: CATEGORY_DESCRIPTIONS[category] || `${count} reports recorded across Dagupan City.`,
  }));

  const marqueeHazards = [...hazardTypes, ...hazardTypes];

  return (
    <div className="homepage-container relative overflow-x-hidden bg-[#0a0b0f] text-white">
      <main className="relative isolate overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.28),transparent_35%),radial-gradient(circle_at_right,_rgba(6,182,212,0.22),transparent_28%),radial-gradient(circle_at_bottom,_rgba(14,116,144,0.18),transparent_30%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(10,11,15,0.2),rgba(10,11,15,0.9))]" />
        </div>

        <section className="relative min-h-screen overflow-hidden">
          <motion.div style={shouldReduceMotion ? undefined : { perspective: 1200 }} className="absolute inset-0">
            <motion.div
              style={
                shouldReduceMotion
                  ? { scale: 1, rotateX: 0, y: 0, transformStyle: 'preserve-3d' }
                  : { scale: heroScale, rotateX: heroRotateX, y: heroY, transformStyle: 'preserve-3d' }
              }
              className="absolute inset-0"
            >
              <div className="absolute inset-0 opacity-90">
                <StaticMap animated={false} showMarkers={false} />
              </div>
              <div className="absolute inset-0 bg-black/70 dark:bg-black/80" />
            </motion.div>
          </motion.div>

          <motion.div
            className="relative z-10 mx-auto grid min-h-screen max-w-7xl items-center gap-10 px-4 pb-12 pt-20 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8"
            style={shouldReduceMotion ? undefined : { y: heroY, opacity: heroOpacity }}
          >
            <div className="relative z-10 max-w-xl">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium uppercase tracking-[0.22em] text-sky-200/90 backdrop-blur-sm">
                <span className="h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.9)]" />
                Community hazard reporting
              </div>

              <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
                Report Hazards. Track Incidents. {' '}
                <span className="bg-brand-gradient-text bg-clip-text text-transparent">
                  Keep Your Community Safe.
                </span>
              </h1>

              <p className="mt-5 max-w-xl text-base leading-7 text-slate-300 sm:text-lg">
                A simple, transparent way to report issues, monitor hazards, and keep Dagupan City informed.
              </p>

              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <Link
                  to="/submit"
                  className="group inline-flex items-center justify-center rounded-full bg-brand-gradient px-6 py-3 text-sm font-semibold text-white shadow-[0_0_30px_rgba(37,99,235,0.35)] transition-all duration-300 hover:bg-brand-gradient-hover hover:shadow-[0_0_40px_rgba(34,211,238,0.45)] focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-2 focus:ring-offset-[#0a0b0f]"
                >
                  Report a Hazard
                </Link>

                <Link
                  to="/map"
                  className="inline-flex items-center justify-center rounded-full border border-sky-400/40 bg-transparent px-6 py-3 text-sm font-semibold text-sky-200 transition-all duration-300 hover:border-sky-300 hover:bg-sky-500/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-2 focus:ring-offset-[#0a0b0f]"
                >
                  View Live Map
                </Link>
              </div>

              <div className="mt-10 flex flex-wrap items-center gap-6 text-sm text-slate-300">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-emerald-400/30 bg-emerald-500/10 text-emerald-300">✓</span>
                  Real-time tracking
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-cyan-400/30 bg-cyan-500/10 text-cyan-300">⚡</span>
                  Faster response
                </div>
              </div>
            </div>

            <div className="hidden lg:block" />
          </motion.div>

          <motion.div
            className="absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
            initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.5, y: 40 }}
            animate={shouldReduceMotion ? { opacity: 1, scale: 1, y: 0 } : { opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
          >
            <div className="relative">
              <div className="absolute -inset-6 rounded-full bg-cyan-400/30 blur-3xl animate-pulse" />
              <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 shadow-2xl shadow-cyan-500/50">
                <MapPin className="h-10 w-10 text-white" />
              </div>
            </div>
          </motion.div>
        </section>

        <section className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
            <div className="flex items-center justify-center lg:justify-start">
              <div className="relative w-full max-w-md aspect-square mx-auto">
                <div className="absolute inset-0 rounded-full bg-cyan-500/20 blur-3xl" />
                <div className="relative h-full w-full overflow-hidden rounded-full border border-cyan-400/20 bg-gradient-to-br from-blue-900 via-blue-950 to-slate-950 shadow-2xl shadow-cyan-500/30">
                  <div
                    className={`absolute inset-0 opacity-20 ${shouldReduceMotion ? '' : 'animate-[globe-spin_60s_linear_infinite]'}`}
                    style={{
                      backgroundImage: `
                        repeating-linear-gradient(0deg, transparent, transparent 19px, rgba(6,182,212,0.4) 20px),
                        repeating-linear-gradient(90deg, transparent, transparent 19px, rgba(6,182,212,0.4) 20px)
                      `,
                    }}
                  />
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-400/40 via-transparent to-transparent" />
                  {[
                    { top: '30%', left: '40%', delay: 0 },
                    { top: '55%', left: '65%', delay: 0.3 },
                    { top: '40%', left: '70%', delay: 0.6 },
                    { top: '65%', left: '35%', delay: 0.9 },
                    { top: '45%', left: '50%', delay: 1.2 },
                  ].map((m, i) => (
                    <span
                      key={i}
                      className="absolute h-2 w-2 rounded-full bg-cyan-400 shadow-lg shadow-cyan-400/80 animate-pulse"
                      style={{
                        top: m.top,
                        left: m.left,
                        animationDelay: `${m.delay}s`,
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div>
              <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-[#7dd3fc]">Why fragmented reporting fails</p>
              <h2 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
                One clear channel makes the difference.
              </h2>

              <div className="mt-8 space-y-6">
                {problemItems.map((item, index) => (
                  <motion.div
                    key={item.title}
                    initial={shouldReduceMotion ? false : { opacity: 0, y: 24 }}
                    whileInView={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.2 }}
                    transition={{ duration: 0.45, delay: index * 0.1, ease: 'easeOut' }}
                    className="flex gap-4"
                  >
                    <div className="mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-sky-500/10 ring-1 ring-sky-400/25">
                      {item.icon}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                      <p className="mt-1 text-sm leading-6 text-slate-300">{item.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="mt-8 border-l-2 border-cyan-400/70 pl-4 text-sm text-slate-300">
                A unified reporting flow helps residents understand what happened, what is being done, and how to act next.
              </div>
            </div>
          </div>
        </section>

        <section className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-[#7dd3fc]">How HazardWatch works</p>
            <h2 className="text-3xl font-bold tracking-tight text-white md:text-4xl">Simple steps, faster action.</h2>
          </div>

          <div className="relative">
            <motion.div
              initial={shouldReduceMotion ? false : { scaleX: 0 }}
              whileInView={shouldReduceMotion ? { scaleX: 1 } : { scaleX: 1 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="absolute left-0 right-0 top-7 hidden h-0.5 origin-left bg-gradient-to-r from-blue-500 via-cyan-400 to-sky-500 md:block"
            />

            <div className="grid gap-6 md:grid-cols-4">
              {steps.map((step, index) => (
                <motion.div
                  key={step.number}
                  initial={shouldReduceMotion ? false : { opacity: 0, y: 22 }}
                  whileInView={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.45, delay: index * 0.15, ease: 'easeOut' }}
                  whileHover={shouldReduceMotion ? undefined : { scale: 1.02, y: -4 }}
                  className="group relative rounded-2xl border border-white/5 bg-white/[0.02] p-5 transition-all duration-300"
                >
                  <div className="relative z-10 flex items-center gap-4 md:block">
                    <div className="relative flex h-12 w-12 items-center justify-center rounded-full border border-sky-400/60 bg-slate-950/70 text-sm font-bold tabular-nums text-sky-300 shadow-[0_0_16px_rgba(56,189,248,0.25)] md:mx-auto">
                      {step.number}
                    </div>
                    <div className="md:mt-4 md:text-center">
                      <h3 className="text-lg font-semibold text-white">{step.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-300 md:max-w-[18ch] md:mx-auto">{step.description}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="mb-10">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-[#7dd3fc]">What can you report?</p>
            <h2 className="text-3xl font-bold tracking-tight text-white md:text-4xl">From street issues to urgent hazards.</h2>
          </div>

          <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-slate-950/40 py-4">
            <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r from-[#0a0b0f] to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-[#0a0b0f] to-transparent" />
            <div className="marquee-track flex gap-5 px-3">
              {[...hazardTypes, ...hazardTypes].map((hazard, index) => (
                <motion.article
                  key={`${hazard}-${index}`}
                  whileHover={shouldReduceMotion ? undefined : { y: -4, scale: 1.02 }}
                  className="group flex h-[120px] w-[240px] shrink-0 flex-col justify-between rounded-2xl border border-white/10 bg-[linear-gradient(135deg,rgba(15,23,42,0.9),rgba(15,23,42,0.7))] p-5 shadow-[0_10px_30px_rgba(37,99,235,0.08)] transition-all duration-300 hover:border-sky-400/40 hover:shadow-[0_20px_40px_rgba(34,211,238,0.18)]"
                >
                  <div className="flex items-center justify-between">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-sky-500/10 text-sm font-semibold text-sky-300">{String(index + 1).padStart(2, '0')}</span>
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-white">{hazard}</h3>
                  </div>
                </motion.article>
              ))}
            </div>
          </div>
        </section>

        <section ref={statsRef} className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="mb-12 max-w-2xl">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-[#7dd3fc]">Most hazard reports</p>
            <h2 className="text-3xl font-bold tracking-tight text-white md:text-4xl">Current community trends at a glance.</h2>
          </div>

          <div className="grid gap-6 border-b border-white/10 pb-10 md:grid-cols-4">
            {statsLoading
              ? [1, 2, 3, 4].map((item) => (
                  <div key={item} className="space-y-2">
                    <div className="h-12 w-24 animate-pulse rounded-md bg-white/5" />
                    <div className="h-4 w-28 animate-pulse rounded-md bg-white/5" />
                  </div>
                ))
              : statCards.map((stat) => (
                  <div key={stat.label} className="space-y-2">
                    <div className="bg-brand-gradient-text bg-clip-text text-4xl font-black tracking-tight text-transparent md:text-5xl">
                      {stat.value.toLocaleString()}
                    </div>
                    <div className="text-sm uppercase tracking-[0.2em] text-slate-400">{stat.label}</div>
                  </div>
                ))}
          </div>

          <div className="mt-10 flex items-center justify-between gap-4">
            <h3 className="text-xl font-semibold text-white">Top Reported Hazards</h3>
            <Link to="/map" className="text-sm font-medium text-sky-300 transition hover:text-white">
              View reports →
            </Link>
          </div>

          {statsLoading ? (
            <div className="mt-6 space-y-4">
              {[1, 2, 3, 4].map((item) => (
                <div key={item} className="flex items-center gap-4 py-3">
                  <div className="h-4 w-8 animate-pulse rounded bg-white/5" />
                  <div className="h-4 w-40 animate-pulse rounded bg-white/5" />
                </div>
              ))}
            </div>
          ) : topHazards.length === 0 ? (
            <p className="mt-6 text-slate-300">No data available yet.</p>
          ) : (
            <ol className="mt-6 divide-y divide-white/10">
              {topHazards.map((hazard, index) => (
                <motion.li
                  key={hazard.id}
                  initial={shouldReduceMotion ? false : { opacity: 0, y: 18 }}
                  whileInView={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.45, delay: index * 0.08 }}
                  whileHover={shouldReduceMotion ? undefined : { backgroundColor: 'rgba(15, 23, 42, 0.45)' }}
                  className="grid grid-cols-[2rem_minmax(0,1fr)] items-center gap-x-4 gap-y-2 py-4 transition-colors sm:grid-cols-[2.5rem_minmax(0,1fr)_auto]"
                >
                  <span className="text-sm font-medium text-slate-400">{String(index + 1).padStart(2, '0')}</span>
                  <div>
                    <h4 className="font-semibold text-white">{hazard.title}</h4>
                    <p className="mt-1 text-sm text-slate-400">{hazard.category}</p>
                  </div>
                  <div className="col-start-2 flex items-center gap-3 sm:col-start-auto sm:justify-end">
                    <span className="text-sm text-slate-200">{Number(hazard.reports || 0).toLocaleString()} reports</span>
                    <span className="rounded-full border border-yellow-400/30 bg-yellow-500/10 px-2 py-1 text-[10px] uppercase tracking-[0.16em] text-yellow-200">
                      {hazard.status}
                    </span>
                  </div>
                </motion.li>
              ))}
            </ol>
          )}
        </section>
      </main>
    </div>
  );
};

export default HomePage;
