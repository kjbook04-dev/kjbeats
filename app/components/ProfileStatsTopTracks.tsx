'use client';

import React, { useMemo, useEffect, useState } from 'react';
import { useMusicLibrary } from '../context/MusicLibraryContext';
import { useLastPlayed } from '../context/LastPlayedContext';
import { useTheme } from '../context/ThemeContext';

export const ProfileStatsTopTracks: React.FC = () => {
  const { songs } = useMusicLibrary();
  const { setCurrentSong, setIsPlaying, playAudio } = useLastPlayed();
  const { currentTheme } = useTheme();
  const [pageBgColor, setPageBgColor] = useState<string>('transparent');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const bg = getComputedStyle(document.body).backgroundColor || getComputedStyle(document.documentElement).backgroundColor;
      setPageBgColor(bg);
    }
  }, []);

  const counts = useMemo(() => {
    try {
      const raw = localStorage.getItem('kjbeats_play_counts') || '{}';
      return JSON.parse(raw);
    } catch (e) {
      return {};
    }
  }, []);

  const tracksWithCounts = songs.map(song => ({
    song,
    count: counts[song.id] || 0
  }));

  tracksWithCounts.sort((a, b) => b.count - a.count || a.song.title.localeCompare(b.song.title));

  const top5 = tracksWithCounts.slice(0, 5);

  const handlePlay = (song: typeof songs[number]) => {
    // Prefer context playAudio if available
    try {
      if (playAudio) {
        playAudio(song);
      } else if (window && (window as any).playTrack) {
        (window as any).playTrack({ id: song.id, name: song.title, url: song.audioUrl, artist: song.artist, duration: song.duration });
      } else {
        // Fallback to setting current song directly
        setCurrentSong(song);
        setIsPlaying(true);
      }
    } catch (e) {
      console.warn('Failed to play top track', e);
    }
  };

  if (songs.length === 0) {
    return (
      <div className="bg-gray-800 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-white mb-2">Top Tracks</h3>
        <p className="text-gray-400">No songs in your library yet. Upload some music to start tracking plays.</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 p-6 rounded-lg">
      <h3 className="text-lg font-semibold text-white mb-4">Top Tracks</h3>
      <div className="space-y-3">
        {top5.map(({ song, count }, idx) => (
          <div key={song.id} className="flex items-center justify-between p-3 bg-gray-700 rounded-md">
            <div>
              <div className="flex items-center space-x-3">
                <div className="text-white font-medium">{idx + 1}.</div>
                <div>
                  <div className="text-white font-medium">{song.title}</div>
                  <div className="text-gray-400 text-sm">{song.artist}</div>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="text-gray-300 text-sm">{count} plays</div>
                      <button
                        onClick={() => handlePlay(song)}
                        className={`${currentTheme.bg} ${currentTheme.bgHover} text-white px-2 py-1 rounded-md text-sm flex items-center justify-center gap-1 whitespace-nowrap`}
                        title={`Play ${song.title}`}
                        aria-label={`Play ${song.title}`}
                      >
                        <span className="inline-flex items-center" style={{ transform: 'translateX(-4px)' }}>
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-4 h-4" aria-hidden="true">
                            <path d="M8 5v14l11-7z" fill={pageBgColor} />
                          </svg>
                        </span>
                        <span className="font-semibold text-sm" style={{ color: pageBgColor, marginLeft: '-3px' }}>Play</span>
                      </button>
            </div>
          </div>
        ))}
        {top5.length === 0 && (
          <div className="text-gray-400">No tracked plays yet.</div>
        )}
      </div>
    </div>
  );
};
