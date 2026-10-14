import React, { useEffect, useState } from 'react';
import AOS from 'aos';
import 'aos/dist/aos.css';
import { AlertTriangle, ArrowRight, Code2, Eye, LayoutGrid, Lightbulb, MapPin, Shield, Target, Users, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import StaticMap from '../../components/StaticMap';

const TAGLINES = [
  'Building safer communities through real-time hazard reporting.',
  'Empowering citizens to report hazards instantly and accurately.',
  'Connecting communities with responsive local disaster response.',
];

const TypingTagline = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  const [typedText, setTypedText] = useState(() => (
    window.matchMedia('(prefers-reduced-motion: reduce)').matches ? TAGLINES[0] : ''
  ));

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updatePreference = () => setPrefersReducedMotion(mediaQuery.matches);
    mediaQuery.addEventListener('change', updatePreference);
    return () => mediaQuery.removeEventListener('change', updatePreference);
  }, []);

  useEffect(() => {
    if (prefersReducedMotion) {
      setTypedText(TAGLINES[0]);
      return undefined;
    }

    let phraseIndex = 0;
    let characterIndex = 0;
    let deleting = false;
    let timeoutId;

    const advance = () => {
      const phrase = TAGLINES[phraseIndex];

      if (!deleting) {
        characterIndex += 1;
        setTypedText(phrase.slice(0, characterIndex));
        if (characterIndex === phrase.length) {
          deleting = true;
          timeoutId = window.setTimeout(advance, 2000);
          return;
        }
        timeoutId = window.setTimeout(advance, 55);
        return;
      }

      characterIndex -= 1;
      setTypedText(phrase.slice(0, characterIndex));
      if (characterIndex === 0) {
        deleting = false;
        phraseIndex = (phraseIndex + 1) % TAGLINES.length;
      }
      timeoutId = window.setTimeout(advance, deleting ? 30 : 350);
    };

    timeoutId = window.setTimeout(advance, 250);
    return () => window.clearTimeout(timeoutId);
  }, [prefersReducedMotion]);

  return (
    <p
      aria-label={TAGLINES.join(' ')}
      className="mx-auto mt-5 min-h-[3.5rem] max-w-2xl text-base leading-relaxed text-slate-700 dark:text-gray-200 md:min-h-[2rem] md:text-lg"
    >
      <span aria-hidden="true">{typedText}</span>
      {!prefersReducedMotion && <span aria-hidden="true" className="ml-1 animate-pulse text-blue-700 dark:text-[#60a5fa]">|</span>}
    </p>
  );
};

