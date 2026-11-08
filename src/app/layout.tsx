import type { Metadata, Viewport } from "next";
import "@fontsource/instrument-serif";
import "@fontsource/instrument-serif/400-italic.css";
import "@fontsource-variable/plus-jakarta-sans";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { LanguageProvider } from "@/context/LanguageContext";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { MobileNavigation } from "@/components/layout/MobileNavigation";
import { AgeVerificationModal } from "@/components/common/AgeVerificationModal";
import { ServiceWorkerRegistration } from "@/components/pwa/ServiceWorkerRegistration";
import { DiscreetMode } from "@/components/privacy/DiscreetMode";
import { serverLang, serverT } from "@/lib/i18n/server";

export function generateMetadata(): Metadata {
  const t = serverT();
  return {
    title: t("Intimo | Prague's sex-positive community"),
    description: t("Sex partners, dates and shared kinks. Intimo is Prague's free sex-positive community for adults. Say what turns you on and what is off limits."),
    metadataBase: new URL("https://intimo.live"),
    applicationName: "Intimo",
    appleWebApp: { capable: true, title: "Intimo", statusBarStyle: "black-translucent" },
    // Brand: "The overlap" (docs/brand/BRAND.md). SVG favicon first, PNG fallbacks.
    icons: {
      icon: [
        { url: "/icons/favicon.svg", type: "image/svg+xml" },
        { url: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" },
        { url: "/icons/favicon-16.png", sizes: "16x16", type: "image/png" },
      ],
      apple: "/icons/apple-touch-icon.png",
    },
    keywords: [
      "Prague sex-positive",
      "private adult network Prague",
      "swingers Prague",
      "kink community Prague",
      "couples Prague",
      "intimo live",
    ],
    openGraph: {
      title: t("Intimo — Kinky. Curious. Welcome."),
      description: t("Sex, dates, kink and consenting adults in Prague. Your yes. Your no. Free to join. Strictly 18+."),
      locale: serverLang() === "cs" ? "cs_CZ" : "en_GB",
      url: "https://intimo.live",
      siteName: "Intimo",
      type: "website",
    },
  };
}

export const viewport: Viewport = {
  themeColor: "#191C20",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Czech for visitors in the Czech Republic (or with a Czech browser) until they choose.
  const lang = serverLang();
  return (
    <html lang={lang}>
      <body className="antialiased bg-intimo-bg text-intimo-textPrimary min-h-screen flex flex-col selection:bg-intimo-gold/30 selection:text-intimo-gold pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0">
        <LanguageProvider initialLanguage={lang}>
          <AuthProvider>
            <Navbar />
            <AgeVerificationModal />
            <main className="flex-1 w-full">{children}</main>
            <MobileNavigation />
            <Footer />
          </AuthProvider>
        </LanguageProvider>
        <ServiceWorkerRegistration />
        <DiscreetMode />
      </body>
    </html>
  );
}
