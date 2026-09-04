"use client";
/**
 * Christie's Testimonials — adapted from BYQ andfold-testimonials-1
 *
 * Restyled per the "Meet the team" Figma update (node 21:401):
 *   - Section bg swapped from black + blurred photo layer to a plain
 *     linear-gradient(#2d2d2d -> #737373 @125.13%) — no more photo layer.
 *   - "Specialists" pill label removed; heading now reads "Meet the team"
 *     (60px Flare) with a lorem ipsum sub-paragraph underneath (no pill).
 *   - Desktop card: fixed 1033px width (was 90%), 560px height (was 420px),
 *     16px gap between cards (was 6px), asymmetric padding pl-24/pr-48/py-24
 *     (was symmetric 18px), rounded-16 (was 12), portrait aspect-ratio
 *     1808:2400 (was 1790:2400). Name bumped to 40px, title to 16px, bio to
 *     24px — all now ABCArizonaFlare (Light) to match the rest of the page's
 *     headings, replacing the old Serif/sans mix.
 *   - The off-screen (next) card is blurred 7px @ 70% opacity, and this is
 *     now mapped continuously to drag position (not just an on/off snap) —
 *     see `applyCardVisualState` below.
 *   - CTA row unchanged (CONNECT WITH {name} + X / Instagram icon buttons),
 *     gap bumped to 16px per spec.
 *   - Mobile slate layout/typography is unaffected — only the desktop card.
 *
 * Token substitutions applied:
 *   Fonts:  LT Superior Serif → ABCArizonaSerif / ABCArizonaFlare
 *           42 Dotsans        → ABCArizonaSans
 *   Colors: section bg        → linear-gradient(#2d2d2d, #737373 125.13%)
 *           card bg           → rgba(42,42,42,0.9) + 6px backdrop blur
 *           card text         → #FFFFFF  (colors.white)
 */

import * as React from 'react';
// @ts-ignore
import Button from '@christies-ds/molecules/button/Button.jsx';
import { animateTextReveal, cleanupGSAPAnimations } from '../../utils/gsapAnimations';
import alexRotterImg from '../../assets/images/specialists/alex-rotter.jpg';
import maxCarterImg from '../../assets/images/specialists/max-carter.jpg';
import saraFriedlanderImg from '../../assets/images/specialists/sara-friedlander.jpg';
import johannaFlaumImg from '../../assets/images/specialists/johanna-flaum.jpg';

// ─── Christie's content ───────────────────────────────────────────────────────
const slides = [
  {
    authorName: 'Alex Rotter',
    handle: "Global President, Christie's",
    quote:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt laborum.",
    image: alexRotterImg,
  },
  {
    authorName: 'Max Carter',
    handle: 'Global Chairman, 20/21',
    quote:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt laborum.",
    image: maxCarterImg,
  },
  {
    authorName: 'Sara Friedlander',
    handle: 'Chairman, PWC',
    quote:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt laborum.",
    image: saraFriedlanderImg,
  },
  {
    authorName: 'Johanna Flaum',
    handle: 'Vice Chairman, PWC',
    quote:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt laborum.",
    image: johannaFlaumImg,
  },
];

// ─── Token-mapped style constants ─────────────────────────────────────────────
const tokens = {
  sectionBg: 'linear-gradient(to bottom, #2d2d2d 0%, #737373 125.13%)',
  // colors.white
  sectionText: '#FFFFFF',
  // rgba(42,42,42) @ 90% opacity, paired with a 6px backdrop blur
  cardBg: 'rgba(42, 42, 42, 0.9)',
  cardBlur: '6px',
  // colors.white
  cardText: '#FFFFFF',

  // typography.fontFamily — resolved via CSS vars from arizona-fonts.css
  fontFlare: 'var(--font-family-arizona-flare)',
  fontSans: 'var(--font-family-arizona-sans)',

  sizeH2: '3.75rem', // 60px, matches Categories/Philosophy heading scale
  sizeBody: '1rem', // 16px sub-paragraph

  cardRadius: '16px',
  imageRadius: '12px',
};

// Off-screen (non-active) card treatment — mapped continuously to drag position
const NEIGHBOR_BLUR_PX = 7;
const NEIGHBOR_OPACITY = 0.7;
const CARD_TRANSITION = 'filter 750ms cubic-bezier(0.16, 1, 0.3, 1), opacity 750ms cubic-bezier(0.16, 1, 0.3, 1)';

function firstName(fullName: string) {
  return fullName.split(' ')[0];
}

