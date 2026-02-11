import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "./components/Header";
import Footer from "./components/Footer";
import { LastPlayedProvider } from "./context/LastPlayedContext";
import { PlaylistProvider } from "./context/PlaylistContext";
import { MusicLibraryProvider } from "./context/MusicLibraryContext";
import { UserProvider } from "./context/UserContext";
import { ThemeProvider } from "./context/ThemeContext";
import EarlyUniversalShim from './components/EarlyUniversalShim';
import PersistentPlayer from './components/PersistentPlayer';
import { DynamicFavicon } from "./components/DynamicFavicon";
import ClientErrorReporter from './components/ClientErrorReporter';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "KJBeats",
  description: "Your ultimate destination for music exploration",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3001"),
  openGraph: {
    title: "KJBeats",
    description: "Your ultimate destination for music exploration",
    type: "website",
    siteName: "KJBeats",
  },
  twitter: {
    card: "summary_large_image",
    title: "KJBeats",
    description: "Your ultimate destination for music exploration",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col bg-gray-800`}
      >
        <UserProvider>
          <EarlyUniversalShim />
          <ThemeProvider>
            <DynamicFavicon />
            <LastPlayedProvider>
             <PlaylistProvider>
              <MusicLibraryProvider>
                <ClientErrorReporter />
                <Header />
                <main className="flex-grow pb-20">
                  {children}
                </main>
                <Footer />
                <PersistentPlayer />
              </MusicLibraryProvider>
             </PlaylistProvider>
            </LastPlayedProvider>
          </ThemeProvider>
        </UserProvider>
      </body>
    </html>
  );
}
