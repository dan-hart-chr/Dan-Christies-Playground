import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import type { Coordinates } from "@/types/animations";
import { MAPBOX_CONFIG } from "@/constants/locations";
import { TIMING } from "@/constants/timing";

interface MarkerConfig extends Coordinates {
  useChristiesLogo?: boolean;
  label?: string;
}

interface UseMapboxOptions {
  center: Coordinates;
  zoom?: number;
  pitch?: number;
  bearing?: number;
  showRoute?: boolean;
  routeFrom?: Coordinates;
  routeTo?: Coordinates;
  markers?: MarkerConfig[];
  onLoad?: (map: mapboxgl.Map) => void;
  interactive?: boolean;
  showAllRoutes?: boolean;
  routesTo?: Coordinates;
}

export function useMapbox({
  center,
  zoom = MAPBOX_CONFIG.DEFAULT_ZOOM,
  pitch = MAPBOX_CONFIG.DEFAULT_PITCH,
  bearing = MAPBOX_CONFIG.DEFAULT_BEARING,
  showRoute = false,
  routeFrom,
  routeTo,
  markers = [],
  onLoad,
  interactive = true,
  showAllRoutes = false,
  routesTo,
}: UseMapboxOptions) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const onLoadRef = useRef(onLoad);
  const [isLoaded, setIsLoaded] = useState(false);
  const [shouldInit, setShouldInit] = useState(false);

  // Keep onLoad callback ref in sync
  useEffect(() => {
    onLoadRef.current = onLoad;
  }, [onLoad]);

  // Lazy load map ONLY when actually in viewport (not before) and destroy when out of view
  useEffect(() => {
    if (!mapContainerRef.current) return;

    let observer: IntersectionObserver | null = null;

    // Delay starting intersection observer to let hero animation complete
    const heroAnimationDelay = setTimeout(() => {
      if (!mapContainerRef.current) return;

      observer = new IntersectionObserver((entries) => {
        const isIntersecting = entries[0].isIntersecting;

        if (isIntersecting && !shouldInit) {
          setShouldInit(true);
        }
      }, {
        rootMargin: '200px', // Load slightly before visible for smoother UX
        threshold: 0
      });

      observer.observe(mapContainerRef.current);
    }, TIMING.MAP_OBSERVER_DELAY);

    return () => {
      clearTimeout(heroAnimationDelay);
      observer?.disconnect();
    };
  }, [shouldInit]);

  useEffect(() => {
    if (!shouldInit || !mapContainerRef.current) return;

    const token = import.meta.env.VITE_MAPBOX_TOKEN;
    if (!token) {
      console.error("Mapbox token not found");
      return;
    }

    mapboxgl.accessToken = token;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: MAPBOX_CONFIG.STYLE,
      center: [center.lng, center.lat],
      zoom,
      pitch,
      bearing,
      attributionControl: false,
      trackResize: false, // Disable resize tracking for better performance
      preserveDrawingBuffer: false, // Disable for better performance
      renderWorldCopies: false, // Reduce rendering workload
      refreshExpiredTiles: false, // Don't reload expired tiles
      maxTileCacheSize: 50, // Reduce cache size (default is much higher)
    });

    // Disable interactions after map is created if needed
    if (!interactive) {
      map.dragPan.disable();
      map.scrollZoom.disable();
      map.boxZoom.disable();
      map.dragRotate.disable();
      map.keyboard.disable();
      map.doubleClickZoom.disable();
      map.touchZoomRotate.disable();
      map.touchPitch.disable();
    }

    mapRef.current = map;
    let isMounted = true;

    // Listen for missing images
    map.on('styleimagemissing', (e) => {
      console.error('Style image missing:', e.id);
    });

    map.on("style.load", () => {
      // Check if component is still mounted
      if (!isMounted || !mapRef.current) return;

      // Configure night mode
      map.setConfigProperty("basemap", "lightPreset", MAPBOX_CONFIG.NIGHT_PRESET);
      map.setConfigProperty("basemap", "showPlaceLabels", false);
      map.setConfigProperty("basemap", "showRoadLabels", false);
      map.setConfigProperty("basemap", "showPointOfInterestLabels", false);
      map.setConfigProperty("basemap", "show3dObjects", true);

      // Add routes first (so they render below markers)
      if (showRoute && routeFrom && routeTo) {
        addRoute(map, routeFrom, routeTo);
      }

      if (showAllRoutes && routesTo) {
        const routeFromMarkers = markers.filter(m => !m.useChristiesLogo);
        addMultipleRoutes(map, routeFromMarkers, routesTo);
      }

      // Add markers as GeoJSON source with symbol layers (WebGL-based, no jitter)
      const markersGeoJSON = {
        type: 'FeatureCollection' as const,
        features: markers.map((markerConfig, index) => ({
          type: 'Feature' as const,
          geometry: {
            type: 'Point' as const,
            coordinates: [markerConfig.lng, markerConfig.lat]
          },
          properties: {
            label: markerConfig.label || '',
            isChristies: markerConfig.useChristiesLogo || false,
            id: index
          }
        }))
      };

      console.log('Markers GeoJSON:', JSON.stringify(markersGeoJSON, null, 2));
      console.log('Christie\'s markers:', markersGeoJSON.features.filter(f => f.properties.isChristies));

      map.addSource('markers', {
        type: 'geojson',
        data: markersGeoJSON
      });

      // Create red pin marker canvas
      const createRedMarkerImage = () => {
        const size = 40;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        if (ctx) {
          // Draw outer white circle
          ctx.beginPath();
          ctx.arc(size / 2, size / 2, 12, 0, Math.PI * 2);
          ctx.fillStyle = '#FFFFFF';
          ctx.fill();

          // Draw inner red circle
          ctx.beginPath();
          ctx.arc(size / 2, size / 2, 10, 0, Math.PI * 2);
          ctx.fillStyle = '#FF0000';
          ctx.fill();

          // Add shadow
          ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
          ctx.shadowBlur = 4;
          ctx.shadowOffsetY = 2;
        }

        return canvas;
      };

      const redMarkerCanvas = createRedMarkerImage();
      const redMarkerImage = new Image();
      redMarkerImage.src = redMarkerCanvas.toDataURL();

      redMarkerImage.onload = () => {
        map.addImage('red-marker', redMarkerImage);

        // Add symbol layer for red markers
        map.addLayer({
          id: 'marker-symbols',
          type: 'symbol',
          source: 'markers',
          filter: ['==', ['get', 'isChristies'], false],
          layout: {
            'icon-image': 'red-marker',
            'icon-size': 1,
            'icon-allow-overlap': true,
            'text-field': ['get', 'label'],
            'text-font': ['Open Sans Semibold', 'Arial Unicode MS Regular'],
            'text-size': 12,
            'text-offset': [0, 2],
            'text-anchor': 'top',
            'text-allow-overlap': true
          },
          paint: {
            'text-color': '#FFFFFF',
            'text-halo-color': 'rgba(0, 0, 0, 0.7)',
            'text-halo-width': 2,
            'text-halo-blur': 0.5
          }
        });

        // Load Christie's logo AFTER red markers are added (ensure proper sequencing)
        console.log('Attempting to load Christie\'s logo from /christieslogo.webp');
        map.loadImage('/christieslogo.webp', (error, image) => {
        console.log('Christie\'s logo loadImage callback', { error: error?.message, hasImage: !!image });
        if (error) {
          console.error('Error loading Christie\'s logo:', error);
          // Fallback to red marker if logo fails to load
          console.log('Using fallback red marker for Christie\'s');
          map.addLayer({
            id: 'christies-marker',
            type: 'symbol',
            source: 'markers',
            filter: ['==', ['get', 'isChristies'], true],
            layout: {
              'icon-image': 'red-marker',
              'icon-size': 2,
              'icon-allow-overlap': true,
              'text-field': ['get', 'label'],
              'text-font': ['Open Sans Bold', 'Arial Unicode MS Regular'],
              'text-size': 15,
              'text-offset': [0, 2.5],
              'text-anchor': 'top',
              'text-allow-overlap': true
            },
            paint: {
              'text-color': '#FFFFFF',
              'text-halo-color': 'rgba(0, 0, 0, 0.7)',
              'text-halo-width': 2,
              'text-halo-blur': 0.5
            }
          });
          return;
        }

        if (!image) {
          console.error('Christie\'s logo image is null');
          return;
        }

        map.addImage('christies-logo', image, {
          sdf: false,
          pixelRatio: 2 // Higher quality rendering
        });
        console.log('Christie\'s logo image added successfully, now adding layer');

        // Check if layer already exists
        if (map.getLayer('christies-marker')) {
          console.log('christies-marker layer already exists, removing it first');
          map.removeLayer('christies-marker');
        }

        // Add Christie's marker with logo
        map.addLayer({
          id: 'christies-marker',
          type: 'symbol',
          source: 'markers',
          filter: ['==', ['get', 'isChristies'], true],
          layout: {
            'icon-image': 'christies-logo',
            'icon-size': 0.3,
            'icon-allow-overlap': true,
            'icon-optional': false,
            'text-field': ['get', 'label'],
            'text-font': ['Open Sans Bold', 'Arial Unicode MS Regular'],
            'text-size': 15,
            'text-offset': [0, 2],
            'text-anchor': 'top',
            'text-allow-overlap': true,
            'text-optional': true
          },
          paint: {
            'text-color': '#FFFFFF',
            'text-halo-color': 'rgba(0, 0, 0, 0.7)',
            'text-halo-width': 2,
            'text-halo-blur': 0.5
          }
        });

        console.log('Christie\'s marker layer added successfully');
        console.log('All map layers:', map.getStyle().layers.map(l => l.id));
        console.log('Christie\'s marker layer details:', map.getLayer('christies-marker'));
      });
      };

      if (isMounted) {
        setIsLoaded(true);
        onLoadRef.current?.(map);
      }
    });

    return () => {
      isMounted = false;
      // Remove all markers
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];

      // Aggressively clean up map resources
      if (map && map.getStyle()) {
        // Remove all layers
        const style = map.getStyle();
        if (style?.layers) {
          style.layers.forEach(layer => {
            try {
              if (map.getLayer(layer.id)) {
                map.removeLayer(layer.id);
              }
            } catch (e) {
              // Layer might not exist
            }
          });
        }

        // Remove all sources
        if (style?.sources) {
          Object.keys(style.sources).forEach(sourceId => {
            try {
              if (map.getSource(sourceId)) {
                map.removeSource(sourceId);
              }
            } catch (e) {
              // Source might not exist
            }
          });
        }
      }

      // Remove map
      map.remove();
      mapRef.current = null;
    };
  }, [shouldInit, center.lat, center.lng, zoom, pitch, bearing, showRoute, routeFrom, routeTo, markers, interactive, showAllRoutes, routesTo]);

  return { mapContainerRef, mapRef, isLoaded };
}

