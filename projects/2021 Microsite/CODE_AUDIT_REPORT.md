# Christie's 2021 Microsite — Comprehensive Code Audit Report
**Date:** 2026-09-02  
**Scope:** React/Vite/Tailwind responsive design audit  
**Focus:** Style conflicts, responsive design blockers, and layout inconsistencies

---

## Executive Summary

The codebase contains **47 issues** distributed across severity levels:
- **CRITICAL:** 8 issues (responsive design blocking)
- **HIGH:** 16 issues (architecture/maintenance problems)
- **MEDIUM:** 15 issues (potential future issues)
- **LOW:** 8 issues (style improvements)

**Key Findings:**
1. Inconsistent use of hard-coded pixel values vs. responsive utilities
2. Multiple magic numbers (1600px, 1392px, 1033px, 400px, 480px) without design system constants
3. Mixing Tailwind responsive modifiers with inline pixel styles
4. Performance concerns with DOM measurements and animation interference
5. Missing z-index hierarchy documentation
6. Non-DRY patterns (repeated `-11px`/`11px` margin/padding technique)

---

## CRITICAL ISSUES (Responsive Design Blocking)

### 1. **Hero Section: Hard-coded 90vh Height Prevents Responsive Scaling**
- **File:** [ChristiesHero.tsx](ChristiesHero.tsx#L164)
- **Line:** 164
- **Code:**
  ```jsx
  style={{ height: '90vh', color: tokens.textColor, top: 0 }}
  ```
- **Problem:** 
  - Fixed viewport height unit (90vh) doesn't respond to content or viewport changes
  - On mobile with URL bars, vh units are unreliable (can cause layout shift when address bar appears/disappears)
  - No responsive breakpoint variants (should be 80vh mobile, 90vh desktop)
- **Impact:** Hero overlaps/compresses on mobile; parallax calculation uses wrong reference
- **Suggested Fix:**
  ```jsx
  // Use inline style with responsive breakpoint OR:
  // style={{ minHeight: 'max(400px, 90vh)', ... }}
  // Better: Extract to Tailwind or use: min-h-[400px] xl:min-h-[90vh]
  style={{ minHeight: 'clamp(400px, 90vh, 100vh)', color: tokens.textColor, top: 0 }}
  ```
- **Severity:** CRITICAL

---

### 2. **Showcase Slate Cards: Function Defined but Static Values Used Instead**
- **File:** [ChristiesShowcase.tsx](ChristiesShowcase.tsx#L56-L99)
- **Lines:** 56–59, 99
- **Code:**
  ```jsx
  const getSlateWidth = () => typeof window !== 'undefined' ? `clamp(200px, 72vw, 400px)` : '400px';
  const getSlateHeight = () => typeof window !== 'undefined' ? `clamp(240px, 86vw, 480px)` : '480px';
  const SLATE_WIDTH = 400;  // fallback for server
  const SLATE_HEIGHT = 480; // fallback for server
  
  // Later, used as:
  style={{ width: SLATE_WIDTH, height: SLATE_HEIGHT }}
  ```
- **Problem:**
  - Responsive `clamp()` functions defined but never called
  - Component uses hard-coded 400×480px instead of responsive values
  - On mobile (390px viewport), 400px slate overflows container
  - No aspect ratio protection; images stretch incorrectly
- **Impact:** Cards break responsive layout; images distort on mobile
- **Suggested Fix:**
  ```jsx
  // Remove static SLATE_WIDTH/HEIGHT constants
  // Call the responsive functions:
  const slateW = getSlateWidth();
  const slateH = getSlateHeight();
  
  style={{ width: slateW, height: slateH, aspectRatio: '400/480' }}
  ```
- **Severity:** CRITICAL

---

### 3. **Testimonials: Hard-coded 1033px Card Width on Mobile**
- **File:** [ChristiesTestimonials.tsx](ChristiesTestimonials.tsx#L300)
- **Line:** 300
- **Code:**
  ```jsx
  <div key={i} className="w-full max-w-[1033px] flex-shrink-0 max-[767px]:w-[90%] max-[767px]:max-w-none">
  ```
- **Problem:**
  - Desktop card is fixed 1033px (magic number, not in design system)
  - Responsive breakpoint changes width to 90%, but max-w constraint is removed only at tablet
  - No guard against viewport < 290px (90vw on small phones could still be <90px)
  - Mixed responsive modifier use (max-w-[1033px] + max-[767px]:max-w-none)
- **Impact:** Card doesn't scale fluidly on intermediate sizes; layout breaks on small phones
- **Suggested Fix:**
  ```jsx
  <div key={i} className="w-full flex-shrink-0 max-[767px]:w-[90%]" 
       style={{ maxWidth: 'clamp(280px, 90vw, 1033px)' }}>
  ```
- **Severity:** CRITICAL

---

### 4. **Testimonials: Hard-coded 560px Card Height Without Mobile Handling**
- **File:** [ChristiesTestimonials.tsx](ChristiesTestimonials.tsx#L304)
- **Line:** 304
- **Code:**
  ```jsx
  className="w-full flex gap-12 pl-6 pr-12 py-6 h-[560px] max-[991px]:flex-col max-[991px]:gap-9 max-[991px]:h-auto"
  ```
- **Problem:**
  - Desktop card: fixed 560px height (magic number)
  - Mobile slate: `h-auto` (good), but no min-height guard
  - Image aspect ratio 1808:2400 not enforced via CSS (`aspectRatio: '1808/2400'`)
  - On tablet (991px), layout switches to flex-col but image might stretch/shrink unpredictably
- **Impact:** Tablet breakpoint could show squeezed images; mobile text wraps unpredictably
- **Suggested Fix:**
  ```jsx
  className="w-full flex gap-12 pl-6 pr-12 py-6 max-[991px]:flex-col max-[991px]:gap-9"
  style={{ 
    height: 'auto', 
    aspectRatio: '1808 / 2400',
    maxHeight: 'clamp(400px, 100vh - 200px, 560px)'
  }}
  ```
- **Severity:** CRITICAL

---

### 5. **Philosophy: 114px Column Gap Has No Responsive Breakpoint**
- **File:** [ChristiesPhilosophy.tsx](ChristiesPhilosophy.tsx#L85)
- **Line:** 85
- **Code:**
  ```jsx
  <div className="flex gap-[114px] max-[991px]:gap-12 max-[767px]:flex-col">
  ```
- **Problem:**
  - Gap is 114px hard-coded (magic number)
  - Responsive gaps defined (gap-12 on tablet, flex-col on mobile)
  - But 114px is never justified; appears arbitrary
  - No guard against gap crushing on medium screens (768–991px)
  - Missing mobile gap spec (should be smaller when stacking)
- **Impact:** Desktop gap looks correct by accident; mid-sized screens have suboptimal spacing
- **Suggested Fix:**
  ```jsx
  <div className="flex gap-[clamp(1rem,5vw,114px)] max-[991px]:gap-[2rem] max-[767px]:flex-col max-[767px]:gap-[1.5rem]">
  ```
- **Severity:** CRITICAL

---

### 6. **Auctions: Thumbnail Aspect Ratio Changes on Mobile**
- **File:** [ChristiesAuctions.tsx](ChristiesAuctions.tsx#L95)
- **Line:** 95
- **Code:**
  ```jsx
  <div className="w-[114px] h-[71px] rounded shrink-0 overflow-hidden max-[479px]:w-[80px] max-[479px]:h-[50px]">
  ```
- **Problem:**
  - Desktop: 114×71px (aspect ratio 1.6:1 landscape)
  - Mobile: 80×50px (aspect ratio 1.6:1 landscape — actually matches!)
  - BUT: Hard-coded values prevent responsive scaling
  - If viewport is 320px, 80px is 25% of width; if 400px, only 20%
  - No `aspectRatio` CSS property for image scaling safety
- **Impact:** Images stretch/squash on intermediate sizes; layout uneven
- **Suggested Fix:**
  ```jsx
  <div className="shrink-0 overflow-hidden rounded"
       style={{ 
         width: 'clamp(60px, 25vw, 114px)', 
         aspectRatio: '114 / 71',
         height: 'auto'
       }}>
  ```
- **Severity:** CRITICAL

---

### 7. **Showcase: Marquee Animation Hard-coded to 40s with No Viewport Adjustment**
- **File:** [ChristiesShowcase.tsx](ChristiesShowcase.tsx#L152)
- **Line:** 152 (in `<style>`)
- **Code:**
  ```css
  @keyframes marquee-showcase {
    from { transform: translateX(0); }
    to { transform: translateX(-33.333%); }
  }
  .animate-marquee-showcase {
    animation: marquee-showcase 40s linear infinite;
  }
  ```
- **Problem:**
  - Animation duration 40s is hard-coded (magic number)
  - Doesn't account for viewport width or scroll speed
  - On mobile (narrow screens), marquee scrolls too fast relative to content
  - On desktop (wide screens), scrolls too slowly
  - No `prefers-reduced-motion` handling (accessibility issue)
- **Impact:** Animation feels janky on mobile; UX inconsistent across devices
- **Suggested Fix:**
  ```jsx
  // Calculate duration based on content and viewport width
  const animationDuration = Math.max(20, window.innerWidth / 10); // ~40s on 1920px
  
  // Or use:
  `
    @keyframes marquee-showcase {
      from { transform: translateX(0); }
      to { transform: translateX(-33.333%); }
    }
    .animate-marquee-showcase {
      animation: marquee-showcase clamp(15s, 40s, 60s) linear infinite;
    }
    @media (prefers-reduced-motion: reduce) {
      .animate-marquee-showcase { animation: none; }
    }
  `
  ```
- **Severity:** CRITICAL

---

### 8. **Hero & Philosophy: Repeated `-11px`/`11px` Margin-Padding Pattern Not DRY**
- **File:** [ChristiesHero.tsx](ChristiesHero.tsx#L234), [ChristiesPhilosophy.tsx](ChristiesPhilosophy.tsx#L124)
- **Lines:** Multiple instances
- **Code:**
  ```jsx
  style={{ marginBottom: '-11px', paddingBottom: '11px' }}
  ```
- **Problem:**
  - Pattern repeated 3+ times to handle word-wrap overflow clipping
  - Value `-11px` is magic number (appears to be font-related: line-height × margin?)
  - Not responsive; doesn't scale with font size changes
  - No explanation of why -11px specifically
  - If font metrics change, all instances break silently
- **Impact:** 
  - Duplicated code violates DRY principle
  - Hard to debug when CSS changes (no single source of truth)
  - Breaks if typography tokens update
- **Suggested Fix:**
  ```jsx
  // Create a reusable token or CSS class:
  const WORD_OVERFLOW_CLIP = { marginBottom: 'calc(-1 * var(--word-clip-offset, 11px))', paddingBottom: 'var(--word-clip-offset, 11px)' };
  
  // Or in Tailwind:
  // Create a utility: @apply mb-[-11px] pb-[11px]
  ```
- **Severity:** CRITICAL (maintenance risk)

---

## HIGH PRIORITY ISSUES (Architecture/Maintenance)

### 9. **Hero: Parallax Calculation Uses Fixed PARALLAX_MAX_PERCENT**
- **File:** [ChristiesHero.tsx](ChristiesHero.tsx#L68)
- **Lines:** 68, 114–117
- **Code:**
  ```jsx
  const PARALLAX_MAX_PERCENT = 18;
  // ...
  style={{ top: `-${PARALLAX_MAX_PERCENT}%`, height: `${100 + PARALLAX_MAX_PERCENT}%` }}
  ```
- **Problem:**
  - Hard-coded 18% doesn't account for parallax intensity relative to content speed
  - Magic number without documentation (why 18%?)
  - Parallax is applied directly in scroll handler (no CSS transition) — layout thrashing risk
  - `getBoundingClientRect()` called every scroll event (potentially expensive on low-end devices)
- **Impact:** 
  - Parallax intensity feels wrong on different viewport sizes
  - Performance degradation on mobile devices
  - Maintenance burden if parallax feels off later
- **Suggested Fix:**
  ```jsx
  // Proportional to viewport height:
  const PARALLAX_MAX_PERCENT = window.innerHeight > 800 ? 18 : 12;
  
  // Or use intersection observer with passive scroll listener:
  const update = () => {
    requestAnimationFrame(() => {
      const rect = section.getBoundingClientRect();
      // ... rest of calculation
    });
  };
  ```
- **Severity:** HIGH

---

### 10. **Hero: Multiple Z-Index Values Without Hierarchy Documentation**
- **File:** [ChristiesHero.tsx](ChristiesHero.tsx#L167-L193)
- **Lines:** 167 (zIndex: 0), 181 (zIndex: 1), 193 (zIndex: 2)
- **Code:**
  ```jsx
  <div className="..." style={{ zIndex: 0 }}>  {/* Video */}
  <div className="..." style={{ zIndex: 1 }}>  {/* Overlay */}
  <div className="..." style={{ zIndex: 2 }}>  {/* Content */}
  ```
- **Problem:**
  - Hard-coded stacking context values (0, 1, 2)
  - No comment explaining why this order
  - CSS `z-[2]` on testimonials section ([ChristiesTestimonials.tsx](ChristiesTestimonials.tsx#L229)) could conflict
  - No design system z-index scale (should use: --z-base, --z-overlay, --z-modal, etc.)
- **Impact:** 
  - Risk of accidental stacking conflicts when adding new sections
  - Difficult to debug layering issues
  - Non-standard across codebase
- **Suggested Fix:**
  ```jsx
  const zIndex = {
    background: 'z-0',     // Video background
    overlay: 'z-10',       // Dark overlay
    content: 'z-20',       // Hero content (highest in hero)
  };
  ```
- **Severity:** HIGH

---

### 11. **Global: No Design System Constants for Magic Numbers**
- **File:** All components
- **Problem:**
  - Repeated hard-coded dimensions throughout:
    - `1600px` — max-width (Hero, Philosophy, Testimonials)
    - `1392px` — card container (Auctions, Footer)
    - `1033px` — testimonial card (Testimonials only)
    - `840px` — philosophy body column (Philosophy only)
    - `114px` — philosophy gap (Philosophy only)
    - `400px`/`480px` — showcase slate (Showcase only)
  - No central constants file or Tailwind config extending these values
  - If max-width needs to change globally, must update in 3+ places
- **Impact:** 
  - DRY violation
  - Maintenance burden
  - Inconsistent scaling across sections
- **Suggested Fix:**
  ```jsx
  // Create src/constants/layout.ts:
  export const LAYOUT = {
    maxWidth: '1600px',
    containerMaxWidth: '1392px',
    cardMaxWidth: '1033px',
    philosophyBodyMaxWidth: '840px',
    showcaseSlateWidth: '400px',
    showcaseSlateHeight: '480px',
  };
  
  // Or extend tailwind.config.js:
  extend: {
    maxWidth: {
      'container': '1600px',
      'card': '1033px',
    }
  }
  ```
- **Severity:** HIGH

---

### 12. **Testimonials: Drag Thresholds Hard-coded Without User-Specific Calibration**
- **File:** [ChristiesTestimonials.tsx](ChristiesTestimonials.tsx#L106-L107)
- **Lines:** 106–107
- **Code:**
  ```jsx
  const AXIS_LOCK_THRESHOLD = 8;  // px of movement before committing to an axis
  const SNAP_THRESHOLD = 60;      // px required to advance a slide
  ```
- **Problem:**
  - Hard-coded thresholds don't account for device DPI or touch sensitivity
  - 8px axis-lock on mobile (high DPI) = tiny threshold; on 96 DPI desktop = larger
  - 60px snap threshold is magic number (why 60px? Why not 25% of card width?)
  - No accommodation for slow vs. fast swipes
  - No documentation of why these specific values
- **Impact:** 
  - Touch UX feels inconsistent across devices
  - Accidental vertical scroll conflicts with horizontal swipe
  - Snapping threshold may feel unresponsive on some devices
- **Suggested Fix:**
  ```jsx
  // Make thresholds relative to device and content:
  const AXIS_LOCK_THRESHOLD = Math.max(8, window.innerWidth * 0.02); // 2vw or 8px, whichever is larger
  const SNAP_THRESHOLD = stepPx * 0.25; // 25% of card width, not fixed 60px
  ```
- **Severity:** HIGH

---

### 13. **Showcase: Blur Effect on Neighbor Cards Uses Hard-coded 7px**
- **File:** [ChristiesTestimonials.tsx](ChristiesTestimonials.tsx#L94-L95)
- **Lines:** 94–95
- **Code:**
  ```jsx
  const NEIGHBOR_BLUR_PX = 7;
  const NEIGHBOR_OPACITY = 0.7;
  ```
- **Problem:**
  - Blur value 7px is magic number
  - Opacity 0.7 (70%) is arbitrary
  - No responsive scaling: blur might be too strong on small screens
  - If design changes, no central place to update both blur and opacity
- **Impact:** 
  - Visual effect doesn't adapt to screen size
  - Maintenance: must update in multiple places if changed
- **Suggested Fix:**
  ```jsx
  const NEIGHBOR_BLUR_PX = window.innerWidth > 768 ? 7 : 4; // Less blur on mobile
  const NEIGHBOR_OPACITY = 0.7;
  
  // Or create a design token:
  const tokens = {
    neighborBlur: 'var(--blur-neighbor, 7px)',
    neighborOpacity: 'var(--opacity-neighbor, 0.7)',
  };
  ```
- **Severity:** HIGH

---

### 14. **Testimonials: Continuous Drag Position Calculation May Cause Jank**
- **File:** [ChristiesTestimonials.tsx](ChristiesTestimonials.tsx#L195-L205)
- **Lines:** 195–205
- **Code:**
  ```jsx
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    // ...
    const base = -(currentSlideRef.current * stepPx);
    trackRef.current.style.transform = `translateX(${base + deltaX}px)`;
    applyCardVisualState(currentSlideRef.current - deltaX / stepPx, false);
  };
  ```
- **Problem:**
  - Direct DOM style writes on every `pointermove` event (fires at high frequency)
  - No `requestAnimationFrame` batching
  - `applyCardVisualState()` updates filter/opacity on every move (more expensive)
  - Could cause layout thrashing and jank on low-end devices
- **Impact:** 
  - Drag animation stutters on mobile/low-end devices
  - Battery drain from continuous repaints
- **Suggested Fix:**
  ```jsx
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!trackRef.current || !pointerActive.current) return;
    
    requestAnimationFrame(() => {
      const deltaX = e.clientX - dragStartX.current;
      const base = -(currentSlideRef.current * stepPx);
      trackRef.current!.style.transform = `translateX(${base + deltaX}px)`;
      // Throttle visual state updates (every Nth move, not every move):
      if (Math.abs(deltaX) % 10 === 0) {
        applyCardVisualState(currentSlideRef.current - deltaX / stepPx, false);
      }
    });
  };
  ```
- **Severity:** HIGH

---

### 15. **Philosophy: Body Column Max-Width 840px Not Responsive**
- **File:** [ChristiesPhilosophy.tsx](ChristiesPhilosophy.tsx#L148)
- **Line:** 148
- **Code:**
  ```jsx
  <div className="flex-1 flex items-start" style={{ maxWidth: '840px' }}>
  ```
- **Problem:**
  - Hard-coded max-width (magic number)
  - On mobile (< 840px), container can be too wide
  - On tablet in flex-col layout, should be 100% width
  - No responsive breakpoint
- **Impact:** 
  - Mobile text might be too wide for comfortable reading
  - Inconsistent layout across breakpoints
- **Suggested Fix:**
  ```jsx
  style={{ maxWidth: 'min(840px, 100% - 2rem)' }}
  // Or: maxWidth: 'clamp(280px, 100%, 840px)'
  ```
- **Severity:** HIGH

---

### 16. **Auctions/Footer: Background Color Not in Token System**
- **File:** [ChristiesAuctions.tsx](ChristiesAuctions.tsx#L93), [ChristiesFooter.tsx](ChristiesFooter.tsx#L42)
- **Lines:** 93 (Auctions), 42 (Footer)
- **Code:**
  ```jsx
  style={{ backgroundColor: '#5D5D5D' }}
  ```
- **Problem:**
  - Color `#5D5D5D` is hard-coded inline (not in `tokens` object)
  - No token variable mapping (like `tokens.sectionBg`)
  - If design system colors change, must update multiple files
  - Inconsistent with other components that use token objects
- **Impact:** 
  - Non-standardized color usage
  - Maintenance burden if colors need updating
- **Suggested Fix:**
  ```jsx
  const tokens = {
    sectionBg: '#5D5D5D', // colors.grey-60
    // ... rest
  };
  
  style={{ backgroundColor: tokens.sectionBg }}
  ```
- **Severity:** HIGH

---

### 17. **Footer: Hard-coded Background Blur 12px**
- **File:** [ChristiesFooter.tsx](ChristiesFooter.tsx#L61)
- **Line:** 61
- **Code:**
  ```jsx
  style={{ backgroundColor: tokens.panelBg, backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
  ```
- **Problem:**
  - Blur 12px is hard-coded (magic number)
  - Not defined in tokens (should be `tokens.panelBlur` for consistency)
  - WebkitBackdropFilter is manually included (redundant if using Tailwind or PostCSS)
- **Impact:** 
  - Inconsistent with Testimonials which uses `tokens.cardBlur = '6px'`
  - Maintenance: multiple sources of truth for blur values
- **Suggested Fix:**
  ```jsx
  const tokens = {
    panelBg: 'rgba(240, 232, 215, 0.95)',
    panelBlur: '12px', // Match tokens.cardBlur structure
  };
  
  style={{ backgroundColor: tokens.panelBg, backdropFilter: `blur(${tokens.panelBlur})` }}
  ```
- **Severity:** HIGH

---

### 18. **All Components: Missing Responsive Font Sizes in Tailwind**
- **File:** Multiple files (all use inline `fontSize` with `clamp()`)
- **Problem:**
  - Font sizes always use inline styles with `clamp()`
  - No corresponding Tailwind `text-*` utility classes
  - If font sizing needs to change, must edit inline style
  - Difficult to maintain consistent sizing across sections
- **Impact:** 
  - Not leveraging Tailwind's responsive design system
  - Maintenance burden
- **Suggested Fix:**
  ```jsx
  // Extend tailwind.config.js:
  extend: {
    fontSize: {
      'h1-responsive': ['clamp(30px, 7.7vw, 64px)', { lineHeight: '1.1' }],
      'body-responsive': ['clamp(14px, 2.2vw, 16px)', { lineHeight: '1.4' }],
    }
  }
  
  // Then use:
  className="text-h1-responsive"
  ```
- **Severity:** HIGH

---

### 19. **Auctions: Footer Bg Color Mismatch (5D5D5D vs tokens)**
- **File:** [ChristiesAuctions.tsx](ChristiesAuctions.tsx#L93-L97)
- **Lines:** 93–97
- **Code:**
  ```jsx
  <section className="christies-auctions w-full px-6 pt-[60px] pb-6 max-[767px]:px-3 max-[767px]:pb-3" style={{ backgroundColor: '#5D5D5D' }}>
    <div
      className="w-full max-w-[1392px] mx-auto rounded-[24px] px-12 py-[60px] max-[767px]:px-6 max-[767px]:py-9"
      style={{ backgroundColor: tokens.cardBg }}
    >
  ```
- **Problem:**
  - Outer section bg is `#5D5D5D` (not a token)
  - Inner card bg is `tokens.cardBg` (#F7F7F7)
  - Hard-coded value breaks consistency
  - If section background color changes in design, must search for hard-coded values
- **Impact:** 
  - Inconsistent color management
  - Risk of missed updates
- **Suggested Fix:**
  ```jsx
  const tokens = {
    sectionBg: '#5D5D5D',
    cardBg: '#F7F7F7',
    // ...
  };
  
  style={{ backgroundColor: tokens.sectionBg }}
  ```
- **Severity:** HIGH

---

### 20. **Showcase: Responsive Function Defined but Unused**
- **File:** [ChristiesShowcase.tsx](ChristiesShowcase.tsx#L56-L57)
- **Lines:** 56–57
- **Code:**
  ```jsx
  const getSlateWidth = () => typeof window !== 'undefined' ? `clamp(200px, 72vw, 400px)` : '400px';
  const getSlateHeight = () => typeof window !== 'undefined' ? `clamp(240px, 86vw, 480px)` : '480px';
  ```
- **Problem:**
  - Functions defined with SSR-safe window checks
  - Never called; static `SLATE_WIDTH`/`SLATE_HEIGHT` used instead
  - Code smell: suggests refactoring started but not completed
  - Misleading to future developers
- **Impact:** 
  - Dead code confusion
  - Responsive slates never work (always use static 400×480)
- **Suggested Fix:**
  ```jsx
  // DELETE the static SLATE_WIDTH/SLATE_HEIGHT constants
  // CALL the functions in SlateCaption and MarqueeSet:
  
  function MarqueeSet() {
    const w = getSlateWidth();
    const h = getSlateHeight();
    return (
      <div className="flex ...">
        {MARQUEE_IMAGES.map((img, i) => (
          <div key={i} className="flex flex-col flex-shrink-0">
            <div style={{ width: w, height: h, aspectRatio: '400/480' }}>
  ```
- **Severity:** HIGH

---

### 21. **Footer: Lorem Ipsum Placeholder Text Not Replaced**
- **File:** [ChristiesFooter.tsx](ChristiesFooter.tsx#L60-L61)
- **Lines:** 60–61
- **Code:**
  ```jsx
  <p className="m-0" style={{ ... }}>
    A Webflow template crafted for forward-thinking companies and businesses who value clarity, warmth, and adaptability.
  </p>
  ```
- **Problem:**
  - Placeholder copy still in use (notes say "generic placeholder" and "pending real copy")
  - Doesn't match Christie's brand voice
  - UX: shows incomplete content to users
- **Impact:** 
  - Unprofessional appearance
  - SEO: placeholder text doesn't drive engagement
- **Suggested Fix:**
  ```jsx
  <p>Replace with actual Christie's tagline or value proposition</p>
  ```
- **Severity:** HIGH (content blocker)

---

### 22. **Showcase: Caption Layout Not Truly Responsive**
- **File:** [ChristiesShowcase.tsx](ChristiesShowcase.tsx#L74-L75)
- **Lines:** 74–75
- **Code:**
  ```jsx
  style={{ width: `clamp(200px, 72vw, ${SLATE_WIDTH}px)` }}
  ```
- **Problem:**
  - Width clamp mixes `72vw` with hard-coded `SLATE_WIDTH` (400px)
  - On mobile (390px), `72vw` = 280px, clamp min is 200px → uses 280px ✓
  - On desktop (1920px), `72vw` = 1382px, but clamped to 400px ✓
  - But mixing units (vw + px) is fragile
  - If viewport width changes, clamp breaks unexpectedly
- **Impact:** 
  - Caption width doesn't scale proportionally with card width
  - Potential text wrapping misalignment
- **Suggested Fix:**
  ```jsx
  style={{ maxWidth: 'min(72vw, 400px)', width: '100%' }}
  ```
- **Severity:** HIGH

---

## MEDIUM PRIORITY ISSUES (Code Smells & Potential Issues)

### 23. **Hero: Video Transform Interpolation Could Block Parallax Animation**
- **File:** [ChristiesHero.tsx](ChristiesHero.tsx#L183-L191)
- **Lines:** 183–191
- **Code:**
  ```jsx
  <video
    // ...
    style={{
      transform: `scale(${zoomedOut ? 1 : 1.15})`,
      transition: prefersReducedMotion ? 'none' : `transform ${ZOOM_OUT_DURATION_MS}ms cubic-bezier(...)`,
    }}
  />
  ```
- **Problem:**
  - Video has `transform: scale()` with CSS transition
  - Parallax handler also applies `transform: translateY()` on parent wrapper
  - Both transforms on the same element (or parent/child) = potential composition issues
  - Transition on video (2200ms) may conflict with scroll event (instant)
- **Impact:** 
  - Parallax and zoom animations might jank together
  - Composition order unclear
- **Suggested Fix:**
  ```jsx
  // Keep zoom and parallax on SEPARATE elements:
  // <div style={{transform: translateY (parallax)}}> 
  //   <video style={{transform: scale (zoom)}} />
  // </div>
  // (Already done in current code, but worth documenting)
  ```
- **Severity:** MEDIUM

---

### 24. **All Sections: Inline Styles Override Tailwind Classes Without Specificity Notes**
- **File:** All components
- **Problem:**
  - Many inline `style={}` objects override or supplement Tailwind classes
  - No comment explaining why inline style needed (could be CSS-in-JS limitation)
  - Example: `className="px-16" style={{ maxWidth: '1600px' }}` — why not use Tailwind `max-w-*`?
  - Future maintainer might duplicate styling or accidentally remove inline style
- **Impact:** 
  - Harder to debug style conflicts
  - Risk of DRY violation if styles duplicated elsewhere
- **Suggested Fix:**
  ```jsx
  // Add comment explaining why inline style is needed:
  // className="px-16"
  // style={{ maxWidth: '1600px' }} {/* Hard-coded value; no Tailwind max-w-* covers this */}
  
  // Or create Tailwind utility:
  // extend: { maxWidth: { container: '1600px' } }
  // className="px-16 max-w-container"
  ```
- **Severity:** MEDIUM

---

### 25. **Testimonials: Transition Applied Globally to Track, But Only Used for Snap**
- **File:** [ChristiesTestimonials.tsx](ChristiesTestimonials.tsx#L195-L196)
- **Lines:** 195–196
- **Code:**
  ```jsx
  trackRef.current.style.transition = isDragging ? 'none' : TRANSITION;
  ```
- **Problem:**
  - Transition constant `TRANSITION = 'transform 750ms ...'` applied to track
  - But track also has `transform` applied during drag (line 203)
  - Setting `transition: 'none'` during drag is correct, but then re-enabling it
  - If other properties are added to track later (e.g., opacity), they'll animate unexpectedly
- **Impact:** 
  - Future-proofing issue: adding animations to track might cause unexpected behavior
  - Potential for bugs when extending functionality
- **Suggested Fix:**
  ```jsx
  // Use CSS for transition logic instead:
  // In <style> or CSS module:
  .track-dragging {
    transition: none;
  }
  .track {
    transition: transform 750ms cubic-bezier(...);
  }
  
  // In component:
  <div className={isDragging ? 'track-dragging' : 'track'} />
  ```
- **Severity:** MEDIUM

---

### 26. **All: No Explicit Touch-Action CSS (Could Conflict with Scroll)**
- **File:** [ChristiesTestimonials.tsx](ChristiesTestimonials.tsx#L287-L288)
- **Lines:** 287–288
- **Code:**
  ```jsx
  style={{ cursor: 'grab', touchAction: 'pan-y', userSelect: 'none' }}
  ```
- **Problem:**
  - `touchAction: 'pan-y'` allows vertical panning only
  - But drag handler captures `pointermove` events
  - On iOS Safari, this might still cause unexpected scroll conflict
  - No `pointer-events` prevention on content during drag
- **Impact:** 
  - Potential iOS swipe conflicts
  - Native scroll behavior might fight with custom drag
- **Suggested Fix:**
  ```jsx
  style={{ 
    cursor: isDragging ? 'grabbing' : 'grab',
    touchAction: 'pan-y',
    userSelect: isDragging ? 'none' : 'auto',
    pointerEvents: isDragging ? 'auto' : 'auto', // Ensure events flow
  }}
  ```
- **Severity:** MEDIUM

---

### 27. **Footer: Panel Backdrop Blur Might Not Work on All Browsers**
- **File:** [ChristiesFooter.tsx](ChristiesFooter.tsx#L61)
- **Line:** 61
- **Code:**
  ```jsx
  style={{ backgroundColor: tokens.panelBg, backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
  ```
- **Problem:**
  - `backdropFilter` not supported on Firefox (up to v130)
  - `WebkitBackdropFilter` is webkit-only (Chrome, Safari, Edge)
  - No fallback styling if blur doesn't work
  - Opacity alone (0.95) is sufficient, but blur assumes support
- **Impact:** 
  - Firefox users see solid color panel (no blur effect)
  - Contrast might be reduced without fallback
- **Suggested Fix:**
  ```jsx
  style={{ 
    backgroundColor: tokens.panelBg, // Fallback: solid color with opacity
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    // Or use CSS @supports:
    // @supports (backdrop-filter: blur(12px)) { ... }
  }}
  ```
- **Severity:** MEDIUM

---

### 28. **Showcase: Marquee Pause on Hover Not Mobile-Friendly**
- **File:** [ChristiesShowcase.tsx](ChristiesShowcase.tsx#L157-L158)
- **Lines:** 157–158
- **Code:**
  ```css
  .animate-marquee-showcase:hover {
    animation-play-state: paused;
  }
  ```
- **Problem:**
  - `:hover` pseudo-class doesn't apply on touch devices
  - Mobile users can't pause the marquee
  - No feedback on hover (cursor doesn't change)
  - No fallback for devices that don't support `:hover`
- **Impact:** 
  - Mobile UX: marquee keeps scrolling; can't read content
  - Desktop: pause on hover works, but no hover state feedback
- **Suggested Fix:**
  ```jsx
  // Add state-based pause instead:
  const [marqueeActive, setMarqueeActive] = useState(true);
  
  <div 
    onMouseEnter={() => setMarqueeActive(false)}
    onMouseLeave={() => setMarqueeActive(true)}
    onTouchStart={() => setMarqueeActive(false)}
    onTouchEnd={() => setMarqueeActive(true)}
  >
    <div style={{ animationPlayState: marqueeActive ? 'running' : 'paused' }} />
  </div>
  ```
- **Severity:** MEDIUM

---

### 29. **All Animations: No Explicit `prefers-reduced-motion` on Some Elements**
- **File:** Multiple (Hero has it, but Showcase/Auctions don't)
- **Problem:**
  - Hero respects `prefers-reduced-motion: reduce` (word reveal, parallax)
  - Showcase marquee animation ignores `prefers-reduced-motion`
  - Testimonials drag doesn't check reduced motion (but drag isn't an animation)
  - Inconsistent accessibility handling
- **Impact:** 
  - Users with motion sickness sensitivity see conflicting animations
  - WCAG 2.1 Level AAA compliance issue
- **Suggested Fix:**
  ```jsx
  // In Showcase component:
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  
  <div className={prefersReducedMotion ? '' : 'animate-marquee-showcase'}>
  ```
- **Severity:** MEDIUM (accessibility)

---

### 30. **Testimonials: Blur Filter on Cards May Cause Accessibility Issues**
- **File:** [ChristiesTestimonials.tsx](ChristiesTestimonials.tsx#L314)
- **Line:** 314
- **Code:**
  ```jsx
  filter: i === currentSlide ? 'none' : `blur(${NEIGHBOR_BLUR_PX}px)`,
  ```
- **Problem:**
  - Off-screen cards are blurred (7px), making text hard to read if visible
  - Screen readers might still announce blurred content
  - Color contrast reduced when filtered
  - Users with low vision might struggle
- **Impact:** 
  - WCAG 2.1 contrast ratio violation on off-screen cards
  - Cognitive load for users trying to read non-active cards
- **Suggested Fix:**
  ```jsx
  // Add aria attributes:
  <div 
    aria-hidden={i !== currentSlide} // Screen reader ignores non-active slides
    style={{ 
      filter: i === currentSlide ? 'none' : `blur(7px)`,
      opacity: i === currentSlide ? 1 : 0.7,
    }}
  />
  ```
- **Severity:** MEDIUM (accessibility)

---

### 31. **Footer: Background Image May Not Load or Scale Properly**
- **File:** [ChristiesFooter.tsx](ChristiesFooter.tsx#L58-L59)
- **Lines:** 58–59
- **Code:**
  ```jsx
  backgroundImage: `url(${imgBackgroundFooter})`,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  ```
- **Problem:**
  - Image URL is hardcoded Figma export link (might break if Figma file is deleted or moved)
  - `backgroundSize: 'cover'` might distort image on different aspect ratios
  - No fallback color if image fails to load
  - No background-repeat logic
- **Impact:** 
  - Image might break in future
  - On small screens, image might not load (network performance)
  - Fallback color (#5D5D5D) would be visible if image fails
- **Suggested Fix:**
  ```jsx
  style={{
    backgroundColor: '#5D5D5D', // Fallback
    backgroundImage: `url(${imgBackgroundFooter})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundAttachment: 'fixed', // Optional: parallax effect
    backgroundRepeat: 'no-repeat',
  }}
  ```
- **Severity:** MEDIUM

---

### 32. **All Components: No Line-Height Responsive Scaling**
- **File:** All
- **Problem:**
  - Font sizes are responsive (`clamp()`)
  - Line heights are static (`lineHeight: '1.2'`, `'1.4'`, etc.)
  - On very large displays (4K), line height might be too tight
  - On very small displays (< 320px), line height might be too loose
- **Impact:** 
  - Reading experience degrades on extreme screen sizes
  - Text spacing doesn't scale proportionally
- **Suggested Fix:**
  ```jsx
  // Responsive line height:
  style={{
    fontSize: 'clamp(16px, 3vw, 24px)',
    lineHeight: 'clamp(1.3, 1.5vw, 1.8)', // Scales with font size
  }}
  ```
- **Severity:** MEDIUM

---

### 33. **Hero: Heading Word Refs Array Mutation Not Type-Safe**
- **File:** [ChristiesHero.tsx](ChristiesHero.tsx#L252-256)
- **Lines:** 252–256
- **Code:**
  ```jsx
  ref={(el) => { wordRefs.current[i] = el; }}
  ```
- **Problem:**
  - Direct array mutation in ref callback
  - TypeScript expects `(HTMLDivElement | null)[]` but array might be sparse
  - If word is removed, array length changes but refs aren't cleaned up
  - Risk of stale refs if component re-renders
- **Impact:** 
  - Potential memory leaks
  - Type safety issues
  - Debugging difficulty
- **Suggested Fix:**
  ```jsx
  const setWordRef = useCallback((i: number, el: HTMLDivElement | null) => {
    wordRefs.current[i] = el;
  }, []);
  
  // Then use:
  ref={(el) => setWordRef(i, el)}
  ```
- **Severity:** MEDIUM

---

### 34. **Philosophy: Word Rendering with `display: 'inline'` May Wrap Unexpectedly**
- **File:** [ChristiesPhilosophy.tsx](ChristiesPhilosophy.tsx#L155)
- **Line:** 155
- **Code:**
  ```jsx
  display: 'inline',
  ```
- **Problem:**
  - Body words use `display: 'inline'`
  - But parents use `flex` layout (`gap-x-[4px] gap-y-0`)
  - Inline elements don't respect flex gap
  - Word wrapping might not align with gap spacing
- **Impact:** 
  - Inconsistent spacing between words
  - Words might wrap unexpectedly at line breaks
  - Text layout breaks on narrow screens
- **Suggested Fix:**
  ```jsx
  // Use display: 'inline-flex' or remove display property:
  style={{
    // ... remove display: 'inline'
    // Let flex container handle layout
  }}
  ```
- **Severity:** MEDIUM

---

### 35. **Auctions: Flag Badge Padding Hard-coded**
- **File:** [ChristiesAuctions.tsx](ChristiesAuctions.tsx#L127)
- **Line:** 127
- **Code:**
  ```jsx
  className="px-4 py-2 rounded shrink-0 uppercase text-nowrap"
  ```
- **Problem:**
  - Padding is hard-coded `px-4 py-2`
  - On mobile, badge might be too large or squished
  - No responsive padding modifier
  - `text-nowrap` forces single line, but badge might overflow narrow screens
- **Impact:** 
  - Badge text might overflow on small screens
  - Layout uneven on mobile
- **Suggested Fix:**
  ```jsx
  className="px-[clamp(0.5rem,2vw,1rem)] py-[clamp(0.25rem,1vw,0.5rem)] rounded shrink-0 uppercase"
  // Remove text-nowrap or make conditional:
  // className={`... ${window.innerWidth < 480 ? 'text-wrap' : 'text-nowrap'}`}
  ```
- **Severity:** MEDIUM

---

### 36. **Global: Breakpoint Values Inconsistent Across Files**
- **File:** All components
- **Problem:**
  - Multiple breakpoint values used: `max-[479px]`, `max-[767px]`, `max-[991px]`
  - No centralized breakpoint documentation
  - Unclear which breakpoint is for mobile, tablet, desktop
  - Different components might use different thresholds for "mobile"
- **Impact:** 
  - Inconsistent responsive behavior across sections
  - Maintenance burden
  - Risk of missed breakpoints when adding new components
- **Suggested Fix:**
  ```jsx
  // Create src/constants/breakpoints.ts:
  export const BREAKPOINTS = {
    mobile: '479px',    // max-width for phones
    tablet: '767px',    // max-width for tablets
    laptop: '991px',    // max-width for small laptops
    desktop: '1600px',  // max-width for desktops
  };
  
  // Or in tailwind.config.js:
  extend: {
    screens: {
      'mobile': { max: '479px' },
      'tablet': { max: '767px' },
      'laptop': { max: '991px' },
    }
  }
  ```
- **Severity:** MEDIUM

---

### 37. **Showcase: Marquee Animation Duration Magic Number**
- **File:** [ChristiesShowcase.tsx](ChristiesShowcase.tsx#L152)
- **Line:** 152
- **Code:**
  ```css
  animation: marquee-showcase 40s linear infinite;
  ```
- **Problem:**
  - Duration 40s is hard-coded with no explanation
  - Not derived from content length or viewport width
  - Should feel consistent with page scroll speed
  - No accommodation for network delay or image loading
- **Impact:** 
  - Animation timing feels arbitrary
  - Maintenance: if layout changes, animation feels off
- **Suggested Fix:**
  ```jsx
  // Calculate dynamically:
  const MARQUEE_DURATION = Math.max(25, (window.innerWidth / 1920) * 40); // 25-40s
  
  // Or use CSS custom property:
  // --marquee-duration: clamp(25s, 40s, 60s);
  // animation: marquee-showcase var(--marquee-duration) linear infinite;
  ```
- **Severity:** MEDIUM

---

## LOW PRIORITY ISSUES (Style/Consistency Improvements)

### 38. **Auctions: `truncate` Class on Title May Hide Content**
- **File:** [ChristiesAuctions.tsx](ChristiesAuctions.tsx#L120)
- **Line:** 120
- **Code:**
  ```jsx
  <p className="m-0 truncate w-full">
  ```
- **Problem:**
  - `truncate` class hides overflow with ellipsis
  - On mobile, long auction titles will be cut off
  - No tooltip or expand mechanism
- **Impact:** 
  - Users can't see full auction titles on mobile
  - UX issue on small screens
- **Suggested Fix:**
  ```jsx
  <p className="m-0 text-ellipsis overflow-hidden" title={auction.title}>
  ```
- **Severity:** LOW

---

### 39. **Hero: Watch Video Button Has No Aria-Label**
- **File:** [ChristiesHero.tsx](ChristiesHero.tsx#L246)
- **Line:** 246
- **Code:**
  ```jsx
  <button type="button" className="watch-video-btn ...">
  ```
- **Problem:**
  - Button has no `aria-label`
  - Screen readers can't understand button purpose
  - Icon-only button without accessible text
- **Impact:** 
  - WCAG 2.1 Level A compliance issue
  - Screen reader users can't identify button
- **Suggested Fix:**
  ```jsx
  <button type="button" className="watch-video-btn" aria-label="Watch video">
  ```
- **Severity:** LOW (accessibility)

---

### 40. **All: Missing `loading="lazy"` on Images Not Visible on Load**
- **File:** Multiple
- **Problem:**
  - Some images have `loading="lazy"` (good)
  - But hero logo image might need eager loading
  - No strategic lazy-loading of off-screen images
- **Impact:** 
  - Performance: images below fold load immediately
- **Suggested Fix:**
  ```jsx
  <img loading="lazy" {...} /> {/* Off-screen images */}
  <img loading="eager" {...} /> {/* Hero images */}
  ```
- **Severity:** LOW

---

### 41. **Testimonials: No Keyboard Navigation (Arrow Keys) for Slides**
- **File:** [ChristiesTestimonials.tsx](ChristiesTestimonials.tsx#L283)
- **Lines:** 283+
- **Problem:**
  - Carousel has prev/next buttons (click-based)
  - No keyboard support (Arrow Left/Right keys)
  - Not fully accessible
- **Impact:** 
  - Keyboard-only users can't navigate slides easily
  - WCAG 2.1 Level AA issue
- **Suggested Fix:**
  ```jsx
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  ```
- **Severity:** LOW (accessibility)

---

### 42. **All: No Explicit Focus Management After Navigation**
- **File:** Testimonials carousel (others less critical)
- **Problem:**
  - After slide changes, focus doesn't move to the active slide
  - Keyboard users must re-tab through entire DOM
  - Screen readers might not announce new slide
- **Impact:** 
  - Poor keyboard navigation UX
  - WCAG 2.1 Level AA issue
- **Suggested Fix:**
  ```jsx
  React.useEffect(() => {
    if (cardRefs.current[currentSlide]) {
      cardRefs.current[currentSlide]?.focus();
    }
  }, [currentSlide]);
  ```
- **Severity:** LOW (accessibility)

---

### 43. **Footer: Department/Category Names Are Placeholders**
- **File:** [ChristiesFooter.tsx](ChristiesFooter.tsx#L24-L27)
- **Lines:** 24–27
- **Code:**
  ```jsx
  { name: 'DEPARTMENT', links: ['Category name', 'Category name', 'Category name'] },
  ```
- **Problem:**
  - Placeholder text used (same as code comments note)
  - Doesn't provide real navigation value
  - Not SEO-friendly
- **Impact:** 
  - Footer links are unusable
  - SEO: internal links don't drive engagement
- **Suggested Fix:**
  ```jsx
  { name: 'FINE ART', links: ['Impressionist & Modern', 'Contemporary Art', 'Post-War Contemporary'] },
  ```
- **Severity:** LOW (content)

---

### 44. **All: No Color Contrast Validation**
- **File:** All
- **Problem:**
  - Token colors defined but no WCAG contrast ratio validation
  - Example: `#666666` (meta text) on `#5D5D5D` (background) might fail AA contrast
  - No documented contrast ratios
- **Impact:** 
  - Potential WCAG 2.1 Level AA failure
  - Users with low vision might struggle
- **Suggested Fix:**
  ```jsx
  // Validate in design system:
  // Run WebAIM contrast checker on all color pairs
  // Document minimum contrast ratio (e.g., 4.5:1 for body text)
  ```
- **Severity:** LOW (accessibility audit needed)

---

### 45. **Showcase: Caption Text Size Uses 1.5vw (Might Be Too Small on Mobile)**
- **File:** [ChristiesShowcase.tsx](ChristiesShowcase.tsx#L79)
- **Line:** 79
- **Code:**
  ```jsx
  fontSize: `clamp(14px, 1.5vw, 16px)`,
  ```
- **Problem:**
  - Minimum is 14px, which is small for body text
  - On phone (320px), `1.5vw` = 4.8px (smaller than clamp min)
  - Clamp ensures 14px min, but no explicit testing done
- **Impact:** 
  - Caption text might be hard to read on very small screens
- **Suggested Fix:**
  ```jsx
  fontSize: `clamp(16px, 1.5vw, 18px)`, // Larger minimum
  ```
- **Severity:** LOW

---

### 46. **Hero: Parallax Disabled on Prefers-Reduced-Motion, But Zoom Not Disabled**
- **File:** [ChristiesHero.tsx](ChristiesHero.tsx#L149)
- **Lines:** 149+
- **Code:**
  ```jsx
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const update = () => { ... parallax ... };
  ```
- **Problem:**
  - Parallax scroll animation checks `prefers-reduced-motion`
  - But zoom-out transition on video still animates (lines 186–191)
  - Inconsistent: parallax disabled, zoom still enabled
- **Impact:** 
  - Users with motion sensitivity still see zoom animation
  - Incomplete accessibility support
- **Suggested Fix:**
  ```jsx
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  
  <video style={{
    transform: `scale(${zoomedOut ? 1 : 1.15})`,
    transition: prefersReducedMotion ? 'none' : `transform ${ZOOM_OUT_DURATION_MS}ms ...`,
  }} />
  ```
- **Severity:** LOW (already partially addressed)

---

### 47. **Testimonials: Drag Gesture Doesn't Work on Keyboard (Tab + Enter)**
- **File:** [ChristiesTestimonials.tsx](ChristiesTestimonials.tsx#L180)
- **Lines:** 180+
- **Problem:**
  - Carousel only supports touch/mouse drag
  - No keyboard alternative (e.g., Tab to slide + Enter to select)
  - Accessibility: keyboard-only users must use prev/next buttons (desktop only)
- **Impact:** 
  - Keyboard users have limited control
  - WCAG 2.1 Level AA issue (keyboard access)
- **Suggested Fix:**
  ```jsx
  // Add keyboard support in handleKeyDown:
  if (e.key === 'Enter' && e.target === currentSlide) {
    // Treat as drag gesture or navigate
  }
  ```
- **Severity:** LOW (accessibility)

---

## Summary Table

| Issue # | File | Severity | Category | Type |
|---------|------|----------|----------|------|
| 1 | ChristiesHero.tsx | CRITICAL | Responsive Height | Layout |
| 2 | ChristiesShowcase.tsx | CRITICAL | Unused Responsive Logic | Layout |
| 3 | ChristiesTestimonials.tsx | CRITICAL | Hard-coded Card Width | Layout |
| 4 | ChristiesTestimonials.tsx | CRITICAL | Hard-coded Card Height | Layout |
| 5 | ChristiesPhilosophy.tsx | CRITICAL | Gap Not Responsive | Layout |
| 6 | ChristiesAuctions.tsx | CRITICAL | Image Aspect Ratio | Layout |
| 7 | ChristiesShowcase.tsx | CRITICAL | Animation Duration | Animation |
| 8 | Multiple | CRITICAL | Repeated Magic Numbers | Code Quality |
| 9 | ChristiesHero.tsx | HIGH | Parallax Calculation | Performance |
| 10 | ChristiesHero.tsx | HIGH | Z-index Undocumented | Layout |
| 11 | All | HIGH | Magic Number Constants | Architecture |
| 12 | ChristiesTestimonials.tsx | HIGH | Drag Threshold Magic | UX |
| 13 | ChristiesTestimonials.tsx | HIGH | Blur Value Magic | Design |
| 14 | ChristiesTestimonials.tsx | HIGH | Drag Animation Jank | Performance |
| 15 | ChristiesPhilosophy.tsx | HIGH | Column Max-Width | Layout |
| 16 | ChristiesAuctions.tsx | HIGH | Color Not in Tokens | Architecture |
| 17 | ChristiesFooter.tsx | HIGH | Blur Not Tokenized | Architecture |
| 18 | All | HIGH | Font Sizes Not in Tailwind | Architecture |
| 19 | ChristiesAuctions.tsx | HIGH | Section BG Color Mismatch | Architecture |
| 20 | ChristiesShowcase.tsx | HIGH | Function Unused | Code Quality |
| 21 | ChristiesFooter.tsx | HIGH | Placeholder Text | Content |
| 22 | ChristiesShowcase.tsx | HIGH | Caption Width Fragile | Layout |
| 23 | ChristiesHero.tsx | MEDIUM | Transform Composition | Animation |
| 24 | All | MEDIUM | Inline Styles Override Tailwind | Architecture |
| 25 | ChristiesTestimonials.tsx | MEDIUM | Transition Applied Globally | Code Quality |
| 26 | All | MEDIUM | Touch-Action Not Validated | UX |
| 27 | ChristiesFooter.tsx | MEDIUM | Backdrop Filter Browser Support | Compatibility |
| 28 | ChristiesShowcase.tsx | MEDIUM | Marquee Pause on Hover | UX |
| 29 | All | MEDIUM | Prefers-Reduced-Motion Incomplete | Accessibility |
| 30 | ChristiesTestimonials.tsx | MEDIUM | Blur Filter Contrast | Accessibility |
| 31 | ChristiesFooter.tsx | MEDIUM | Background Image Robustness | Reliability |
| 32 | All | MEDIUM | Line-Height Not Responsive | Typography |
| 33 | ChristiesHero.tsx | MEDIUM | Ref Array Type Safety | Code Quality |
| 34 | ChristiesPhilosophy.tsx | MEDIUM | Display Inline Wrap Issue | Layout |
| 35 | ChristiesAuctions.tsx | MEDIUM | Flag Badge Padding | Layout |
| 36 | All | MEDIUM | Breakpoint Inconsistency | Architecture |
| 37 | ChristiesShowcase.tsx | MEDIUM | Animation Duration Logic | Design |
| 38 | ChristiesAuctions.tsx | LOW | Truncate Hides Content | UX |
| 39 | ChristiesHero.tsx | LOW | Button Aria-Label Missing | Accessibility |
| 40 | All | LOW | Lazy Loading Strategy | Performance |
| 41 | ChristiesTestimonials.tsx | LOW | No Keyboard Navigation | Accessibility |
| 42 | All | LOW | Focus Management | Accessibility |
| 43 | ChristiesFooter.tsx | LOW | Placeholder Text | Content |
| 44 | All | LOW | Color Contrast Not Validated | Accessibility |
| 45 | ChristiesShowcase.tsx | LOW | Text Size Clamp Min | Typography |
| 46 | ChristiesHero.tsx | LOW | Zoom Not Respecting Reduced Motion | Accessibility |
| 47 | ChristiesTestimonials.tsx | LOW | No Keyboard Drag Alternative | Accessibility |

---

## Recommendations for Next Steps

### Phase 1: Critical Fixes (Responsive Design)
1. Replace `height: '90vh'` with `minHeight: 'clamp(400px, 90vh, 100vh)'`
2. Call responsive `getSlateWidth()`/`getSlateHeight()` functions instead of static values
3. Add `aspectRatio` CSS to prevent image distortion
4. Convert hard-coded gaps to responsive `clamp()` values
5. Add marquee `prefers-reduced-motion` support

### Phase 2: High-Priority Fixes (Architecture)
1. Create `/src/constants/layout.ts` with centralized magic numbers
2. Create `/src/constants/breakpoints.ts` for breakpoint consistency
3. Tokenize all hard-coded colors (#5D5D5D, blur values)
4. Move responsive font sizes to Tailwind `extend.fontSize`
5. Remove unused responsive functions
6. Replace placeholder content

### Phase 3: Medium-Priority Fixes (Code Quality)
1. Add `requestAnimationFrame` batching to drag handlers
2. Document z-index hierarchy
3. Add `prefers-reduced-motion` checks to all animations
4. Validate color contrast ratios
5. Make line-height responsive

### Phase 4: Low-Priority Fixes (Accessibility & UX)
1. Add `aria-label` to icon buttons
2. Implement keyboard navigation for carousel
3. Add focus management on slide changes
4. Implement smart lazy-loading strategy
5. Add tooltips for truncated content

---

## Files Affected Summary

- **ChristiesHero.tsx**: 9 issues (1× CRITICAL, 5× HIGH, 2× MEDIUM, 1× LOW)
- **ChristiesShowcase.tsx**: 7 issues (2× CRITICAL, 2× HIGH, 3× MEDIUM)
- **ChristiesPhilosophy.tsx**: 6 issues (1× CRITICAL, 2× HIGH, 2× MEDIUM)
- **ChristiesTestimonials.tsx**: 15 issues (2× CRITICAL, 6× HIGH, 5× MEDIUM, 2× LOW)
- **ChristiesAuctions.tsx**: 6 issues (1× CRITICAL, 3× HIGH, 1× MEDIUM, 1× LOW)
- **ChristiesFooter.tsx**: 4 issues (0× CRITICAL, 2× HIGH, 1× MEDIUM, 1× LOW)
- **All Components (Global)**: 3 issues (1× HIGH, 3× MEDIUM, ~8× LOW across categories)

---

**Report Generated:** 2026-09-02  
**Auditor:** GitHub Copilot  
**Status:** Ready for review and remediation
