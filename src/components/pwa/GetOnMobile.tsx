"use client";

import React from "react";
import Image from "next/image";
import { ArrowUpRight, Bell, Check, ChevronLeft, CircleCheck, Copy, Download, Ellipsis, EllipsisVertical, Menu, Share, Smartphone, SquarePlus } from "lucide-react";
import { useTranslation } from "@/context/LanguageContext";
import { Sheet } from "@/components/editorial/Sheet";
import { detectDevice, installSteps, type Device, type InstallStep } from "@/lib/installGuide.mjs";

type Phone = "ios" | "android";
type InstallPrompt = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };
export const GET_THE_APP_HASH = "#get-the-app";

/** Landing section + guided setup. Anyone can open it; nothing is installed or asked without a tap. */
export function GetOnMobileSection() {
  const { t } = useTranslation();
  const [open, setOpen] = React.useState(false);
  const [device, setDevice] = React.useState<Device>({ os: "desktop", browser: "other", inApp: null, installed: false });
  const [installPrompt, setInstallPrompt] = React.useState<InstallPrompt | null>(null);

  React.useEffect(() => {
    const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
    setDevice(detectDevice(navigator.userAgent, { maxTouchPoints: navigator.maxTouchPoints, standalone }));
    const onPrompt = (event: Event) => { event.preventDefault(); setInstallPrompt(event as InstallPrompt); };
    window.addEventListener("beforeinstallprompt", onPrompt);
    // intimo.live/#get-the-app (e.g. from a social bio) opens the guide straight away.
    const onHash = () => { if (window.location.hash === GET_THE_APP_HASH) setOpen(true); };
    onHash();
    window.addEventListener("hashchange", onHash);
    return () => { window.removeEventListener("beforeinstallprompt", onPrompt); window.removeEventListener("hashchange", onHash); };
  }, []);

  return (
    <section id="get-the-app" className="mt-8 scroll-mt-24 grid overflow-hidden rounded-2xl border border-velora-line bg-velora-surface lg:grid-cols-2" aria-labelledby="get-the-app-title">
      <div className="p-7 sm:p-10 lg:p-14">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-velora-accent">{t("On your phone")}</p>
        <h2 id="get-the-app-title" className="mt-4 font-display text-4xl leading-tight sm:text-5xl">{t("Intimo on your home screen.")}</h2>
        <p className="mt-5 max-w-lg leading-relaxed text-velora-ink2">{t("No app store, nothing to download. Add Intimo to your phone in under a minute: it opens full-screen like an app, and the icon only says “Intimo”.")}</p>
        <ul className="mt-6 space-y-3 text-sm text-velora-ink">
          {["Opens like an app, full-screen", "Discreet notifications: never names or messages", "Works on iPhone and Android"].map((line) => (
            <li key={line} className="flex items-center gap-3"><Check className="h-4 w-4 shrink-0 text-velora-accent" aria-hidden />{t(line)}</li>
          ))}
        </ul>
        {device.installed ? (
          <p className="mt-8 inline-flex min-h-14 items-center gap-2 rounded-xl border border-velora-line px-6 font-semibold text-velora-ink"><CircleCheck className="h-5 w-5 text-velora-accent" aria-hidden />{t("You're already using the app on this phone.")}</p>
        ) : (
          <button type="button" onClick={() => setOpen(true)} className="mt-8 inline-flex min-h-14 items-center justify-center gap-2 rounded-xl bg-velora-accent px-8 text-base font-semibold text-velora-paper transition hover:bg-velora-accentHover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-velora-accent">
            <Smartphone className="h-5 w-5 shrink-0" aria-hidden />{t("Get it on your phone")}
          </button>
        )}
        <p className="mt-4 text-sm text-velora-muted">{t("Free. Takes about a minute.")}</p>
      </div>
      <div className="relative flex min-h-72 items-center justify-center bg-velora-night p-10">
        <HomeScreenArt />
      </div>
      <InstallGuide open={open} onClose={() => { setOpen(false); if (window.location.hash === GET_THE_APP_HASH) history.replaceState(null, "", window.location.pathname + window.location.search); }} device={device} installPrompt={installPrompt} onInstalled={() => setInstallPrompt(null)} />
    </section>
  );
}

