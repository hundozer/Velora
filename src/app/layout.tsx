import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { MobileNavigation } from "@/components/layout/MobileNavigation";
import { AgeVerificationModal } from "@/components/common/AgeVerificationModal";

export const metadata: Metadata = {
  title: "Velora | Private Verified Adult Social Marketplace",
  description:
    "Velora is a private, verified adult social platform combining modern dating UX, private communities, creator economy, and verified adult networking.",
  keywords: [
    "private social club",
    "adult social marketplace",
    "verified adult network",
    "creator monetization",
    "discreet dating",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-velora-bg text-velora-textPrimary min-h-screen flex flex-col selection:bg-velora-gold/30 selection:text-velora-gold pb-16 md:pb-0">
        <AuthProvider>
          <Navbar />
          <AgeVerificationModal />
          <main className="flex-1 w-full">{children}</main>
          <MobileNavigation />
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
