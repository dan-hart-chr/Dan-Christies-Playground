"use client";
/**
 * Christie's Philosophy — Two Centuries, One Philosophy
 *
 * Per Figma node 39:519 ("franco-hero-6-desktop"):
 *   - Two-column layout: title (left, 56px serif) + body (right, 24px light)
 *   - Background: #530000 (dark maroon)
 *   - 114px gap between columns
 *   - Title and body text animate via Web Animations API (element.animate),
 *     same pattern as ChristiesHero heading reveal
 *   - Body starts 0.4s after title begins animating
 *
 * Token substitutions applied:
 *   Fonts:  Instrument Serif       → ABCArizonaFlare (Thin for title, Light for body)
 *   Colors: section bg / text      → #530000 / #FFFFFF (colors.white)
 */

import * as React from 'react';
import { animateTextReveal, cleanupGSAPAnimations } from '../../utils/gsapAnimations';

const tokens = {
  sectionBg: '#530000',
  textColor: '#FFFFFF',
  fontFlare: 'var(--font-family-arizona-flare)',
};

export function ChristiesPhilosophy() {
  const titleRef = React.useRef<HTMLHeadingElement>(null);
  const bodyRef = React.useRef<HTMLDivElement>(null);
  const [prefersReducedMotion] = React.useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  React.useEffect(() => {
    if (prefersReducedMotion) return;

    // Animate title with GSAP (scroll-triggered)
    animateTextReveal(titleRef.current, {
      duration: 0.8,
      stagger: 0.1,
      yOffset: 20,
      triggerOnScroll: true,
    });

    // Animate body with delay after title (scroll-triggered) — each
    // paragraph is animated separately so the paragraph break survives
    // (animateTextReveal flattens whatever element it's given).
    const bodyParagraphs = bodyRef.current?.querySelectorAll('p') ?? [];
    bodyParagraphs.forEach((p, i) => {
      animateTextReveal(p as HTMLElement, {
        duration: 0.8,
        delay: 0.4 + i * 0.05,
        stagger: 0.05,
        yOffset: 20,
        triggerOnScroll: true,
      });
    });

    return () => {
      cleanupGSAPAnimations();
    };
  }, [prefersReducedMotion]);

  return (
    <section
      className="christies-philosophy relative py-[80px] max-[999px]:py-[60px] max-[479px]:py-7"
      style={{ backgroundColor: tokens.sectionBg, color: tokens.textColor }}
    >
      <div className="w-full max-w-[1600px] mx-auto px-16 max-[999px]:px-5">
        <div className="flex gap-[114px] max-[999px]:flex-col min-[768px]:max-[999px]:items-center max-[999px]:gap-[60px]">
          {/* Title column — left side */}
          <div className="flex items-start justify-center min-w-max max-[999px]:min-w-0">
            <h2
              ref={titleRef}
              className="philosophy-title min-[768px]:max-[999px]:text-center"
              style={{
                maxWidth: '600px',
                fontFamily: tokens.fontFlare,
                fontWeight: 100,
                lineHeight: '1.1',
                color: tokens.textColor,
                fontSize: `clamp(22px, 12vw, 56px)`,
                letterSpacing: `clamp(-0.44px, -2.4vw, -1.12px)`,
                margin: 0,
              }}
            >
              Two Centuries, One Philosophy
            </h2>

            {/* Tablet override (768-999px, per Figma node 46:1058) — the
                clamp() above saturates at its max well before 768px, so it
                never reaches the smaller tablet-specified size on its own. */}
            <style>{`
              @media (min-width: 768px) and (max-width: 999px) {
                .philosophy-title {
                  font-size: 40px !important;
                  letter-spacing: -0.8px !important;
                  line-height: 1.1 !important;
                }
                .philosophy-body {
                  font-size: 20px !important;
                  letter-spacing: -0.4px !important;
                  line-height: 1.4 !important;
                }
              }
            `}</style>
          </div>

          {/* Body column — right side */}
          <div className="flex-1 flex items-start max-[999px]:flex-none max-[999px]:w-full" style={{ maxWidth: '840px' }}>
            <div
              ref={bodyRef}
              className="philosophy-body min-[768px]:max-[999px]:text-center"
              style={{
                fontFamily: tokens.fontFlare,
                fontWeight: 300,
                lineHeight: '1.4',
                color: tokens.textColor,
                fontSize: `clamp(16px, 5.4vw, 24px)`,
                letterSpacing: `clamp(-0.28px, -1.4vw, -0.48px)`,
              }}
            >
              <p style={{ margin: '0 0 1em 0' }}>
                At Christie's, we believe collecting crosses boundaries of all kinds, limited only by imagination and desire.
              </p>
              <p style={{ margin: 0 }}>
                In that spirit, we created 20/21, a first-of-its-kind department that combines the art and objects across the
                twentieth and twenty-first centuries, culminating in two annual marquee weeks, celebrating the very best the art market
                has to offer.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ChristiesPhilosophy;