function InstallGuide({ open, onClose, device, installPrompt, onInstalled }: { open: boolean; onClose: () => void; device: Device; installPrompt: InstallPrompt | null; onInstalled: () => void }) {
  const { t } = useTranslation();
  const [phone, setPhone] = React.useState<Phone | null>(null);
  const [index, setIndex] = React.useState(0);
  const close = React.useCallback(() => { onClose(); setPhone(null); setIndex(0); }, [onClose]);
  const steps = phone ? installSteps(phone, device, { canPrompt: Boolean(installPrompt) }) : [];
  const step = steps[index];
  const last = index === steps.length - 1;

  const footer = phone ? (
    <div className="flex items-center justify-between gap-3">
      <button type="button" onClick={() => (index === 0 ? setPhone(null) : setIndex(index - 1))} className="inline-flex min-h-12 items-center gap-1 rounded-xl px-3 text-sm font-semibold text-velora-ink2 hover:text-velora-ink">
        <ChevronLeft className="h-4 w-4" aria-hidden />{t("Back")}
      </button>
      <button type="button" onClick={() => (last ? close() : setIndex(index + 1))} className="inline-flex min-h-12 flex-1 items-center justify-center rounded-xl bg-velora-accent px-6 text-base font-semibold text-velora-paper hover:bg-velora-accentHover sm:flex-none">
        {last ? t("Done") : t("Next")}
      </button>
    </div>
  ) : undefined;

  return (
    <Sheet open={open} onClose={close} label="Get Intimo on your phone" footer={footer}>
      {!phone ? (
        <ChoosePhone device={device} onChoose={(choice) => { setPhone(choice); setIndex(0); }} />
      ) : (
        <div>
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-velora-accent">{phone === "ios" ? "iPhone" : "Android"}</p>
            <p className="text-sm font-semibold text-velora-muted" aria-live="polite">{t("Step {current} of {total}", { current: index + 1, total: steps.length })}</p>
          </div>
          <div className="mt-3 flex gap-1.5" aria-hidden>
            {steps.map((id, i) => <span key={id} className={`h-1 flex-1 rounded-full ${i <= index ? "bg-velora-accent" : "bg-velora-line"}`} />)}
          </div>
          <StepView key={step} step={step} phone={phone} device={device} installPrompt={installPrompt} onInstalled={() => { onInstalled(); setIndex(index + 1); }} />
        </div>
      )}
    </Sheet>
  );
}

function ChoosePhone({ device, onChoose }: { device: Device; onChoose: (phone: Phone) => void }) {
  const { t } = useTranslation();
  const options: { phone: Phone; name: string; hint: string }[] = [
    { phone: "ios", name: "iPhone", hint: "Made by Apple" },
    { phone: "android", name: "Android", hint: "Samsung, Google Pixel, Xiaomi, Motorola and most others" },
  ];
  return (
    <div>
      <h2 className="font-display text-3xl leading-tight">{t("Which phone do you have?")}</h2>
      <p className="mt-2 text-velora-ink2">{t("We'll show you exactly where to tap.")}</p>
      <div className="mt-6 grid gap-3">
        {options.map((option) => {
          const thisOne = device.os === option.phone;
          return (
            <button key={option.phone} type="button" onClick={() => onChoose(option.phone)} className={`flex min-h-20 items-center gap-4 rounded-2xl border p-4 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-velora-accent ${thisOne ? "border-velora-accent bg-velora-accent/[0.06]" : "border-velora-line hover:border-velora-ink/40"}`}>
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-velora-night text-velora-onPhoto"><Smartphone className="h-6 w-6" aria-hidden /></span>
              <span className="min-w-0 flex-1">
                <span className="block text-lg font-semibold text-velora-ink">{option.name}</span>
                <span className="block text-sm text-velora-muted">{t(option.hint)}</span>
              </span>
              {thisOne && <span className="shrink-0 rounded-full bg-velora-accent px-3 py-1 text-xs font-bold text-velora-paper">{t("This phone")}</span>}
            </button>
          );
        })}
      </div>
      <p className="mt-5 text-sm text-velora-muted">{t("Not sure? If there's an apple on the back, it's an iPhone.")}</p>
    </div>
  );
}

