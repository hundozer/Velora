import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { LanguageProvider } from "@/context/LanguageContext";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { MobileNavigation } from "@/components/layout/MobileNavigation";
import { AgeVerificationModal } from "@/components/common/AgeVerificationModal";
import { CookieConsent } from "@/components/privacy/CookieConsent";
import { ServiceWorkerRegistration } from "@/components/pwa/ServiceWorkerRegistration";

export const metadata: Metadata = {
  title: "Intimo | Adults-Only Social Discovery",
  description:
    "Intimo is a free adults-only social discovery platform for consenting adults seeking compatible social, casual, dating and erotic experiences.",
  metadataBase: new URL("https://intimo.live"),
  applicationName: "Intimo",
  appleWebApp: { capable: true, title: "Intimo", statusBarStyle: "black-translucent" },
  icons: { icon: "/icons/icon-192.png", apple: "/icons/apple-touch-icon.png" },
  keywords: [
    "private social club",
    "adult social discovery",
    "verified adult network",
    "free creator profiles",
    "discreet dating",
    "intimo live",
  ],
  openGraph: {
    title: "Intimo — Private Members Club After Dark",
    description: "Free adults-only social discovery and creator community.",
    url: "https://intimo.live",
    siteName: "Intimo",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0A0B0E",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-intimo-bg text-intimo-textPrimary min-h-screen flex flex-col selection:bg-intimo-gold/30 selection:text-intimo-gold pb-16 md:pb-0">
        <LanguageProvider>
          <AuthProvider>
            <Navbar />
            <AgeVerificationModal />
            <CookieConsent />
            <main className="flex-1 w-full">{children}</main>
            <MobileNavigation />
            <Footer />
          </AuthProvider>
        </LanguageProvider>
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
