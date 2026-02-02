'use client';

import { useState, useEffect } from 'react';
import type { Song } from '../types/music';
import AddToPlaylist from './AddToPlaylist';
import { useLastPlayed } from '../context/LastPlayedContext';
import { useMusicLibrary } from '../context/MusicLibraryContext';
import { useTheme } from '../context/ThemeContext';
import { gradientTextStyle } from '../context/themeHelpers';

interface PlayTrackData {
  name: string;
  artist: string;
  album: string;
  url: string;
  coverUrl?: string;
  songId: string;
}

interface WindowWithPlayTrack extends Window {
  playTrack?: (trackData: PlayTrackData) => void;
}

export default function TrackList({ songs }: { songs?: Song[] }) {
  const [allSongs, setAllSongs] = useState<Song[]>([]);
  const { currentSong, setCurrentSong, isPlaying, setIsPlaying, togglePlay, playAudio } = useLastPlayed();
  const { songs: librarySongs } = useMusicLibrary();
  const { currentTheme } = useTheme();
  const gText = gradientTextStyle();

  useEffect(() => {
    // If songs prop is provided, use it; otherwise use library songs
    if (songs) {
      setAllSongs(songs);
    } else {
      setAllSongs(librarySongs);
    }
  }, [songs, librarySongs]);

  const displaySongs = songs || allSongs;
  const [search, setSearch] = useState('');
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);

  // Filter songs by title or artist
  const filteredSongs = displaySongs.filter(
    (s) =>
      s.title.toLowerCase().includes(search.toLowerCase()) ||
      s.artist.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="mb-6">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by title or artist..."
          className={`w-full px-4 py-2 rounded-lg bg-gray-900 border ${currentTheme.border} text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-${currentTheme.primary.split(' ')[0]}`}
        />
      </div>
      <div className="grid grid-cols-1 gap-4">
        {filteredSongs.length === 0 ? (
          <div className={`${currentTheme.text} text-center py-8`}>No tracks found.</div>
        ) : (
          filteredSongs.map((s) => (
            <div
              key={s.id}
              className={`p-4 rounded-lg border ${currentSong?.id === s.id ? `${currentTheme.border} bg-gray-900` : 'border-gray-700 bg-gray-800'}`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className={`font-medium`} style={gText}>{s.title}</h4>
                  <p className="text-gray-300 text-sm">{s.artist}</p>
                  {s.uploadedBy && (
                    <p className="text-gray-400 text-xs">Uploaded by {s.uploadedBy}</p>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                    <span className="text-gray-300 text-sm">{s.duration}</span>
                  <button
                    onClick={() => {
                      const isThisPlaying = !!currentSong && currentSong.id === s.id && isPlaying;

                      if (isThisPlaying) {
                        // If the shared toggle is available use it so the PersistentPlayer
                        // handles the actual audio element; otherwise fall back to setting
                        // isPlaying to false which will also pause the player.
                        if (togglePlay) togglePlay();
                        else setIsPlaying(false);
                        return;
                      }

                      console.log('🔥 TrackList play button clicked for:', s.title, 'ID:', s.id);

                      // Prefer global playTrack shim for local file support
                      if ((window as WindowWithPlayTrack).playTrack && s.audioUrl) {
                        const trackData = {
                          name: s.title,
                          artist: s.artist,
                          album: 'Unknown Album',
                          url: s.audioUrl,
                          coverUrl: s.coverUrl,
                          songId: s.id,
                        };
                        (window as WindowWithPlayTrack).playTrack!(trackData);
                        setCurrentSong(s);
                        setIsPlaying(true);
                        return;
                      }

                      // Prefer the context-backed player if available
                      if (playAudio) {
                        try {
                          playAudio(s);
                        } catch (e) {
                          console.error('TrackList: playAudio failed', e);
                          setCurrentSong(s);
                          setIsPlaying(true);
                        }
                        return;
                      }

                      // Last resort: set the song and mark playing
                      setCurrentSong(s);
                      setIsPlaying(true);
                    }}
                      className={`w-8 h-8 rounded-full ${currentTheme.bg} text-gray-300 font-bold ${currentTheme.bgHover} flex items-center justify-center`}
                  >
                    {currentSong?.id === s.id && isPlaying ? '❚❚' : '▶'}
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {selectedSong && (
        <AddToPlaylist
          song={selectedSong}
          onClose={() => setSelectedSong(null)}
        />
      )}
    </div>
  );
}
