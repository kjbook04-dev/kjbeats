'use client';

import React from 'react';
import Link from 'next/link';
import { useTheme } from '../../app/context/ThemeContext';

export default function FriendsPage() {
  const { currentTheme } = useTheme();

  return (
    <div className="p-8">
      <h1 className={`text-4xl font-bold mb-6 bg-gradient-to-r ${currentTheme.gradient} text-transparent bg-clip-text`}>Friends</h1>
      <p className="text-gray-300 mb-4">This is your friends area. Add or manage friends here.</p>

      <div className="bg-gray-800 p-6 rounded-md">
        <p className="text-gray-400">No friends yet. Invite friends to follow your activity and share playlists.</p>
        <div className="mt-4">
          <Link href="/profile" className={`${currentTheme.bg} text-gray-900 px-4 py-2 rounded-md font-medium ${currentTheme.bgHover} inline-block`}>
            Go to Profile → Add Friends
          </Link>
        </div>
      </div>
    </div>
  );
}
