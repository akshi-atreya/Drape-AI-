import type { Metadata, Viewport } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import { SessionProvider } from "next-auth/react";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { MobileTabBar } from "@/components/MobileTabBar";
import "./globals.css";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

export const metadata: Metadata = {
  title: "FitCast AI — Your Fashion Suggestion Friend",
  description:
    "Tell me the occasion. I'll design the look, you pick the pieces from any store, and FitCast AI shows you how it looks on you.",
};

// viewport-fit=cover lets the layout use the full screen on notched phones
// (the tab bar pads itself with env(safe-area-inset-bottom)); themeColor
// tints the browser/status bar to match the ivory background.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#f8f4ee",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${playfair.variable} ${inter.variable} h-full`}>
      <body className="min-h-full flex flex-col bg-ivory text-charcoal antialiased">
        <SessionProvider>
          <Nav />
          <main className="flex-1 flex flex-col">{children}</main>
          <Footer />
          <MobileTabBar />
        </SessionProvider>
      </body>
    </html>
  );
}