function StepView({ step, phone, device, installPrompt, onInstalled }: { step: InstallStep; phone: Phone; device: Device; installPrompt: InstallPrompt | null; onInstalled: () => void }) {
  const { t } = useTranslation();
  const app = device.inApp || "this app";
  const copy: Record<InstallStep, { title: string; body: string; vars?: Record<string, string> }> = {
    "open-on-iphone": { title: "Open intimo.live on your iPhone", body: "Open Safari on your iPhone, go to intimo.live and tap “Get it on your phone” there. Or copy the link and send it to yourself." },
    "open-on-android": { title: "Open intimo.live on your Android phone", body: "Open Chrome on your phone, go to intimo.live and tap “Get it on your phone” there. Or copy the link and send it to yourself." },
    "leave-app-ios": { title: "First, open this page in Safari", body: "You're browsing inside {app}, which can't add Intimo to your home screen. Tap ⋯ or the compass icon and choose “Open in Safari” or “Open in browser”.", vars: { app } },
    "leave-app-android": { title: "First, open this page in Chrome", body: "You're browsing inside {app}, which can't add Intimo to your home screen. Tap ⋮ and choose “Open in Chrome” or “Open in browser”.", vars: { app } },
    "switch-to-safari": { title: "Switch to Safari", body: "On iPhone, Safari is the surest way to add Intimo. Copy the link, open Safari and paste it into the address bar." },
    "switch-to-chrome": { title: "Switch to Chrome", body: "On Android, Chrome is the surest way to add Intimo. Copy the link, open Chrome and paste it into the address bar." },
    "ios-share": { title: "Tap the Share button", body: "It's the square with an arrow pointing up, in Safari's bar at the bottom. Don't see it? Tap ⋯ first, then Share." },
    "ios-add": { title: "Tap “Add to Home Screen”", body: "Scroll down the list a little until you see it." },
    "ios-confirm": { title: "Tap “Add”", body: "Keep the name “Intimo” and tap Add in the top-right corner. If you see “Open as Web App”, leave it switched on." },
    "android-one-tap": { title: "Tap “Install Intimo”", body: "Your phone can install Intimo in one tap. When Android asks, tap Install." },
    "android-menu": { title: "Tap the ⋮ menu", body: "It's the three dots in the top-right corner of Chrome." },
    "android-install": { title: "Tap “Install app” or “Add to Home screen”", body: "Then tap Install. If Chrome asks whether to make a shortcut or install, choose Install." },
    "samsung-menu": { title: "Tap the ☰ menu", body: "It's the three lines at the bottom right of Samsung Internet." },
    "samsung-add": { title: "Tap “Add page to”, then “Home screen”", body: "Then tap Add." },
    "open-from-icon": { title: "Open Intimo from your home screen", body: "Find the icon that says only “Intimo” and open it from there from now on. It runs full-screen, like any app." },
    notifications: { title: "Turn on discreet notifications", body: "In the app, sign in, open the You tab and tap “Allow discreet notifications”. They only ever say “Intimo”, never names or messages." },
  };
  const content = copy[step];
  const needsLink = ["open-on-iphone", "open-on-android", "leave-app-ios", "leave-app-android", "switch-to-safari", "switch-to-chrome"].includes(step);

  return (
    <div className="mt-5">
      {/* Instruction first, so it's never below the fold; the drawing shows where. */}
      <h2 className="font-display text-2xl leading-tight">{t(content.title)}</h2>
      <p className="mt-2 leading-relaxed text-velora-ink2">{t(content.body, content.vars)}</p>
      <div className="mt-4 flex justify-center rounded-2xl bg-velora-night py-4"><CompactArt><StepArt step={step} phone={phone} /></CompactArt></div>
      {needsLink && <CopyLink />}
      {step === "android-one-tap" && installPrompt && (
        <button type="button" onClick={async () => { await installPrompt.prompt(); const choice = await installPrompt.userChoice; if (choice.outcome === "accepted") onInstalled(); }} className="mt-4 inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-xl bg-velora-accent px-6 text-base font-semibold text-velora-paper hover:bg-velora-accentHover">
          <Download className="h-5 w-5" aria-hidden />{t("Install Intimo")}
        </button>
      )}
      {step === "notifications" && phone === "ios" && <p className="mt-3 text-sm text-velora-muted">{t("On iPhone, notifications only work when you open Intimo from the home-screen icon.")}</p>}
    </div>
  );
}

