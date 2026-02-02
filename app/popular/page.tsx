"use client";

// All-in-one music search removed
import { useTheme } from '../context/ThemeContext';
import { gradientTextStyle } from '../context/themeHelpers';

export default function PopularMusicPage() {
  const { currentTheme } = useTheme();
  const gText = gradientTextStyle();

  return (
    <div className="min-h-screen bg-gray-900 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold mb-2" style={gText}>Popular Music</h1>
          <p className="text-gray-400 mb-8">
            Discover trending and popular tracks curated for you.
          </p>

          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <p className="text-gray-300">Search removed — use the site navigation to find music or upload your own.</p>
          </div>
        </div>
      </div>
    </div>
  );
}