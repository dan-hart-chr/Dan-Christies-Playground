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
 * The background video is a temporary BYQ stock placeholder pending a final
 * Christie's video asset — swap the <source> URLs when one is available.
 */

import * as React from 'react';

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
          style={{
            backgroundImage:
              'url("https://cdn.prod.website-files.com/6751dc3d88655c482ba588b8%2F67595b7416681c5c7dd18a5f_-2599-411c-b59e-c5c327dae87e-poster-00001.jpg")',
          }}
        >
          <source
            src="https://byqsupply-components.netlify.app/FRANCO/videos/-2599-411c-b59e-c5c327dae87e-transcode.mp4"
            type="video/mp4"
          />
          <source
            src="https://byqsupply-components.netlify.app/FRANCO/videos/-2599-411c-b59e-c5c327dae87e-transcode.webm"
            type="video/webm"
          />
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
          paddingTop: '97px',
          paddingBottom: '80px',
          height: '100%',
        }}
      >
        <div className="flex flex-col justify-between items-start w-full h-full gap-10">
          {/* Top: wordmark + labels */}
          <div className="flex flex-col w-full gap-3">
            <div
              className="w-full"
              style={{
                fontFamily: tokens.fontSerif,
                fontWeight: 300,
                fontSize: 'clamp(3rem, 10vw, 8.5rem)',
                lineHeight: '1',
                letterSpacing: '-0.02em',
                color: tokens.textColor,
              }}
            >
              Christie&rsquo;s
            </div>
            <div className="flex justify-between items-end w-full">
              <div
                className="uppercase tracking-widest"
                style={{
                  fontFamily: tokens.fontSans,
                  fontSize: tokens.sizeLabel,
                  lineHeight: '1',
                  fontWeight: 500,
                  letterSpacing: '0.15em',
                  color: tokens.textColor,
                }}
              >
                Auctions &amp; Private Sales
              </div>
              <div
                className="uppercase tracking-widest"
                style={{
                  fontFamily: tokens.fontSans,
                  fontSize: tokens.sizeLabel,
                  lineHeight: '1',
                  fontWeight: 500,
                  letterSpacing: '0.15em',
                  color: tokens.textColor,
                }}
              >
                Est. 1766
              </div>
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