const AboutPage = () => {
  const [shouldReduceMotion, setShouldReduceMotion] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updatePreference = () => setShouldReduceMotion(mediaQuery.matches);
    mediaQuery.addEventListener('change', updatePreference);

    AOS.init({
      duration: 800,
      easing: 'ease-in-out',
      once: true,
      offset: 100,
      disable: () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    });
    AOS.refresh();

    return () => mediaQuery.removeEventListener('change', updatePreference);
  }, []);

  const pillars = [
    {
      title: 'Location-based',
      description: 'Reports tied to Dagupan City and its barangays.',
      Icon: MapPin,
    },
    {
      title: 'Centralized monitoring',
      description: 'Hazard reports brought together in one dashboard.',
      Icon: LayoutGrid,
    },
    {
      title: 'Community-driven',
      description: 'Citizens and local officials working from shared information.',
      Icon: Users,
    },
    {
      title: 'Real-time reporting',
      description: 'Updates as hazards are reported, reviewed, and resolved.',
      Icon: Zap,
    },
    {
      title: 'Transparent',
      description: 'Every report is tracked with clear status updates.',
      Icon: Eye,
    },
    {
      title: 'Secure',
      description: 'Role-based access and verified accounts protect the platform.',
      Icon: Shield,
    },
  ];

  const storyMilestones = [
    {
      number: '01',
      title: 'The Problem',
      description: 'Dagupan City had no unified, real-time way to report hazards. Reports were scattered, slow, and often missed.',
      Icon: AlertTriangle,
    },
    {
      number: '02',
      title: 'The Idea',
      description: 'A vision for a simple, accessible platform where citizens, barangays, and city officials collaborate in real time.',
      Icon: Lightbulb,
    },
    {
      number: '03',
      title: 'The Build',
      description: 'Built with modern web technologies, designed for scalability, security, and real-world deployment.',
      Icon: Code2,
    },
    {
      number: '04',
      title: 'The Vision',
      description: 'A future where every hazard is reported, tracked, and resolved, powered by community and technology.',
      Icon: Target,
    },
  ];

  const renderPillar = ({ title, description, Icon }, index) => (
    <li
      key={`${title}-${index}`}
      className="group relative w-[300px] flex-none overflow-hidden rounded-2xl border border-slate-200 bg-white/70 p-6 dark:border-slate-700 dark:bg-[#0b1220]/70"
      data-aos="fade-up"
      data-aos-delay={index * 100}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500/10 to-cyan-400/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
      />
      <span
        className="relative inline-flex transition-transform duration-300 group-hover:rotate-[10deg] group-hover:scale-110 motion-reduce:transform-none motion-reduce:transition-none"
      >
        <Icon className="relative z-10 h-8 w-8 text-[#3b82f6]" aria-hidden="true" />
        <span
          aria-hidden="true"
          className="absolute inset-0 rounded-full bg-cyan-400/30 opacity-0 blur-xl transition-opacity duration-300 group-hover:opacity-100"
        />
      </span>
      <h3 className="mt-5 text-lg font-semibold md:text-xl">{title}</h3>
      <p className="mt-3 text-base leading-relaxed text-slate-600 dark:text-gray-400">{description}</p>
    </li>
  );

  return (
    <main className="relative isolate overflow-x-clip bg-transparent text-slate-900 dark:text-white">
      <div className="page-bg" aria-hidden="true">
        <div className="star-layer star-layer-1" />
        <div className="star-layer star-layer-2" />
        <div className="star-layer star-layer-3" />
      </div>
      <div className="relative z-10">
      <section className="relative min-h-screen overflow-hidden">
        <div className="absolute inset-0 z-0 overflow-hidden">
          <div className="hero-map-animate absolute inset-0" aria-hidden="true">
            <StaticMap animated={false} showMarkers={false} />
          </div>
          <div
            className="pointer-events-none absolute inset-0 z-[2] bg-[linear-gradient(to_right,rgba(148,163,184,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.06)_1px,transparent_1px)] bg-[size:48px_48px]"
            aria-hidden="true"
          />
          <div className="pointer-events-none absolute inset-0 z-[3] bg-black/10 dark:bg-black/65" />
          <div className="pointer-events-none absolute inset-0 z-[4] overflow-hidden" aria-hidden="true">
            <div className="star-layer star-layer-1" />
            <div className="star-layer star-layer-2" />
            <div className="star-layer star-layer-3" />
          </div>
        </div>
        <div className="relative z-10 mx-auto flex min-h-screen max-w-7xl flex-col justify-center px-8 py-24 text-center md:px-12 md:py-32">
          <div className="mx-auto max-w-4xl">
            <h1 data-aos="fade-up" className="mt-5 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">About HazardWatch</h1>
            <div data-aos="fade-up" data-aos-delay="100">
              <TypingTagline />
            </div>
            <Link
              to="/map"
              className="mt-8 inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-[#2563eb] px-6 py-3 font-semibold text-white transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3b82f6] focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#0a0b0f]"
            >
              Explore Live Map <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-white/95 dark:bg-[#0d0d0f]/95">
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 px-4 py-20 sm:px-6 md:py-24 lg:grid-cols-2 lg:gap-16 lg:px-8">
        <div data-aos="fade-right">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-700 dark:text-[#60a5fa] md:text-sm">Our mission</p>
          <h2 className="mt-4 max-w-2xl text-2xl font-semibold tracking-tight md:text-4xl">
            Empowering communities through accessible hazard reporting.
          </h2>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-slate-600 dark:text-gray-400 md:text-lg">
            HazardWatch gives Dagupan residents a simple way to share local hazards and see what is happening around them. By connecting community reports with real-time awareness, we help citizens and local officials work toward safer neighborhoods.
          </p>
        </div>
        <div className="relative mx-auto w-full max-w-md" data-aos="fade-left">
          <div
            aria-hidden="true"
            className="absolute inset-8 rounded-full bg-cyan-400/20 blur-3xl"
          />
          <img
            src="/mission-illustration.png"
            alt="Community safety illustration"
            loading="lazy"
            className="relative h-auto w-full object-contain"
          />
        </div>
        </div>
      </section>

      <section className="bg-slate-50/95 dark:bg-[#0f1729]/95">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 md:py-24 lg:px-8">
          <header className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-700 dark:text-[#60a5fa] md:text-sm">Our story</p>
            <h2
              data-aos="fade-up"
              className="relative mt-4 text-2xl font-semibold tracking-tight text-slate-500 md:text-4xl dark:text-slate-400"
            >
              The Story Behind HazardWatch
              <span
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-400 bg-clip-text text-transparent"
              >
                The Story Behind HazardWatch
              </span>
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-slate-600 dark:text-gray-400 md:text-lg">
              From a simple idea to a community-powered platform — here's how HazardWatch came to life.
            </p>
          </header>
          <ol className="relative mt-14 space-y-10 before:absolute before:inset-y-0 before:left-5 before:w-px before:bg-slate-300 dark:before:bg-slate-700 md:before:left-1/2">
            {storyMilestones.map(({ number, title, description, Icon }, index) => {
              const isLeft = index % 2 === 0;
              return (
                <li
                  key={number}
                  data-aos="fade-up"
                  data-aos-delay={index * 100}
                  className={`relative grid grid-cols-[2.5rem_minmax(0,1fr)] items-start gap-x-5 pb-10 last:pb-0 md:grid-cols-[minmax(0,1fr)_4rem_minmax(0,1fr)] ${
                    isLeft ? '' : 'md:[&>div:last-child]:col-start-3 md:[&>div:last-child]:col-end-4 md:[&>div:last-child]:row-start-1'
                  }`}
                >
                  <div className="relative z-10 col-start-1 row-start-1 flex h-10 w-10 items-center justify-center rounded-full border border-cyan-400/60 bg-slate-950 text-xs font-semibold text-cyan-200 md:col-start-2 md:mx-auto">
                    {number}
                  </div>
                  <div className={`col-start-2 row-start-1 min-w-0 ${isLeft ? 'md:col-start-1 md:row-start-1 md:pr-8 md:text-right' : 'md:col-start-3 md:row-start-1 md:pl-8'}`}>
                    <div className={`mb-3 flex items-center gap-3 text-cyan-300 ${isLeft ? 'md:flex-row-reverse' : ''}`}>
                      <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                      <h3 className="text-lg font-semibold text-white md:text-xl">{title}</h3>
                    </div>
                    <p className="text-base leading-relaxed text-slate-200">{description}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      <section className="bg-white/95 dark:bg-[#0d0d0f]/95">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 md:py-24 lg:px-8">
        <header className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-700 dark:text-[#60a5fa] md:text-sm">Core pillars</p>
          <h2 data-aos="fade-up" className="mt-4 text-2xl font-semibold tracking-tight md:text-4xl">Built for safer communities.</h2>
        </header>
        {shouldReduceMotion ? (
          <ul className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {pillars.map(renderPillar)}
          </ul>
        ) : (
          <div className="mt-12 overflow-hidden">
            <ul className="pillar-marquee flex w-max" aria-label="HazardWatch core pillars">
              {[0, 1].map((group) => (
                <li key={group} aria-hidden={group === 1} className="list-none">
                  <ul className="flex gap-6 pr-6">
                    {pillars.map((pillar, index) => renderPillar(pillar, index))}
                  </ul>
                </li>
              ))}
            </ul>
          </div>
        )}
        </div>
      </section>

      <section className="bg-slate-50/95 dark:bg-[#0f1729]/95">
        <div className="mx-auto max-w-7xl px-4 pb-20 pt-20 sm:px-6 md:pb-24 md:pt-24 lg:px-8">
        <div className="rounded-2xl bg-gradient-to-br from-slate-100 via-slate-50 to-blue-100 px-6 py-16 text-center dark:from-[#14151d] dark:via-[#14151d] dark:to-[#0a0b0f] sm:px-10 md:py-20">
          <div className="mx-auto max-w-4xl" data-aos="zoom-in">
            <h2 className="text-2xl font-semibold tracking-tight md:text-4xl">Be part of the solution.</h2>
            <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-slate-600 dark:text-gray-400 md:text-lg">
              Report hazards and help keep your community safe.
            </p>
            <Link
              to="/submit"
              className="mt-8 inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 px-6 py-3 font-semibold text-white shadow-lg shadow-blue-500/20 transition-all hover:from-blue-500 hover:to-cyan-400 hover:shadow-cyan-500/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-100 dark:focus-visible:ring-offset-[#14151d]"
            >
              Report a Hazard <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
        </div>
      </section>
      </div>
    </main>
  );
};

export default AboutPage;
