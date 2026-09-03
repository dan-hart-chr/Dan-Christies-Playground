"use client";
/**
 * Christie's Hero — adapted from BYQ franco-hero-1 (Hero with Video Background)
 *
 * Per latest design updates (Figma node 11:2955):
 *   - Title font: ABC Arizona Flare Thin (100 weight), 64px, -1.28px tracking
 *   - Height: 80vh (reduced from 100svh) so intro section visible on load
 *   - Padding: aligned to intro section (px-16 / px-8 / px-6 / px-3 per breakpoint)
 *   - Watch Video button reinstated in bottom right corner
 *   - Animated heading words fade in via Web Animations API (revealWords)
 *
 * Token substitutions applied:
 *   Fonts:  Instrument Serif        → ABCArizonaFlare (Thin)
 *           DM Mono / Inter         → ABCArizonaSans
 *   Colors: text / wordmark / label → #FFFFFF (colors.white)
 *           overlay                 → #000000 (colors.black) @ 40% opacity
 *
 * Wordmark swapped for the "20/21 Full Logo" SVG (Figma node 5:57), same
 * size/position as the frame it was exported from. It reveals with a
 * left-to-right clip-path wipe + fade, synced to the same trigger as the
 * heading word reveal below it.
 *
 * Background video replaced with the Christie's "gavelslam" clip (Figma
 * node 5:167 pointed to a native Figma video embed, which can't be exported
 * as bytes via the API — the user supplied the real asset directly).
 *
 * Watch Video button dimensions/type sizes scaled 0.75x to match the rest of
 * this hero's already-scaled BYQ token substitutions.
 *
 * Video motion (per request, referencing kononenkogroup.com):
 *   - Zoom-out intro: the video itself starts at scale(1.15) and eases down
 *     to scale(1) once on mount — a one-time CSS transition on the <video>.
 *   - Scroll parallax: a wrapper div around the video gets a scroll-linked
 *     translateY (0–18% of its own height, applied instantly with no CSS
 *     transition) as the hero scrolls past, so the video lags behind the
 *     page scroll relative to the Philosophy section sliding in underneath
 *     — same technique as the reference site's hero image. That wrapper is
 *     oversized (negative top offset + extra height) so the shift never
 *     exposes a gap at the edges. Parallax and zoom live on separate
 *     elements so the zoom's transition doesn't bleed into scroll updates.
 *   - Both are skipped under prefers-reduced-motion.
 *
 * Heading reveal (per request, referencing kononenkogroup.com): the
 * reference site splits its headings into lines, each wrapped in an
 * overflow-clipped mask, and slides them in with a single JS-driven
 * animation pass (GSAP) rather than N separate CSS transitions each with
 * their own transition-delay. Reproduced here at the word level with the
 * native Web Animations API (`Element.animate`) — `revealWords` loops over
 * every word once and calls `.animate()` with a computed per-index delay,
 * instead of setting a `transitionDelay` per word and letting CSS drive it.
 */

import * as React from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { animateTextReveal, animateParallax, cleanupGSAPAnimations } from '../../utils/gsapAnimations';
import logo2021 from '../../assets/images/2021-full-logo.svg';
import gavelSlamVideo from '../../assets/videos/gavelslam.mp4';
import watchVideoThumbnail from '../../assets/images/watch-video-thumbnail.jpg';
import playIcon from '../../assets/icons/play.svg';

gsap.registerPlugin(ScrollTrigger);

const ZOOM_OUT_DURATION_MS = 2200;

const tokens = {
  overlayColor: '#000000', // colors.black
  textColor: '#FFFFFF', // colors.white

  fontFlare: 'var(--font-family-arizona-flare)',
  fontSans: 'var(--font-family-arizona-sans)',

  sizeHeading: '64px', // 64px per Figma node 11:2958
  sizeLabel: '0.625rem', // fontSizes["label-s"] scaled 0.75x
};

