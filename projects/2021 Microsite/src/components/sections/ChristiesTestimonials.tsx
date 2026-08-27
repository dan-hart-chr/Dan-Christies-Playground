"use client";
/**
 * Christie's Testimonials — adapted from BYQ andfold-testimonials-1
 *
 * Slate redesign per Figma (20/21 Wireframe, node 70:486):
 *   - Card height reduced (desktop/tablet); portrait now aspect-ratio locked
 *     (1790:2400 — trimmed from the Figma 1808:2400 spec to clip a stray
 *     outline artifact at the image edges) instead of a fixed-height crop,
 *     so it scales down with the row instead of a fixed 624px box.
 *   - Card bg → colors.black-400 @ 90% opacity + 6px backdrop blur; text → white.
 *   - CTA row replaced with a "CONNECT WITH {name}" button plus X / Instagram
 *     icon buttons. All three invert to a white fill / black icon+text on hover
 *     (see Button.jsx Secondary+Dark mode).
 *   - Colour/blur/CTA changes are mirrored on the mobile slate too; the mobile
 *     card's height/layout is otherwise unchanged.
 *
 * Token substitutions applied:
 *   Fonts:  LT Superior Serif → ABCArizonaSerif
 *           42 Dotsans        → ABCArizonaSans
 *   Colors: section bg        → #000000  (colors.black)
 *           card bg           → rgba(51,51,51,0.9)  (colors.black-400 @ 90%)
 *           card text         → #FFFFFF  (colors.white)
 *           label text        → #960000  (colors.brand-c-red)
 *           label bg          → rgba(150,0,0,0.08)
 *
 * All animations, slider mechanics, and responsive behaviour are unchanged.
 */

import * as React from 'react';
// @ts-ignore
import Button from '@christies-ds/molecules/button/Button.jsx';
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
      "Alex Rotter is an Austrian man with a deep appreciation for the arts. He is the global president of Christie's. There are few people who are as well acquainted with Warhol as him. He has an impressive collection of jackets and it feels like he saves some of them for evening sales. He\u2019s a friend to animals and humans alike. Blop Blop Blop.",
    image: alexRotterImg,
  },
  {
    authorName: 'Max Carter',
    handle: 'Global Chairman, 20/21',
    quote:
      "Here is a little blurb about Max Carter. He is an important guy around here. People like Max because he helps them do their jobs. People recognize that Max is good at his job and they also recognize him by his hair. Max enjoys art and has been at Christie\u2019s since he was born. He is friends with King Charles. When you click read more it could drive to an interview with Tilly?",
    image: maxCarterImg,
  },
  {
    authorName: 'Sara Friedlander',
    handle: 'Chairman, PWC',
    quote:
      "He\u2019re is where we put some info about Ms. Sara Friedlander. She is a friend to both animals and humans. Her parents were rabbis and growing up every Saturday they let her choose between going to temple or a museum. She always chose museum and now she is part of the upper echelon of Christie\u2019s elite. She is proudly from the UWS.",
    image: saraFriedlanderImg,
  },
  {
    authorName: 'Johanna Flaum',
    handle: 'Vice Chairman, PWC',
    quote:
      "Ms. Johanna Flaum is that girl. She has an office in a very nice part of Rockefeller Center and is always down to share feedback. She doesn\u2019t play around! She has a pretty encycolpedic knowledge of major Post-War and Contemporary artists. Mess with her and you will be sorry. Johanna does not suffer fools and I bet you she\u2019d say that too! She went to Penn which is like the best.",
    image: johannaFlaumImg,
  },
];

// ─── Token-mapped style constants ─────────────────────────────────────────────
const tokens = {
  // colors.black
  sectionBg: '#000000',
  // colors.white
  sectionText: '#FFFFFF',
  // colors.black-400 @ 90% opacity, paired with a 6px backdrop blur
  cardBg: 'rgba(51, 51, 51, 0.9)',
  cardBlur: '6px',
  // colors.white
  cardText: '#FFFFFF',
  // colors.brand-c-red
  labelText: '#FFFFFF',
  labelBg: 'rgba(40, 40, 40, 0.65)',
  introText: '#960000', // colors.brand-c-red

  // typography.fontFamily — resolved via CSS vars from arizona-fonts.css
  fontSerif: 'var(--font-family-arizona-serif)',
  fontSans: 'var(--font-family-arizona-sans)',

  // typography.fontSizes — closest Christie's token to original sizes
  sizeH2: '3.5rem',      // fontSizes["5xl-lg"]  ≈ 56px
  sizeQuote: '2.25rem',  // fontSizes["4xl"]     ≈ 36px
  sizeLabel: '0.75rem',  // fontSizes["label-s"]
  sizeBody: '1rem',      // fontSizes["body"]

  // radius
  cardRadius: '16px',    // radius-2 (Figma)
  imageRadius: '12px',   // radius.sm
  labelRadius: '12px',
};

function firstName(fullName: string) {
  return fullName.split(' ')[0];
}

