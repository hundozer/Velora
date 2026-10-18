// Discreet mode (P1-14) is a per-device setting: it protects against someone
// glancing at this screen, so it lives in this browser rather than the account.
export const DISCREET_STORAGE_KEY = "intimo:discreet";
export const DISCREET_TITLE = "Notes";
export const DISCREET_EVENT = "intimo:discreet-change";

export function readDiscreet(): boolean {
  try { return window.localStorage.getItem(DISCREET_STORAGE_KEY) === "on"; } catch { return false; }
}

export function writeDiscreet(on: boolean) {
  try { window.localStorage.setItem(DISCREET_STORAGE_KEY, on ? "on" : "off"); } catch { /* private window: applies to this tab only */ }
  window.dispatchEvent(new CustomEvent(DISCREET_EVENT, { detail: on }));
}