function CopyLink() {
  const { t } = useTranslation();
  const [copied, setCopied] = React.useState(false);
  const link = typeof window === "undefined" ? "https://intimo.live" : `${window.location.origin}/${GET_THE_APP_HASH}`;
  async function copyLink() {
    try { await navigator.clipboard.writeText(link); setCopied(true); window.setTimeout(() => setCopied(false), 2500); } catch { setCopied(false); }
  }
  return (
    <div className="mt-4 flex items-center gap-2 rounded-xl border border-velora-line p-2 pl-4">
      <span className="min-w-0 flex-1 truncate text-sm font-semibold text-velora-ink">{link.replace(/^https?:\/\//, "")}</span>
      <button type="button" onClick={copyLink} className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-lg border border-velora-control px-4 text-sm font-semibold text-velora-ink hover:border-velora-accent">
        {copied ? <Check className="h-4 w-4 text-velora-accent" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}{copied ? t("Copied") : t("Copy link")}
      </button>
    </div>
  );
}

/* ── Illustrations: a simple phone with the one thing to tap lit in ice. ───────── */

function Lit({ children, label }: { children: React.ReactNode; label?: string }) {
  return (
    <span className="relative inline-flex items-center justify-center">
      <span aria-hidden className="absolute -inset-1.5 rounded-full ring-2 ring-velora-accent motion-safe:animate-pulse" />
      <span className="relative inline-flex items-center gap-1 text-velora-accent">{children}{label && <span className="text-[9px] font-bold">{label}</span>}</span>
    </span>
  );
}

/** Scales the phone drawing down inside the sheet so the whole step fits on a small screen. */
function CompactArt({ children }: { children: React.ReactNode }) {
  return <div className="h-48 w-[6.75rem]"><div className="origin-top-left scale-75">{children}</div></div>;
}

function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div aria-hidden className="relative h-64 w-36 overflow-hidden rounded-[26px] border-2 border-velora-onPhoto/25 bg-velora-paper text-velora-onPhoto/70 shadow-2xl">
      <div className="mx-auto mt-1.5 h-1.5 w-10 rounded-full bg-velora-onPhoto/20" />
      {children}
    </div>
  );
}

function PageLines() {
  return (
    <div className="space-y-2 px-3 pt-4">
      <div className="h-2.5 w-16 rounded bg-velora-onPhoto/30" />
      <div className="h-16 rounded-lg bg-velora-onPhoto/10" />
      <div className="h-1.5 w-24 rounded bg-velora-onPhoto/15" />
      <div className="h-1.5 w-20 rounded bg-velora-onPhoto/15" />
    </div>
  );
}

