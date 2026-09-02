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
import logo2021 from '../../assets/images/2021-full-logo.svg';
import gavelSlamVideo from '../../assets/videos/gavelslam.mp4';
import watchVideoThumbnail from '../../assets/images/watch-video-thumbnail.jpg';
import playIcon from '../../assets/icons/play.svg';

const PARALLAX_MAX_PERCENT = 18;
const ZOOM_OUT_DURATION_MS = 2200;

const words = [
  'Extraordinary',
  'art',
  'deserves',
  'an',
  'extraordinary',
  'stage',
];

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
  const wordRefs = React.useRef<(HTMLDivElement | null)[]>([]);
  const [wordsVisible, setWordsVisible] = React.useState(false);

  const sectionRef = React.useRef<HTMLElement>(null);
  const parallaxRef = React.useRef<HTMLDivElement>(null);
  const [zoomedOut, setZoomedOut] = React.useState(false);
  const [prefersReducedMotion] = React.useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  // Word reveal — a single JS-driven pass over the word elements (Web
  // Animations API), matching the reference site's mask+translateY line
  // reveal (one script orchestrating every line) instead of N separate CSS
  // transitions each carrying their own hardcoded transition-delay.
  const revealWords = React.useCallback(() => {
    wordRefs.current.forEach((el, i) => {
      if (!el) return;
      if (prefersReducedMotion) {
        el.style.transform = 'translate3d(0, 0%, 0)';
        return;
      }
      el.animate(
        [{ transform: 'translate3d(0, 200%, 0)' }, { transform: 'translate3d(0, 0%, 0)' }],
        { duration: 700, delay: i * 80, easing: 'cubic-bezier(0.16, 1, 0.3, 1)', fill: 'forwards' }
      );
    });
  }, [prefersReducedMotion]);

  React.useEffect(() => {
    const el = headingRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setWordsVisible(true);
          revealWords();
          obs.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [revealWords]);

  // Zoom-out intro — one-time. useEffect (unlike useLayoutEffect) already
  // fires after the browser paints, so the zoomed-in start state is visible
  // for a frame before this flips it, giving the transition something to animate.
  React.useEffect(() => {
    setZoomedOut(true);
  }, []);

  // Scroll parallax — the video lags behind the page scroll as the hero
  // passes by, capped once the section has fully scrolled out of view.
  // Applied directly (no CSS transition, no rAF throttling — a single
  // getBoundingClientRect + style write per scroll event is cheap) so it
  // tracks the scroll 1:1 with no rubber-banding or lag; the oversized box
  // (negative top + extra height) means shifting it down never exposes a
  // gap at the wrapper's edges.
  React.useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const update = () => {
      const section = sectionRef.current;
      const parallax = parallaxRef.current;
      if (!section || !parallax) return;
      const rect = section.getBoundingClientRect();
      const progress = Math.min(1, Math.max(0, -rect.top / rect.height));
      parallax.style.transform = `translate3d(0, ${progress * PARALLAX_MAX_PERCENT}%, 0)`;
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="christies-hero relative flex justify-start items-end"
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
          style={{ top: `-${PARALLAX_MAX_PERCENT}%`, height: `${100 + PARALLAX_MAX_PERCENT}%` }}
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
        className="relative w-full flex flex-col justify-between items-start px-16 max-[991px]:px-8 max-[767px]:px-6 max-[479px]:px-3"
        style={{
          zIndex: 2,
          maxWidth: '1600px',
          marginLeft: 'auto',
          marginRight: 'auto',
          paddingTop: '15px',
          paddingBottom: '60px',
          height: '100%',
        }}
      >
        <div className="flex flex-col justify-between items-start w-full h-full gap-[30px]">
          {/* Top: wordmark — reveals left-to-right (wipe + fade), synced with the heading animation below */}
          <div className="flex flex-col w-full gap-[9px]">
            <div className="w-full overflow-hidden">
              <img
                src={logo2021}
                alt="20/21"
                className="w-full h-auto transition-all duration-1000 ease-out"
                style={{
                  clipPath: wordsVisible ? 'inset(0 0% 0 0)' : 'inset(0 100% 0 0)',
                  opacity: wordsVisible ? 1 : 0,
                }}
              />
            </div>
          </div>

          {/* Bottom row: animated heading (buttons removed per request) + Watch Video button */}
          <div className="flex flex-row items-end justify-between gap-6 w-full max-[767px]:flex-col max-[767px]:items-start max-[767px]:gap-4">
            <div ref={headingRef} className="hero-words flex flex-wrap gap-x-[9px] max-[767px]:gap-x-1 max-[479px]:gap-x-0.5" style={{ maxWidth: '540px' }}>
              {words.map((word, i) => (
                <div
                  key={i}
                  className="overflow-hidden"
                  style={{ marginBottom: '-11px', paddingBottom: '11px' }}
                >
                  <div
                    ref={(el) => { wordRefs.current[i] = el; }}
                    className="hero-word"
                    style={{
                      fontFamily: tokens.fontFlare,
                      fontWeight: 100,
                      lineHeight: '1.1',
                      color: tokens.textColor,
                      transform: 'translate3d(0, 200%, 0)',
                      fontSize: `clamp(30px, 7.7vw, 64px)`,
                      letterSpacing: `clamp(-0.6px, -1.92vw, -1.28px)`,
                    }}
                  >
                    {word}
                  </div>
                </div>
              ))}
            </div>

            <WatchVideoButton visible={wordsVisible} delayMs={words.length * 80 + 200} />
          </div>
        </div>
      </div>

      <style>{`
        /* Responsive styling is now handled via clamp() in inline styles */
      `}</style>
    </section>
  );
}

// — Watch Video button (Figma node 21:348) — fades/slides in after the heading words finish
// Mobile (max-767px): horizontal layout with thumbnail left, text right
// Desktop: vertical layout with thumbnail on top, text below
function WatchVideoButton({ visible, delayMs }: { visible: boolean; delayMs: number }) {
  return (
    <button
      type="button"
      className="watch-video-btn flex flex-col max-[767px]:flex-row items-start max-[767px]:items-center shrink-0 transition-all duration-700 ease-out"
      style={{
        width: '100%',
        maxWidth: '100%',
        height: 'auto',
        maxHeight: '83px',
        padding: '8px',
        gap: '8px',
        borderRadius: '8px',
        backgroundColor: 'rgba(220, 218, 215, 0.9)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        border: 'none',
        cursor: 'pointer',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(24px)',
        transitionDelay: `${delayMs}ms`,
      }}
    >
      {/* Thumbnail — 137px wide on mobile, maintains aspect ratio on desktop */}
      <div 
        className="relative shrink-0 overflow-hidden" 
        style={{ 
          borderRadius: '8px',
          width: `clamp(80px, 35vw, 137px)`,
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
      <span
        className="uppercase flex-1 text-center"
        style={{ 
          fontFamily: tokens.fontSans, 
          fontWeight: 500, 
          fontSize: '14px',
          lineHeight: '1.2', 
          color: '#000000',
          minWidth: 0,
        }}
      >
        Watch Video
      </span>
    </button>
  );
}

export default ChristiesHero;
