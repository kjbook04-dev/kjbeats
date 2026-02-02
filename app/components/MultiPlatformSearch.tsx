'use client';

import { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { gradientBgStyle } from '../context/themeHelpers';

interface UniversalSearchResult {
  id: string;
  title: string;
  artist: string;
  platform: 'youtube' | 'spotify' | 'soundcloud';
  thumbnail: string;
  playableUrl?: string;
  externalUrl?: string;
  available: boolean;
  reason?: string;
}

export default function MultiPlatformSearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<UniversalSearchResult[]>([]);
  const [currentPlaying, setCurrentPlaying] = useState<string | null>(null);
  const { currentTheme } = useTheme();
  const gBg = gradientBgStyle();

  const searchAllPlatforms = async (query: string) => {
    if (!query.trim()) return;

    // Simulate multi-platform search
    const mockResults: UniversalSearchResult[] = [
      // YouTube results (may be geo-blocked)
      {
        id: 'yt-1',
        title: 'GOOSEBUMPS - Travis Scott ft. Kendrick Lamar',
        artist: 'Travis Scott',
        platform: 'youtube',
        thumbnail: 'https://i.ytimg.com/vi/Srv3qoDMVGI/mqdefault.jpg',
        available: false,
        reason: 'Not available in your country',
        externalUrl: 'https://youtube.com/watch?v=Srv3qoDMVGI'
      },
      // SoundCloud alternatives (often work)
      {
        id: 'sc-1',
        title: 'GOOSEBUMPS - Travis Scott (SoundCloud)',
        artist: 'Travis Scott',
        platform: 'soundcloud',
        thumbnail: 'https://via.placeholder.com/300x300/ff6600/white?text=SC',
        available: true,
        externalUrl: 'https://soundcloud.com/travisscott/goosebumps'
      },
      // Spotify (preview only)
      {
        id: 'sp-1',
        title: 'GOOSEBUMPS',
        artist: 'Travis Scott',
        platform: 'spotify',
        thumbnail: 'https://via.placeholder.com/300x300/1db954/white?text=Spotify',
        available: true,
        externalUrl: 'https://open.spotify.com/track/6gBFPUFcJLzWGx4lenP6h2'
      },
      // Working YouTube alternatives
      {
        id: 'yt-2',
        title: 'GOOSEBUMPS - Travis Scott (Cover)',
        artist: 'Various Artists',
        platform: 'youtube',
        thumbnail: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/mqdefault.jpg',
        playableUrl: 'dQw4w9WgXcQ',
        available: true
      }
    ];

    setResults(mockResults.filter(result => 
      result.title.toLowerCase().includes(query.toLowerCase()) ||
      result.artist.toLowerCase().includes(query.toLowerCase())
    ));
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'youtube': return '📺';
      case 'spotify': return '🎵';
      case 'soundcloud': return '🔊';
      default: return '🎶';
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case 'youtube': return 'bg-red-600';
      case 'spotify': return 'bg-green-600';
      case 'soundcloud': return 'bg-orange-600';
      default: return 'bg-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={(e) => { e.preventDefault(); searchAllPlatforms(searchQuery); }}>
        <div className="flex space-x-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search across YouTube, Spotify, and SoundCloud..."
            className="flex-1 px-4 py-2 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-pink-500 focus:outline-none"
          />
          <button
            type="submit"
            className={`px-6 py-2 rounded-lg text-white font-medium transition-all duration-300 hover:scale-105 shadow-lg`}
            style={gBg}
          >
            Search All
          </button>
        </div>
      </form>

      {results.length > 0 && (
        <div>
          <h3 className="text-white text-lg font-semibold mb-4">
            Results from Multiple Platforms
          </h3>
          <div className="space-y-3">
            {results.map((result) => (
              <div key={result.id} className="bg-gray-800 rounded-lg overflow-hidden">
                {currentPlaying === result.id && result.playableUrl ? (
                  <div className="p-2 bg-gray-900 rounded">
                    <p className="text-white text-sm">Playing on site player</p>
                    <div className="mt-2">
                      <button
                        onClick={() => {
                          setCurrentPlaying(null);
                          try { if ((window as any).playerTogglePlay) (window as any).playerTogglePlay(); } catch (e) {}
                        }}
                        className="px-3 py-1 bg-red-600 text-white rounded"
                      >
                        Stop
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center space-x-4 p-4">
                    <img
                      src={result.thumbnail}
                      alt={result.title}
                      className="w-16 h-16 object-cover rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-white font-semibold truncate">{result.title}</h4>
                      <p className="text-gray-400 text-sm truncate">{result.artist}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={`inline-block px-2 py-1 text-xs rounded text-white ${getPlatformColor(result.platform)}`}>
                          {getPlatformIcon(result.platform)} {result.platform.toUpperCase()}
                        </span>
                        {!result.available && (
                          <span className="text-red-400 text-xs">{result.reason}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {result.available && result.playableUrl ? (
                        <button
                          onClick={() => {
                            setCurrentPlaying(result.id);
                            try {
                              if (typeof (window as any).playTrack === 'function') {
                                (window as any).playTrack({ id: result.id, title: result.title, artist: result.artist, youtubeId: result.playableUrl, platform: 'youtube' });
                              }
                            } catch (e) { console.error(e); }
                          }}
                          className={`w-10 h-10 rounded-full flex items-center justify-center text-white transition-all duration-300 hover:scale-105 shadow-lg`}
                          style={gBg}
                          title="Play Song"
                        >
                          ▶️
                        </button>
                      ) : (
                        <a
                          href={result.externalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`px-4 py-2 rounded-lg text-white text-sm ${getPlatformColor(result.platform)} hover:opacity-80`}
                        >
                          Open in {result.platform}
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}