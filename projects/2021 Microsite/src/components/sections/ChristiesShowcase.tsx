"use client";
/**
 * Christie's Showcase — adapted from BYQ evermind-hero-2 (Hero with Marquee)
 *
 * Per request: the "BYQ Studio celebrates..." announcement pill and both CTA
 * buttons were stripped out entirely — only the heading, body copy, and the
 * auto-scrolling marquee strip remain. The decorative dots divider was also
 * dropped, and the marquee's "Read case study" link was converted to a
 * static stat card so nothing clickable/button-like remains in the section.
 *
 * Every marquee slate (images + stat card) is locked to a uniform 3:4 ratio,
 * and each photo carries a bottom-left caption using the same pill "flag"
 * style as ChristiesPhilosophy's "Two Centuries, One Philosophy" label.
 *
 * Token substitutions applied:
 *   Fonts:  Playfair Display  → ABCArizonaSerif
 *           Inter             → ABCArizonaSans
 *   Colors: bg #eeeae3        → rgb(45, 45, 45)
 *           heading #181e25   → colors.white
 *           body #181e25 @70% → colors.white
 *           dark card #181e25 → colors.black
 */

import * as React from 'react';

const tokens = {
  sectionBg: 'rgb(45, 45, 45)',
  headingColor: '#FFFFFF', // colors.white
  bodyColor: '#FFFFFF', // colors.white
  cardBg: '#000000', // colors.black
  cardText: '#FFFFFF', // colors.white

  // flag/label style reused from ChristiesPhilosophy's "Two Centuries, One Philosophy" pill
  flagBg: '#213328',
  flagBorder: 'rgba(255, 255, 255, 0.16)',

  fontSerif: 'var(--font-family-arizona-serif)',
  fontSans: 'var(--font-family-arizona-sans)',

  sizeHeading: '4.5rem', // fontSizes["5xl-xl"]
  sizeBody: '1.125rem', // fontSizes["xl-sans"]
};

// Uniform 3:4 slate size shared by every marquee item (images + stat card)
const SLATE_HEIGHT = 400;
const SLATE_WIDTH = (SLATE_HEIGHT * 3) / 4;

const MARQUEE_IMAGES = [
  { src: 'https://byqsupply-components.netlify.app/evermind/images/TestimonialImage.webp', caption: 'Post-War & Contemporary' },
  { src: 'https://byqsupply-components.netlify.app/evermind/images/FeatureImage.webp', caption: 'Modern & Impressionist' },
  { src: 'https://byqsupply-components.netlify.app/evermind/images/MarqueeCube.webp', caption: 'Design & Decorative Arts' },
  { src: 'https://byqsupply-components.netlify.app/evermind/images/AboutBcity.webp', caption: 'Photographs' },
  { src: 'https://byqsupply-components.netlify.app/evermind/images/ServiceImage.webp', caption: 'Prints & Editions' },
];

function SlateCaption({ text }: { text: string }) {
  return (
    <div
      className="absolute bottom-4 left-4 rounded-[24px] px-5 py-3"
      style={{ backgroundColor: tokens.flagBg, border: `1px solid ${tokens.flagBorder}` }}
    >
      <p
        className="whitespace-nowrap m-0"
        style={{ fontFamily: tokens.fontSans, fontWeight: 300, fontSize: '1rem', lineHeight: '1.2', color: tokens.cardText }}
      >
        {text}
      </p>
    </div>
  );
}

function MarqueeSet() {
  return (
    <div className="flex flex-row gap-4 flex-shrink-0">
      {MARQUEE_IMAGES.map((img, i) => (
        <div
          key={i}
          className="relative overflow-hidden rounded-2xl flex-shrink-0"
          style={{ width: SLATE_WIDTH, height: SLATE_HEIGHT, aspectRatio: '3 / 4' }}
        >
          <img src={img.src} loading="lazy" alt="" className="w-full h-full object-cover" />
          <SlateCaption text={img.caption} />
        </div>
      ))}

      {/* Stat card — static, no link/button */}
      <div
        className="flex-shrink-0 rounded-2xl p-8 flex flex-col justify-between"
        style={{ width: SLATE_WIDTH, height: SLATE_HEIGHT, aspectRatio: '3 / 4', backgroundColor: tokens.cardBg, color: tokens.cardText }}
      >
        <div className="flex flex-col gap-4">
          <div
            className="text-[11px] font-semibold tracking-widest uppercase"
            style={{ fontFamily: tokens.fontSans, color: 'rgba(255,255,255,0.48)' }}
          >
            In the frame
          </div>
          <div className="leading-snug" style={{ fontFamily: tokens.fontSans, fontWeight: 500, fontSize: '1.125rem' }}>
            20/21 brings two centuries of artistic ambition together under one roof.
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <div style={{ fontFamily: tokens.fontSerif, fontSize: '3rem', fontWeight: 300 }}>200+</div>
          <div style={{ fontFamily: tokens.fontSans, fontSize: '0.875rem', color: 'rgba(255,255,255,0.64)' }}>
            Years of artistic history
          </div>
        </div>
      </div>
    </div>
  );
}

