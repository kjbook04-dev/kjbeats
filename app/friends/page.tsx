"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTheme } from '../context/ThemeContext';
import { gradientTextStyle, gradientBgStyle } from '../context/themeHelpers';

export default function FriendsPage() {
  const { currentTheme } = useTheme();
  const [pageBgColor, setPageBgColor] = useState<string>('transparent');
  const hasMultiStop = !!currentTheme.backgroundCss;
  const gText = hasMultiStop ? gradientTextStyle() : {};
  const gBg = hasMultiStop ? gradientBgStyle() : {};

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const bg = getComputedStyle(document.body).backgroundColor || getComputedStyle(document.documentElement).backgroundColor;
      setPageBgColor(bg);
    }
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-6" style={gText}>Friends</h1>
      <div className="max-w-4xl mx-auto">
  {/* use the theme color (gradient if available) for the intro phrase */}
  <p className={`font-semibold mb-4`} style={hasMultiStop ? gText : undefined}>
    {!hasMultiStop ? (
      <span className={currentTheme.text}>This is your friends area. Add or manage friends here.</span>
    ) : (
      <>This is your friends area. Add or manage friends here.</>
    )}
  </p>

        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
          <p className="text-gray-300">No friends yet. Invite friends to follow your activity and share playlists.</p>
          <div className="mt-4">
            <Link
              href="/profile"
              className={`inline-block px-4 py-2 rounded-lg text-sm font-medium hover:scale-105 transition-all`}
              style={gBg}
            >
              <span style={{ color: pageBgColor }}>Go to Profile → Add Friends</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
