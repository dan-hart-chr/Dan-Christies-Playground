import type { LocationInfo } from "@/types/animations";

export const LOCATIONS = {
  ED_SULLIVAN_THEATRE: {
    coords: { lng: -73.98286203417227, lat: 40.763721100079714 },
    name: "Ed Sullivan Theatre",
  },
  CBS_STUDIOS: {
    coords: { lng: -73.9749, lat: 40.7589 },
    name: "CBS Studios",
  },
  CHRISTIES_NYC: {
    coords: { lng: -73.97794, lat: 40.75864 },
    name: "Christie's New York",
    subtitle: "20 Rockefeller Plaza",
  },
  CARNEGIE_HALL: {
    coords: { lng: -73.9799, lat: 40.7651 },
    name: "Carnegie Hall",
    subtitle: "881 7th Avenue",
  },
  RKO_THEATRE: {
    coords: { lng: -73.9675, lat: 40.7621 },
    name: "RKO Theatre",
    subtitle: "58th Street Theatre",
  },
  MANNYS_MUSIC: {
    coords: { lng: -73.9844, lat: 40.7614 },
    name: "Manny's Music",
    subtitle: "West 48th Street",
  },
  MADISON_SQUARE_GARDEN: {
    coords: { lng: -73.9934, lat: 40.7505 },
    name: "Madison Square Garden",
  },
} as const satisfies Record<string, LocationInfo>;

export const MAPBOX_CONFIG = {
  STYLE: "mapbox://styles/mapbox/standard?optimize=true", // Add optimize=true for performance
  DEFAULT_ZOOM: 14,
  DEFAULT_PITCH: 0,
  DEFAULT_BEARING: 0,
  CLOSE_ZOOM: 16,
  PITCHED_ANGLE: 60,
  BEARING_ANGLE: 130,
  NIGHT_PRESET: "night",
  PATTERN_DOT_SIZE: 64,
  PATTERN_DOT_COLOR: "#FF0000", // Bright red for high visibility on dark maps
  MARKER_COLOR: "#ff0000",
  LINE_WIDTH: 8, // Thicker line for better visibility
  FLY_DURATION: 5000, // Duration in milliseconds for flyTo animations
  FLY_PAUSE_DURATION: 2000, // Pause duration between flights
  ACCESS_TOKEN: import.meta.env.VITE_MAPBOX_TOKEN || "",
} as const;
