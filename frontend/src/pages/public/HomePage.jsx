import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion, useMotionValueEvent, useReducedMotion, useScroll, useSpring, useTransform } from 'framer-motion';
import { ArrowUpRight, Droplets, Flame, Shield, Wrench } from 'lucide-react';
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

const hazardCategories = [
  {
    id: 'flood-water',
    label: 'Flood & Water',
    icon: Droplets,
    color: 'cyan',
    description: 'Flooding, drainage blockages, and water-related hazards affecting streets and neighborhoods.',
    subCategories: [
      'Flooding',
      'Clogged Drainage',
      'Broken Water Pipe',
      'Clogged Canal (Waste)',
      'Contaminated Water',
      'Oil Spill',
      'Water Leak',
    ],
  },
  {
    id: 'fire-emergency',
    label: 'Fire & Emergency',
    icon: Flame,
    color: 'red',
    description: 'Fire risks, gas leaks, blocked fire exits, and smoke incidents that need urgent attention.',
    subCategories: ['Fire Hazard', 'Gas Leak', 'Blocked Fire Exit', 'Smoke Report'],
  },
  {
    id: 'infrastructure',
    label: 'Infrastructure',
    icon: Wrench,
    color: 'amber',
    description: 'Road, streetlight, facility, and transport infrastructure issues affecting public access.',
    subCategories: [
      'Pothole',
      'Broken Streetlight',
      'Damaged Public Facility',
      'Fallen Electrical Wire',
      'Damaged Road',
      'Broken Traffic Light',
      'Damaged Bridge',
      'Damaged Sidewalk',
      'Missing Road Sign',
      'Traffic Obstruction',
    ],
  },
  {
    id: 'public-safety-environment',
    label: 'Public Safety & Environment',
    icon: Shield,
    color: 'green',
    description: 'Waste, environmental hazards, and other public safety concerns in the community.',
    subCategories: [
      'Waste Disposal',
      'Illegal Dumping',
      'Air Pollution',
      'Animal Related',
      'Deforestation',
      'Fallen Tree',
      'Noise Pollution',
      'Other',
      'Overflowing Trash Bin',
      'Public Safety Hazard',
      'Public Toilet Issue',
      'Vandalism',
    ],
  },
];

const totalReportTypes = hazardCategories.reduce(
  (total, category) => total + category.subCategories.length,
  0,
);

const hazardCategoryStyles = {
  cyan: {
    active: 'border-cyan-400/60 bg-cyan-500/10',
    icon: 'border-cyan-400/30 bg-cyan-500/10 text-cyan-200',
    count: 'text-cyan-200',
  },
  red: {
    active: 'border-red-400/60 bg-red-500/10',
    icon: 'border-red-400/30 bg-red-500/10 text-red-200',
    count: 'text-red-200',
  },
  amber: {
    active: 'border-amber-400/60 bg-amber-500/10',
    icon: 'border-amber-400/30 bg-amber-500/10 text-amber-200',
    count: 'text-amber-200',
  },
  green: {
    active: 'border-green-400/60 bg-green-500/10',
    icon: 'border-green-400/30 bg-green-500/10 text-green-200',
    count: 'text-green-200',
  },
};

const fragmentedReports = [
  {
    label: 'CHANNEL CHAOS',
    title: 'Too many channels',
    description: 'Reports get scattered across email, phone, and paper forms.',
    images: ['channel1.jpg', 'channel2.jpg', 'channel3.jpg'],
    imageAlts: ['Scattered communication channels', 'Disconnected reporting devices', 'A tangled network of reports'],
  },
  {
    label: 'VISIBILITY',
    title: 'No status updates',
    description: "Residents don't know whether a report was seen or fixed.",
    images: ['status1.jpg', 'status2.jpg', 'status3.jpg'],
    imageAlts: ['No status updates', 'Unanswered report notification', 'A report lost in the system'],
  },
  {
    label: 'PROCESS',
    title: 'Manual triage',
    description: 'Every case has to be read, checked, and forwarded by hand.',
    images: ['manual1.jpg', 'manual2.jpg', 'manual3.jpg'],
    imageAlts: ['Manual document triage', 'Staff sorting paper reports', 'A queue of reports awaiting review'],
  },
  {
    label: 'DATA',
    title: 'No trends',
    description: 'Without structured data, planners are guessing where to act first.',
    images: ['trend1.jpg', 'trend2.jpg', 'trend3.jpg'],
    imageAlts: ['No data trends', 'Unorganized hazard records', 'A city planner reviewing scattered data'],
  },
];