function getDirectionsUrl(from: Coordinates, to: Coordinates, token: string): string {
  return `https://api.mapbox.com/directions/v5/mapbox/walking/${from.lng},${from.lat};${to.lng},${to.lat}?geometries=geojson&access_token=${token}`;
}

function addRoute(
  map: mapboxgl.Map,
  from: Coordinates,
  to: Coordinates,
  routeId: string = "path"
): void {
  const token = mapboxgl.accessToken;
  if (!token) {
    console.error("Mapbox access token not available");
    return;
  }

  const directionsUrl = getDirectionsUrl(from, to, token);

  fetch(directionsUrl)
    .then((response) => response.json())
    .then((data) => {
      if (!data.routes?.[0]?.geometry) {
        console.error("No route geometry found in response");
        return;
      }

      // Check if map still exists
      if (!map.getContainer()) return;

      const route = data.routes[0].geometry;

      // Check if map still exists before adding layers
      if (!map.getContainer()) return;

      // Create dot pattern inline if it doesn't exist
      if (!map.hasImage("pattern-dot")) {
        const size = MAPBOX_CONFIG.PATTERN_DOT_SIZE;
        const canvas = document.createElement("canvas");
        const dotImage = new Image(size, size);
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");

        if (ctx) {
          ctx.fillStyle = MAPBOX_CONFIG.PATTERN_DOT_COLOR;
          ctx.beginPath();
          ctx.arc(size / 2, size / 2, size / 4, 0, Math.PI * 2);
          ctx.fill();
          dotImage.src = canvas.toDataURL();
          dotImage.onload = () => {
            if (!map.getContainer()) return;
            map.addImage("pattern-dot", dotImage);
          };
        }
      }

      map.addSource(routeId, {
        type: "geojson",
        lineMetrics: true,
        data: {
          type: "Feature",
          geometry: route,
          properties: {},
        },
      });

      // Wait for pattern to load then add layer
      const checkPattern = setInterval(() => {
        if (map.hasImage("pattern-dot")) {
          clearInterval(checkPattern);

          // Line layer with pattern and emissive strength for visibility
          // Add route layer before marker layers (if they exist)
          // Check for marker-symbols first, as it's added before christies-marker
          const beforeId = map.getLayer('marker-symbols') ? 'marker-symbols' :
                          (map.getLayer('christies-marker') ? 'christies-marker' : undefined);
          map.addLayer({
            type: "line",
            source: routeId,
            id: `${routeId}-line`,
            layout: {
              "line-join": "round",
              "line-cap": "round"
            },
            paint: {
              "line-pattern": "pattern-dot",
              "line-width": MAPBOX_CONFIG.LINE_WIDTH,
              "line-emissive-strength": 2, // Increased brightness
            },
          }, beforeId);
        }
      }, 100);

      // Cleanup after 5 seconds if pattern never loads
      setTimeout(() => clearInterval(checkPattern), 5000);
    })
    .catch((error) => {
      console.error("Failed to fetch route:", error);
    });
}

