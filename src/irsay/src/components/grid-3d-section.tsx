
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import imagesLoaded from "imagesloaded";
import { useReducedMotion } from "@/hooks/useReducedMotion";

gsap.registerPlugin(ScrollTrigger);

// Grid 3D Animation Constants
const GRID_3D_CONFIG = {
  TOTAL_IMAGES: 44,
  IMAGE_COUNT: 20,
  Z_DEPTH: 300,
  INITIAL_ROTATION_X: 70,
  FINAL_ROTATION_X: -50,
  ROTATION_Z_SMALL: 1,
  ROTATION_Z_LARGE: 5,
  SKEW_X_SMALL: 10,
  SKEW_X_LARGE: 20,
  X_PERCENT_NEAR: 20,
  X_PERCENT_FAR: 40,
  Y_PERCENT: 100,
  BLUR_INITIAL: 7,
  BLUR_FINAL: 4,
  SCALE_Y: 1.8,
  BRIGHTNESS: 100,
  CONTRAST: 100,
} as const;

// Generate array of images (repeating 1-20)
const generateImages = () => {
  const images = [];
  for (let i = 0; i < GRID_3D_CONFIG.TOTAL_IMAGES; i++) {
    const imageNum = (i % GRID_3D_CONFIG.IMAGE_COUNT) + 1;
    images.push(`/grid-section/${imageNum}.webp`);
  }
  return images;
};

const images = generateImages();

const marqueeTexts = [
  "February 9, 1964",
  "Ed Sullivan Show",
  "73 Million Viewers",
  "The Beatles Arrive",
  "New York City",
  "CBS Studio 50",
  "Four Lads from Liverpool",
  "America's Awakening",
  "The British Invasion",
  "A Cultural Revolution",
];

export default function Grid3DSection() {
  const gridRef = useRef<HTMLDivElement>(null);
  const marqueeRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const initialized = useRef(false);

  useEffect(() => {
    if (!gridRef.current || !marqueeRef.current) return;
    if (initialized.current) {
      console.log('[Grid3D] Already initialized, skipping');
      return;
    }
    initialized.current = true;

    const scrollTriggersToKill: ScrollTrigger[] = [];

    const preloadGridImages = (selector: string): Promise<void> => {
      return new Promise((resolve) => {
        const elements = document.querySelectorAll(selector);
        imagesLoaded(elements, { background: true }, () => resolve());
      });
    };

    const initAnimations = () => {
      const gridImages = gridRef.current?.querySelectorAll(".grid__item-imgwrap");
      const marqueeInner = marqueeRef.current?.querySelector(".mark__inner");

      if (!gridImages || !marqueeInner) return;

      console.log(`[Grid3D] Initializing with ${gridImages.length} images`);
      console.log(`[Grid3D] GridRef exists:`, !!gridRef.current);
      console.log(`[Grid3D] First image element:`, gridImages[0]);

      // Clear any existing transforms before initializing
      gsap.set(gridImages, { clearProps: "all" });
      gsap.set(gridImages, {
        filter: "blur(0px) brightness(100%) contrast(100%)",
      });

      const isLeftSide = (element: Element) => {
        const elementCenter = element.getBoundingClientRect().left + (element as HTMLElement).offsetWidth / 2;
        const viewportCenter = window.innerWidth / 2;
        return elementCenter < viewportCenter;
      };

      // Animate grid items - EXACT COPY from original demo
      gridImages.forEach((imageWrap) => {
        const imgEl = imageWrap.querySelector(".grid__item-img");
        const leftSide = isLeftSide(imageWrap);

        const tl = gsap
          .timeline({
            scrollTrigger: {
              trigger: imageWrap,
              start: "top bottom+=10%",
              end: "bottom top-=25%",
              scrub: true,
            },
          })
          .from(imageWrap, {
            startAt: { filter: "blur(0px) brightness(100%) contrast(100%)" },
            z: 300,
            rotateX: 70,
            rotateZ: leftSide ? 5 : -5,
            xPercent: leftSide ? -40 : 40,
            skewX: leftSide ? -20 : 20,
            yPercent: 100,
            filter: "blur(7px) brightness(0%) contrast(400%)",
            ease: "sine",
          })
          .to(imageWrap, {
            z: 300,
            rotateX: -50,
            rotateZ: leftSide ? -1 : 1,
            xPercent: leftSide ? -20 : 20,
            skewX: leftSide ? 10 : -10,
            filter: "blur(4px) brightness(0%) contrast(500%)",
            ease: "sine.in",
          })
          .from(imgEl, {
            scaleY: 1.5,
            ease: "sine",
          }, 0)
          .to(imgEl, {
            scaleY: 1.5,
            ease: "sine.in",
          }, ">");

        if (tl.scrollTrigger) {
          scrollTriggersToKill.push(tl.scrollTrigger);
        }
      });

      // Animate marquee
      const marqueeTl = gsap
        .timeline({
          scrollTrigger: {
            trigger: gridRef.current,
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          },
        })
        .fromTo(
          marqueeInner,
          {
            x: "100vw",
          },
          {
            x: "-100%",
            ease: "sine",
          }
        );

      if (marqueeTl.scrollTrigger) {
        scrollTriggersToKill.push(marqueeTl.scrollTrigger);
      }
    };

    preloadGridImages(".grid__item-img").then(() => {
      initAnimations();
      // Refresh ScrollTrigger after images load to recalculate positions
      ScrollTrigger.refresh();
    });

    return () => {
      console.log('[Grid3D] Cleaning up, killing', scrollTriggersToKill.length, 'ScrollTriggers');
      scrollTriggersToKill.forEach((trigger) => trigger.kill());
      initialized.current = false;
    };
  }, []);

  return (
    <section className="grid-3d-section">
      <div ref={gridRef} className="grid">
        {images.map((src, index) => (
          <figure key={index} className="grid__item">
            <div className="grid__item-imgwrap">
              <div
                className="grid__item-img"
                style={{ backgroundImage: `url(${src})` }}
              />
            </div>
          </figure>
        ))}
      </div>
      <div ref={marqueeRef} className="mark">
        <div className="mark__inner">
          {marqueeTexts.map((text, index) => (
            <span key={index}>{text}</span>
          ))}
        </div>
      </div>
    </section>
  );
}
