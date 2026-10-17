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
  title: "Intimo | Prague's private, sex-positive network",
  description:
    "Intimo is a free, members-only network for adults in Prague: share your desires and boundaries, see who's out tonight, and keep private photos for people you choose.",
  metadataBase: new URL("https://intimo.live"),
  applicationName: "Intimo",
  appleWebApp: { capable: true, title: "Intimo", statusBarStyle: "black-translucent" },
  icons: { icon: "/icons/icon-192.png", apple: "/icons/apple-touch-icon.png" },
  keywords: [
    "Prague sex-positive",
    "private adult network Prague",
    "swingers Prague",
    "kink community Prague",
    "couples Prague",
    "intimo live",
  ],
  openGraph: {
    title: "Intimo — Prague's private, sex-positive network",
    description: "Free and members-only. Desires, boundaries, plans for tonight and the Prague scene.",
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