// ─── Component ────────────────────────────────────────────────────────────────
export function ChristiesTestimonials() {
  const [currentSlide, setCurrentSlide] = React.useState(0);
  const [stepPx, setStepPx] = React.useState(0);
  const trackRef = React.useRef<HTMLDivElement>(null);

  // Heading entrance animation (unchanged from BYQ original)
  const headingRef = React.useRef<HTMLHeadingElement>(null);
  const [headingVisible, setHeadingVisible] = React.useState(false);

  React.useEffect(() => {
    const el = headingRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setHeadingVisible(true); obs.disconnect(); } },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

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
    setCurrentSlide(next);
  };

  const handlePrev = () => setCurrentSlide((s) => Math.max(0, s - 1));
  const handleNext = () => setCurrentSlide((s) => Math.min(slides.length - 1, s + 1));

  return (
    <section
      className="relative z-[2] py-[120px] overflow-hidden"
      style={{ backgroundColor: tokens.sectionBg, color: tokens.sectionText }}
    >
      {/* Blurred background image layer (unchanged) */}
      <div className="absolute inset-0 w-full h-full flex" style={{ filter: 'blur(20px)', opacity: 0.35 }}>
        <img
          src="https://byqsupply-components.netlify.app/andfold/images/ArticleThumbnail2.jpeg"
          loading="lazy"
          srcSet="https://byqsupply-components.netlify.app/andfold/images/Portrait-in-Red-Top-p-500.jpeg 500w, https://byqsupply-components.netlify.app/andfold/images/Portrait-in-Red-Top-p-800.jpeg 800w, https://byqsupply-components.netlify.app/andfold/images/Portrait-in-Red-Top-p-1080.jpeg 1080w"
          sizes="100vw"
          alt=""
          className="object-cover w-full h-full"
        />
      </div>

      {/* Main container */}
      <div
        className="relative z-[2] w-full mx-auto px-12 max-[991px]:px-8 max-[767px]:px-5"
        style={{ maxWidth: '1800px' }}
      >
        {/* Headline + arrows row */}
        <div className="relative flex items-start justify-between mb-20">
          <div className="flex flex-col gap-8 items-start">
            {/* Label pill */}
            <div
              className="flex items-center justify-center"
              style={{
                backgroundColor: tokens.labelBg,
                borderRadius: tokens.labelRadius,
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                padding: '12px 16px',
              }}
            >
              <span
                className="uppercase tracking-widest"
                style={{
                  fontFamily: tokens.fontSans,
                  fontSize: tokens.sizeLabel,
                  lineHeight: '1',
                  fontWeight: 500,
                  letterSpacing: '0.15em',
                  color: tokens.labelText,
                }}
              >
                Specialists
              </span>
            </div>

            {/* H2 — Christie's serif heading */}
            <h2
              ref={headingRef}
              className={`m-0 transition-all duration-700 ease-out max-[479px]:text-[2.5rem] ${
                headingVisible ? 'opacity-100 blur-0' : 'opacity-0 blur-[20px]'
              }`}
              style={{
                fontFamily: tokens.fontSerif,
                fontSize: tokens.sizeH2,
                lineHeight: '1',
                fontWeight: 300, // fontWeight.light
                letterSpacing: '-0.03em',
                color: tokens.sectionText,
                maxWidth: '800px',
              }}
            >
              Get to know the team
            </h2>
          </div>

          {/* Arrow buttons */}
          <div className="flex items-center gap-4 flex-shrink-0 mt-2 max-[767px]:hidden">
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
              className="flex gap-2"
              style={{
                transform: `translateX(-${currentSlide * stepPx}px)`,
                transition: 'transform 750ms cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            >
              {slides.map((slide, i) => (
                <div key={i} className="w-[90%] flex-shrink-0 max-[767px]:w-[90%] max-[479px]:w-[92%]">
                  {/* Card — desktop / tablet layout */}
                  <div
                    className="w-full flex gap-12 pl-6 pr-12 py-6 h-[560px] max-[991px]:flex-col max-[991px]:gap-12 max-[991px]:h-auto max-[767px]:hidden"
                    style={{
                      backgroundColor: tokens.cardBg,
                      backdropFilter: `blur(${tokens.cardBlur})`,
                      WebkitBackdropFilter: `blur(${tokens.cardBlur})`,
                      color: tokens.cardText,
                      borderRadius: tokens.cardRadius,
                    }}
                  >
                    {/* Portrait image — aspect-ratio locked; h-full needs the row's now-definite
                        height above, otherwise the aspect-ratio width calc is indeterminate and
                        the image falls back to its raw (oversized) intrinsic size */}
                    <div
                      className="h-full shrink-0 overflow-hidden max-[991px]:w-full max-[991px]:h-auto"
                      style={{ aspectRatio: '1790 / 2400', borderRadius: tokens.imageRadius }}
                    >
                      <img
                        src={slide.image}
                        loading="lazy"
                        alt={slide.authorName}
                        draggable={false}
                        className="object-cover w-full h-full"
                      />
                    </div>

                    {/* Right content */}
                    <div className="flex flex-1 min-w-0 flex-col justify-between items-start gap-12 pt-4">
                      {/* Quote block */}
                      <div className="flex flex-col gap-6 items-start justify-start w-full">
                        {/* Name + Job Title/Label */}
                        <div className="flex flex-col gap-1 items-start w-full">
                          <p
                            style={{
                              fontFamily: tokens.fontSerif,
                              fontWeight: 300,
                              fontSize: '2rem',
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
                        {/* Quote — Arizona Serif */}
                        <div
                          style={{
                            fontFamily: tokens.fontSerif,
                            fontSize: '1.5rem',
                            lineHeight: '1.2',
                            fontWeight: 200,
                            letterSpacing: '-0.02em',
                            color: tokens.cardText,
                          }}
                        >
                          {slide.quote}
                        </div>
                      </div>

                      {/* CTAs — connect + social */}
                      <div className="flex gap-4 items-center">
                        <Button type="Secondary" mode="Dark" className="!w-auto">
                          <MailIcon />
                          {`CONNECT WITH ${firstName(slide.authorName).toUpperCase()}`}
                        </Button>
                        <div className="flex gap-2 items-center">
                          <SocialIconButton icon="x" href="#" label={`Follow ${firstName(slide.authorName)} on X`} />
                          <SocialIconButton icon="instagram" href="#" label={`Follow ${firstName(slide.authorName)} on Instagram`} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card — mobile slate layout */}
                  <div
                    className="hidden max-[767px]:flex flex-col justify-between gap-10 items-center w-full h-full p-6"
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
                        className="rounded-full overflow-hidden shrink-0 w-[204px] h-[204px]"
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
                      <div className="flex flex-col items-center gap-1 text-center mt-3 w-[192px]">
                        <p
                          style={{
                            fontFamily: tokens.fontSerif,
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
                            fontSize: '0.875rem',
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

                      {/* CTAs — single row; connect button flexes/truncates to fit */}
                      <div className="w-full mt-6 flex flex-row gap-3 items-center">
                        <Button type="Secondary" mode="Dark" className="!w-auto !px-4 flex-1 min-w-0 overflow-hidden">
                          <MailIcon />
                          <span className="truncate min-w-0 flex-1 text-left">{`CONNECT WITH ${firstName(slide.authorName).toUpperCase()}`}</span>
                        </Button>
                        <div className="flex gap-2 items-center shrink-0">
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
          <div className="testimonials-dot-nav hidden max-[767px]:flex items-center justify-center gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentSlide(i)}
                className="rounded-full transition-all duration-300"
                style={{
                  width: currentSlide === i ? '16px' : '8px',
                  height: '8px',
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
        @media (max-width: 767px) {
          .testimonials-dot-nav { margin-top: 2rem; }
        }
      `}</style>
    </section>
  );
}

// ─── Slider arrow button (hover/active states unchanged from BYQ original) ────
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
        width: '48px',
        height: '48px',
        borderRadius: '100vw',
        border: `1.5px solid ${hovered ? '#ffffff' : 'rgba(255,255,255,0.16)'}`,
        backgroundColor: 'rgba(255,255,255,0.10)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        color: '#ffffff',
        cursor: 'pointer',
        transition: 'border-color 0.3s, transform 0.2s',
        transform: active ? 'scale(0.9)' : 'scale(1)',
        outline: 'none',
      }}
    >
      {direction === 'prev' ? (
        <span className="flex items-center justify-center" style={{ width: '11px' }}>
          <svg width="100%" height="100%" viewBox="0 0 11 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9.66797 2L1.66797 10L9.66797 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" />
          </svg>
        </span>
      ) : (
        <span className="flex items-center justify-center ml-[3px]" style={{ width: '11px' }}>
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
}: {
  icon: 'x' | 'instagram';
  href: string;
  label: string;
}) {
  return (
    <a
      href={href}
      aria-label={label}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-center rounded-full border border-solid border-white text-white transition-colors duration-200 hover:bg-white hover:text-black shrink-0"
      style={{ width: '48px', height: '48px' }}
    >
      {icon === 'x' ? <XIcon /> : <InstagramIcon />}
    </a>
  );
}

function MailIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="3" width="14" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M1.5 4L8 9L14.5 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// X (Twitter) logo mark — path exported from Figma node 70:497 (X 16px)
function XIcon() {
  return (
    <svg width="13" height="12" viewBox="0 0 12.7765 12" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M0.0311503 0L4.964 6.61871L0 12H1.1172L5.46317 7.2886L8.9746 12H12.7765L7.56607 5.009L12.1865 0H11.0693L7.0669 4.33911L3.83302 0H0.0311503ZM1.67407 0.825802H3.42066L11.1333 11.1741H9.38671L1.67407 0.825802Z"
        fill="currentColor"
      />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="1.5" y="1.5" width="13" height="13" rx="4" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="11.5" cy="4.5" r="0.75" fill="currentColor" />
    </svg>
  );
}

export default ChristiesTestimonials;
