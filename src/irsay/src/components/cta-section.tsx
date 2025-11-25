
import { useEffect, useRef, useMemo } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ANIMATION_EASE } from "@/types/animations";
import { useMapbox } from "@/hooks/useMapbox";
import { LOCATIONS } from "@/constants/locations";

gsap.registerPlugin(ScrollTrigger);

export default function CTASection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const mapWrapperRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Prepare all markers with labels
  const allMarkers = useMemo(() => {
    const markers = [];

    // Add all locations except Christie's with their names
    Object.entries(LOCATIONS).forEach(([key, location]) => {
      if (key !== 'CHRISTIES_NYC') {
        markers.push({
          ...location.coords,
          label: location.name
        });
      }
    });

    // Add Christie's with logo as the last marker
    markers.push({
      ...LOCATIONS.CHRISTIES_NYC.coords,
      useChristiesLogo: true,
      label: LOCATIONS.CHRISTIES_NYC.name
    });

    return markers;
  }, []);

  // Setup map with all routes converging on Christie's
  const { mapContainerRef, mapRef, isLoaded } = useMapbox({
    center: LOCATIONS.CHRISTIES_NYC.coords,
    zoom: 14,
    pitch: 60, // 3D perspective
    bearing: 0,
    markers: allMarkers,
    interactive: false, // Disable all interactions
    showAllRoutes: true, // Show routes from all locations
    routesTo: LOCATIONS.CHRISTIES_NYC.coords,
  });

  // Orbit animation - using Mapbox's recommended approach
  useEffect(() => {
    if (!isLoaded || !mapRef.current) return;

    const map = mapRef.current;

    function rotateCamera(timestamp: number) {
      if (!map.getContainer()) return;

      // Divide by larger number for slower rotation (300 = ~3.6 degrees/second)
      map.rotateTo((timestamp / 300) % 360, { duration: 0 });
      requestAnimationFrame(rotateCamera);
    }

    // Start rotation after a short delay
    const timeout = setTimeout(() => {
      requestAnimationFrame(rotateCamera);
    }, 500);

    return () => {
      clearTimeout(timeout);
      map.stop();
    };
  }, [isLoaded, mapRef]);

  useEffect(() => {
    if (!sectionRef.current || !logoRef.current || !buttonRef.current || !mapWrapperRef.current) return;

    const section = sectionRef.current;
    const logo = logoRef.current;
    const button = buttonRef.current;
    const mapWrapper = mapWrapperRef.current;

    // Set initial states
    gsap.set([logo, mapWrapper, button], { opacity: 0, y: 30 });

    // Create animation timeline
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: "top bottom-=20%",
        end: "center center",
        scrub: true,
      },
    });

    tl.to(logo, {
      opacity: 1,
      y: 0,
      ease: ANIMATION_EASE.SMOOTH,
      duration: 1,
    })
    .to(
      mapWrapper,
      {
        opacity: 1,
        y: 0,
        ease: ANIMATION_EASE.SMOOTH,
        duration: 1,
      },
      "-=0.5"
    )
    .to(
      button,
      {
        opacity: 1,
        y: 0,
        ease: ANIMATION_EASE.SMOOTH,
        duration: 1,
      },
      "-=0.5"
    );

    return () => {
      tl.kill();
    };
  }, []);

  return (
    <section ref={sectionRef} className="cta-section">
      <div className="cta-section__content">
        <div ref={logoRef} className="cta-section__logo">
          <img
            src="/Logo.svg"
            alt="Christie's Logo"
            width={200}
            height={67}
          />
        </div>
        <div ref={mapWrapperRef} className="cta-section__map-wrapper">
          <div ref={mapContainerRef} className="cta-section__map" />
        </div>
        <button ref={buttonRef} className="cta-section__button">
          LEARN MORE
        </button>
      </div>
    </section>
  );
}