function MenuSheet({ rows, lit, position }: { rows: string[]; lit: number; position: "bottom" | "top" }) {
  const { t } = useTranslation();
  return (
    <div className={`absolute inset-x-2 space-y-1 rounded-xl bg-velora-surface p-2 text-[9px] font-semibold text-velora-ink ${position === "bottom" ? "bottom-2" : "right-2 top-7 left-8"}`}>
      {rows.map((row, i) => (
        <div key={row} className={`flex items-center justify-between rounded-md px-2 py-1.5 ${i === lit ? "bg-velora-accent/15 text-velora-accent ring-1 ring-velora-accent" : ""}`}>
          {t(row)}{i === lit && (position === "bottom" ? <SquarePlus className="h-3 w-3" /> : <Download className="h-3 w-3" />)}
        </div>
      ))}
    </div>
  );
}

function StepArt({ step, phone }: { step: InstallStep; phone: Phone }) {
  const { t } = useTranslation();
  const safariBar = (lit: boolean) => (
    <div className="absolute inset-x-0 bottom-0 flex items-center justify-around border-t border-velora-onPhoto/10 bg-velora-surface px-2 pb-3 pt-2">
      <ChevronLeft className="h-3.5 w-3.5" />
      {lit ? <Lit><Share className="h-4 w-4" /></Lit> : <Share className="h-3.5 w-3.5" />}
      <Ellipsis className="h-3.5 w-3.5" />
    </div>
  );
  const chromeBar = (lit: boolean) => (
    <div className="flex items-center gap-2 bg-velora-surface px-2 py-1.5">
      <div className="h-4 flex-1 rounded-full bg-velora-onPhoto/10 px-2 text-[8px] leading-4">intimo.live</div>
      {lit ? <Lit><EllipsisVertical className="h-4 w-4" /></Lit> : <EllipsisVertical className="h-3.5 w-3.5" />}
    </div>
  );
  switch (step) {
    case "open-on-iphone":
    case "open-on-android":
    case "switch-to-safari":
    case "switch-to-chrome":
      return <PhoneFrame><div className="flex items-center gap-2 bg-velora-surface px-2 py-1.5"><Lit><span className="h-4 rounded-full px-2 text-[9px] font-bold leading-4">intimo.live</span></Lit></div><PageLines />{phone === "ios" && safariBar(false)}</PhoneFrame>;
    case "leave-app-ios":
    case "leave-app-android":
      return <PhoneFrame><div className="flex items-center justify-between bg-velora-surface px-2 py-1.5 text-[9px]"><span>✕</span><span className="truncate">intimo.live</span><Lit>{phone === "ios" ? <Ellipsis className="h-4 w-4" /> : <EllipsisVertical className="h-4 w-4" />}</Lit></div><PageLines /><MenuSheet rows={["Copy link", phone === "ios" ? "Open in Safari" : "Open in Chrome"]} lit={1} position="bottom" /></PhoneFrame>;
    case "ios-share":
      return <PhoneFrame><PageLines />{safariBar(true)}</PhoneFrame>;
    case "ios-add":
      return <PhoneFrame><PageLines /><MenuSheet rows={["Copy", "Add to Reading List", "Add to Home Screen"]} lit={2} position="bottom" /></PhoneFrame>;
    case "ios-confirm":
      return <PhoneFrame><div className="flex items-center justify-between bg-velora-surface px-2 py-2 text-[9px] font-semibold"><span>{t("Cancel")}</span><Lit><span className="font-bold">{t("Add")}</span></Lit></div><div className="flex items-center gap-2 px-3 pt-4"><Image src="/icons/apple-touch-icon.png" alt="" width={32} height={32} className="rounded-lg" /><span className="text-[10px] font-semibold text-velora-ink">Intimo</span></div><PageLines /></PhoneFrame>;
    case "android-one-tap":
      return <PhoneFrame>{chromeBar(false)}<PageLines /><div className="absolute inset-x-2 bottom-3 rounded-xl bg-velora-surface p-2 text-[9px]"><div className="flex items-center gap-2"><Image src="/icons/icon-192.png" alt="" width={20} height={20} className="rounded-md" /><span className="font-semibold text-velora-ink">Intimo</span></div><div className="mt-2 flex justify-end"><Lit><span className="font-bold">{t("Install")}</span></Lit></div></div></PhoneFrame>;
    case "android-menu":
      return <PhoneFrame>{chromeBar(true)}<PageLines /></PhoneFrame>;
    case "android-install":
      return <PhoneFrame>{chromeBar(false)}<PageLines /><MenuSheet rows={["New tab", "Bookmarks", "Install app"]} lit={2} position="top" /></PhoneFrame>;
    case "samsung-menu":
      return <PhoneFrame><PageLines /><div className="absolute inset-x-0 bottom-0 flex items-center justify-around bg-velora-surface px-2 pb-3 pt-2"><ChevronLeft className="h-3.5 w-3.5" /><span className="h-3 w-3 rounded border border-current" /><Lit><Menu className="h-4 w-4" /></Lit></div></PhoneFrame>;
    case "samsung-add":
      return <PhoneFrame><PageLines /><MenuSheet rows={["Bookmarks", "Add page to", "Home screen"]} lit={2} position="bottom" /></PhoneFrame>;
    case "open-from-icon":
      return <PhoneFrame><HomeGrid lit /></PhoneFrame>;
    case "notifications":
      return <PhoneFrame><div className="px-3 pt-5"><div className="rounded-xl bg-velora-surface p-2 text-[9px]"><div className="flex items-center gap-1.5 font-semibold text-velora-ink"><Image src="/icons/icon-192.png" alt="" width={14} height={14} className="rounded" />Intimo</div><p className="mt-1">{t("Someone wrote to you.")}</p></div><div className="mt-6 flex justify-center"><Lit><span className="flex items-center gap-1 text-[9px] font-bold"><Bell className="h-3.5 w-3.5" />{t("Allow")}</span></Lit></div></div></PhoneFrame>;
  }
}