// ─── Component ────────────────────────────────────────────────────────────────
export function ChristiesTestimonials() {
  const [currentSlide, setCurrentSlide] = React.useState(0);
  const [stepPx, setStepPx] = React.useState(0);
  const trackRef = React.useRef<HTMLDivElement>(null);
  // Desktop card boxes only (mobile slate is unaffected by the blur/opacity effect)
  const cardRefs = React.useRef<(HTMLDivElement | null)[]>([]);

  // Heading entrance animation — using GSAP
  const headingRef = React.useRef<HTMLHeadingElement>(null);
  const subcopyRef = React.useRef<HTMLParagraphElement>(null);
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

    // Animate subcopy with delay (scroll-triggered)
    animateTextReveal(subcopyRef.current, {
      duration: 0.8,
      delay: 0.2,
      stagger: 0.05,
      yOffset: 20,
      triggerOnScroll: true,
    });

    return () => {
      cleanupGSAPAnimations();
    };
  }, [prefersReducedMotion]);

  // Measure card width for pixel-based translation (unchanged)
  React.useEffect(() => {
    const measure = () => {
      if (!trackRef.current) return;
      const card = trackRef.current.firstElementChild as HTMLElement | null;
      if (!card) return;
      const gap = parseFloat(getComputedStyle(trackRef.current).gap) || 8;
      setStepPx(card.offsetWidth + gap);
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  // Keep a ref in sync so pointer handlers read current slide without stale closures
  const currentSlideRef = React.useRef(currentSlide);
  React.useEffect(() => { currentSlideRef.current = currentSlide; }, [currentSlide]);

  // Applies the blur/opacity treatment to every desktop card, given a
  // (possibly fractional) index representing what's currently centered —
  // fractional during a drag so the effect tracks the finger continuously.
  // Only used to override the declarative per-card style below while an
  // actual drag gesture is in progress; JSX handles the settled state.
  const applyCardVisualState = (continuousIndex: number, animated: boolean) => {
    cardRefs.current.forEach((el, i) => {
      if (!el) return;
      const distance = Math.min(1, Math.abs(i - continuousIndex));
      el.style.transition = animated ? CARD_TRANSITION : 'none';
      el.style.filter = distance === 0 ? 'none' : `blur(${distance * NEIGHBOR_BLUR_PX}px)`;
      el.style.opacity = String(1 - distance * (1 - NEIGHBOR_OPACITY));
    });
  };

  const isDragging = React.useRef(false);
  // True only between an actual pointerdown and its matching up/cancel — guards
  // against pointermove, which fires on mouse hover with no button pressed
  const pointerActive = React.useRef(false);
  const dragStartX = React.useRef(0);
  const dragStartY = React.useRef(0);
  // null until the gesture's primary axis is determined, so a vertical scroll
  // swipe isn't misread as horizontal drag ("phantom touch" advancing slides)
  const dragAxis = React.useRef<'x' | 'y' | null>(null);
  const AXIS_LOCK_THRESHOLD = 8; // px of movement before committing to an axis
  const SNAP_THRESHOLD = 60; // px required to advance a slide
  const TRANSITION = 'transform 750ms cubic-bezier(0.16, 1, 0.3, 1)';

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!trackRef.current || stepPx === 0) return;
    pointerActive.current = true;
    dragStartX.current = e.clientX;
    dragStartY.current = e.clientY;
    dragAxis.current = null;
    isDragging.current = false;
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!trackRef.current || !pointerActive.current) return;
    const deltaX = e.clientX - dragStartX.current;
    const deltaY = e.clientY - dragStartY.current;

    if (dragAxis.current === null) {
      if (Math.abs(deltaX) < AXIS_LOCK_THRESHOLD && Math.abs(deltaY) < AXIS_LOCK_THRESHOLD) return;
      // Commit to whichever axis dominates the gesture so far
      dragAxis.current = Math.abs(deltaX) > Math.abs(deltaY) ? 'x' : 'y';
      if (dragAxis.current === 'x') {
        isDragging.current = true;
        trackRef.current.style.transition = 'none';
        try {
          e.currentTarget.setPointerCapture(e.pointerId);
        } catch {
          // Pointer may already be gone (e.g. a fast cancel) — safe to ignore
        }
      }
    }

    // Vertical gestures are left alone so the page scrolls natively
    if (dragAxis.current !== 'x' || !isDragging.current) return;
    const base = -(currentSlideRef.current * stepPx);
    trackRef.current.style.transform = `translateX(${base + deltaX}px)`;
    // Blur/opacity track the same progress, on the X axis, as the drag itself
    applyCardVisualState(currentSlideRef.current - deltaX / stepPx, false);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const wasDraggingX = isDragging.current && dragAxis.current === 'x';
    pointerActive.current = false;
    isDragging.current = false;
    dragAxis.current = null;
    if (!wasDraggingX || !trackRef.current) return;
    const delta = e.clientX - dragStartX.current;
    let next = currentSlideRef.current;
    if (delta < -SNAP_THRESHOLD) next = Math.min(slides.length - 1, next + 1);
    else if (delta > SNAP_THRESHOLD) next = Math.max(0, next - 1);
    trackRef.current.style.transition = TRANSITION;
    trackRef.current.style.transform = `translateX(-${next * stepPx}px)`;
    applyCardVisualState(next, true);
    setCurrentSlide(next);
  };

  const handlePrev = () => setCurrentSlide((s) => Math.max(0, s - 1));
  const handleNext = () => setCurrentSlide((s) => Math.min(slides.length - 1, s + 1));

  return (
    <section
      className="christies-testimonials relative z-[2] py-[28px] overflow-hidden"
      style={{ background: tokens.sectionBg, color: tokens.sectionText }}
    >
      {/* Main container */}
      <div
        className="relative z-[2] w-full mx-auto px-9 max-[991px]:px-6 max-[999px]:px-6"
        style={{ maxWidth: '1600px' }}
      >
        {/* Headline + arrows row */}
        <div className="testimonials-headline-row relative flex items-start justify-between mb-[60px]">
          <div className="specialists-header flex flex-col gap-6 items-start">
            {/* H2 — Christie's Flare heading */}
            <h2
              ref={headingRef}
              className="team-heading m-0"
              style={{
                fontFamily: tokens.fontFlare,
                lineHeight: '1.067',
                fontWeight: 100, // fontWeight.thin
                color: tokens.sectionText,
                maxWidth: '600px',
                fontSize: `clamp(24px, 12vw, 60px)`,
              }}
            >
              Meet the team
            </h2>

            {/* Sub-paragraph */}
            <p
              ref={subcopyRef}
              className="team-subcopy m-0"
              style={{
                fontFamily: tokens.fontSans,
                fontWeight: 300,
                fontSize: `clamp(14px, 2vw, 16px)`,
                lineHeight: '1.4',
                color: tokens.sectionText,
                maxWidth: '484px',
              }}
            >
              Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore
              et dolore magna aliqua.
            </p>
          </div>

          {/* Arrow buttons */}
          <div className="flex items-center gap-3 flex-shrink-0 mt-1.5 max-[999px]:hidden">
            <SliderButton onClick={handlePrev} direction="prev" />
            <SliderButton onClick={handleNext} direction="next" />
          </div>
        </div>

        {/* Slider */}
        <div className="relative">
          <div
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            style={{ cursor: 'grab', touchAction: 'pan-y', userSelect: 'none' }}
          >
            <div
              ref={trackRef}
              className="flex gap-4"
              style={{
                transform: `translateX(-${currentSlide * stepPx}px)`,
                transition: 'transform 750ms cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            >
              {slides.map((slide, i) => (
                <div key={i} className="w-full flex-shrink-0" style={{ maxWidth: 'clamp(280px, 90vw, 1033px)' }}>
                  {/* Card — desktop / tablet layout */}
                  <div
                    ref={(el) => { cardRefs.current[i] = el; }}
                    className="w-full flex gap-12 pl-6 pr-12 py-6 h-[560px] max-[991px]:flex-col max-[991px]:gap-9 max-[991px]:h-auto max-[999px]:hidden"
                    style={{
                      backgroundColor: tokens.cardBg,
                      backdropFilter: `blur(${tokens.cardBlur})`,
                      WebkitBackdropFilter: `blur(${tokens.cardBlur})`,
                      color: tokens.cardText,
                      borderRadius: tokens.cardRadius,
                      boxShadow: '0px 0px 12px 0px rgba(0,0,0,0.2)',
                      // Settled state (also the initial paint); drag overrides this imperatively
                      transition: CARD_TRANSITION,
                      filter: i === currentSlide ? 'none' : `blur(${NEIGHBOR_BLUR_PX}px)`,
                      opacity: i === currentSlide ? 1 : NEIGHBOR_OPACITY,
                    }}
                  >
                    {/* Portrait image — aspect-ratio locked; h-full needs the row's now-definite
                        height above, otherwise the aspect-ratio width calc is indeterminate and
                        the image falls back to its raw (oversized) intrinsic size.
                        bg + redundant radius on the <img> guard against the rounded-corner/
                        backdrop-filter "white seam" rendering artifact from the card's blur. */}
                    <div
                      className="h-full shrink-0 overflow-hidden max-[991px]:w-full max-[991px]:h-auto"
                      style={{ aspectRatio: '1800 / 2400', borderRadius: tokens.imageRadius, backgroundColor: '#000000' }}
                    >
                      <img
                        src={slide.image}
                        loading="lazy"
                        alt={slide.authorName}
                        draggable={false}
                        className="object-cover w-full h-full block"
                        style={{ borderRadius: tokens.imageRadius }}
                      />
                    </div>

                    {/* Right content */}
                    <div className="flex flex-1 min-w-0 flex-col justify-between items-start gap-9 pt-3">
                      {/* Quote block */}
                      <div className="flex flex-col gap-[18px] items-start justify-start w-full">
                        {/* Name + Job Title/Label */}
                        <div className="flex flex-col gap-[3px] items-start w-full">
                          <p
                            style={{
                              fontFamily: tokens.fontFlare,
                              fontWeight: 300,
                              fontSize: '2.5rem',
                              lineHeight: '1.2',
                              color: tokens.cardText,
                              margin: 0,
                            }}
                          >
                            {slide.authorName}
                          </p>
                          <p
                            style={{
                              fontFamily: tokens.fontSans,
                              fontWeight: 300,
                              fontSize: '1rem',
                              lineHeight: '1.4',
                              color: tokens.cardText,
                              margin: 0,
                            }}
                          >
                            {slide.handle}
                          </p>
                        </div>
                        {/* Bio — Arizona Flare */}
                        <div
                          style={{
                            fontFamily: tokens.fontFlare,
                            fontSize: '1.5rem',
                            lineHeight: '1.2',
                            fontWeight: 300,
                            color: tokens.cardText,
                          }}
                        >
                          {slide.quote}
                        </div>
                      </div>

                      {/* CTAs — connect + social (240x49 / 50x49, Figma node 21:421-425) */}
                      <div className="flex gap-4 items-center">
                        <Button type="Secondary" mode="Dark" className="!h-[49px]">
                          <MailIcon />
                          {`CONNECT WITH ${firstName(slide.authorName).toUpperCase()}`}
                        </Button>
                        <div className="flex gap-2 items-center">
                          <SocialIconButton icon="x" href="#" label={`Follow ${firstName(slide.authorName)} on X`} width="50px" height="49px" />
                          <SocialIconButton icon="instagram" href="#" label={`Follow ${firstName(slide.authorName)} on Instagram`} width="50px" height="49px" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card — mobile slate layout */}
                  <div
                    className="hidden max-[999px]:flex flex-col justify-between gap-[20px] items-center w-full h-full p-[18px]"
                    style={{
                      backgroundColor: tokens.cardBg,
                      backdropFilter: `blur(${tokens.cardBlur})`,
                      WebkitBackdropFilter: `blur(${tokens.cardBlur})`,
                      color: tokens.cardText,
                      borderRadius: tokens.cardRadius,
                    }}
                  >
                    {/* Top group — image + name/title, anchored top */}
                    <div className="flex flex-col items-center w-full">
                      {/* Circular portrait */}
                      <div
                        className="rounded-full overflow-hidden shrink-0 w-[153px] h-[153px]"
                      >
                        <img
                          src={slide.image}
                          loading="lazy"
                          alt={slide.authorName}
                          draggable={false}
                          className="object-cover w-full h-full"
                        />
                      </div>

                      {/* Name + Job Title/Label — centered */}
                      <div className="flex flex-col items-center gap-[3px] text-center mt-[9px] w-[240px]">
                        <p
                          style={{
                            fontFamily: tokens.fontFlare,
                            fontWeight: 300,
                            fontSize: '1.5rem',
                            lineHeight: '1.2',
                            color: tokens.cardText,
                            margin: 0,
                          }}
                        >
                          {slide.authorName}
                        </p>
                        <p
                          style={{
                            fontFamily: tokens.fontSans,
                            fontWeight: 300,
                            fontSize: '1rem',
                            lineHeight: '1.4',
                            color: tokens.cardText,
                            margin: 0,
                          }}
                        >
                          {slide.handle}
                        </p>
                      </div>
                    </div>

                    {/* Bottom group — bio + button, anchored bottom */}
                    <div className="flex flex-col w-full">
                      {/* Bio — left aligned */}
                      <p
                        className="w-full text-left"
                        style={{
                          fontFamily: tokens.fontSans,
                          fontWeight: 300,
                          fontSize: '1rem',
                          lineHeight: '1.4',
                          color: tokens.cardText,
                          margin: 0,
                        }}
                      >
                        {slide.quote}
                      </p>

                      {/* CTAs — single row; connect button fills the row, icons stay fixed-size */}
                      <div className="w-full mt-[18px] flex flex-row gap-[9px] items-center">
                        <Button type="Secondary" mode="Dark" className="!flex-1 !w-full !px-3 !h-9 !gap-1.5 !text-[10px]">
                          <MailIcon />
                          CONNECT
                        </Button>
                        <div className="flex gap-1.5 items-center shrink-0">
                          <SocialIconButton icon="x" href="#" label={`Follow ${firstName(slide.authorName)} on X`} />
                          <SocialIconButton icon="instagram" href="#" label={`Follow ${firstName(slide.authorName)} on Instagram`} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Mobile dot nav */}
          <div className="testimonials-dot-nav hidden max-[999px]:flex items-center justify-center gap-1.5">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentSlide(i)}
                className="rounded-full transition-all duration-300"
                style={{
                  width: currentSlide === i ? '12px' : '6px',
                  height: '6px',
                  backgroundColor: currentSlide === i ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.32)',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                }}
              />
            ))}
          </div>
        </div>
      </div>

      <style>{`
        .testimonials-dot-nav { margin-top: 1.5rem; }
      `}</style>
    </section>
  );
}

