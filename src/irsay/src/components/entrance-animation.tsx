
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import imagesLoaded from "imagesloaded";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { VIEWPORT_BREAKPOINT } from "@/types/animations";
import { TIMING, ENTRANCE_ANIMATION } from "@/constants/timing";

gsap.registerPlugin(ScrollTrigger);

const images = [
  "/17.webp",
  "/18.webp",
  "/19.webp",
  "/20.webp",
  "/21.webp",
  "/22.webp",
  "/23.webp",
  "/24.webp",
];

export default function EntranceAnimation() {
  const [isLoading, setIsLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    const preloadImages = (selector: string): Promise<void> => {
      return new Promise((resolve) => {
        const elements = document.querySelectorAll(selector);
        imagesLoaded(elements, { background: true }, () => resolve());
      });
    };

    const initAnimation = () => {
      if (!containerRef.current) return undefined;

      const mm = gsap.matchMedia();

      mm.add(
        {
          isDesktop: `(min-width: ${VIEWPORT_BREAKPOINT})`,
          isMobile: `(max-width: ${VIEWPORT_BREAKPOINT})`,
        },
        (context) => {
          const { isDesktop } = context.conditions as { isDesktop: boolean };

          const cardList = gsap.utils.toArray<HTMLElement>(".card");
          const count = cardList.length;

          const radius = isDesktop ? ENTRANCE_ANIMATION.RADIUS_DESKTOP : ENTRANCE_ANIMATION.RADIUS_MOBILE;
          const sliceAngle = (2 * Math.PI) / count;

          // Set initial circular positions (where they should end up)
          gsap.set(cardList, {
            x: (index) => {
              return Math.round(
                radius * Math.cos(sliceAngle * index - Math.PI / 4)
              );
            },
            y: (index) => {
              return Math.round(
                radius * Math.sin(sliceAngle * index - Math.PI / 4)
              );
            },
            rotation: (index) => {
              return (index + 1) * (360 / count);
            },
          });

          // Ensure headings are visible initially (fallback)
          gsap.set(".headings", {
            opacity: 1,
            filter: "blur(0px)",
          });

          // Create simplified timeline for reduced motion
          if (prefersReducedMotion) {
            const timeline = gsap
              .timeline()
              .set(cardList, {
                opacity: 1,
                scale: 1,
              });

            return () => {
              timeline.kill();
            };
          }

          // Create full timeline with animations
          const timeline = gsap
            .timeline()
            .set(cardList, {
              opacity: 0,
              scale: 0,
              x: 0,
              y: 0,
              duration: TIMING.ENTRANCE_CARD_ANIMATION * 2,
            })
            .to(cardList, {
              stagger: TIMING.ENTRANCE_STAGGER_DURATION,
              opacity: 1,
              scale: 1,
              duration: TIMING.ENTRANCE_CARD_ANIMATION,
              x: (index) => {
                return Math.round(
                  radius * Math.cos(sliceAngle * index - Math.PI / 4)
                );
              },
              y: (index) => {
                return Math.round(
                  radius * Math.sin(sliceAngle * index - Math.PI / 4)
                );
              },
              rotation: (index) => {
                return (index + 1) * (360 / count);
              },
            })
            .to(
              ".group",
              {
                rotation: -360 - 90,
                duration: TIMING.ENTRANCE_ROTATION_DURATION,
                ease: "power4.out",
              },
              0
            )
            .fromTo(
              ".headings",
              {
                opacity: 0,
                filter: "blur(60px)",
              },
              {
                opacity: 1,
                filter: "blur(0px)",
                duration: TIMING.ENTRANCE_TEXT_FADE_DURATION,
              },
              TIMING.ENTRANCE_CARD_ANIMATION
            )
            .to(cardList, {
              repeat: -1,
              duration: TIMING.ENTRANCE_FLIP_INTERVAL,
              onRepeat: () => {
                gsap.to(cardList[Math.floor(Math.random() * count)], {
                  rotateY: "+=180",
                });
              },
            })
            .to(
              ".container",
              {
                rotation: "-=360",
                duration: TIMING.ENTRANCE_SPIN_DURATION,
                ease: "none",
                repeat: -1,
              },
              0
            );

          return () => {
            timeline.kill();
          };
        }
      );

      return () => {
        mm.revert();
      };
    };

    let cleanup: (() => void) | undefined;

    preloadImages(".card__img")
      .then(() => {
        setIsLoading(false);
        cleanup = initAnimation();
      })
      .catch((error) => {
        console.error("Failed to preload images:", error);
        setIsLoading(false);
      });

    return () => {
      if (cleanup) {
        cleanup();
      }
    };
  }, [prefersReducedMotion]);

  return (
    <section ref={containerRef} className={`hero-section ${isLoading ? "loading" : ""}`}>
      <div className="content">
        <div className="scene">
          <div className="container">
            <div className="group">
              {images.map((src, index) => (
                <div key={index} className="card">
                  <div
                    className="card__img"
                    style={{ backgroundImage: `url(${src})` }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="headings">
          <h1 className="headings__subtitle headings__subtitle--spaced">THE</h1>
          <h1 className="headings__main">JIM IRSAY</h1>
          <h1 className="headings__subtitle headings__subtitle--spaced">COLLECTION</h1>
        </div>

        <div className="scroll-downs">
          <div className="mousey">
            <div className="scroller"></div>
          </div>
        </div>
      </div>
    </section>
  );
}
