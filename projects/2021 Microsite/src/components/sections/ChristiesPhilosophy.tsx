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

const titleWords = ['Two', 'Centuries,', 'One', 'Philosophy'];

const bodyWords = [
  'At', "Christie's,", 'we', 'believe', 'collecting', 'crosses', 'boundaries',
  'of', 'all', 'kinds,', 'limited', 'only', 'by', 'imagination', 'and', 'desire.',
  'In', 'that', 'spirit,', 'we', 'created', '20/21,', 'a', 'first-of-its-kind',
  'department', 'that', 'combines', 'the', 'art', 'and', 'objects', 'across', 'the',
  'twentieth', 'and', 'twenty-first', 'centuries,', 'culminating', 'in', 'two', 'annual',
  'marquee', 'weeks,', 'celebrating', 'the', 'very', 'best', 'the', 'art', 'market',
  'has', 'to', 'offer.',
];

const tokens = {
  sectionBg: '#530000',
  textColor: '#FFFFFF',
  fontFlare: 'var(--font-family-arizona-flare)',
};

export function ChristiesPhilosophy() {
  const sectionRef = React.useRef<HTMLElement>(null);
  const titleWordRefs = React.useRef<(HTMLDivElement | null)[]>([]);
  const bodyWordRefs = React.useRef<(HTMLDivElement | null)[]>([]);
  const [prefersReducedMotion] = React.useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  const revealWords = React.useCallback(
    (refs: React.MutableRefObject<(HTMLDivElement | null)[]>, startDelay: number) => {
      refs.current.forEach((el, i) => {
        if (!el) return;
        if (prefersReducedMotion) {
          el.style.transform = 'translate3d(0, 0%, 0)';
          return;
        }
        el.animate(
          [{ transform: 'translate3d(0, 200%, 0)' }, { transform: 'translate3d(0, 0%, 0)' }],
          { duration: 700, delay: startDelay + i * 80, easing: 'cubic-bezier(0.16, 1, 0.3, 1)', fill: 'forwards' }
        );
      });
    },
    [prefersReducedMotion]
  );

  React.useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          revealWords(titleWordRefs, 0);
          revealWords(bodyWordRefs, 400);
          obs.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [revealWords]);

  return (
    <section
      ref={sectionRef}
      className="christies-philosophy relative py-[80px] max-[991px]:py-12 max-[767px]:py-8 max-[479px]:py-6"
      style={{ backgroundColor: tokens.sectionBg, color: tokens.textColor }}
    >
      <div className="w-full max-w-[1350px] mx-auto px-16 max-[991px]:px-8 max-[767px]:px-6 max-[479px]:px-3">
        <div className="flex gap-[114px] max-[991px]:gap-12 max-[767px]:flex-col max-[767px]:gap-6">
          {/* Title column — left side */}
          <div className="flex items-center justify-center min-w-max max-[767px]:min-w-0">
            <div className="philosophy-title flex flex-wrap gap-x-[9px]" style={{ maxWidth: '600px' }}>
              {titleWords.map((word, i) => (
                <div
                  key={i}
                  className="overflow-hidden"
                  style={{ marginBottom: '-11px', paddingBottom: '11px' }}
                >
                  <div
                    ref={(el) => {
                      titleWordRefs.current[i] = el;
                    }}
                    className="philosophy-word"
                    style={{
                      fontFamily: tokens.fontFlare,
                      fontSize: '56px',
                      fontWeight: 100,
                      lineHeight: '1.1',
                      letterSpacing: '-1.12px',
                      color: tokens.textColor,
                      transform: 'translate3d(0, 200%, 0)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {word}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Body column — right side */}
          <div className="flex-1 flex items-start" style={{ maxWidth: '840px' }}>
            <div className="philosophy-body flex flex-wrap gap-x-[4px] gap-y-0" style={{ wordBreak: 'break-word' }}>
              {bodyWords.map((word, i) => (
                <div
                  key={i}
                  className="overflow-hidden"
                  style={{ marginBottom: '-11px', paddingBottom: '11px' }}
                >
                  <div
                    ref={(el) => {
                      bodyWordRefs.current[i] = el;
                    }}
                    className="philosophy-body-word"
                    style={{
                      fontFamily: tokens.fontFlare,
                      fontSize: '24px',
                      fontWeight: 300,
                      lineHeight: '1.4',
                      letterSpacing: '-0.48px',
                      color: tokens.textColor,
                      transform: 'translate3d(0, 200%, 0)',
                      display: 'inline',
                    }}
                  >
                    {word}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ChristiesPhilosophy;
