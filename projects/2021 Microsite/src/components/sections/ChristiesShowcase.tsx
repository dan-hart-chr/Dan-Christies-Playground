"use client";
/**
 * Christie's Showcase — adapted from BYQ evermind-hero-2 (Hero with Marquee)
 *
 * Per request: the "BYQ Studio celebrates..." announcement pill and the
 * original template CTA buttons were stripped out — only the heading, body
 * copy, and the auto-scrolling marquee strip remain from the BYQ reference.
 *
 * Restyled per the "20/21 Categories" Figma update (node 21:365):
 *   - Background: maroon-to-charcoal gradient (unchanged from the prior pass).
 *   - Cards enlarged to the real spec (400x480, was 225x300), each slate's
 *     caption as a left-border label + description block underneath it.
 *   - Real category artwork pulled from Figma (imgFrame23–27) and downsized
 *     locally for web (originals up to 15MB — resized to <=900px/~78% jpeg).
 *   - Added the "SEE ALL CATEGORIES" button (Figma node 21:376) below the
 *     marquee, static (not part of the auto-scroll).
 *
 * Token substitutions applied:
 *   Fonts:  Playfair Display  → ABCArizonaSerif
 *           Inter             → ABCArizonaSans
 *   Colors: bg #eeeae3        → linear-gradient(#530000 23.271%, #2d2d2d)
 *           heading #181e25   → colors.white
 *           body #181e25 @70% → colors.white
 *           dark card #181e25 → colors.black
 */

import * as React from 'react';
// @ts-ignore
import Button from '@christies-ds/molecules/button/Button.jsx';
import surrealism1 from '../../assets/images/categories/surrealism-1.jpg';
import popArt from '../../assets/images/categories/pop-art.jpg';
import impressionism from '../../assets/images/categories/impressionism.jpg';
import postWarContemporary from '../../assets/images/categories/post-war-contemporary.jpg';
import surrealism2 from '../../assets/images/categories/surrealism-2.jpg';

const tokens = {
  sectionBg: 'linear-gradient(to bottom, #530000 23.271%, #2d2d2d)',
  headingColor: '#FFFFFF', // colors.white
  bodyColor: '#FFFFFF', // colors.white
  cardText: '#FFFFFF', // colors.white
  captionBorder: 'rgba(153, 153, 153, 0.5)',

  fontSerif: 'var(--font-family-arizona-serif)',
  fontSans: 'var(--font-family-arizona-sans)',

  sizeHeading: '3.375rem', // fontSizes["5xl-xl"] scaled 0.75x
  sizeBody: '0.875rem', // fontSizes["xl-sans"] scaled 0.75x
};

// Uniform slate size shared by every marquee item (Figma node 21:365 spec)
const SLATE_WIDTH = 400;
const SLATE_HEIGHT = 480;

const MARQUEE_IMAGES = [
  { src: surrealism1, caption: 'Surrealism|Decoding the most enigmatic art movement of the twentieth century.' },
  { src: popArt, caption: 'Pop Art|Decoding the most enigmatic art movement of the twentieth century.' },
  { src: impressionism, caption: 'Impressionism|Decoding the most enigmatic art movement of the twentieth century.' },
  { src: postWarContemporary, caption: 'Post War & Contemporary|Decoding the most enigmatic art movement of the twentieth century.' },
  { src: surrealism2, caption: 'Surrealism|Decoding the most enigmatic art movement of the twentieth century.' },
];

function SlateCaption({ text }: { text: string }) {
  const [label, description] = text.split('|');
  return (
    <div
      className="flex flex-col gap-2 items-start pl-3 mt-4"
      style={{ width: SLATE_WIDTH, borderLeft: `1px solid ${tokens.captionBorder}` }}
    >
      <p
        className="m-0 uppercase"
        style={{ fontFamily: tokens.fontSerif, fontWeight: 300, fontSize: '1.25rem', lineHeight: '1.056', letterSpacing: '0.1875rem', color: tokens.cardText }}
      >
        {label}
      </p>
      <p
        className="m-0"
        style={{ fontFamily: tokens.fontSans, fontWeight: 300, fontSize: '1rem', lineHeight: '1.4', color: tokens.cardText }}
      >
        {description}
      </p>
    </div>
  );
}