const FragmentedImage = ({ src, alt, className }) => {
  const [hasError, setHasError] = useState(false);
  const [source, setSource] = useState(`/images/fragmented/${src}`);

  return (
    <div className={`overflow-hidden rounded-[28px] border border-slate-700 sm:rounded-[40px] ${className}`}>
      {!src || hasError ? (
        <div
          role="img"
          aria-label={alt}
          className="h-full w-full bg-gradient-to-br from-slate-700 to-slate-800"
        />
      ) : (
        <img
          src={source}
          alt={alt}
          loading="lazy"
          onError={() => {
            if (source !== `/${src}`) setSource(`/${src}`);
            else setHasError(true);
          }}
          className="h-full w-full object-cover"
        />
      )}
    </div>
  );
};

const GlobeBackground = ({ y, scale, opacity, reduceMotion }) => (
  <div
    aria-hidden="true"
    className="pointer-events-none absolute left-[50vw] top-[54vh] z-0 w-[120vmax] max-w-none -translate-x-1/2 sm:top-[58vh]"
  >
    <motion.div
      style={reduceMotion ? undefined : { y, scale, opacity }}
    >
      <div className="globe-spin">
        <img
          src="/globe.png"
          alt=""
          aria-hidden="true"
          className="block h-auto w-full opacity-70 brightness-125 saturate-125"
        />
      </div>
    </motion.div>
  </div>
);

const StackedReportCard = ({ item, index, total, reduceMotion }) => {
  const cardRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: cardRef,
    offset: ['start end', 'start 96px'],
  });
  const targetScale = 1 - (total - 1 - index) * 0.03;
  const scale = useSpring(
    useTransform(scrollYProgress, [0, 1], [1, targetScale], { clamp: true }),
    { stiffness: 120, damping: 24, mass: 0.3 },
  );
  const topOffset = `calc(6rem + ${index * 28}px)`;

  return (
    <motion.article
      ref={cardRef}
      aria-labelledby={`fragmented-card-${index + 1}`}
      className={`relative mb-8 flex min-h-[580px] flex-col overflow-hidden rounded-[40px] border border-slate-700 bg-slate-950 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.45)] sm:min-h-[640px] sm:p-8 lg:h-[calc(100vh-8rem)] lg:max-h-[780px] ${reduceMotion ? '' : 'md:sticky md:top-24'}`}
      style={reduceMotion ? undefined : { scale, top: topOffset, zIndex: index + 1 }}
    >
      <div className="flex items-start justify-between gap-3 sm:gap-6">
        <div className="flex min-w-0 items-start gap-3 sm:gap-6">
          <span aria-hidden="true" className="shrink-0 text-[72px] font-black leading-[0.85] text-slate-800 sm:text-[120px]">
            {String(index + 1).padStart(2, '0')}
          </span>
          <div className="pt-1 sm:pt-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400 sm:text-xs sm:tracking-widest">
              {item.label}
            </p>
            <h3 id={`fragmented-card-${index + 1}`} className="mt-2 text-xl font-semibold text-white sm:text-2xl">
              {item.title}
            </h3>
            <p className="mt-2 max-w-xl text-xs leading-5 text-slate-300 sm:text-sm sm:leading-6">
              {item.description}
            </p>
          </div>
        </div>
        <Link
          to="/submit"
          className="mt-1 inline-flex shrink-0 items-center gap-1 rounded-full border border-slate-600 px-3 py-2 text-[10px] font-semibold text-slate-100 transition-colors hover:border-cyan-300 hover:text-cyan-200 focus:outline-none focus:ring-2 focus:ring-cyan-300 sm:gap-2 sm:px-4 sm:text-xs"
        >
          Report issue <ArrowUpRight size={14} aria-hidden="true" />
        </Link>
      </div>

      <div className="mt-6 grid min-h-0 flex-1 grid-cols-[0.4fr_0.6fr] gap-3 sm:mt-8 sm:gap-5">
        <div className="grid min-h-0 grid-rows-2 gap-3 sm:gap-5">
          {[0, 1].map((imageIndex) => (
            <FragmentedImage
              key={imageIndex}
              src={item.images[imageIndex]}
              alt={item.imageAlts[imageIndex]}
              className="min-h-0"
            />
          ))}
        </div>
        <FragmentedImage
          src={item.images[2]}
          alt={item.imageAlts[2]}
          className="min-h-0"
        />
      </div>
    </motion.article>
  );
};

