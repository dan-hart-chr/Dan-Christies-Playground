"use client";
/**
 * Christie's Philosophy — adapted from BYQ franco-hero-6 (Hero Text with Inline Images)
 *
 * Content and copy overridden per Figma:
 * https://www.figma.com/design/kseLCorDTXBX2kCOVYzUn3/Untitled?node-id=1-19
 *   - Inline collage images removed — replaced with plain centered body copy.
 *   - Label copy: "Two Centuries, One Philosophy"
 *   - Body font: ABC Arizona Flare (Thin) at 40px / 54px line-height, -0.8px tracking (desktop)
 *
 * Section padding, container width, label-pill treatment, and the
 * max-[991px] / max-[767px] / max-[479px] breakpoint steps are carried over
 * unchanged from the BYQ reference — only sizing/copy values were swapped.
 *
 * Token substitutions applied:
 *   Fonts:  Instrument Serif → ABCArizonaFlare (Thin)
 *           DM Mono          → ABCArizonaSans (Light)
 *   Colors: section bg       → #000000 (colors.black)
 *           text / label     → #FFFFFF (colors.white)
 *           label border     → rgba(255,255,255,0.16)
 */

import * as React from 'react';

const tokens = {
  sectionBg: '#000000', // colors.black
  textColor: '#FFFFFF', // colors.white
  labelBorder: 'rgba(255, 255, 255, 0.16)',

  fontFlare: 'var(--font-family-arizona-flare)',
  fontSans: 'var(--font-family-arizona-sans)',

  sizeLabel: '1.125rem', // fontSizes["xl-sans"] — matches Figma spec exactly
};

export function ChristiesPhilosophy() {
  const sectionRef = React.useRef<HTMLElement>(null);
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.05 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="christies-philosophy relative py-[120px] max-[991px]:py-16 max-[479px]:pt-[100px] max-[479px]:pb-12"
      style={{ backgroundColor: tokens.sectionBg, color: tokens.textColor }}
    >
      <div className="w-full max-w-[1800px] mx-auto px-8 max-[479px]:px-4">
        <div className="flex flex-col items-center gap-6">
          {/* Label */}
          <div
            className={`intro-flag rounded-[24px] px-5 py-3 transition-all duration-700 ease-out ${
              visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
            style={{ backgroundColor: '#213328', border: `1px solid ${tokens.labelBorder}` }}
          >
            <p
              className="intro-flag-text whitespace-nowrap m-0"
              style={{
                fontFamily: tokens.fontSans,
                fontWeight: 300,
                fontSize: '1.2rem',
                lineHeight: '1.2',
                color: tokens.textColor,
              }}
            >
              Two Centuries, One Philosophy
            </p>
          </div>

          {/* Body copy */}
          <div
            className={`max-w-[900px] text-center transition-all duration-700 ease-out ${
              visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
            }`}
            style={{ transitionDelay: '150ms' }}
          >
            <p
              className="philosophy-copy m-0 mb-[54px] max-[991px]:mb-9 max-[767px]:mb-8 max-[479px]:mb-6"
              style={{
                fontFamily: tokens.fontFlare,
                fontWeight: 100,
                fontSize: '2.5rem',
                lineHeight: '54px',
                letterSpacing: '-0.8px',
              }}
            >
              At Christie&rsquo;s, we believe collecting crosses boundaries of all kinds, limited only by
              imagination and desire.
            </p>
            <p
              className="philosophy-copy m-0"
              style={{
                fontFamily: tokens.fontFlare,
                fontWeight: 100,
                fontSize: '2.5rem',
                lineHeight: '54px',
                letterSpacing: '-0.8px',
              }}
            >
              In that spirit, we created 20/21, a first-of-its-kind department that combines the art and
              objects across the twentieth and twenty-first centuries, culminating in two annual marquee
              weeks, celebrating the very best the art market has to offer.
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 991px) {
          .christies-philosophy p.philosophy-copy { font-size: 2rem !important; line-height: 44px !important; }
        }
        @media (max-width: 767px) {
          .christies-philosophy p.philosophy-copy { font-size: 1.25rem !important; line-height: 32px !important; }
          .christies-philosophy .intro-flag { padding: 0.2rem !important; }
          .christies-philosophy .intro-flag-text { font-size: 1rem !important; }
        }
        @media (max-width: 479px) {
          .christies-philosophy p.philosophy-copy { font-size: 1.25rem !important; line-height: 32px !important; }
        }
      `}</style>
    </section>
  );
}

export default ChristiesPhilosophy;
