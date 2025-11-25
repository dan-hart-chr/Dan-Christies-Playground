/**
 * Centralized timing constants for animations and interactions
 * All values in milliseconds unless otherwise specified
 */
export const TIMING = {
  // Hero animation
  HERO_ANIMATION_DURATION: 3000,

  // Smooth scroll initialization
  SMOOTH_SCROLL_INIT_DELAY: 3000,

  // Map initialization
  MAP_OBSERVER_DELAY: 2000,

  // Splitting polling (will be removed once callback pattern is implemented)
  SPLITTING_POLL_INTERVAL: 100,

  // Entrance animation
  ENTRANCE_STAGGER_DURATION: 0.15, // in seconds for GSAP
  ENTRANCE_CARD_ANIMATION: 1, // in seconds
  ENTRANCE_ROTATION_DURATION: 3, // in seconds
  ENTRANCE_TEXT_FADE_DURATION: 1, // in seconds
  ENTRANCE_SPIN_DURATION: 20, // in seconds
  ENTRANCE_FLIP_INTERVAL: 2, // in seconds
} as const;

export const ENTRANCE_ANIMATION = {
  RADIUS_DESKTOP: 250,
  RADIUS_MOBILE: 180,
} as const;
