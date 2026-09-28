import React, { useEffect, useState } from 'react';
import AOS from 'aos';
import 'aos/dist/aos.css';
import { AlertTriangle, ArrowRight, Code2, LayoutGrid, Lightbulb, MapPin, Target, Users, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

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
  useEffect(() => {
    AOS.init({
      duration: 800,
      easing: 'ease-in-out',
      once: true,
      offset: 100,
      disable: () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    });
    AOS.refresh();
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

  return (
    <main className="overflow-hidden bg-white text-slate-900 dark:bg-[#0a0b0f] dark:text-white">
      <section className="relative isolate flex min-h-screen items-center justify-center overflow-hidden px-4 py-20 text-center sm:px-6 lg:px-8">
        <img
          src="/dagupan-map-dark.png"
          alt=""
          aria-hidden="true"
          loading="eager"
          fetchPriority="high"
          className="absolute inset-0 -z-20 h-full w-full object-cover object-center opacity-30 dark:opacity-100"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-white/90 via-white/75 to-white/90 dark:from-black/80 dark:via-black/60 dark:to-black/80" />
        <div className="mx-auto max-w-4xl pt-16">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-700 dark:text-[#60a5fa] md:text-sm">About HazardWatch</p>
          <h1 className="mt-5 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">About HazardWatch</h1>
          <TypingTagline />
          <Link
            to="/map"
            className="mt-8 inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-[#2563eb] px-6 py-3 font-semibold text-white transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3b82f6] focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#0a0b0f]"
          >
            Explore Live Map <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </section>

      <section className="bg-white dark:bg-[#0d0d0f]">
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
        <div className="mx-auto w-full max-w-md" data-aos="fade-left">
          <img
            src="/mission-illustration.png"
            alt="Community safety illustration"
            loading="lazy"
            className="h-auto w-full object-contain"
          />
        </div>
        </div>
      </section>

      <section className="bg-slate-50 dark:bg-[#0f1729]">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 md:py-24 lg:px-8">
          <header className="max-w-2xl" data-aos="fade-up">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-700 dark:text-[#60a5fa] md:text-sm">Our story</p>
            <h2 className="mt-4 text-2xl font-semibold tracking-tight md:text-4xl">The Story Behind HazardWatch</h2>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-slate-600 dark:text-gray-400 md:text-lg">
              From a simple idea to a community-powered platform — here's how HazardWatch came to life.
            </p>
          </header>
          <ol className="relative mt-14 space-y-10 before:absolute before:inset-y-0 before:left-5 before:w-px before:bg-slate-300 dark:before:bg-slate-700 md:space-y-0 md:before:left-1/2">
            {storyMilestones.map(({ number, title, description, Icon }, index) => {
              const isLeft = index % 2 === 0;
              return (
                <li
                  key={number}
                  className="relative grid grid-cols-[2.5rem_minmax(0,1fr)] items-start gap-x-5 md:grid-cols-[minmax(0,1fr)_4rem_minmax(0,1fr)] md:pb-14 md:last:pb-0"
                  data-aos="fade-up"
                  data-aos-delay={index * 100}
                >
                  <div className="relative z-10 col-start-1 row-start-1 flex h-10 w-10 items-center justify-center rounded-full border border-[#3b82f6]/50 bg-slate-50 text-xs font-semibold text-blue-700 dark:bg-[#0f1729] dark:text-[#60a5fa] md:col-start-2 md:mx-auto">
                    {number}
                  </div>
                  <div className={`col-start-2 row-start-1 min-w-0 ${isLeft ? 'md:col-start-1 md:pr-8 md:text-right' : 'md:col-start-3 md:pl-8'}`}>
                    <div className={`mb-3 flex items-center gap-3 text-blue-700 dark:text-[#60a5fa] ${isLeft ? 'md:flex-row-reverse' : ''}`}>
                      <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white md:text-xl">{title}</h3>
                    </div>
                    <p className="text-base leading-relaxed text-slate-600 dark:text-gray-400">{description}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      <section className="bg-white dark:bg-[#0d0d0f]">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 md:py-24 lg:px-8">
        <header className="max-w-2xl" data-aos="fade-up">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-700 dark:text-[#60a5fa] md:text-sm">Core pillars</p>
          <h2 className="mt-4 text-2xl font-semibold tracking-tight md:text-4xl">Built for safer communities.</h2>
        </header>
        <ul className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {pillars.map(({ title, description, Icon }, index) => (
            <li key={title} className="min-w-0 border-t border-slate-200 pt-6 transition-colors hover:border-[#3b82f6] dark:border-[#2e303a] dark:hover:border-[#3b82f6]" data-aos="fade-up" data-aos-delay={index * 100}>
              <Icon className="h-6 w-6 text-[#3b82f6]" aria-hidden="true" />
              <h3 className="mt-5 text-lg font-semibold md:text-xl">{title}</h3>
              <p className="mt-3 text-base leading-relaxed text-slate-600 dark:text-gray-400">{description}</p>
            </li>
          ))}
        </ul>
        </div>
      </section>

      <section className="bg-slate-50 dark:bg-[#0f1729]">
        <div className="mx-auto max-w-7xl px-4 pb-20 pt-20 sm:px-6 md:pb-24 md:pt-24 lg:px-8">
        <div className="rounded-2xl bg-gradient-to-br from-slate-100 via-slate-50 to-blue-100 px-6 py-16 text-center dark:from-[#14151d] dark:via-[#14151d] dark:to-[#0a0b0f] sm:px-10 md:py-20">
          <div className="mx-auto max-w-4xl" data-aos="zoom-in">
            <h2 className="text-2xl font-semibold tracking-tight md:text-4xl">Be part of the solution.</h2>
            <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-slate-600 dark:text-gray-400 md:text-lg">
              Report hazards and help keep your community safe.
            </p>
            <Link
              to="/submit"
              className="mt-8 inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-[#2563eb] px-6 py-3 font-semibold text-white shadow-lg shadow-[#3b82f6]/20 transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3b82f6] focus-visible:ring-offset-2 focus-visible:ring-offset-slate-100 dark:shadow-[0_0_40px_rgba(59,130,246,0.5)] dark:focus-visible:ring-offset-[#14151d]"
            >
              Report a Hazard <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
        </div>
      </section>
    </main>
  );
};

export default AboutPage;
