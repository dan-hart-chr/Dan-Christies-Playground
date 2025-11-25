import { useEffect, useRef } from "react";
import { gsap } from "gsap";

export function useGSAPContext<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const ctxRef = useRef<gsap.Context | null>(null);

  useEffect(() => {
    return () => {
      ctxRef.current?.revert();
      ctxRef.current = null;
    };
  }, []);

  return { ref, ctxRef };
}
