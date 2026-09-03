# GSAP Animation Guide for Christie's 2021 Microsite

## Quick Start

GSAP is now installed and ready to use. Here are practical examples for your microsite:

---

## 1. Text Reveal Animation (Hero Section)

```typescript
import { useEffect, useRef } from 'react';
import { animateTextReveal } from '@/utils/gsapAnimations';

export const HeroTitle = () => {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    animateTextReveal(headingRef.current, {
      duration: 0.8,
      stagger: 0.1,
      yOffset: 20,
    });
  }, []);

  return (
    <h1 ref={headingRef} className="text-4xl md:text-6xl font-bold">
      Exceptional Artistry, Curated Collections
    </h1>
  );
};
```

---

## 2. Fade In on Scroll (Showcase Cards)

```typescript
import { useEffect, useRef } from 'react';
import { animateFadeInOnScroll } from '@/utils/gsapAnimations';

export const ShowcaseCard = ({ image, title }) => {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    animateFadeInOnScroll(cardRef.current, {
      duration: 0.8,
      yOffset: 30,
    });
  }, []);

  return (
    <div ref={cardRef} className="card">
      <img src={image} alt={title} />
      <h3>{title}</h3>
    </div>
  );
};
```

---

## 3. Parallax Scroll Effect (Hero Background)

```typescript
import { useEffect, useRef } from 'react';
import { animateParallax } from '@/utils/gsapAnimations';

export const HeroBackground = () => {
  const bgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    animateParallax(bgRef.current, {
      speed: 0.5, // Move at 50% of scroll speed
    });
  }, []);

  return (
    <div 
      ref={bgRef} 
      className="hero-bg"
      style={{ backgroundImage: 'url(...)' }}
    />
  );
};
```

---

## 4. Hover Lift Effect (Interactive Cards)

```typescript
import { useEffect, useRef } from 'react';
import { setupHoverLift } from '@/utils/gsapAnimations';

export const InteractiveCard = ({ children }) => {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setupHoverLift(cardRef.current, {
      duration: 0.3,
      liftDistance: 10,
    });
  }, []);

  return (
    <div 
      ref={cardRef} 
      className="bg-white rounded-lg p-6 cursor-pointer"
    >
      {children}
    </div>
  );
};
```

---

## 5. Scale on Scroll (Testimonials)

```typescript
import { useEffect, useRef } from 'react';
import { animateScaleOnScroll } from '@/utils/gsapAnimations';

export const TestimonialCard = ({ quote, author }) => {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    animateScaleOnScroll(cardRef.current, {
      duration: 0.8,
      startScale: 0.8,
      endScale: 1,
    });
  }, []);

  return (
    <div ref={cardRef} className="testimonial">
      <p className="text-lg italic">"{quote}"</p>
      <p className="font-semibold">— {author}</p>
    </div>
  );
};
```

---

## 6. Counter Animation (Auction Stats)

```typescript
import { useEffect, useRef } from 'react';
import { animateCounter } from '@/utils/gsapAnimations';

export const AuctionStats = () => {
  const countRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    animateCounter(countRef.current, 2500, {
      duration: 2,
      prefix: '$',
      suffix: 'k',
      decimals: 0,
    });
  }, []);

  return (
    <div>
      <span ref={countRef}>$0k</span>
      <p>Total Raised</p>
    </div>
  );
};
```

---

## 7. Complex Timeline (Multi-step Animation)

```typescript
import { useEffect, useRef } from 'react';
import { createAnimationTimeline } from '@/utils/gsapAnimations';
import gsap from 'gsap';

export const ComplexHeroAnimation = () => {
  const heroRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const tl = createAnimationTimeline();

    // Animate in sequence
    tl.from(titleRef.current, { opacity: 0, y: 30, duration: 0.8 }, 0)
      .from(subtitleRef.current, { opacity: 0, y: 30, duration: 0.8 }, 0.2)
      .from(ctaRef.current, { opacity: 0, scale: 0.8, duration: 0.6 }, 0.4);

    return () => {
      tl.kill();
    };
  }, []);

  return (
    <div ref={heroRef} className="hero">
      <h1 ref={titleRef}>Welcome to Christie's</h1>
      <p ref={subtitleRef}>Discover Exceptional Art & Collectibles</p>
      <button ref={ctaRef}>Explore Now</button>
    </div>
  );
};
```

---

## 8. Cleanup on Unmount (Important!)

Always clean up GSAP animations when components unmount:

```typescript
import { useEffect } from 'react';
import { cleanupGSAPAnimations } from '@/utils/gsapAnimations';

export const MyComponent = () => {
  useEffect(() => {
    // Your animations here...

    return () => {
      cleanupGSAPAnimations(); // Cleanup on unmount
    };
  }, []);

  return <div>Content</div>;
};
```

---

## Available GSAP Plugins

The utils file includes support for:

- **ScrollTrigger** - Trigger animations on scroll events (already registered)

To use other plugins (like TextPlugin, CustomEase), register them:

```typescript
import { CustomEase, TextPlugin } from 'gsap/all';

gsap.registerPlugin(CustomEase, TextPlugin);
```

---

## Performance Tips

1. **Use `once: true`** in ScrollTrigger to prevent repeated animations
2. **Kill animations on cleanup** to prevent memory leaks
3. **Use `scrub` for smooth performance** (1 = 1 second lag)
4. **Limit simultaneous animations** using timelines
5. **Test on mobile** - use `prefers-reduced-motion` for accessibility

```typescript
// Respect user's motion preferences
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (!prefersReducedMotion) {
  // Run animations
}
```

---

## Resources

- [GSAP Documentation](https://gsap.com/docs)
- [ScrollTrigger Guide](https://gsap.com/docs/v3/Plugins/ScrollTrigger)
- [GSAP Easing Visualizer](https://gsap.com/docs/v3/Eases)
- [Interactive Examples](https://gsap.com/showcase)

---

## Next Steps for Your Microsite

1. **Hero Section** - Add text reveal + parallax background
2. **Showcase Section** - Fade in on scroll + hover lift effects
3. **Testimonials** - Scale animations as they scroll into view
4. **Auctions** - Counter animations for prices/bids
5. **CTA Buttons** - Hover animations and pulse effects

Start with one section and build up! The animations will make your microsite feel much more premium and interactive.
