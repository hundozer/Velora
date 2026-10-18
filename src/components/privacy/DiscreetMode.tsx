"use client";

import React from "react";
import { DISCREET_EVENT, DISCREET_TITLE, readDiscreet } from "@/lib/discreet";

/**
 * Applies discreet mode: a neutral tab title, and photos blurred until tapped.
 * The first tap on a blurred photo only reveals it; the next one follows links.
 */
export function DiscreetMode() {
  const [on, setOn] = React.useState(false);

  React.useEffect(() => {
    setOn(readDiscreet());
    const onChange = (event: Event) => setOn(Boolean((event as CustomEvent<boolean>).detail));
    window.addEventListener(DISCREET_EVENT, onChange);
    return () => window.removeEventListener(DISCREET_EVENT, onChange);
  }, []);

  React.useEffect(() => {
    const root = document.documentElement;
    if (!on) {
      delete root.dataset.discreet;
      document.querySelectorAll("[data-revealed]").forEach((element) => element.removeAttribute("data-revealed"));
      return;
    }
    root.dataset.discreet = "on";
    const original = document.title;
    const keepNeutral = () => { if (document.title !== DISCREET_TITLE) document.title = DISCREET_TITLE; };
    keepNeutral();
    const titleElement = document.querySelector("title");
    const observer = new MutationObserver(keepNeutral);
    if (titleElement) observer.observe(titleElement, { childList: true, characterData: true, subtree: true });
    const reveal = (event: MouseEvent) => {
      const media = (event.target as Element | null)?.closest?.("main img, main video");
      if (!media || media.hasAttribute("data-revealed")) return;
      event.preventDefault();
      event.stopPropagation();
      media.setAttribute("data-revealed", "1");
    };
    document.addEventListener("click", reveal, true);
    return () => {
      observer.disconnect();
      document.removeEventListener("click", reveal, true);
      document.title = original;
    };
  }, [on]);

  return null;
}
