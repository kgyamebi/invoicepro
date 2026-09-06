import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { getAppName, getAppTagline, getAppUrl } from "@/lib/utils";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const appName = getAppName();
const tagline = getAppTagline();

export const metadata: Metadata = {
  metadataBase: new URL(getAppUrl()),
  title: {
    default: `${appName} — ${tagline}`,
    template: `%s · ${appName}`,
  },
  description: tagline,
  openGraph: {
    title: appName,
    description: tagline,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: appName,
    description: tagline,
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full bg-bg text-ink">{children}</body>
    </html>
  );
}
