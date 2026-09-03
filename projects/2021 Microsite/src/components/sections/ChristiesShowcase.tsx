"use client";
/**
 * Christie's Showcase — adapted from BYQ evermind-hero-2 (Hero with Marquee)
 *
 * Per request: the "BYQ Studio celebrates..." announcement pill and the
 * original template CTA buttons were stripped out — only the heading, body
 * copy, and the auto-scrolling marquee strip remain from the BYQ reference.
 *
 * Restyled per the "20/21 Categories" Figma update (node 21:365):
 *   - Background: maroon-to-charcoal gradient, top stop bumped to #640303
 *     (was #530000) so it reads as distinct from ChristiesPhilosophy above it.
 *   - Cards enlarged to the real spec (400x480, was 225x300), each slate's
 *     caption as a left-border label + description block underneath it.
 *   - Real category artwork pulled from Figma (imgFrame23–27) and downsized
 *     locally for web (originals up to 15MB — resized to <=900px/~78% jpeg).
 *   - Added the "SEE ALL CATEGORIES" button (Figma node 21:376) below the
 *     marquee, static (not part of the auto-scroll).
 *   - Heading/body copy swapped to match Figma exactly ("20/21 Categories" +
 *     lorem ipsum placeholder), replacing the earlier real copy.
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
import { animateTextReveal, animateFadeInOnScroll, cleanupGSAPAnimations } from '../../utils/gsapAnimations';
import surrealism1 from '../../assets/images/categories/surrealism-1.jpg';
import popArt from '../../assets/images/categories/pop-art.jpg';
import impressionism from '../../assets/images/categories/impressionism.jpg';
import postWarContemporary from '../../assets/images/categories/post-war-contemporary.jpg';
import surrealism2 from '../../assets/images/categories/surrealism-2.jpg';

const tokens = {
  sectionBg: 'linear-gradient(to bottom, #640303 23.271%, #2d2d2d)',
  headingColor: '#FFFFFF', // colors.white
  bodyColor: '#FFFFFF', // colors.white
  cardText: '#FFFFFF', // colors.white
  captionBorder: 'rgba(153, 153, 153, 0.5)',

  fontFlare: 'var(--font-family-arizona-flare)',
  fontSerif: 'var(--font-family-arizona-serif)',
  fontSans: 'var(--font-family-arizona-sans)',

  sizeHeading: '3.375rem', // fontSizes["5xl-xl"] scaled 0.75x
  sizeBody: '0.875rem', // fontSizes["xl-sans"] scaled 0.75x
};

// Uniform slate size shared by every marquee item (Figma node 21:365 spec)
// Now responsive: 281px on mobile (390px viewport), scales up to 400px desktop
const getSlateWidth = () => typeof window !== 'undefined' ? `clamp(200px, 72vw, 400px)` : '400px';
const getSlateHeight = () => typeof window !== 'undefined' ? `clamp(240px, 86vw, 480px)` : '480px';
const SLATE_WIDTH = 400;  // fallback for server
const SLATE_HEIGHT = 480; // fallback for server

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
      className="flex flex-col gap-2 items-start mt-4"
      style={{ width: `clamp(200px, 72vw, ${SLATE_WIDTH}px)` }}
    >
      <p
        className="m-0 uppercase"
        style={{ fontFamily: tokens.fontFlare, fontWeight: 300, fontSize: `clamp(16px, 2vw, 20px)`, lineHeight: '1.056', letterSpacing: '0.1875rem', color: tokens.cardText }}
      >
        {label}
      </p>
      <p
        className="m-0"
        style={{ fontFamily: tokens.fontSans, fontWeight: 300, fontSize: `clamp(14px, 1.5vw, 16px)`, lineHeight: '1.4', color: tokens.cardText }}
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
        <div key={i} className="flex flex-col flex-shrink-0 marquee-card">
          <div
            className="relative overflow-hidden rounded-2xl flex-shrink-0"
            style={{ width: `clamp(200px, 72vw, ${SLATE_WIDTH}px)`, height: `clamp(240px, 86vw, ${SLATE_HEIGHT}px)`, aspectRatio: `${SLATE_WIDTH}/${SLATE_HEIGHT}` }}
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
  const bodyRef = React.useRef<HTMLDivElement>(null);
  const marqueeRef = React.useRef<HTMLDivElement>(null);
  const [prefersReducedMotion] = React.useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  React.useEffect(() => {
    if (prefersReducedMotion) return;

    // Animate heading with GSAP (scroll-triggered)
    animateTextReveal(headingRef.current, {
      duration: 0.8,
      stagger: 0.1,
      yOffset: 20,
      triggerOnScroll: true,
    });

    // Animate body with slight delay (scroll-triggered)
    animateTextReveal(bodyRef.current, {
      duration: 0.8,
      delay: 0.15,
      stagger: 0.05,
      yOffset: 20,
      triggerOnScroll: true,
    });

    // Fade in marquee cards with staggered animation
    const slideElements = marqueeRef.current?.querySelectorAll('.marquee-card');
    if (slideElements) {
      slideElements.forEach((el, i) => {
        animateFadeInOnScroll(el as HTMLElement, {
          duration: 0.8,
          yOffset: 30,
        });
      });
    }

    return () => {
      cleanupGSAPAnimations();
    };
  }, [prefersReducedMotion]);

  return (
    <section className="christies-showcase w-full overflow-hidden" style={{ background: tokens.sectionBg }}>
      <div className="showcase-top max-w-[705px] mx-auto px-[15px] pt-[72px] pb-12 flex flex-col items-center text-center max-[767px]:items-start max-[767px]:text-left max-[767px]:pt-12 max-[767px]:pb-10 max-[479px]:pt-8 max-[479px]:px-6">
        {/* Heading */}
        <h2
          ref={headingRef}
          className="showcase-heading leading-[1.1]"
          style={{ 
            fontFamily: tokens.fontFlare, 
            fontWeight: 100, 
            color: tokens.headingColor, 
            margin: 0, 
            marginBottom: '0.75rem',
            fontSize: `clamp(28px, 12vw, 54px)`,
          }}
        >
          20/21 Categories
        </h2>

        {/* Body */}
        <div ref={bodyRef} className="text-center max-[767px]:text-left">
          <p
            className="m-0"
            style={{
              fontFamily: tokens.fontSans,
              fontSize: `clamp(14px, 2vw, 16px)`,
              fontWeight: 300,
              lineHeight: '1.4',
              color: tokens.bodyColor,
              maxWidth: '484px',
              marginLeft: 'auto',
              marginRight: 'auto',
            }}
          >
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore
            et dolore magna aliqua.
          </p>
        </div>
      </div>

      {/* Marquee strip */}
      <div className="showcase-marquee-wrap relative w-full overflow-hidden pb-12 max-[767px]:pb-[48px]" ref={marqueeRef}>
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
        <Button type="Primary" mode="Light" className="see-all-categories-btn !gap-2">
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
        .see-all-categories-btn:hover {
          background-color: #ffffff;
          color: #000000;
        }
      `}</style>
    </section>
  );
}

export default ChristiesShowcase;
