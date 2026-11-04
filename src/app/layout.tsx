import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const DESCRIPTION = "Keep track of every concert you're going to and every one you've been to.";

export const metadata: Metadata = {
  // TODO: set NEXT_PUBLIC_SITE_URL once Riffstub has a real domain — used
  // to build absolute URLs for shared social preview images. Falls back to
  // localhost so nothing breaks in the meantime.
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "Riffstub — track your concerts",
    template: "%s — Riffstub",
  },
  description: DESCRIPTION,
  openGraph: {
    title: "Riffstub",
    description: DESCRIPTION,
    siteName: "Riffstub",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Riffstub",
    description: DESCRIPTION,
  },
};

// Behave like an app rather than a web page, mainly for the Android app
// (a Trusted Web Activity): no pinch/double-tap zoom, and the on-screen
// keyboard shrinks the layout instead of sliding over the focused field.
// Android's accessibility "force enable zoom" setting still overrides this.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  interactiveWidget: "resizes-content",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <NavBar />
        <main className="flex flex-1 flex-col">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