// ─── Slider arrow button — bg/border/shadow updated per Figma node 21:409 ─────
function SliderButton({ onClick, direction }: { onClick: () => void; direction: 'prev' | 'next' }) {
  const [hovered, setHovered] = React.useState(false);
  const [active, setActive] = React.useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setActive(false); }}
      onMouseDown={() => setActive(true)}
      onMouseUp={() => setActive(false)}
      className="flex items-center justify-center flex-shrink-0"
      style={{
        width: '44px',
        height: '44px',
        borderRadius: '100vw',
        border: `1px solid ${hovered ? '#ffffff' : '#6e6259'}`,
        backgroundColor: 'rgba(191, 184, 175, 0.6)',
        boxShadow: '0px 0px 12px 0px rgba(0,0,0,0.1)',
        color: '#ffffff',
        cursor: 'pointer',
        transition: 'border-color 0.3s, transform 0.2s',
        transform: active ? 'scale(0.9)' : 'scale(1)',
        outline: 'none',
      }}
    >
      {direction === 'prev' ? (
        <span className="flex items-center justify-center" style={{ width: '10px' }}>
          <svg width="100%" height="100%" viewBox="0 0 11 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9.66797 2L1.66797 10L9.66797 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" />
          </svg>
        </span>
      ) : (
        <span className="flex items-center justify-center ml-[3px]" style={{ width: '10px' }}>
          <svg width="100%" height="100%" viewBox="0 0 11 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M1.33203 18L9.33203 10L1.33203 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" />
          </svg>
        </span>
      )}
    </button>
  );
}

