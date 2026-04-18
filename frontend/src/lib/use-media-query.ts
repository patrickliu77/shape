import { useEffect, useState } from "react";

// Subscribe to a CSS media-query so React re-renders when it flips.
// Used to mount only ONE ExplainPanel at a time (desktop side panel vs
// mobile bottom sheet) — otherwise both stay mounted and their <audio>
// elements both load the same MP3, causing overlapping playback.
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(() => {
    if (typeof window === "undefined" || !window.matchMedia) return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mql = window.matchMedia(query);
    const update = () => setMatches(mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, [query]);

  return matches;
}
