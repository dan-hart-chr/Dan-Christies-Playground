import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register ScrollTrigger plugin
gsap.registerPlugin(ScrollTrigger);

/**
 * GSAP Animation Utilities for Christie's 2021 Microsite
 * These utilities provide reusable animation patterns for common use cases
 */

/**
 * Stagger text reveal animation - splits text into words/lines and animates in
 * Useful for: Hero headings, section titles
 * Set triggerOnScroll=true to activate on scroll into view instead of immediately
 */
export const animateTextReveal = (
  element: HTMLElement | null,
  options: {
    duration?: number;
    delay?: number;
    stagger?: number;
    yOffset?: number;
    triggerOnScroll?: boolean;
  } = {}
) => {
  if (!element) return;

  const {
    duration = 0.8,
    delay = 0.3,
    stagger = 0.1,
    yOffset = 20,
    triggerOnScroll = false,
  } = options;

  const words = element.innerText.split(' ');
  element.innerHTML = words
    // The reveal mask (overflow: hidden) clips to the box's own height, which at
    // tight line-heights is shorter than the font's true descender depth — cutting
    // off "y"/"g"/"p" etc. padding-bottom buys that room back; margin-bottom
    // cancels the padding so it doesn't push the following line down, leaving the
    // element's overall line-height/flow unchanged.
    .map((word) => `<span style="display: inline-block; overflow: hidden; padding-bottom: 0.3em; margin-bottom: -0.3em;"><span style="display: inline-block;">${word}</span></span>`)
    .join(' ');

  const spans = element.querySelectorAll('span span');
  
  if (triggerOnScroll) {
    // Create a timeline for ScrollTrigger
    gsap.to(spans, {
      scrollTrigger: {
        trigger: element,
        start: 'top 80%',
        once: true,
      },
      opacity: 1,
      y: 0,
      duration,
      delay,
      stagger,
      ease: 'power3.out',
      overwrite: 'auto',
    });
    // Set initial state
    gsap.set(spans, { opacity: 0, y: yOffset });
  } else {
    // Immediate animation (for hero and initial loads) — explicit fromTo,
    // see the fromTo note in animateFadeInOnScroll for why plain .from()
    // is unsafe here.
    gsap.fromTo(spans,
      { opacity: 0, y: yOffset },
      {
        opacity: 1,
        y: 0,
        duration,
        delay,
        stagger,
        ease: 'power3.out',
      }
    );
  }
};

/**
 * Fade in on scroll - element fades in when it enters viewport
 * Useful for: Cards, sections, images
 */
export const animateFadeInOnScroll = (
  element: HTMLElement | null,
  options: {
    duration?: number;
    delay?: number;
    yOffset?: number;
  } = {}
) => {
  if (!element) return;

  const { duration = 0.8, delay = 0, yOffset = 30 } = options;

  // fromTo (not from) — an implicit .from() end-target is captured from the
  // element's *current* value when the tween is created. On initial mount
  // this effect is exposed to React 18 StrictMode's dev-only double-invoke,
  // and the first invocation's immediate-render already zeroes opacity
  // before the second invocation's tween is created, so its implicit target
  // would be captured as 0 too (animating 0 -> 0, "completing" while staying
  // invisible). Explicit from/to values are immune to that.
  gsap.fromTo(element,
    { opacity: 0, y: yOffset },
    {
      scrollTrigger: {
        trigger: element,
        start: 'top 80%',
        once: true,
      },
      opacity: 1,
      y: 0,
      duration,
      delay,
      ease: 'power3.out',
    }
  );
};

/**
 * Parallax scroll effect - element moves at different speed than scroll
 * Useful for: Hero images, background elements
 */
export const animateParallax = (
  element: HTMLElement | null,
  options: {
    speed?: number; // 0.5 = half scroll speed, -0.5 = opposite direction
  } = {}
) => {
  if (!element) return;

  const { speed = 0.5 } = options;

  gsap.to(element, {
    scrollTrigger: {
      trigger: element,
      start: 'top center',
      end: 'bottom center',
      scrub: 1, // smooth scrubbing
      markers: false,
    },
    y: window.innerHeight * speed,
    ease: 'none',
  });
};

/**
 * Scale on scroll - element scales up/down as it enters viewport
 * Useful for: Cards, images in showcase sections
 */
export const animateScaleOnScroll = (
  element: HTMLElement | null,
  options: {
    duration?: number;
    startScale?: number;
    endScale?: number;
  } = {}
) => {
  if (!element) return;

  const { duration = 0.8, startScale = 0.8, endScale = 1 } = options;

  gsap.from(element, {
    scrollTrigger: {
      trigger: element,
      start: 'top 75%',
      once: true,
    },
    scale: startScale,
    opacity: 0,
    duration,
    ease: 'back.out',
  });
};

/**
 * Hover lift effect - element lifts on hover with shadow
 * Useful for: Cards, buttons, interactive elements
 */
export const setupHoverLift = (
  element: HTMLElement | null,
  options: {
    duration?: number;
    liftDistance?: number;
  } = {}
) => {
  if (!element) return;

  const { duration = 0.3, liftDistance = 10 } = options;

  element.addEventListener('mouseenter', () => {
    gsap.to(element, {
      y: -liftDistance,
      boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
      duration,
      ease: 'power2.out',
    });
  });

  element.addEventListener('mouseleave', () => {
    gsap.to(element, {
      y: 0,
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
      duration,
      ease: 'power2.out',
    });
  });
};

/**
 * Number counter animation - animates from 0 to target number
 * Useful for: Stats, counters, price animations
 */
export const animateCounter = (
  element: HTMLElement | null,
  targetValue: number,
  options: {
    duration?: number;
    prefix?: string;
    suffix?: string;
    decimals?: number;
  } = {}
) => {
  if (!element) return;

  const { duration = 2, prefix = '', suffix = '', decimals = 0 } = options;

  const obj = { value: 0 };

  gsap.to(obj, {
    value: targetValue,
    duration,
    ease: 'power1.out',
    onUpdate: () => {
      element.textContent =
        prefix + obj.value.toFixed(decimals) + suffix;
    },
  });
};

/**
 * Timeline - create complex multi-step animations
 * Useful for: Coordinated animations across multiple elements
 */
export const createAnimationTimeline = () => {
  const tl = gsap.timeline();
  return tl;
};

/**
 * Cleanup function, called from each section's useEffect teardown.
 *
 * This is intentionally a no-op. Every section on this page is permanent —
 * nothing here ever really unmounts — so the only thing that ever invokes
 * this teardown is React 18 StrictMode's dev-only double-invoke of effects.
 * Killing ScrollTriggers or tweens at that point is actively harmful: killing
 * a ScrollTrigger-tied `.from()` tween mid-flight leaves the element frozen
 * at its "from" value (e.g. opacity 0), and the *next* (surviving) tween
 * then captures that already-corrupted value as its own implicit end target,
 * so it "completes" without ever visually animating. If a component ever
 * needs real unmount cleanup, it should kill only the specific tween/
 * ScrollTrigger it created, not reach for a shared global nuke.
 */
export const cleanupGSAPAnimations = () => {};
