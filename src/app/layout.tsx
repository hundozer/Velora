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

export const metadata: Metadata = {
  title: "Intimo | Prague's sex-positive community",
  description:
    "Kinky. Curious. Welcome. A free sex-positive community for adults in Prague. Find your people, share your desires and keep your boundaries.",
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
    title: "Intimo — Kinky. Curious. Welcome.",
    description: "Prague's sex-positive community. Different desires, shared respect. Free to join. Strictly 18+.",
    url: "https://intimo.live",
    siteName: "Intimo",
    type: "website",
  },
};

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
  return (
    <html lang="en">
      <body className="antialiased bg-intimo-bg text-intimo-textPrimary min-h-screen flex flex-col selection:bg-intimo-gold/30 selection:text-intimo-gold pb-16 md:pb-0">
        <LanguageProvider>
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
