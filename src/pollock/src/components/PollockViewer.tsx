import { useRef, useEffect, useState, useCallback } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import pollockImage from '../assets/pollock-7a.webp';
import { createPollockAudio } from '../audio';
import ArtworkInfo from './ArtworkInfo';
import Controls from './Controls';
import Footer from './Footer';
import InfoPanel from './InfoPanel';
import TranscriptPanel from './TranscriptPanel';
import LanguagePanel from './LanguagePanel';

gsap.registerPlugin(ScrollTrigger);

const SHOW_LANGUAGE_SELECTION: boolean = false;

export type PanelType = 'info' | 'transcript' | 'language' | null;

type IntroStage =
  | 'language'
  | 'language-closing'
  | 'instructions'
  | 'instructions-closing'
  | 'done';

export default function PollockViewer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [imageNaturalSize, setImageNaturalSize] = useState({ w: 0, h: 0 });
  const [activePanel, setActivePanel] = useState<PanelType>(null);
  const [language, setLanguage] = useState('en');
  const [introStage, setIntroStage] = useState<IntroStage>(
    SHOW_LANGUAGE_SELECTION ? 'language' : 'instructions',
  );
  const [muted, setMuted] = useState(false);
  const audioRef = useRef(createPollockAudio());

  const introActive = introStage !== 'done';
  const closePanel = useCallback(() => setActivePanel(null), []);

  useEffect(() => {
    document.documentElement.style.colorScheme = 'dark';
  }, []);

  // Freeze page scrolling while the intro flow is up OR a regular panel is
  // open. The latter prevents scroll inside the transcript modal from
  // driving the GSAP ScrollTrigger that scrubs the painting animation.
  useEffect(() => {
    if (!activePanel && !introActive) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [activePanel, introActive]);

  useEffect(() => {
    const img = imageRef.current;
    if (!img) return;

    const onLoad = () => {
      setImageNaturalSize({ w: img.naturalWidth, h: img.naturalHeight });
    };

    if (img.complete) {
      onLoad();
    } else {
      img.addEventListener('load', onLoad);
      return () => img.removeEventListener('load', onLoad);
    }
  }, []);

  useEffect(() => {
    if (!imageNaturalSize.w || !imageNaturalSize.h) return;

    const container = containerRef.current;
    const image = imageRef.current;
    const overlay = overlayRef.current;
    if (!container || !image || !overlay) return;

    const ctx = gsap.context(() => {
      const getValues = () => {
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const imgAspect = imageNaturalSize.w / imageNaturalSize.h;
        const viewportAspect = vw / vh;
        const coverWidth = viewportAspect > imgAspect ? vw : vh * imgAspect;
        const coverHeight = coverWidth / imgAspect;
        const coverLeft = (vw - coverWidth) / 2;
        const coverTop = (vh - coverHeight) / 2;

        const isMobile = vw < 768;
        const isTablet = vw >= 768 && vw < 1100;
        const clamp = (value: number, min: number, max: number) =>
          Math.min(max, Math.max(min, value));
        const startFocusX = isMobile ? 0.31 : 0.30;
        const endFocusX = isMobile ? 0.69 : 0.70;
        const focusY = isMobile ? 0.441 : 0.451;
        const canvasHeightRatio = 0.15;
        const targetCanvasHeight = vh * (isMobile ? 0.64 : 0.68);
        const rawZoomScale = targetCanvasHeight / (coverHeight * canvasHeightRatio);
        const zoomScale = clamp(
          rawZoomScale,
          isMobile ? 3.8 : isTablet ? 3.3 : 3.1,
          isMobile ? 6.4 : 5.0,
        );
        const maxX = Math.max(0, (coverWidth * zoomScale - vw) / 2);
        const maxY = Math.max(0, (coverHeight * zoomScale - vh) / 2);
        const xForFocus = (focusX: number) =>
          clamp(-((coverLeft + focusX * coverWidth) - vw / 2) * zoomScale, -maxX, maxX);
        const yFocus = clamp(-((coverTop + focusY * coverHeight) - vh / 2) * zoomScale, -maxY, maxY);

        return {
          coverWidth,
          coverHeight,
          zoomScale,
          xStart: xForFocus(startFocusX),
          xEnd: xForFocus(endFocusX),
          yFocus,
        };
      };

      const vals = getValues();

      gsap.set(image, {
        position: 'absolute',
        left: '50%',
        top: '50%',
        width: vals.coverWidth,
        height: vals.coverHeight,
        xPercent: -50,
        yPercent: -50,
        x: 0,
        y: 0,
        scale: 1,
        transformOrigin: 'center center',
      });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: container,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 2,
          invalidateOnRefresh: true,
        },
      });

      tl.to(
        image,
        {
          scale: () => getValues().zoomScale,
          x: () => getValues().xStart,
          y: () => getValues().yFocus,
          ease: 'power2.inOut',
          duration: 1,
        },
        0,
      );

      tl.to(overlay, { opacity: 0, duration: 0.5, ease: 'power2.out' }, 0);

      tl.to(
        image,
        {
          x: () => getValues().xEnd,
          y: () => getValues().yFocus,
          ease: 'none',
          duration: 2,
        },
        1,
      );

      tl.to(
        image,
        {
          scale: 1,
          x: 0,
          y: 0,
          ease: 'power2.inOut',
          duration: 1,
        },
        3,
      );

      tl.to(overlay, { opacity: 1, duration: 0.5, ease: 'power2.in' }, 3.5);

      ScrollTrigger.addEventListener('refreshInit', () => {
        const v = getValues();
        gsap.set(image, {
          position: 'absolute',
          left: '50%',
          top: '50%',
          width: v.coverWidth,
          height: v.coverHeight,
          xPercent: -50,
          yPercent: -50,
        });
      });
    }, container);

    return () => ctx.revert();
  }, [imageNaturalSize]);

  return (
    <div ref={containerRef} className="relative" style={{ height: '500vh' }}>
      {/* Sticky viewport */}
      <div className="sticky top-0 flex h-screen w-full items-center justify-center overflow-hidden bg-[#050404] text-[#f0e8d7]">
        {/* The painting */}
        <img
          ref={imageRef}
          src={pollockImage}
          alt="Jackson Pollock - 7a, 1948"
          className="pointer-events-none absolute left-1/2 top-1/2 max-w-none select-none will-change-transform"
          draggable={false}
        />

        {/* UI Overlay */}
        <div ref={overlayRef} className="pointer-events-none absolute inset-0">
          <div className="pointer-events-auto">
            <ArtworkInfo />
            <Controls
              onOpenPanel={setActivePanel}
              currentLang={language}
              muted={muted}
              onMuteToggle={() => {
                const next = !muted;
                setMuted(next);
                audioRef.current.setMuted(next);
              }}
              showLanguageSelection={SHOW_LANGUAGE_SELECTION}
            />
            <Footer />
          </div>
        </div>

        {/* Dark intro overlay — hides the painting + UI until the user has
            completed the intro instructions. */}
        <div
          className={`pointer-events-none absolute inset-0 z-[45] bg-[#050404] transition-opacity duration-1000 ease-out ${
            introActive ? 'opacity-100' : 'opacity-0'
          }`}
          aria-hidden={!introActive}
        />

        {/* Intro flow: optional language → instructions → done */}
        {SHOW_LANGUAGE_SELECTION && (introStage === 'language' || introStage === 'language-closing') && (
          <LanguagePanel
            currentLang={language}
            onSelect={(code) => {
              setLanguage(code);
              audioRef.current.setLanguage(code);
              setIntroStage('language-closing');
            }}
            onClose={() => setIntroStage('instructions')}
            closing={introStage === 'language-closing'}
            hideClose
            disableBackdropClose
          />
        )}
        {(introStage === 'instructions' || introStage === 'instructions-closing') && (
          <InfoPanel
            lang={language}
            introMode
            onContinue={() => {
              setIntroStage('instructions-closing');
              if (!window.viewPageViewFired) {
                window.viewPageViewFired = true;
                if (window.AnalyticsDataLayer?.page) {
                  window.AnalyticsDataLayer.page.name = `experience:${window.artName}:view`;
                  window.AnalyticsDataLayer.page.template = `experience:view`;
                }
                window._satellite?.track('experience_virtual_page_view');
              }
            }}
            onClose={() => {
              setIntroStage('done');
              audioRef.current.start();
            }}
            closing={introStage === 'instructions-closing'}
            hideClose
            disableBackdropClose
          />
        )}

        {/* Regular panels (only after the intro is done) */}
        {!introActive && activePanel === 'info' && (
          <InfoPanel onClose={closePanel} lang={language} />
        )}
        {!introActive && activePanel === 'transcript' && (
          <TranscriptPanel onClose={closePanel} lang={language} />
        )}
        {SHOW_LANGUAGE_SELECTION && !introActive && activePanel === 'language' && (
          <LanguagePanel
            onClose={closePanel}
            currentLang={language}
            onSelect={(code) => {
              setLanguage(code);
              audioRef.current.setLanguage(code);
              closePanel();
            }}
          />
        )}
      </div>
    </div>
  );
}
