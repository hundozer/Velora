// "Get Intimo on your phone": which phone and browser the visitor is on, and which
// steps they need. Pure functions so every path is testable.

/**
 * @param {string} ua navigator.userAgent
 * @param {{ maxTouchPoints?: number, standalone?: boolean }} [env]
 */
export function detectDevice(ua = "", env = {}) {
  const text = String(ua);
  // iPadOS 13+ reports a Mac user agent; touch points give it away.
  const ios = /iPhone|iPad|iPod/i.test(text) || (/Macintosh/i.test(text) && (env.maxTouchPoints || 0) > 1);
  const android = !ios && /Android/i.test(text);
  /** In-app browsers (social apps) can't add anything to the home screen. */
  let inApp = null;
  if (/Instagram/i.test(text)) inApp = "Instagram";
  else if (/FBAN|FBAV|FB_IAB/i.test(text)) inApp = "Facebook";
  else if (/BytedanceWebview|musical_ly|TikTok/i.test(text)) inApp = "TikTok";
  else if (/Snapchat/i.test(text)) inApp = "Snapchat";
  else if (/Twitter/i.test(text)) inApp = "X";
  else if (/LinkedInApp/i.test(text)) inApp = "LinkedIn";
  else if (/Messenger|MessengerForiOS/i.test(text)) inApp = "Messenger";
  else if (/WhatsApp/i.test(text)) inApp = "WhatsApp";
  else if (/Telegram/i.test(text)) inApp = "Telegram";
  else if (/Line\//.test(text)) inApp = "LINE";
  else if (android && /; wv\)/.test(text)) inApp = "app";

  let browser = "other";
  if (ios) browser = /CriOS/i.test(text) ? "chrome" : /FxiOS/i.test(text) ? "firefox" : /EdgiOS/i.test(text) ? "edge" : /OPiOS|OPT\//i.test(text) ? "opera" : inApp ? "other" : "safari";
  else if (android) browser = /SamsungBrowser/i.test(text) ? "samsung" : /Firefox/i.test(text) ? "firefox" : /EdgA/i.test(text) ? "edge" : /OPR|Opera/i.test(text) ? "opera" : /Chrome/i.test(text) && !inApp ? "chrome" : "other";

  return { os: ios ? "ios" : android ? "android" : "desktop", browser, inApp, installed: Boolean(env.standalone) };
}

/**
 * The steps for the phone the visitor picked. When they browse on a different
 * device (a laptop), the guide starts by getting them onto the phone.
 * @param {"ios" | "android"} phone what the visitor chose
 * @param {{ os: string, browser: string, inApp: string | null }} device what they're browsing on
 * @param {{ canPrompt?: boolean }} [options] Android Chrome offered a one-tap install
 */
export function installSteps(phone, device, options = {}) {
  const onThatPhone = device.os === phone;
  const steps = [];
  if (!onThatPhone) steps.push(phone === "ios" ? "open-on-iphone" : "open-on-android");
  else if (device.inApp) steps.push(phone === "ios" ? "leave-app-ios" : "leave-app-android");
  else if (phone === "ios" && device.browser !== "safari") steps.push("switch-to-safari");
  else if (phone === "android" && !["chrome", "samsung", "edge"].includes(device.browser)) steps.push("switch-to-chrome");

  if (phone === "ios") steps.push("ios-share", "ios-add", "ios-confirm", "open-from-icon");
  else if (onThatPhone && !device.inApp && options.canPrompt) steps.push("android-one-tap", "open-from-icon");
  else if (onThatPhone && device.browser === "samsung") steps.push("samsung-menu", "samsung-add", "open-from-icon");
  else steps.push("android-menu", "android-install", "open-from-icon");
  steps.push("notifications");
  return steps;
}
