import { useEffect, useRef, useCallback, useState } from "react";
import type Splitting from "splitting";

type SplittingBy = "chars" | "words" | "lines";

interface UseSplittingOptions {
  by?: SplittingBy;
  onReady?: () => void;
}

export function useSplitting<T extends HTMLElement>(
  byOrOptions: SplittingBy | UseSplittingOptions = "chars"
) {
  const options = typeof byOrOptions === "string"
    ? { by: byOrOptions }
    : byOrOptions;

  const { by = "chars", onReady } = options;

  const ref = useRef<T>(null);
  const isInitialized = useRef(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!ref.current || isInitialized.current) return;

    import("splitting")
      .then((SplittingModule) => {
        const Splitting = SplittingModule.default;
        if (ref.current) {
          Splitting({ target: ref.current, by });
          isInitialized.current = true;
          setIsReady(true);
          onReady?.();
        }
      })
      .catch((error) => {
        console.error("Failed to load Splitting:", error);
      });
  }, [by, onReady]);

  return { ref, isReady };
}