const FragmentedCatalog = ({ reduceMotion }) => (
  <section aria-labelledby="fragmented-heading" className="relative z-20 py-20 sm:py-24">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <header className="mb-10 max-w-2xl sm:mb-12">
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-[#7dd3fc]">
          Why fragmented reporting fails
        </p>
        <h2 id="fragmented-heading" className="text-3xl font-bold tracking-tight text-white md:text-4xl">
          One clear channel makes the difference.
        </h2>
        <p className="mt-4 text-sm leading-6 text-slate-300">
          Four familiar breakdowns show why reports need a clearer path from submission to action.
        </p>
      </header>

      <div className="relative">
        {fragmentedReports.map((item, index) => (
          <StackedReportCard
            key={item.title}
            item={item}
            index={index}
            total={fragmentedReports.length}
            reduceMotion={reduceMotion}
          />
        ))}
      </div>
    </div>
  </section>
);

const steps = [
  {
    number: '01',
    title: 'Report',
    description: 'Citizens submit a hazard report with its location, category, description, and photo.',
  },
  {
    number: '02',
    title: 'Verify',
    description: 'Authorized staff reviews and verifies submitted reports.',
  },
  {
    number: '03',
    title: 'Monitor',
    description: 'Verified hazards appear on the map and can be monitored in real time.',
  },
  {
    number: '04',
    title: 'Resolve',
    description: 'Staff updates the report once the hazard has been addressed.',
  },
];

const HomePage = () => {
  const { user, token, loading } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();
  const [isMobileViewport, setIsMobileViewport] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches,
  );
  const heroRef = useRef(null);
  const { scrollYProgress: heroProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });
  const heroTextOpacity = useTransform(heroProgress, [0.08, 0.68], [1, 0], { clamp: true });
  const globeY = useTransform(heroProgress, [0, 1], [0, -100], { clamp: true });
  const desktopGlobeScale = useTransform(heroProgress, [0, 1], [1.15, 0.5], { clamp: true });
  const mobileGlobeScale = useTransform(heroProgress, [0, 1], [1, 0.6], { clamp: true });
  const globeScale = isMobileViewport ? mobileGlobeScale : desktopGlobeScale;
  const globeOpacity = useTransform(heroProgress, [0, 1], [1, 0], { clamp: true });
  const section2Y = useTransform(heroProgress, [0, 1], ['24vh', '0vh'], { clamp: true });
  const howItWorksRef = useRef(null);
  const { scrollYProgress: howItWorksProgress } = useScroll({
    target: howItWorksRef,
    offset: ['start start', 'end end'],
  });
  const howItWorksLineProgress = useTransform(howItWorksProgress, [0, 0.9], [0, 1], { clamp: true });
  const [activeStep, setActiveStep] = useState(0);

  useMotionValueEvent(howItWorksProgress, 'change', (progress) => {
    if (!shouldReduceMotion) {
      setActiveStep(Math.min(steps.length - 1, Math.floor(progress * steps.length)));
    }
  });

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
  const [activeCategoryId, setActiveCategoryId] = useState(null);
  const statsRef = useRef(null);
  const categorySectionRef = useRef(null);
  const activeCategory = hazardCategories.find((category) => category.id === activeCategoryId);

  useEffect(() => {
    const mobileViewport = window.matchMedia('(max-width: 767px)');
    const updateMobileViewport = (event) => setIsMobileViewport(event.matches);

    mobileViewport.addEventListener('change', updateMobileViewport);
    return () => mobileViewport.removeEventListener('change', updateMobileViewport);
  }, []);

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

  return (
    <div className="homepage-container relative overflow-x-clip bg-transparent text-white">
      <main className="relative z-10 isolate overflow-x-clip">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.28),transparent_35%),radial-gradient(circle_at_right,_rgba(6,182,212,0.22),transparent_28%),radial-gradient(circle_at_bottom,_rgba(14,116,144,0.18),transparent_30%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(10,11,15,0.05),rgba(10,11,15,0.3))]" />
        </div>

        <div className="page-bg" aria-hidden="true">
          <div className="star-layer star-layer-1" />
          <div className="star-layer star-layer-2" />
          <div className="star-layer star-layer-3" />
        </div>
        <GlobeBackground
          y={shouldReduceMotion ? 0 : globeY}
          scale={shouldReduceMotion ? 1 : globeScale}
          opacity={shouldReduceMotion ? 1 : globeOpacity}
          reduceMotion={shouldReduceMotion}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 z-[5] h-[160vh] bg-[linear-gradient(to_bottom,rgba(8,13,23,0.3)_0%,rgba(8,13,23,0.2)_40%,rgba(8,13,23,0.1)_60%,transparent_100%)]"
        />

        <section ref={heroRef} className="relative z-10 isolate min-h-screen overflow-visible bg-transparent">
          <motion.div
            className="relative z-10 mx-auto flex min-h-screen max-w-7xl flex-col items-center px-4 pb-20 pt-28 text-center sm:justify-center sm:px-6 sm:pt-20 lg:px-8"
            style={shouldReduceMotion ? undefined : { opacity: heroTextOpacity }}
          >
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-slate-950/35 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-cyan-100/85 backdrop-blur-sm sm:text-xs">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_12px_rgba(103,232,249,0.9)]" />
              Dagupan City · Community hazard reporting
            </p>
            <h1 className="max-w-5xl text-4xl font-black leading-[1.05] tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl">
              Report Hazards. Track Incidents.{' '}
              <span className="bg-brand-gradient-text bg-clip-text text-transparent">Keep Your Community Safe.</span>
            </h1>
            <p className="mt-5 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base sm:leading-7">
              A simple, transparent way to report issues and keep Dagupan informed.
            </p>
            <div className="mt-8 flex w-full flex-col justify-center gap-3 sm:w-auto sm:flex-row sm:gap-4">
              <Link
                to="/submit"
                className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition-all hover:from-blue-500 hover:to-cyan-400 hover:shadow-cyan-500/30 focus:outline-none focus:ring-2 focus:ring-cyan-300 focus:ring-offset-2 focus:ring-offset-[#080d17]"
              >
                Report a Hazard
              </Link>
              <Link
                to="/map"
                className="inline-flex items-center justify-center rounded-full border border-cyan-300/35 bg-slate-950/30 px-6 py-3 text-sm font-semibold text-cyan-100 backdrop-blur-sm transition-colors hover:bg-cyan-400/10 focus:outline-none focus:ring-2 focus:ring-cyan-300"
              >
                View Live Map
              </Link>
            </div>
          </motion.div>
        </section>

        <motion.div className="relative z-20" style={shouldReduceMotion ? undefined : { y: section2Y }}>
          <FragmentedCatalog reduceMotion={shouldReduceMotion} />
        </motion.div>
        <section
          ref={howItWorksRef}
          className={`relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 ${shouldReduceMotion ? '' : 'md:min-h-[260vh]'}`}
        >
          <div className={`${shouldReduceMotion ? 'py-20' : 'md:sticky md:top-0 md:flex md:min-h-screen md:flex-col md:justify-center'} py-20`}>
            <header className="mb-12 text-center">
              <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-[#7dd3fc]">How HazardWatch works</p>
              <h2 className="text-3xl font-bold tracking-tight text-white md:text-4xl">Simple steps, faster action.</h2>
            </header>

            <div className="relative hidden md:block">
              <svg
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 top-6 h-2 w-full"
                viewBox="0 0 1000 12"
                preserveAspectRatio="none"
              >
                <defs>
                  <linearGradient id="how-it-works-timeline" x1="0" x2="1">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#22d3ee" />
                  </linearGradient>
                </defs>
                <path d="M 125 6 H 875" fill="none" stroke="rgba(148,163,184,0.25)" strokeWidth="2" />
                <motion.path
                  d="M 125 6 H 875"
                  fill="none"
                  stroke="url(#how-it-works-timeline)"
                  strokeLinecap="round"
                  strokeWidth="3"
                  style={{ pathLength: shouldReduceMotion ? 1 : howItWorksLineProgress }}
                />
              </svg>

              <div className="grid grid-cols-4">
                {steps.map((step, index) => {
                  const isActive = index === activeStep;
                  const opacity = shouldReduceMotion ? 1 : isActive ? 1 : index < activeStep ? 0.5 : 0.3;

                  return (
                    <div
                      key={step.number}
                      aria-current={isActive ? 'step' : undefined}
                      className="flex flex-col items-center text-center"
                    >
                      <motion.span
                        animate={{ opacity, scale: shouldReduceMotion ? 1 : isActive ? 1.12 : 0.92 }}
                        transition={{ duration: shouldReduceMotion ? 0 : 0.3, ease: 'easeOut' }}
                        className={`relative z-10 flex h-12 w-12 items-center justify-center rounded-full border bg-slate-950 text-sm font-bold tabular-nums ${
                          isActive
                            ? 'border-cyan-300 text-cyan-100 shadow-[0_0_24px_rgba(34,211,238,0.5)]'
                            : 'border-slate-600 text-slate-400'
                        }`}
                      >
                        {step.number}
                      </motion.span>
                      <motion.span
                        animate={{ opacity }}
                        transition={{ duration: shouldReduceMotion ? 0 : 0.3 }}
                        className={`mt-4 text-sm font-semibold ${isActive ? 'text-white' : 'text-slate-400'}`}
                      >
                        {step.title}
                      </motion.span>
                    </div>
                  );
                })}
              </div>
            </div>

            {shouldReduceMotion ? (
              <div className="mt-10 hidden gap-5 md:grid md:grid-cols-2">
                {steps.map((step) => (
                  <div key={step.number} className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
                    <p className="text-xs font-semibold uppercase tracking-widest text-cyan-200">{step.number} · {step.title}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-300">{step.description}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div aria-live="polite" className="mx-auto mt-12 hidden min-h-28 max-w-2xl text-center md:block">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={steps[activeStep].number}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.25 }}
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200">
                      {steps[activeStep].number} · {steps[activeStep].title}
                    </p>
                    <p className="mt-3 text-base leading-7 text-slate-200">{steps[activeStep].description}</p>
                  </motion.div>
                </AnimatePresence>
              </div>
            )}

            <div className="grid gap-4 md:hidden">
              {steps.map((step) => (
                <motion.article
                  key={step.number}
                  initial={shouldReduceMotion ? false : { opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: shouldReduceMotion ? 0 : 0.35 }}
                  className="rounded-2xl border border-white/10 bg-white/[0.02] p-5"
                >
                  <p className="text-xs font-semibold uppercase tracking-widest text-cyan-200">{step.number} · {step.title}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{step.description}</p>
                </motion.article>
              ))}
            </div>
          </div>
        </section>

        <section ref={categorySectionRef} className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="mb-10">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-[#7dd3fc]">What can you report?</p>
            <h2 className="text-3xl font-bold tracking-tight text-white md:text-4xl">From street issues to urgent hazards.</h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {hazardCategories.map((category) => {
              const Icon = category.icon;
              const isActive = activeCategoryId === category.id;
              const styles = hazardCategoryStyles[category.color];

              return (
                <motion.button
                  key={category.id}
                  type="button"
                  onMouseEnter={() => {
                    if (window.matchMedia('(hover: hover)').matches) setActiveCategoryId(category.id);
                  }}
                  onMouseLeave={() => {
                    if (activeCategoryId === category.id) setActiveCategoryId(null);
                  }}
                  onFocus={() => setActiveCategoryId(category.id)}
                  onBlur={() => {
                    if (activeCategoryId === category.id) setActiveCategoryId(null);
                  }}
                  onTouchStart={() => {
                    setActiveCategoryId((currentCategoryId) => (
                      currentCategoryId === category.id ? null : category.id
                    ));
                  }}
                  aria-expanded={isActive}
                  aria-controls="live-focus-panel"
                  whileHover={shouldReduceMotion ? undefined : { y: -4 }}
                  whileTap={shouldReduceMotion ? undefined : { scale: 0.99 }}
                  className={`rounded-2xl border p-5 text-left transition-colors focus:outline-none focus:ring-2 focus:ring-sky-400/60 ${
                    isActive
                      ? styles.active
                      : 'border-white/10 bg-slate-950/60 hover:border-white/20'
                  }`}
                >
                  <span className={`inline-flex h-11 w-11 items-center justify-center rounded-xl border ${styles.icon}`}>
                    <Icon size={22} aria-hidden="true" />
                  </span>
                  <span className="mt-5 block text-base font-semibold text-white">{category.label}</span>
                  <span className={`mt-2 block text-xs ${styles.count}`}>
                    {category.subCategories.length} report types
                  </span>
                </motion.button>
              );
            })}
          </div>

          <motion.div
            id="live-focus-panel"
            initial={{ y: '20%', opacity: 0 }}
            animate={{
              y: activeCategory ? 0 : '20%',
              opacity: activeCategory ? 1 : 0,
            }}
            transition={{
              duration: shouldReduceMotion ? 0 : 0.4,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="mt-6 overflow-hidden rounded-[28px] border border-sky-400/20 bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.18),transparent_40%),linear-gradient(180deg,rgba(15,23,42,0.96),rgba(2,6,23,0.96))] p-5 shadow-[0_30px_80px_rgba(14,116,144,0.18)] sm:p-7"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-cyan-200/80">
                Live focus
              </p>
              <span className={`rounded-full border px-3 py-1 text-[10px] uppercase tracking-widest ${
                activeCategory ? hazardCategoryStyles[activeCategory.color].icon : 'border-cyan-400/30 bg-cyan-500/10 text-cyan-200'
              }`}>
                {activeCategory ? activeCategory.subCategories.length : totalReportTypes} report types
              </span>
            </div>

            <h3 aria-live="polite" className="mt-3 min-h-9 text-2xl font-bold tracking-tight text-white">
              {activeCategory?.label || 'What Can You Report?'}
            </h3>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
              {activeCategory?.description
                || 'Explore four categories of hazards you can report in Dagupan City, covering water, fire, infrastructure, public safety, and environmental concerns.'}
            </p>

            {activeCategory && (
              <ul className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {activeCategory.subCategories.map((category) => (
                  <li key={category} className="flex items-center gap-2 text-sm text-slate-200">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-300" />
                    {category}
                  </li>
                ))}
              </ul>
            )}
          </motion.div>
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
