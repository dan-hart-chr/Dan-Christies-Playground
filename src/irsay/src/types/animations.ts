export interface Coordinates {
  lng: number;
  lat: number;
}

export interface LocationInfo {
  coords: Coordinates;
  name: string;
  subtitle?: string;
}

export const ANIMATION_DURATIONS = {
  ENTRANCE: 1,
  EXIT: 0.5,
  BLUR_TRANSITION: 1,
  CHARACTER_STAGGER: 0.015,
  WORD_STAGGER: 0.05,
  MAP_FLY_DURATION: 8000,
  MAP_FLY_PAUSE: 1000,
} as const;

export const ANIMATION_EASE = {
  DEFAULT: "none",
  SMOOTH: "power2.out",
  SMOOTH_IN_OUT: "power2.inOut",
  POWER4: "power4.out",
  SINE: "sine",
  SINE_IN: "sine.in",
  POWER1_IN_OUT: "power1.inOut",
} as const;

export const VIEWPORT_BREAKPOINT = "53em";

export const SCROLL_TRIGGER_DEFAULTS = {
  START_TOP_BOTTOM: "top bottom",
  START_TOP_TOP: "top top",
  END_BOTTOM_TOP: "bottom top",
  END_TOP_TOP: "top top",
  END_CENTER_CENTER: "center center",
} as const;
