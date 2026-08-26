"use client";
/**
 * Christie's Testimonials — adapted from BYQ andfold-testimonials-1
 *
 * Token substitutions applied:
 *   Fonts:  LT Superior Serif → ABCArizonaSerif
 *           42 Dotsans        → ABCArizonaSans
 *   Colors: section bg        → #000000  (colors.black)
 *           card bg           → #F0E8D7  (colors.brand-natural-white / 500)
 *           card text         → #000000  (colors.black)
 *           label text        → #960000  (colors.brand-c-red)
 *           label bg          → rgba(150,0,0,0.08)
 *
 * All animations, slider mechanics, and responsive behaviour are unchanged.
 */

import * as React from 'react';
// @ts-ignore
import Button from '@christies-ds/molecules/button/Button.jsx';

// ─── Christie's content ───────────────────────────────────────────────────────
const slides = [
  {
    intro: 'James Whitfield',
    quote:
      "From first enquiry to the hammer falling, the Christie's team were exceptional. The most extraordinary experience I have had acquiring a work of art.",
    authorName: 'James Whitfield',
    handle: 'Collector, London',
    image:
      'https://byqsupply-components.netlify.app/andfold/images/ArticleThumbnail2.jpeg',
    imageSrcSet:
      'https://byqsupply-components.netlify.app/andfold/images/Portrait-in-Red-Top-p-500.jpeg 500w, https://byqsupply-components.netlify.app/andfold/images/Portrait-in-Red-Top-p-800.jpeg 800w, https://byqsupply-components.netlify.app/andfold/images/Portrait-in-Red-Top-p-1080.jpeg 1080w, https://byqsupply-components.netlify.app/andfold/images/Portrait-in-Red-Top-p-1600.jpeg 1600w, https://byqsupply-components.netlify.app/andfold/images/ArticleThumbnail2.jpeg 1808w',
  },
  {
    intro: 'Marina Sørensen',
    quote:
      "I consigned my grandfather's collection through Christie's. The expertise and care they showed for each individual piece was beyond anything I had anticipated.",
    authorName: 'Marina Sørensen',
    handle: 'Estate Consignor, New York',
    image:
      'https://byqsupply-components.netlify.app/andfold/images/MainTestimonial.webp',
    imageSrcSet:
      'https://byqsupply-components.netlify.app/andfold/images/MainTestimonial.webp 500w, https://byqsupply-components.netlify.app/andfold/images/MainTestimonial.webp 648w',
  },
  {
    intro: 'David Okubo',
    quote:
      "I bid on a Basquiat I had been searching for over a decade. Winning it at Christie's was the realisation of a lifelong ambition. The whole experience was flawless.",
    authorName: 'David Okubo',
    handle: 'Art Advisor, Hong Kong',
    image:
      'https://byqsupply-components.netlify.app/andfold/images/SliderImage.jpeg',
    imageSrcSet:
      'https://byqsupply-components.netlify.app/andfold/images/Portrait-in-Silver-Jacket-2-p-500.jpeg 500w, https://byqsupply-components.netlify.app/andfold/images/Portrait-in-Silver-Jacket-2-p-800.jpeg 800w, https://byqsupply-components.netlify.app/andfold/images/Portrait-in-Silver-Jacket-2-p-1080.jpeg 1080w, https://byqsupply-components.netlify.app/andfold/images/Portrait-in-Silver-Jacket-2-p-1600.jpeg 1600w, https://byqsupply-components.netlify.app/andfold/images/Portrait-in-Silver-Jacket-2-p-2000.jpeg 2000w, https://byqsupply-components.netlify.app/andfold/images/SliderImage.jpeg 2400w',
  },
];

// ─── Token-mapped style constants ─────────────────────────────────────────────
const tokens = {
  // colors.black
  sectionBg: '#000000',
  // colors.white
  sectionText: '#FFFFFF',
  // colors.brand-natural-white / 500
  cardBg: '#F0E8D7',
  // colors.black
  cardText: '#000000',
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
  cardRadius: '24px',    // radius.md
  imageRadius: '12px',   // radius.sm
  labelRadius: '12px',
};

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
  const dragStartX = React.useRef(0);
  const SNAP_THRESHOLD = 60; // px required to advance a slide
  const TRANSITION = 'transform 750ms cubic-bezier(0.16, 1, 0.3, 1)';

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!trackRef.current || stepPx === 0) return;
    isDragging.current = true;
    dragStartX.current = e.clientX;
    trackRef.current.style.transition = 'none';
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging.current || !trackRef.current) return;
    const delta = e.clientX - dragStartX.current;
    const base = -(currentSlideRef.current * stepPx);
    trackRef.current.style.transform = `translateX(${base + delta}px)`;
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging.current || !trackRef.current) return;
    isDragging.current = false;
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
              className={`m-0 transition-all duration-700 ease-out ${
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
                  {/* Card */}
                  <div
                    className="w-full grid gap-12 p-6 max-[991px]:grid-cols-1 max-[991px]:gap-12"
                    style={{
                      backgroundColor: tokens.cardBg,
                      color: tokens.cardText,
                      borderRadius: tokens.cardRadius,
                      gridTemplateColumns: '1fr 1.5fr',
                    }}
                  >
                    {/* Portrait image */}
                    <div
                      className="flex items-center justify-center w-full overflow-hidden max-[991px]:h-[350px] max-[767px]:hidden"
                      style={{ height: '624px', borderRadius: tokens.imageRadius }}
                    >
                      <img
                        src={slide.image}
                        loading="lazy"
                        srcSet={slide.imageSrcSet}
                        sizes="(max-width: 767px) 100vw, (max-width: 991px) 727px, 940px"
                        alt=""
                        draggable={false}
                        className="object-cover w-full h-full"
                      />
                    </div>

                    {/* Right content */}
                    <div
                      className="flex flex-col justify-between items-start gap-12"
                      style={{ paddingTop: '16px', paddingRight: '16px', paddingBottom: '16px' }}
                    >
                      {/* Quote block */}
                      <div className="flex flex-col gap-6 items-start justify-start">
                        {/* Intro line with Name | Job Title — Arizona Sans */}
                        <div
                          style={{
                            fontFamily: tokens.fontSans,
                            fontWeight: 500,
                            fontSize: tokens.sizeBody,
                            lineHeight: '1.5',
                            color: tokens.introText,
                            letterSpacing: '0.05em',
                          }}
                        >
                          {slide.intro} | {slide.handle}
                        </div>
                        {/* Quote — Arizona Serif */}
                        <div
                          style={{
                            fontFamily: tokens.fontSerif,
                            fontSize: tokens.sizeQuote,
                            lineHeight: '1.2',
                            fontWeight: 300,
                            letterSpacing: '-0.02em',
                            color: tokens.cardText,
                          }}
                        >
                          {slide.quote}
                        </div>
                      </div>

                      {/* Read More Button */}
                      <Button
                        type="Secondary"
                        mode="Light"
                        buttonCopy="READ MORE"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Mobile dot nav */}
          <div className="hidden max-[767px]:flex items-center justify-center gap-2 mt-3">
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

export default ChristiesTestimonials;
