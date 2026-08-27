"use client";
/**
 * Christie's Hero — adapted from BYQ franco-hero-1 (Hero with Video Background)
 *
 * Per request: both CTA buttons ("Buy Template" / "Learn more") and the
 * "Watch Video" lightbox card were stripped out entirely — only the video
 * background, wordmark, labels, and animated heading remain.
 *
 * Token substitutions applied:
 *   Fonts:  Instrument Serif        → ABCArizonaSerif
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
 */

import * as React from 'react';
import logo2021 from '../../assets/images/2021-full-logo.svg';
import gavelSlamVideo from '../../assets/videos/gavelslam.mp4';

const words = [
  'Extraordinary',
  'art',
  'deserves',
  'an',
  'extraordinary',
  'stage.',
];

const tokens = {
  overlayColor: '#000000', // colors.black
  textColor: '#FFFFFF', // colors.white

  fontSerif: 'var(--font-family-arizona-serif)',
  fontSans: 'var(--font-family-arizona-sans)',

  sizeHeading: '3.5rem', // fontSizes["5xl-lg"]
  sizeLabel: '0.75rem', // fontSizes["label-s"]
};

export function ChristiesHero() {
  const headingRef = React.useRef<HTMLDivElement>(null);
  const [wordsVisible, setWordsVisible] = React.useState(false);

  React.useEffect(() => {
    const el = headingRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setWordsVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section
      className="relative flex justify-start items-end"
      style={{ height: '100svh', color: tokens.textColor, top: 0 }}
    >
      {/* Background Video */}
      <div className="absolute inset-0 w-full h-full overflow-hidden" style={{ zIndex: 0 }}>
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src={gavelSlamVideo} type="video/mp4" />
        </video>
      </div>

      {/* Dark overlay */}
      <div
        className="absolute inset-x-0 top-0 h-full"
        style={{ backgroundColor: tokens.overlayColor, opacity: 0.4, zIndex: 1 }}
      />

      {/* Main content container */}
      <div
        className="relative w-full flex flex-col justify-between items-start"
        style={{
          zIndex: 2,
          maxWidth: '1800px',
          marginLeft: 'auto',
          marginRight: 'auto',
          paddingLeft: '32px',
          paddingRight: '32px',
          paddingTop: '20px',
          paddingBottom: '80px',
          height: '100%',
        }}
      >
        <div className="flex flex-col justify-between items-start w-full h-full gap-10">
          {/* Top: wordmark — reveals left-to-right (wipe + fade), synced with the heading animation below */}
          <div className="flex flex-col w-full gap-3">
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

          {/* Bottom: animated heading (buttons removed per request) */}
          <div ref={headingRef} className="flex flex-wrap gap-x-3" style={{ maxWidth: '720px' }}>
            {words.map((word, i) => (
              <div
                key={i}
                className="overflow-hidden"
                style={{ marginBottom: '-15px', paddingBottom: '15px' }}
              >
                <div
                  className="transition-transform duration-700 ease-out"
                  style={{
                    fontFamily: tokens.fontSerif,
                    fontSize: tokens.sizeHeading,
                    fontWeight: 300,
                    lineHeight: '1',
                    letterSpacing: '-0.02em',
                    color: tokens.textColor,
                    transform: wordsVisible ? 'translate3d(0, 0%, 0)' : 'translate3d(0, 200%, 0)',
                    transitionDelay: `${i * 80}ms`,
                  }}
                >
                  {word}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default ChristiesHero;
