import React from "react"
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { StoreHydration } from "@/components/game/store-hydration";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Tower Battle - Card Game",
  description:
    "A premium tower-battle card game with strategic deck building and real-time arena combat.",
};

export const viewport: Viewport = {
  themeColor: "#172319",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params?: Promise<Record<string, string | string[]>>;
}>) {
  // Next.js 15: params is a Promise; unwrap so it isn't enumerated as sync
  if (params) await params;

  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans antialiased min-h-dvh">
        <StoreHydration />
        {children}
      </body>
    </html>
  );
}