function MarqueeSet() {
  return (
    <div className="flex flex-row gap-4 flex-shrink-0 items-start">
      {MARQUEE_IMAGES.map((img, i) => (
        <div key={i} className="flex flex-col flex-shrink-0">
          <div
            className="relative overflow-hidden rounded-2xl flex-shrink-0"
            style={{ width: SLATE_WIDTH, height: SLATE_HEIGHT }}
          >
            <img src={img.src} loading="lazy" alt="" className="w-full h-full object-cover" />
          </div>
          <SlateCaption text={img.caption} />
        </div>
      ))}
    </div>
  );
}

// — "See all categories" button (Figma node 21:376) — static, sits below the marquee
function GridViewIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="2" width="5" height="5" rx="1" fill="currentColor" />
      <rect x="9" y="2" width="5" height="5" rx="1" fill="currentColor" />
      <rect x="2" y="9" width="5" height="5" rx="1" fill="currentColor" />
      <rect x="9" y="9" width="5" height="5" rx="1" fill="currentColor" />
    </svg>
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
    <section className="christies-showcase w-full overflow-hidden" style={{ background: tokens.sectionBg }}>
      <div className="showcase-top max-w-[705px] mx-auto px-[15px] pt-[72px] pb-12 flex flex-col items-center text-center max-[767px]:pt-12 max-[767px]:pb-[30px]">
        {/* Heading */}
        <h2
          ref={headingRef}
          className={`showcase-heading leading-[1.1] transition-all duration-700 ease-out text-7xl max-[991px]:text-6xl max-[767px]:text-5xl max-[479px]:text-4xl ${
            headingVisible ? 'opacity-100 blur-0' : 'opacity-0 blur-[12px]'
          }`}
          style={{ fontFamily: tokens.fontSerif, fontWeight: 300, color: tokens.headingColor, margin: 0, marginBottom: '0.75rem' }}
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
            className="m-0 leading-relaxed max-w-[420px] max-[767px]:text-base"
            style={{ fontFamily: tokens.fontSans, fontSize: tokens.sizeBody, fontWeight: 300, color: tokens.bodyColor }}
          >
            From the boldest icons of the twentieth century to the most vital voices working today, 20/21 brings
            two hundred years of artistic ambition into a single, continuing conversation.
          </p>
        </div>
      </div>

      {/* Marquee strip */}
      <div className="showcase-marquee-wrap relative w-full overflow-hidden pb-12 max-[767px]:pb-[30px]">
        <div
          className="absolute left-0 top-0 bottom-0 w-[72px] z-10 pointer-events-none"
          style={{ background: `linear-gradient(to right, #2d2d2d, transparent)` }}
        />
        <div
          className="absolute right-0 top-0 bottom-0 w-[72px] z-10 pointer-events-none"
          style={{ background: `linear-gradient(to left, #2d2d2d, transparent)` }}
        />

        <div className="flex flex-row gap-4 animate-marquee-showcase w-max">
          <MarqueeSet />
          <MarqueeSet />
          <MarqueeSet />
        </div>
      </div>

      {/* See all categories */}
      <div className="flex justify-center pb-20 max-[767px]:pb-12">
        <Button type="Primary" mode="Light" className="!gap-2">
          <GridViewIcon />
          See all categories
        </Button>
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
        @media (max-width: 767px) {
          .christies-showcase .showcase-top { padding-top: 2.25rem !important; }
          .christies-showcase .showcase-marquee-wrap { padding-bottom: 2.25rem !important; }
          .christies-showcase .showcase-heading { font-size: 1.5rem !important; margin-bottom: 1.125rem !important; }
        }
      `}</style>
    </section>
  );
}

export default ChristiesShowcase;
