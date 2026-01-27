'use client';

import { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { gradientTextStyle, gradientBgStyle } from '../context/themeHelpers';

interface LibrarySong {
  id: string;
  source: 'youtube' | 'soundcloud' | 'hosted';
  externalId: string;
  title: string;
  artist: string;
  thumbnail: string;
  duration?: number;
  addedBy: string;
  addedAt: string;
  playCount: number;
  approved: boolean;
}

export default function LibraryPage() {
  const [library, setLibrary] = useState<LibrarySong[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPlaying, setCurrentPlaying] = useState<string | null>(null);
  const { currentTheme } = useTheme();
  const hasMultiStop = !!currentTheme.backgroundCss;
  const gText = hasMultiStop ? gradientTextStyle() : {};
  const gBg = hasMultiStop ? gradientBgStyle() : {};

  useEffect(() => {
    fetchLibrary();
  }, []);

  const fetchLibrary = async () => {
    try {
      const response = await fetch('/api/library');
      const data = await response.json();
      setLibrary(data.songs || []);
    } catch (error) {
      console.error('Failed to fetch library:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeSong = async (songId: string) => {
    if (!confirm('Remove this song from the library?')) return;
    
    try {
      const response = await fetch(`/api/library?id=${songId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setLibrary(library.filter(song => song.id !== songId));
      } else {
        alert('Failed to remove song');
      }
    } catch (error) {
      console.error('Remove song error:', error);
      alert('Failed to remove song');
    }
  };

  const handlePlay = async (song: LibrarySong) => {
    setCurrentPlaying(song.externalId);
    
    // Attempt to play via global playTrack (legacy) or PersistentPlayer
    try {
      if (typeof (window as any).playTrack === 'function') {
        (window as any).playTrack({
          id: song.id,
          title: song.title,
          artist: song.artist,
          youtubeId: song.externalId,
          platform: 'youtube'
        });
      } else if (typeof (window as any).playerTogglePlay === 'function') {
        // Some older shims expose toggles; calling it may start playback.
        (window as any).playerTogglePlay();
      }
    } catch (err) {
      console.error('Play invocation failed', err);
    }

    // Increment play count
    try {
      await fetch(`/api/library/play?id=${song.id}`, { method: 'POST' });
      // Update local state
      setLibrary(library.map(s => 
        s.id === song.id ? { ...s, playCount: s.playCount + 1 } : s
      ));
    } catch (error) {
      console.error('Failed to update play count:', error);
    }
  };

  const filteredLibrary = library.filter(song =>
    song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    song.artist.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 py-8">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center h-64">
            <div className="text-white text-xl">Loading library...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold mb-2" style={gText}>
            Music Library
          </h1>
          <p className="text-gray-400 mb-8">
            Your saved songs from YouTube and other sources. {library.length} songs in library.
          </p>

          {/* Search */}
          <div className="mb-8">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search your library..."
              className="w-full max-w-md px-4 py-2 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-pink-500 focus:outline-none"
            />
          </div>

          {filteredLibrary.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-gray-400 text-xl mb-4">
                {library.length === 0 ? 'Your library is empty' : 'No songs match your search'}
              </div>
              {library.length === 0 && (
                <p className="text-gray-500 mb-6">
                  Search for songs and click &quot;Save to Library&quot; to build your collection!
                </p>
              )}
              <a
                href="/popular"
                className={`inline-block text-white px-6 py-3 rounded-lg font-medium hover:scale-105 transition-all`}
                style={gBg}
              >
                Browse Popular Music
              </a>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredLibrary.map((song) => (
                <div key={song.id} className="bg-gray-800 rounded-lg overflow-hidden">
                  {currentPlaying === song.externalId ? (
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <img
                            src={song.thumbnail}
                            alt={song.title}
                            className="w-12 h-12 object-cover rounded"
                          />
                          <div>
                            <h3 className="text-white font-semibold">{song.title}</h3>
                            <p className={`${(song.artist === 'Local Upload' || (song as any).audioUrl && (song as any).audioUrl.startsWith('blob:')) ? 'text-gray-300' : 'text-gray-400'} text-sm`}>{song.artist}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-400">
                          <span>{song.playCount} plays</span>
                          <button
                            onClick={() => removeSong(song.id)}
                            className="text-red-400 hover:text-red-300"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                      {song.source === 'youtube' && (
                        <div className="p-4 bg-gray-900 rounded">
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
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center space-x-4 p-4">
                      <img
                        src={song.thumbnail}
                        alt={song.title}
                        className="w-16 h-16 object-cover rounded"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-semibold truncate">{song.title}</h3>
                        <p className={`${(song.artist === 'Local Upload' || (song as any).audioUrl && (song as any).audioUrl.startsWith('blob:')) ? 'text-gray-300' : 'text-gray-400'} text-sm truncate`}>{song.artist}</p>
                        <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                          <span>{song.playCount} plays</span>
                          <span>Added {new Date(song.addedAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => removeSong(song.id)}
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white transition-all duration-300 bg-red-600 hover:bg-red-700 hover:scale-105"
                          title="Remove from Library"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handlePlay(song)}
                          className={`w-10 h-10 rounded-full flex items-center justify-center text-white transition-all duration-300 bg-gradient-to-r ${currentTheme.gradient} hover:scale-105 shadow-lg`}
                          title="Play Song"
                        >
                          <svg className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}