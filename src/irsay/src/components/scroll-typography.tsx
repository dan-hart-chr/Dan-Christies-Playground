
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useSplitting } from "@/hooks/useSplitting";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import {
  ANIMATION_DURATIONS,
  ANIMATION_EASE,
  SCROLL_TRIGGER_DEFAULTS,
} from "@/types/animations";

gsap.registerPlugin(ScrollTrigger);

const text = `Jim Irsay's collection is a famous private museum of rock 'n' roll, American history, and pop culture. It includes legendary guitars once owned by icons like Kurt Cobain, Prince, and Bob Dylan, as well as rare items such as Abraham Lincoln's letters and John Wilkes Booth's wanted poster. Irsay also owns sports and movie memorabilia, and he tours the collection with live music performances, turning it into a travelling celebration of music and history.`;

export default function ScrollTypography() {
  const { ref: textRef } = useSplitting<HTMLHeadingElement>("words");
  const prefersReducedMotion = useReducedMotion();
  const scrollTriggersRef = useRef<ScrollTrigger[]>([]);

  useEffect(() => {
    if (!textRef.current) return;

    const initScrollAnimations = () => {
      if (!textRef.current) return;

      const title = textRef.current;

      // Set initial rotation state immediately for Safari compatibility
      if (!prefersReducedMotion) {
        gsap.set(title, {
          transformOrigin: "0% 50%",
          rotate: 3,
        });

        const rotateAnimation = gsap.to(title, {
          ease: ANIMATION_EASE.DEFAULT,
          rotate: 0,
          scrollTrigger: {
            trigger: title,
            start: SCROLL_TRIGGER_DEFAULTS.START_TOP_BOTTOM,
            end: SCROLL_TRIGGER_DEFAULTS.START_TOP_TOP,
            scrub: true,
          },
        });
        if (rotateAnimation.scrollTrigger) {
          scrollTriggersRef.current.push(rotateAnimation.scrollTrigger);
        }
      }

      // Set initial word opacity
      gsap.set(title.querySelectorAll(".word"), { opacity: 0.1 });

      const opacityAnimation = gsap.to(title.querySelectorAll(".word"), {
        ease: ANIMATION_EASE.DEFAULT,
        opacity: 1,
        stagger: ANIMATION_DURATIONS.WORD_STAGGER,
        scrollTrigger: {
          trigger: title,
          start: "top bottom-=20%",
          end: SCROLL_TRIGGER_DEFAULTS.END_CENTER_CENTER,
          scrub: true,
        },
      });
      if (opacityAnimation.scrollTrigger) {
        scrollTriggersRef.current.push(opacityAnimation.scrollTrigger);
      }
    };

    // Wait for splitting to complete using requestAnimationFrame
    let rafId: number;
    const checkSplitting = () => {
      if (textRef.current?.querySelector(".word")) {
        initScrollAnimations();
      } else {
        rafId = requestAnimationFrame(checkSplitting);
      }
    };

    rafId = requestAnimationFrame(checkSplitting);

    return () => {
      cancelAnimationFrame(rafId);
      scrollTriggersRef.current.forEach((trigger) => trigger.kill());
      scrollTriggersRef.current = [];
    };
  }, [prefersReducedMotion, textRef]);

  return (
    <div className="scroll-content">
      <h2 ref={textRef} className="scroll-text" data-splitting>
        {text}
      </h2>
    </div>
  );
}