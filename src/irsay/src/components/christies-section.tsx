
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useSplitting } from "@/hooks/useSplitting";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { ANIMATION_DURATIONS, ANIMATION_EASE } from "@/types/animations";

gsap.registerPlugin(ScrollTrigger);

const text = `Founded in 1766 by James Christie, Christie's has since become synonymous with art auctions, and throughout its storied history has sold some of the most significant paintings, sculptures, photographs and jewelry ever to come to market.`;

export default function ChristiesSection() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const backgroundRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLImageElement>(null);
  const textSectionRef = useRef<HTMLDivElement>(null);
  const { ref: textRef } = useSplitting<HTMLParagraphElement>("chars");
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (!wrapperRef.current || !backgroundRef.current || !frameRef.current || !textSectionRef.current) return;

    const wrapper = wrapperRef.current;
    const background = backgroundRef.current;
    const frame = frameRef.current;

    // Hide the video section gradient when entering Christie's section
    ScrollTrigger.create({
      trigger: wrapper,
      start: "top bottom",
      end: "bottom top",
      onEnter: () => document.body.classList.add("christies-active"),
      onLeave: () => document.body.classList.remove("christies-active"),
      onEnterBack: () => document.body.classList.add("christies-active"),
      onLeaveBack: () => document.body.classList.remove("christies-active"),
    });

    // Create main timeline for scroll-based zoom effect AND text/map
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: wrapper,
        start: "center center",
        end: "+=600%",
        pin: true,
        scrub: !prefersReducedMotion,
      },
    });

    // Zoom in the frame to reveal the background
    tl.to(frame, {
      scale: 2,
      z: 350,
      transformOrigin: "center center",
      ease: ANIMATION_EASE.POWER1_IN_OUT,
      duration: ANIMATION_DURATIONS.EXIT * 8,
    }, 0)
      // Slightly zoom the background for parallax effect
      .to(
        background,
        {
          scale: 1.1,
          transformOrigin: "center center",
          ease: ANIMATION_EASE.POWER1_IN_OUT,
          duration: ANIMATION_DURATIONS.EXIT * 8,
        },
        0
      );

    // Wait for splitting to complete
    const checkSplitting = setInterval(() => {
      if (!textRef.current) return;

      const chars = textRef.current.querySelectorAll(".char");
      if (!chars.length) return;

      clearInterval(checkSplitting);

      const bottomContent = textRef.current.parentElement;

      // Set initial states
      gsap.set(chars, { opacity: 0, y: 20, scale: 0.8 });

      // Make visible when zoom completes
      tl.call(() => {
        bottomContent?.classList.add("is-active");
        wrapper.classList.add("has-text");
      }, undefined, 4);

      // Animate text characters
      tl.to(chars, {
        opacity: 1,
        y: 0,
        scale: 1,
        stagger: ANIMATION_DURATIONS.CHARACTER_STAGGER,
        ease: ANIMATION_EASE.SMOOTH,
        duration: ANIMATION_DURATIONS.EXIT,
      }, 4)
      // Exit animations - fade out at the end
      .to(chars, {
        opacity: 0,
        y: -50,
        ease: ANIMATION_EASE.SMOOTH_IN_OUT,
        duration: ANIMATION_DURATIONS.EXIT * 2,
      }, "+=2")
      .to(wrapper, {
        filter: "blur(20px)",
        opacity: 0,
        ease: ANIMATION_EASE.SMOOTH_IN_OUT,
        duration: ANIMATION_DURATIONS.EXIT * 2,
      }, "<");
    }, 100);

    return () => {
      clearInterval(checkSplitting);
      tl.kill();
    };
  }, [textRef, prefersReducedMotion]);

  return (
    <div ref={wrapperRef} className="christies-wrapper">
      <div className="christies-content">
        <section ref={backgroundRef} className="christies-hero"></section>
      </div>
      <div className="christies-image-container">
        <img
          ref={frameRef}
          src="/artgal.webp"
          alt="Christie's Art Gallery Frame"
        />
      </div>
      <div ref={textSectionRef} className="christies-text-content">
        <div className="dylan-title-section__bottom-content">
          <p ref={textRef} className="dylan-title-section__description" data-splitting>
            {text}
          </p>
        </div>
      </div>
    </div>
  );
}
