// SoundCloud Integration - Often has songs that YouTube blocks
'use client';

import { useState } from 'react';

interface SoundCloudTrack {
  id: number;
  title: string;
  user: { username: string };
  artwork_url: string | null;
  stream_url: string;
  permalink_url: string;
}

export default function SoundCloudSearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const [tracks, setTracks] = useState<SoundCloudTrack[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const searchSoundCloud = async (query: string) => {
    if (!query.trim()) return;

    setIsSearching(true);
    try {
      // SoundCloud API call would go here
      // For now, showing structure - requires SoundCloud API key
      const response = await fetch(`/api/soundcloud/search?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      setTracks(data.tracks || []);
    } catch (error) {
      console.error('SoundCloud search failed:', error);
      // Fallback to curated list
      setTracks([]);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={(e) => { e.preventDefault(); searchSoundCloud(searchQuery); }}>
        <div className="flex space-x-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search SoundCloud (often has songs YouTube blocks)..."
            className="flex-1 px-4 py-2 bg-gray-800 text-white rounded-lg"
          />
          <button
            type="submit"
            disabled={isSearching}
            className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
          >
            {isSearching ? 'Searching...' : 'Search SoundCloud'}
          </button>
        </div>
      </form>

      <div className="text-gray-400 text-sm">
        💡 SoundCloud often has songs that are geo-blocked on YouTube, including covers and remixes.
      </div>
    </div>
  );
}