export function ChristiesHero() {
  const headingRef = React.useRef<HTMLDivElement>(null);
  const sectionRef = React.useRef<HTMLElement>(null);
  const parallaxRef = React.useRef<HTMLDivElement>(null);
  const watchButtonRef = React.useRef<HTMLButtonElement>(null);
  const [zoomedOut, setZoomedOut] = React.useState(false);
  const [prefersReducedMotion] = React.useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  // Zoom-out intro — one-time CSS transition
  React.useEffect(() => {
    setZoomedOut(true);
  }, []);

  // GSAP animations — text reveal, parallax, and watch button
  React.useEffect(() => {
    if (prefersReducedMotion) return;

    // Animate heading text reveal with GSAP
    animateTextReveal(headingRef.current, {
      duration: 0.8,
      delay: 0,
      stagger: 0.1,
      yOffset: 20,
    });

    // Setup parallax for video background with GSAP
    if (parallaxRef.current) {
      animateParallax(parallaxRef.current, { speed: 0.5 });
    }

    // Fade in watch button after text animation
    if (watchButtonRef.current) {
      gsap.from(watchButtonRef.current, {
        opacity: 0,
        y: 24,
        duration: 0.6,
        delay: 1,
        ease: 'power3.out',
      });
    }

    // Fade in logo
    const logo = document.querySelector('.hero-logo');
    if (logo) {
      gsap.from(logo, {
        opacity: 0,
        duration: 0.8,
        ease: 'power3.out',
      });
    }

    return () => {
      cleanupGSAPAnimations();
    };
  }, [prefersReducedMotion]);

  return (
    <section
      ref={sectionRef}
      className="christies-hero relative flex justify-start"
      style={{ minHeight: 'clamp(400px, 90vh, 100vh)', color: tokens.textColor, top: 0 }}
    >
      {/* Background Video — outer box is oversized (top offset + extra height)
          so the parallax div can translate down without exposing a gap.
          Parallax (instant) and zoom-out (transitioned) are on separate
          elements so one's transition doesn't bleed into the other. */}
      <div className="absolute inset-0 w-full h-full overflow-hidden" style={{ zIndex: 0 }}>
        <div
          ref={parallaxRef}
          className="absolute left-0 w-full"
          style={{ top: '-25%', height: '125%' }}
        >
          <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
            style={{
              transform: `scale(${zoomedOut ? 1 : 1.15})`,
              transition: prefersReducedMotion ? 'none' : `transform ${ZOOM_OUT_DURATION_MS}ms cubic-bezier(0.16, 1, 0.3, 1)`,
            }}
          >
            <source src={gavelSlamVideo} type="video/mp4" />
          </video>
        </div>
      </div>

      {/* Dark overlay */}
      <div
        className="absolute inset-x-0 top-0 h-full"
        style={{ backgroundColor: tokens.overlayColor, opacity: 0.4, zIndex: 1 }}
      />

      {/* Main content container */}
      <div
        className="relative w-full flex flex-col justify-between items-start px-16 max-[991px]:px-8 max-[767px]:px-6 max-[479px]:px-5 pt-[15px] pb-[60px] max-[479px]:pt-5 max-[479px]:pb-5"
        style={{
          zIndex: 2,
          maxWidth: '1600px',
          marginLeft: 'auto',
          marginRight: 'auto',
        }}
      >
        <div className="flex flex-col justify-between items-start w-full h-full">
          {/* Top: wordmark — reveals with fade */}
          <div className="flex flex-col w-full gap-[9px]">
            <div className="w-full overflow-hidden">
              <img
                src={logo2021}
                alt="20/21"
                className="hero-logo w-full h-auto"
              />
            </div>
          </div>

          {/* Bottom row: animated heading + Watch Video button */}
          <div className="flex flex-row items-end justify-between gap-6 w-full max-[767px]:flex-col max-[767px]:items-start max-[767px]:gap-8">
            {/* Simple heading for GSAP text reveal */}
            <h1
              ref={headingRef}
              className="hero-heading"
              style={{
                maxWidth: '540px',
                fontFamily: tokens.fontFlare,
                fontWeight: 100,
                lineHeight: '1.1',
                color: tokens.textColor,
                fontSize: `clamp(30px, 7.7vw, 64px)`,
                letterSpacing: `clamp(-0.6px, -1.92vw, -1.28px)`,
                margin: 0,
              }}
            >
              Extraordinary art deserves an extraordinary stage
            </h1>

            <WatchVideoButton ref={watchButtonRef} />
          </div>
        </div>
      </div>

      <style>{`
        /* Responsive styling is now handled via clamp() in inline styles */
      `}</style>
    </section>
  );
}

// — Watch Video button (Figma node 21:348)
// Mobile (max-767px): horizontal layout with thumbnail left, text right
// Desktop: vertical layout with thumbnail on top, text below
const WatchVideoButton = React.forwardRef<HTMLButtonElement>((_props, ref) => {
  return (
    <button
      ref={ref}
      type="button"
      className="watch-video-btn flex flex-col max-[767px]:flex-row items-center shrink-0 max-[767px]:!w-full"
      style={{
        width: '252px',
        height: 'auto',
        padding: '8px',
        gap: '8px',
        borderRadius: '8px',
        backgroundColor: 'rgba(220, 218, 215, 0.9)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        border: 'none',
        cursor: 'pointer',
      }}
    >
      {/* Thumbnail — full width of the 252px container on desktop, fixed 137px wide on mobile */}
      <div 
        className="relative shrink-0 overflow-hidden w-full max-[767px]:w-[clamp(80px,35vw,137px)]" 
        style={{ 
          borderRadius: '8px',
          aspectRatio: '137 / 83',
        }}
      >
        <img src={watchVideoThumbnail} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <span
          className="absolute flex items-center justify-center rounded-full"
          style={{
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: '#ece7d9',
            padding: '6px',
            boxShadow: '0 0 6px rgba(0,0,0,0.25)',
            width: '28px',
            height: '28px',
            minWidth: '28px',
            minHeight: '28px',
          }}
        >
          <img src={playIcon} alt="" style={{ width: '12px', height: '12px' }} />
        </span>
      </div>

      {/* Watch Video text — visible on all breakpoints, centered positioning */}
      <p
        className="uppercase text-center w-full m-0"
        style={{ 
          fontFamily: tokens.fontSans, 
          fontWeight: 500, 
          fontSize: '14px',
          lineHeight: '1.2', 
          color: '#000000',
        }}
      >
        Watch Video
      </p>
    </button>
  );
});

export default ChristiesHero;
