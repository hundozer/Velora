"use client";

import { useEffect, useSyncExternalStore } from "react";

// Lets a page with a dark, full-bleed opening (People → Introductions) ask the bottom
// navigation to use its dark variant while that opening is on screen.
type Tone = "light" | "dark";
let tone: Tone = "light";
const listeners = new Set<() => void>();

function setTone(next: Tone) {
  if (tone === next) return;
  tone = next;
  listeners.forEach((listener) => listener());
}

export function useNavTone(): Tone {
  return useSyncExternalStore((listener) => { listeners.add(listener); return () => listeners.delete(listener); }, () => tone, () => "light");
}

/** While `dark` is true (and the component is mounted) the bottom navigation is dark. */
export function useDarkNav(dark: boolean) {
  useEffect(() => {
    setTone(dark ? "dark" : "light");
    return () => setTone("light");
  }, [dark]);
}
