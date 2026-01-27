"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useLastPlayed } from './context/LastPlayedContext';
import { useTheme } from './context/ThemeContext';
// compact list UI on home page; reuse TrackList elsewhere
import { useMusicLibrary } from './context/MusicLibraryContext';
import { usePlaylist } from './context/PlaylistContext';
// All-in-one music search removed

export default function Home() {
  const { lastPlayed, playAudio, setCurrentSong, setIsPlaying } = useLastPlayed();
  const { currentTheme } = useTheme();
  const bgImage = lastPlayed?.coverUrl;
  const [pageBgColor, setPageBgColor] = useState<string>('transparent');
  const { songs } = useMusicLibrary();
  const { playlists } = usePlaylist();

  const handlePlayPlaylist = (playlist: any) => {
    if (!playlist.songs || playlist.songs.length === 0) {
      // nothing to play
      return;
    }

    const firstSong = playlist.songs[0];

    try {
      // prefer global playTrack (for local files)
      if (firstSong.audioUrl && (window as any).playTrack) {
        (window as any).playTrack!({
          title: firstSong.title,
          artist: firstSong.artist,
          audioUrl: firstSong.audioUrl,
          id: firstSong.id,
        });
        return;
      }

      if (playAudio) {
        playAudio(firstSong);
        return;
      }

      // fallback
      setCurrentSong(firstSong);
      setIsPlaying(true);
    } catch (e) {
      console.error('Failed to play playlist from home:', e);
    }
  };

  const handlePlaySong = (song: any) => {
    if (!song) return;
    try {
      if (song.audioUrl && (window as any).playTrack) {
        (window as any).playTrack!({
          title: song.title,
          artist: song.artist,
          audioUrl: song.audioUrl,
          id: song.id,
        });
        return;
      }

      if (playAudio) {
        playAudio(song);
        return;
      }

      setCurrentSong(song);
      setIsPlaying(true);
    } catch (e) {
      console.error('Failed to play song from home:', e);
    }
  };

  // helpers to compute total playlist duration (durations are strings like "3:45" or "1:02:30")
  const parseDurationToSeconds = (durStr: string) => {
    if (!durStr) return 0;
    const parts = durStr.split(':').map(p => parseInt(p, 10));
    if (parts.length === 3) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    }
    if (parts.length === 2) {
      return parts[0] * 60 + parts[1];
    }
    return parts[0] || 0;
  };

  const formatSeconds = (secs: number) => {
    if (secs >= 3600) {
      const h = Math.floor(secs / 3600);
      const m = Math.floor((secs % 3600) / 60).toString().padStart(2, '0');
      const s = Math.floor(secs % 60).toString().padStart(2, '0');
      return `${h}:${m}:${s}`;
    }
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  useEffect(() => {
    try {
      const color = getComputedStyle(document.body).backgroundColor;
      setPageBgColor(color || 'transparent');
    } catch (e) {
      // SSR safeguard
      setPageBgColor('transparent');
    }
  }, [bgImage]);
  return (
    <div
      className="min-h-screen"
      style={bgImage ? {
        backgroundImage: `url(${bgImage})`,
        backgroundPosition: 'center',
        backgroundSize: 'cover',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
        transition: 'background 0.5s',
      } : undefined}
    >
      {/* Hero Section */}
      <section className={bgImage ? "bg-black/70 py-20" : "bg-gray-900 py-20"}>
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className={`text-5xl font-bold mb-6 bg-gradient-to-r ${currentTheme.gradient} text-transparent bg-clip-text`}>Welcome to KJBeats</h1>
            <p className="text-gray-300 text-xl mb-8">
              Search popular music, save your favorites, and play full songs from multiple platforms.
            </p>
            <Link
              href="/popular"
              className={`bg-gradient-to-r ${currentTheme.gradientHover} text-gray-900 px-8 py-3 rounded-full font-semibold hover:scale-105 transition-all`}>
              Discover Music
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Sections */}
      <section className={bgImage ? "py-16 bg-black/70" : "py-16"}>
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-8 text-center">Featured Content</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Music Library */}
            <div className="bg-gray-800 rounded-lg shadow-md p-6 border border-gray-700 flex flex-col justify-between">
              <h3 className={`text-xl font-semibold mb-4 bg-gradient-to-r ${currentTheme.gradient} text-transparent bg-clip-text`}>Your Music Library</h3>
              <div className="flex-grow">
                {songs.length === 0 ? (
                  <div className={`${currentTheme.text} text-center py-8`}>No songs added yet.</div>
                ) : (
                  <div className="grid grid-cols-1 gap-3">
                    {songs.slice(0, 5).map((s: any) => (
                      <div key={s.id} className="bg-gray-900 p-4 rounded border border-gray-700">
                        <div className="flex items-center justify-between">
                          <div className="min-w-0">
                            <p className="text-white truncate font-medium">{s.title}</p>
                            <p className="text-gray-400 text-sm truncate">{s.artist}</p>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="text-gray-500 text-xs">{s.duration}</div>
                            <button
                              onClick={() => handlePlaySong(s)}
                              title={`Play ${s.title}`}
                              className={`w-8 h-8 rounded-full ${currentTheme.bg} ${currentTheme.bgHover} ${currentTheme.text} flex items-center justify-center hover:scale-105 transition-transform`}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-4 h-4" aria-hidden="true">
                                <path d="M5 3v18l15-9L5 3z" fill="currentColor" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                    {songs.length > 5 && (
                      <p className="text-gray-500 text-xs">+{songs.length - 5} more songs</p>
                    )}
                  </div>
                )}
              </div>
              <div className="mt-4">
                <Link
                  href="/library"
                  className={`inline-block bg-gradient-to-r ${currentTheme.gradient} px-4 py-2 rounded-lg text-sm font-medium hover:scale-105 transition-all`}
                >
                  <span style={{ color: pageBgColor }}>View Library</span>
                </Link>
              </div>
            </div>

            {/* Playlists */}
            <div className="bg-gray-800 rounded-lg shadow-md p-6 border border-gray-700 flex flex-col justify-between">
              <h3 className={`text-xl font-semibold mb-4 bg-gradient-to-r ${currentTheme.gradient} text-transparent bg-clip-text`}>Playlists</h3>
              <div className="flex-grow">
                {playlists.length === 0 ? (
                  <div className={`${currentTheme.text} text-center py-8`}>No playlists yet.</div>
                ) : (
                  <div className="grid grid-cols-1 gap-3">
                    {playlists.slice(0, 5).map((pl) => {
                      // compute total duration
                      const totalSecs = (pl.songs || []).reduce((acc: number, s: any) => acc + parseDurationToSeconds(s.duration || ''), 0);
                      const totalStr = formatSeconds(totalSecs);
                      return (
                        <div key={pl.id} className="bg-gray-900 p-4 rounded border border-gray-700">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className={`font-medium ${currentTheme.text}`}>{pl.title}</h4>
                              {pl.description && <p className="text-gray-400 text-sm">{pl.description}</p>}
                              <p className="text-gray-500 text-xs mt-1">{pl.songs.length} songs • {totalStr}</p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handlePlayPlaylist(pl)}
                                title={`Play ${pl.title}`}
                                className={`w-8 h-8 rounded-full ${currentTheme.bg} ${currentTheme.bgHover} ${currentTheme.text} flex items-center justify-center hover:scale-105 transition-transform`}
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-4 h-4" aria-hidden="true">
                                  <path d="M5 3v18l15-9L5 3z" fill="currentColor" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              <div className="mt-4">
                <Link
                  href="/playlists"
                  className={`inline-block bg-gradient-to-r ${currentTheme.gradient} px-4 py-2 rounded-lg text-sm font-medium hover:scale-105 transition-all`}
                >
                  <span style={{ color: pageBgColor }}>View All Playlists</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Last Played */}
          <div className="mt-12">
            <h2 className={`text-3xl font-bold mb-6 text-center bg-gradient-to-r ${currentTheme.gradient} text-transparent bg-clip-text`}>Last Played</h2>
            <div className="max-w-4xl mx-auto">
              <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 text-center">
                {lastPlayed ? (
                  <div>
                    <h3 className={`text-xl font-semibold ${currentTheme.text}`}>{lastPlayed.title}</h3>
                    <p className="text-gray-400">{lastPlayed.artist}</p>
                    <div className="mt-4">
                      <button
                        onClick={() => {
                          if (!lastPlayed) return;
                          if (playAudio) {
                            playAudio(lastPlayed);
                          } else {
                            setCurrentSong(lastPlayed);
                            setIsPlaying(true);
                          }
                        }}
                        className={`inline-block bg-gradient-to-r ${currentTheme.gradient} text-gray-900 px-4 py-2 rounded-lg text-sm font-medium hover:scale-105 transition-all`}
                      >
                        Play
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-400">No recently played songs.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );

}
