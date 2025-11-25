
import { useEffect, useRef, useState, useMemo } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Hls from "hls.js";
import { useSplitting } from "@/hooks/useSplitting";
import { useMapbox, useMapFlyAnimation } from "@/hooks/useMapbox";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useGSAPContext } from "@/hooks/useGSAPContext";
import { LOCATIONS } from "@/constants/locations";
import { getWalkingTimeText } from "@/utils/distance";
import { ANIMATION_DURATIONS, ANIMATION_EASE } from "@/types/animations";
import type { Coordinates } from "@/types/animations";

gsap.registerPlugin(ScrollTrigger);

interface LocationSectionProps {
  location: keyof typeof LOCATIONS;
  title?: string | { main: string; sub: string };
  mainText?: string;
  bottomText: string;
  imageClassName?: string;
  videoUrl?: string;
  sectionClassName?: string;
}

export default function LocationSection({
  location,
  title,
  mainText,
  bottomText,
  imageClassName,
  videoUrl,
  sectionClassName = "dylan-title-section",
}: LocationSectionProps) {
  const { ref: sectionRef, ctxRef } = useGSAPContext<HTMLDivElement>();
  const imageRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const mapWrapperRef = useRef<HTMLDivElement>(null);
  const [startFly, setStartFly] = useState(false);
  const [allSplittingReady, setAllSplittingReady] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  // Track splitting readiness - adjust count based on what's present
  const expectedSplittingCount = title && mainText ? 3 : 1; // title + subtext + bottomText OR just bottomText
  const readyCountRef = useRef(0);
  const handleSplittingReady = () => {
    readyCountRef.current += 1;
    if (readyCountRef.current === expectedSplittingCount) {
      setAllSplittingReady(true);
    }
  };

  const { ref: titleRef, isReady: titleReady } = useSplitting<HTMLHeadingElement>({
    by: "chars",
    onReady: title ? handleSplittingReady : undefined,
  });
  const { ref: subtextRef, isReady: subtextReady } = useSplitting<HTMLParagraphElement>({
    by: "chars",
    onReady: mainText ? handleSplittingReady : undefined,
  });
  const { ref: textRef, isReady: textReady } = useSplitting<HTMLParagraphElement>({
    by: "chars",
    onReady: handleSplittingReady,
  });

  const locationCoords = LOCATIONS[location].coords;
  const christiesCoords = LOCATIONS.CHRISTIES_NYC.coords;

  const distanceText = useMemo(
    () => getWalkingTimeText(locationCoords, christiesCoords),
    [locationCoords, christiesCoords]
  );

  const mapMarkers = useMemo(
    () => [locationCoords, { ...christiesCoords, useChristiesLogo: true }],
    [locationCoords, christiesCoords]
  );

  const { mapContainerRef, mapRef } = useMapbox({
    center: locationCoords,
    showRoute: true,
    routeFrom: locationCoords,
    routeTo: christiesCoords,
    markers: mapMarkers,
  });

  useMapFlyAnimation(
    mapRef,
    locationCoords,
    christiesCoords,
    startFly && !prefersReducedMotion
  );

  // Video HLS setup
  useEffect(() => {
    if (!videoUrl || !videoRef.current) return;

    const video = videoRef.current;

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
      });

      hlsRef.current = hls;
      hls.loadSource(videoUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => {
          // Autoplay blocked - expected behavior
        });
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          console.error("HLS fatal error:", data);
        }
      });

      return () => {
        hls.destroy();
        hlsRef.current = null;
      };
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      // Native HLS support (Safari)
      video.src = videoUrl;
      video.play().catch(() => {
        // Autoplay blocked - expected behavior
      });
    }

    return () => {
      if (video.src) {
        video.pause();
        video.src = "";
        video.load();
      }
    };
  }, [videoUrl]);

  useEffect(() => {
    if (!sectionRef.current) return;

    // Set initial image state if using image background
    if (!videoUrl && imageRef.current) {
      gsap.set(imageRef.current, {
        scale: 0.3,
        opacity: 0,
        visibility: "visible",
        borderRadius: "20px",
      });
    }

    // Set initial video state if using video background
    if (videoUrl && videoRef.current) {
      gsap.set(videoRef.current, {
        scale: 0.3,
        opacity: 0,
        visibility: "visible",
        borderRadius: "20px",
      });
    }
  }, [sectionRef, videoUrl]);

  useEffect(() => {
    if (
      !allSplittingReady ||
      !sectionRef.current ||
      !textRef.current ||
      !mapWrapperRef.current
    ) {
      return;
    }

    // For video sections, wait for video ref; for image sections, wait for image ref
    if (videoUrl && !videoRef.current) return;
    if (!videoUrl && !imageRef.current) return;

    const section = sectionRef.current;
    const titleElement = titleRef.current;
    const subtextElement = subtextRef.current;
    const backgroundElement = videoUrl ? videoRef.current : imageRef.current;
    const textElement = textRef.current;
    const mapWrapper = mapWrapperRef.current;

    const textChars = textElement.querySelectorAll(".char");

    ctxRef.current = gsap.context(() => {
      // Set initial states
      gsap.set(textChars, { opacity: 0, y: 20, scale: 0.8 });
      gsap.set(mapWrapper, { opacity: 0, scale: 0.8 });

      // Control wrapper visibility
      const startTrigger = videoUrl ? "top top" : "60% top";
      ScrollTrigger.create({
        trigger: section,
        start: startTrigger,
        end: "bottom top",
        toggleClass: {
          targets: textElement.parentElement,
          className: "is-active",
        },
      });

      // Title animation - 3D perspective (only if title exists)
      if (titleElement) {
        const words = titleElement.querySelectorAll(".word");
        for (const word of words) {
          const chars = word.querySelectorAll(".char");
          chars.forEach((char) =>
            gsap.set(char.parentNode, { perspective: 2000 })
          );

          gsap.fromTo(
            chars,
            {
              opacity: 0,
              y: (position: number, _: unknown, arr: unknown[]) =>
                -40 * Math.abs(position - arr.length / 2),
              z: () => gsap.utils.random(-1500, -600),
              rotationX: () => gsap.utils.random(-500, -200),
            },
            {
              ease: ANIMATION_EASE.POWER1_IN_OUT,
              opacity: 1,
              y: 0,
              z: 0,
              rotationX: 0,
              stagger: {
                each: 0.06,
                from: "center",
              },
              scrollTrigger: {
                trigger: word,
                start: "top bottom",
                end: "center center",
                scrub: !prefersReducedMotion,
              },
            }
          );
        }
      }

      // Subtext animation (only if subtext exists)
      if (subtextElement) {
        const subtextChars = subtextElement.querySelectorAll(".char");
        gsap.fromTo(
          subtextChars,
          { opacity: 0, y: 20 },
          {
            opacity: 1,
            y: 0,
            stagger: 0.01,
            ease: ANIMATION_EASE.SMOOTH,
            scrollTrigger: {
              trigger: subtextElement,
              start: "top bottom-=10%",
              end: "top center",
              scrub: !prefersReducedMotion,
            },
          }
        );
      }

      // Animate map inline (appears after subtext)
      gsap.fromTo(
        mapWrapper,
        { opacity: 0, scale: 0.9, y: 30 },
        {
          opacity: 1,
          scale: 1,
          y: 0,
          ease: ANIMATION_EASE.SMOOTH,
          scrollTrigger: {
            trigger: mapWrapper,
            start: "top bottom",
            end: "top center",
            scrub: !prefersReducedMotion,
          },
        }
      );

      // Start map animation when visible
      ScrollTrigger.create({
        trigger: mapWrapper,
        start: "top bottom-=20%",
        onEnter: () => setStartFly(true),
        onLeaveBack: () => setStartFly(false),
      });

      // Background animation (video or image - same for both)
      gsap.fromTo(
        backgroundElement,
        { scale: 0.3, opacity: 0 },
        {
          scale: 1,
          opacity: 1,
          borderRadius: "0px",
          ease: ANIMATION_EASE.SMOOTH_IN_OUT,
          scrollTrigger: {
            trigger: section,
            start: "60% top",
            end: "80% top",
            scrub: ANIMATION_DURATIONS.BLUR_TRANSITION,
          },
        }
      );

      // Animate bottom text - appears with the image/video
      const textAnimStart = "65% top";
      const textAnimEnd = "85% top";

      gsap.to(textChars, {
        opacity: 1,
        y: 0,
        scale: 1,
        stagger: ANIMATION_DURATIONS.CHARACTER_STAGGER,
        ease: ANIMATION_EASE.SMOOTH,
        scrollTrigger: {
          trigger: section,
          start: textAnimStart,
          end: textAnimEnd,
          scrub: ANIMATION_DURATIONS.BLUR_TRANSITION,
        },
      });

      // EXIT animations - everything fades out together
      const exitStart = "90% top";
      const exitTimeline = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: exitStart,
          end: "bottom top",
          scrub: ANIMATION_DURATIONS.BLUR_TRANSITION,
        },
      });

      // Exit map first (scrolls away naturally)
      exitTimeline.to(
        mapWrapper,
        {
          opacity: 0,
          y: -30,
          scale: 0.95,
          ease: ANIMATION_EASE.SMOOTH_IN_OUT,
        },
        0
      );

      // Exit text
      exitTimeline.to(
        textElement,
        {
          opacity: 0,
          y: -50,
          ease: ANIMATION_EASE.SMOOTH_IN_OUT,
        },
        0.2
      );

      // Exit background element (image or video - same for both)
      exitTimeline.to(
        backgroundElement,
        {
          opacity: 0,
          scale: 1.1,
          ease: ANIMATION_EASE.SMOOTH_IN_OUT,
        },
        0.2
      );
    }, sectionRef);
  }, [
    allSplittingReady,
    sectionRef,
    titleRef,
    subtextRef,
    textRef,
    prefersReducedMotion,
    ctxRef,
    videoUrl,
  ]);

  const renderTitle = () => {
    if (!title) return null;
    if (typeof title === "string") {
      return <span className="dylan-title-section__title-main">{title}</span>;
    }
    return (
      <>
        <span className="dylan-title-section__title-main">{title.main}</span>
        <span className="dylan-title-section__title-sub">{title.sub}</span>
      </>
    );
  };

  return (
    <section ref={sectionRef} className={sectionClassName}>
      {/* Video background (fixed, just like image) */}
      {videoUrl && (
        <video
          ref={videoRef}
          className="dylan-title-section__image"
          loop
          muted
          playsInline
        />
      )}
      {/* Image background (fixed) */}
      {!videoUrl && (
        <div
          ref={imageRef}
          className={`dylan-title-section__image ${imageClassName || ""}`}
        />
      )}
      {/* Title, mainText, Map - same for both video and image */}
      {(title || mainText) && (
        <div className="dylan-title-section__content">
          {title && (
            <h2
              ref={titleRef}
              className="dylan-title-section__title"
              data-splitting
            >
              {renderTitle()}
            </h2>
          )}
          {mainText && (
            <p
              ref={subtextRef}
              className="dylan-title-section__subtext"
              data-splitting
            >
              {mainText}
            </p>
          )}
          {/* Divider before map */}
          <div className="dylan-title-section__divider">
            <img src="/divider.svg" alt="" />
          </div>
          {/* Map appears here after main text */}
          <div ref={mapWrapperRef} className="dylan-title-section__map-wrapper-inline">
            <div ref={mapContainerRef} className="dylan-title-section__map-inline" />
            <div className="dylan-title-section__map-overlay dylan-title-section__map-overlay--top">
              <div className="dylan-title-section__map-label-distance">
                {distanceText}
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Bottom text - same for both video and image */}
      <div className="dylan-title-section__bottom-content">
        <p
          ref={textRef}
          className="dylan-title-section__description"
          data-splitting
        >
          {bottomText}
        </p>
      </div>
    </section>
  );
}
