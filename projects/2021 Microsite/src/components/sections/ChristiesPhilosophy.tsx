"use client";
/**
 * Christie's Philosophy — adapted from BYQ franco-hero-6 (Hero Text with Inline Images)
 *
 * Restyled per Figma node 21:360 ("franco-hero-6-desktop"):
 *   - Label pill removed — "Two Centuries, One Philosophy" is now a plain
 *     italic serif line, no background/border.
 *   - A short divider line (25px, white @ 50%) now sits between the label
 *     and the body copy.
 *   - Body font size/line-height bumped to 32px/48px (from 30px/40.5px),
 *     max-width widened to 840px.
 *   - Section bg is now solid maroon (#530000) — the same start color used
 *     in ChristiesShowcase's gradient, so the two sections read as continuous.
 *
 * Token substitutions applied:
 *   Fonts:  Instrument Serif → ABCArizonaFlare (Light)
 *   Colors: section bg       → #530000 (matches ChristiesShowcase gradient start)
 *           text / label     → #FFFFFF (colors.white)
 *           divider          → rgba(255,255,255,0.5)
 */

import * as React from 'react';

const tokens = {
  sectionBg: '#530000',
  textColor: '#FFFFFF', // colors.white
  dividerColor: 'rgba(255, 255, 255, 0.5)',

  fontFlare: 'var(--font-family-arizona-flare)',
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
      className="christies-philosophy relative py-[90px] max-[991px]:py-12 max-[479px]:pt-[75px] max-[479px]:pb-9"
      style={{ backgroundColor: tokens.sectionBg, color: tokens.textColor }}
    >
      <div className="w-full max-w-[1350px] mx-auto px-6 max-[479px]:px-3">
        <div className="flex flex-col items-center gap-6">
          {/* Label — plain italic line, no pill */}
          <p
            className={`philosophy-label m-0 transition-all duration-700 ease-out ${
              visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
            style={{
              fontFamily: tokens.fontFlare,
              fontStyle: 'italic',
              fontWeight: 300,
              fontSize: '1.5rem',
              lineHeight: '1.2',
              color: tokens.textColor,
            }}
          >
            Two Centuries, One Philosophy
          </p>

          {/* Divider */}
          <div
            className={`transition-all duration-700 ease-out ${
              visible ? 'opacity-100' : 'opacity-0'
            }`}
            style={{ width: '25px', height: '1px', backgroundColor: tokens.dividerColor, transitionDelay: '100ms' }}
          />

          {/* Body copy */}
          <div
            className={`max-w-[840px] text-center transition-all duration-700 ease-out ${
              visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
            }`}
            style={{ transitionDelay: '150ms' }}
          >
            <p
              className="philosophy-copy m-0 mb-[40px] max-[991px]:mb-[27px] max-[767px]:mb-6 max-[479px]:mb-[18px]"
              style={{
                fontFamily: tokens.fontFlare,
                fontWeight: 300,
                fontSize: '2rem',
                lineHeight: '48px',
                letterSpacing: '-0.64px',
              }}
            >
              At Christie&rsquo;s, we believe collecting crosses boundaries of all kinds, limited only by
              imagination and desire.
            </p>
            <p
              className="philosophy-copy m-0"
              style={{
                fontFamily: tokens.fontFlare,
                fontWeight: 300,
                fontSize: '2rem',
                lineHeight: '48px',
                letterSpacing: '-0.64px',
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
          .christies-philosophy p.philosophy-copy { font-size: 1.5rem !important; line-height: 33px !important; }
        }
        @media (max-width: 767px) {
          .christies-philosophy { padding-top: 2.25rem !important; padding-bottom: 2.25rem !important; }
          .christies-philosophy p.philosophy-copy { font-size: 1.125rem !important; line-height: 24px !important; }
          .christies-philosophy p.philosophy-label { font-size: 1.125rem !important; }
        }
        @media (max-width: 479px) {
          .christies-philosophy p.philosophy-copy { font-size: 1.125rem !important; line-height: 24px !important; }
        }
      `}</style>
    </section>
  );
}

export default ChristiesPhilosophy;
