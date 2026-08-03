import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { LanguageProvider } from "@/context/LanguageContext";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { MobileNavigation } from "@/components/layout/MobileNavigation";
import { AgeVerificationModal } from "@/components/common/AgeVerificationModal";

export const metadata: Metadata = {
  title: "Intimo | Private Verified Adult Social Marketplace",
  description:
    "Intimo is a private, verified adult social platform combining modern dating UX, private communities, creator economy, and verified adult networking.",
  metadataBase: new URL("https://intimo.live"),
  keywords: [
    "private social club",
    "adult social marketplace",
    "verified adult network",
    "creator monetization",
    "discreet dating",
    "intimo live",
  ],
  openGraph: {
    title: "Intimo — Private Members Club After Dark",
    description: "Private verified adult social marketplace and creator network.",
    url: "https://intimo.live",
    siteName: "Intimo",
    type: "website",
  },
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
      </body>
    </html>
  );
}
