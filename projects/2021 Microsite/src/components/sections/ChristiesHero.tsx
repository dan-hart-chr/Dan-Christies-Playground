"use client";
/**
 * Christie's Hero — adapted from BYQ franco-hero-1 (Hero with Video Background)
 *
 * Per request: both CTA buttons ("Buy Template" / "Learn more") were
 * stripped out entirely — the video background, wordmark, labels, and
 * animated heading remain.
 *
 * The "Watch Video" button (Figma node 21:348) was reinstated in the bottom
 * right corner per the latest design pass. It fades/slides in on the same
 * trigger as the heading words, timed to land just after the last word
 * finishes revealing.
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
 *
 * Watch Video button dimensions/type sizes scaled 0.75x to match the rest of
 * this hero's already-scaled BYQ token substitutions.
 */

import * as React from 'react';
import logo2021 from '../../assets/images/2021-full-logo.svg';
import gavelSlamVideo from '../../assets/videos/gavelslam.mp4';
import watchVideoThumbnail from '../../assets/images/watch-video-thumbnail.jpg';
import playIcon from '../../assets/icons/play.svg';

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

  sizeHeading: '2.625rem', // fontSizes["5xl-lg"] scaled 0.75x
  sizeLabel: '0.625rem', // fontSizes["label-s"] scaled 0.75x
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
      className="christies-hero relative flex justify-start items-end"
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
          maxWidth: '1350px',
          marginLeft: 'auto',
          marginRight: 'auto',
          paddingLeft: '24px',
          paddingRight: '24px',
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
            <div ref={headingRef} className="hero-words flex flex-wrap gap-x-[9px]" style={{ maxWidth: '540px' }}>
              {words.map((word, i) => (
                <div
                  key={i}
                  className="overflow-hidden"
                  style={{ marginBottom: '-11px', paddingBottom: '11px' }}
                >
                  <div
                    className="hero-word transition-transform duration-700 ease-out"
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

            <WatchVideoButton visible={wordsVisible} delayMs={words.length * 80 + 200} />
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 767px) {
          .christies-hero .hero-word { font-size: 1.5rem !important; }
          .christies-hero .hero-words { column-gap: 0.3rem !important; }
        }
      `}</style>
    </section>
  );
}

// — Watch Video button (Figma node 21:348) — fades/slides in after the heading words finish
function WatchVideoButton({ visible, delayMs }: { visible: boolean; delayMs: number }) {
  return (
    <button
      type="button"
      className="watch-video-btn flex flex-col items-start shrink-0 transition-all duration-700 ease-out"
      style={{
        width: '189px',
        padding: '6px',
        borderRadius: '6px',
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
      <div className="flex flex-col gap-1.5 w-full items-start">
        <div className="relative w-full overflow-hidden" style={{ borderRadius: '6px', aspectRatio: '177 / 101' }}>
          <img src={watchVideoThumbnail} alt="" className="absolute inset-0 w-full h-full object-cover" />
          <span
            className="absolute flex items-center justify-center rounded-full"
            style={{
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              backgroundColor: '#ece7d9',
              padding: '9px',
              boxShadow: '0 0 6px rgba(0,0,0,0.25)',
            }}
          >
            <img src={playIcon} alt="" style={{ width: '12px', height: '12px' }} />
          </span>
        </div>
        <span
          className="w-full text-center uppercase"
          style={{ fontFamily: tokens.fontSans, fontWeight: 500, fontSize: tokens.sizeLabel, lineHeight: '1.2', color: '#000000' }}
        >
          Watch Video
        </span>
      </div>
    </button>
  );
}

export default ChristiesHero;
