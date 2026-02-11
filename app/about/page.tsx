"use client";

import Link from "next/link";
import { useTheme } from "../context/ThemeContext";
import { gradientTextStyle } from "../context/themeHelpers";

export default function AboutPage() {
  const { currentTheme } = useTheme();
  const gText = gradientTextStyle();

  return (
    <div className="container mx-auto px-4 py-8">
  <h1 className="text-4xl font-bold mb-8" style={gText}>About KJBeats</h1>
      <div className="max-w-3xl mx-auto">
        <p className="text-gray-300 text-lg mb-6">
          Welcome to KJBeats, your ultimate destination for music exploration. We&apos;re passionate about 
          connecting people with the music they love and helping them discover new artists and sounds.
        </p>
        
  <h2 className="text-2xl font-bold mb-4" style={gText}>Our Mission</h2>
        <p className="text-gray-300 text-lg mb-6">
          Our mission is to create the most comprehensive and user-friendly music platform where fans 
          can discover, collect, and share their favorite music. We believe that music has the power 
          to bring people together and create meaningful connections.
        </p>

  <h2 className="text-2xl font-bold mb-4" style={gText}>What We Offer</h2>
        <ul className="list-disc list-inside text-lg mb-6 space-y-2 text-gray-300">
          <li>Curated playlists for every mood and occasion</li>
          <li>High-quality album streaming</li>
          <li>Community features for music lovers</li>
          <li>Personalized music recommendations</li>
        </ul>

        <div className="bg-gray-800 p-6 rounded-lg mt-8 border border-gray-700">
          <h2 className="text-2xl font-bold mb-4" style={gText}>Get in Touch</h2>
          <p className="text-gray-300 text-lg">
            Have questions or suggestions? We&apos;d love to hear from you. Reach out through our{" "}
            <Link href="/contact" className="transition-colors underline" style={gText}>
              Contact Us form
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