// ─── Social icon button — inverts to white fill / black icon on hover ─────────
function SocialIconButton({
  icon,
  href,
  label,
  width = '36px',
  height = '36px',
}: {
  icon: 'x' | 'instagram';
  href: string;
  label: string;
  width?: string;
  height?: string;
}) {
  return (
    <a
      href={href}
      aria-label={label}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-center rounded-full border border-solid border-white text-white transition-colors duration-200 hover:bg-white hover:text-black shrink-0"
      style={{ width, height }}
    >
      {icon === 'x' ? <XIcon /> : <InstagramIcon />}
    </a>
  );
}

function MailIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="3" width="14" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M1.5 4L8 9L14.5 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// X (Twitter) logo mark — path exported from Figma node 70:497 (X 16px)
function XIcon() {
  return (
    <svg width="10" height="9" viewBox="0 0 12.7765 12" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M0.0311503 0L4.964 6.61871L0 12H1.1172L5.46317 7.2886L8.9746 12H12.7765L7.56607 5.009L12.1865 0H11.0693L7.0669 4.33911L3.83302 0H0.0311503ZM1.67407 0.825802H3.42066L11.1333 11.1741H9.38671L1.67407 0.825802Z"
        fill="currentColor"
      />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="1.5" y="1.5" width="13" height="13" rx="4" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="11.5" cy="4.5" r="0.75" fill="currentColor" />
    </svg>
  );
}

export default ChristiesTestimonials;