function addMultipleRoutes(
  map: mapboxgl.Map,
  fromLocations: Coordinates[],
  to: Coordinates
): void {
  fromLocations.forEach((from, index) => {
    addRoute(map, from, to, `path-${index}`);
  });
}

export function useMapFlyAnimation(
  mapRef: React.RefObject<mapboxgl.Map | null>,
  from: Coordinates,
  to: Coordinates,
  enabled: boolean
) {
  const isFlying = useRef(false);
  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);

  useEffect(() => {
    if (!enabled || !mapRef.current) return;

    const map = mapRef.current;
    isFlying.current = true;

    function loopFlight() {
      if (!isFlying.current || !mapRef.current) return;

      const map = mapRef.current;

      map.flyTo({
        center: [to.lng, to.lat],
        zoom: MAPBOX_CONFIG.CLOSE_ZOOM,
        pitch: MAPBOX_CONFIG.PITCHED_ANGLE,
        bearing: MAPBOX_CONFIG.BEARING_ANGLE,
        duration: MAPBOX_CONFIG.FLY_DURATION,
        essential: true,
      });

      map.once("moveend", () => {
        if (!isFlying.current) return;
        const timeoutId = setTimeout(() => {
          if (!isFlying.current || !mapRef.current) return;

          mapRef.current.flyTo({
            center: [from.lng, from.lat],
            zoom: MAPBOX_CONFIG.CLOSE_ZOOM,
            pitch: MAPBOX_CONFIG.DEFAULT_PITCH,
            bearing: MAPBOX_CONFIG.DEFAULT_BEARING,
            duration: MAPBOX_CONFIG.FLY_DURATION,
            essential: true,
          });

          mapRef.current.once("moveend", () => {
            if (!isFlying.current) return;
            const nextTimeoutId = setTimeout(loopFlight, MAPBOX_CONFIG.FLY_PAUSE_DURATION);
            timeoutsRef.current.push(nextTimeoutId);
          });
        }, MAPBOX_CONFIG.FLY_PAUSE_DURATION);
        timeoutsRef.current.push(timeoutId);
      });
    }

    // Start at origin
    map.flyTo({
      center: [from.lng, from.lat],
      zoom: MAPBOX_CONFIG.CLOSE_ZOOM,
      pitch: MAPBOX_CONFIG.DEFAULT_PITCH,
      bearing: MAPBOX_CONFIG.DEFAULT_BEARING,
      duration: 0,
    });

    loopFlight();

    return () => {
      isFlying.current = false;
      // Clear all pending timeouts
      timeoutsRef.current.forEach(clearTimeout);
      timeoutsRef.current = [];
      // Remove all event listeners by stopping the map
      if (mapRef.current) {
        mapRef.current.stop();
      }
    };
  }, [enabled, from, to, mapRef]);
}
