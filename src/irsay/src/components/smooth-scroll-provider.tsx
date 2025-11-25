
import { useEffect, useRef } from "react";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function SmoothScrollProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    // Initialize Lenis immediately - no need to wait for entrance animation
    const lenis = new Lenis({
      lerp: 0.12,
      smoothWheel: true,
    });
    lenisRef.current = lenis;

    // Sync ScrollTrigger with Lenis' scroll updates
    lenis.on("scroll", ScrollTrigger.update);

    // Ensure GSAP animations are in sync with Lenis' scroll frame updates
    gsap.ticker.add((time) => {
      lenis.raf(time * 1000); // Convert GSAP's time to milliseconds for Lenis
    });

    // Turn off GSAP's default lag smoothing to avoid conflicts with Lenis
    gsap.ticker.lagSmoothing(0);

    return () => {
      lenisRef.current?.destroy();
    };
  }, []);

  return <>{children}</>;
}