function HomeGrid({ lit = false }: { lit?: boolean }) {
  return (
    <div className="grid grid-cols-3 gap-3 px-3 pt-6">
      {Array.from({ length: 9 }, (_, i) => i === 4 ? (
        <div key={i} className="flex flex-col items-center gap-1">
          {lit ? <Lit><Image src="/icons/apple-touch-icon.png" alt="" width={28} height={28} className="rounded-lg" /></Lit> : <Image src="/icons/apple-touch-icon.png" alt="" width={28} height={28} className="rounded-lg" />}
          <span className="text-[8px] font-semibold text-velora-onPhoto">Intimo</span>
        </div>
      ) : (
        <div key={i} className="flex flex-col items-center gap-1"><span className="h-7 w-7 rounded-lg bg-velora-onPhoto/10" /><span className="h-1 w-6 rounded bg-velora-onPhoto/10" /></div>
      ))}
    </div>
  );
}

function HomeScreenArt() {
  const { t } = useTranslation();
  return (
    <div className="flex items-center gap-8">
      <PhoneFrame><HomeGrid lit /></PhoneFrame>
      <div className="hidden max-w-[11rem] space-y-3 text-sm text-velora-onPhoto/85 sm:block">
        <p className="flex items-center gap-2"><Smartphone className="h-4 w-4 text-velora-accent" aria-hidden />{t("Your home screen")}</p>
        <p className="leading-relaxed">{t("Just the overlap and “Intimo”. Nothing that gives anything away.")}</p>
        <a href={GET_THE_APP_HASH} className="inline-flex items-center gap-1 font-semibold text-velora-onPhoto underline underline-offset-4">{t("How it works")}<ArrowUpRight className="h-4 w-4" aria-hidden /></a>
      </div>
    </div>
  );
}
