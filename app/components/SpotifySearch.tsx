// Spotify Integration Component
'use client';

import { useState, useEffect } from 'react';

interface SpotifyTrack {
  id: string;
  name: string;
  artists: { name: string }[];
  album: { name: string; images: { url: string }[] };
  preview_url: string | null;
  external_urls: { spotify: string };
}

export default function SpotifySearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const [tracks, setTracks] = useState<SpotifyTrack[]>([]);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  // Get Spotify access token (requires Spotify app credentials)
  useEffect(() => {
    const getAccessToken = async () => {
      try {
        const response = await fetch('/api/spotify/token', {
          method: 'POST',
        });
        const data = await response.json();
        setAccessToken(data.access_token);
      } catch (error) {
        console.error('Failed to get Spotify token:', error);
      }
    };

    getAccessToken();
  }, []);

  const searchSpotify = async (query: string) => {
    if (!accessToken || !query.trim()) return;

    try {
      const response = await fetch(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=20`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      const data = await response.json();
      setTracks(data.tracks?.items || []);
    } catch (error) {
      console.error('Spotify search failed:', error);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    searchSpotify(searchQuery);
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSearch} className="flex space-x-2">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search Spotify for any song..."
          className="flex-1 px-4 py-2 bg-gray-800 text-white rounded-lg"
        />
        <button
          type="submit"
          className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          Search Spotify
        </button>
      </form>

      <div className="space-y-3">
        {tracks.map((track) => (
          <div key={track.id} className="bg-gray-800 p-4 rounded-lg flex items-center space-x-4">
            {track.album.images[0] && (
              <img
                src={track.album.images[0].url}
                alt={track.album.name}
                className="w-16 h-16 rounded"
              />
            )}
            <div className="flex-1">
              <h4 className="text-white font-medium">{track.name}</h4>
              <p className="text-gray-400">{track.artists.map(a => a.name).join(', ')}</p>
              <p className="text-gray-500 text-sm">{track.album.name}</p>
            </div>
            <div className="flex space-x-2">
              {track.preview_url && (
                <audio controls className="w-48">
                  <source src={track.preview_url} type="audio/mpeg" />
                </audio>
              )}
              <a
                href={track.external_urls.spotify}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Open in Spotify
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}