export function ChristiesShowcase() {
  const headingRef = React.useRef<HTMLHeadingElement>(null);
  const [headingVisible, setHeadingVisible] = React.useState(false);

  const bodyRef = React.useRef<HTMLDivElement>(null);
  const [bodyVisible, setBodyVisible] = React.useState(false);

  React.useEffect(() => {
    const observers: IntersectionObserver[] = [];

    const makeObs = (
      ref: React.RefObject<HTMLElement | null>,
      setter: (v: boolean) => void,
      delay: number
    ) => {
      const el = ref.current;
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setTimeout(() => setter(true), delay);
            obs.disconnect();
          }
        },
        { threshold: 0.1 }
      );
      obs.observe(el);
      observers.push(obs);
    };

    makeObs(headingRef, setHeadingVisible, 0);
    makeObs(bodyRef, setBodyVisible, 150);

    return () => observers.forEach((o) => o.disconnect());
  }, []);

  return (
    <section className="christies-showcase w-full overflow-hidden" style={{ backgroundColor: tokens.sectionBg }}>
      <div className="max-w-[940px] mx-auto px-5 pt-24 pb-16 flex flex-col items-center text-center max-[767px]:pt-16 max-[767px]:pb-10">
        {/* Heading */}
        <h2
          ref={headingRef}
          className={`leading-[1.1] transition-all duration-700 ease-out text-7xl max-[991px]:text-6xl max-[767px]:text-5xl max-[479px]:text-4xl ${
            headingVisible ? 'opacity-100 blur-0' : 'opacity-0 blur-[12px]'
          }`}
          style={{ fontFamily: tokens.fontSerif, fontWeight: 300, color: tokens.headingColor, margin: 0, marginBottom: '1rem' }}
        >
          Every era finds its stage
        </h2>

        {/* Body */}
        <div
          ref={bodyRef}
          className={`transition-all duration-700 ease-out ${
            bodyVisible ? 'opacity-100 blur-0' : 'opacity-0 blur-[12px]'
          }`}
          style={{ transitionDelay: '150ms' }}
        >
          <p
            className="m-0 leading-relaxed max-w-[560px] max-[767px]:text-base"
            style={{ fontFamily: tokens.fontSans, fontSize: tokens.sizeBody, fontWeight: 300, color: tokens.bodyColor }}
          >
            From the boldest icons of the twentieth century to the most vital voices working today, 20/21 brings
            two hundred years of artistic ambition into a single, continuing conversation.
          </p>
        </div>
      </div>

      {/* Marquee strip */}
      <div className="relative w-full overflow-hidden pb-16 max-[767px]:pb-10">
        <div
          className="absolute left-0 top-0 bottom-0 w-24 z-10 pointer-events-none"
          style={{ background: `linear-gradient(to right, ${tokens.sectionBg}, transparent)` }}
        />
        <div
          className="absolute right-0 top-0 bottom-0 w-24 z-10 pointer-events-none"
          style={{ background: `linear-gradient(to left, ${tokens.sectionBg}, transparent)` }}
        />

        <div className="flex flex-row gap-4 animate-marquee-showcase w-max">
          <MarqueeSet />
          <MarqueeSet />
          <MarqueeSet />
        </div>
      </div>

      <style>{`
        @keyframes marquee-showcase {
          from { transform: translateX(0); }
          to { transform: translateX(-33.333%); }
        }
        .animate-marquee-showcase {
          animation: marquee-showcase 40s linear infinite;
        }
        .animate-marquee-showcase:hover {
          animation-play-state: paused;
        }
      `}</style>
    </section>
  );
}

export default ChristiesShowcase;
