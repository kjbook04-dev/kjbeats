'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { usePlaylist } from "../../context/PlaylistContext";
import { useTheme } from "../../context/ThemeContext";
import { Notification } from "../../components/Notification";
import type { Song } from "../../types/music";

interface WindowWithPlayTrack {
  playTrack?: (data: { title: string; artist: string; audioUrl: string; id: string }) => void;
}

export default function PlaylistDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { playlists, removeFromPlaylist, deletePlaylist } = usePlaylist();
  const { currentTheme } = useTheme();
  const [pageBgColor, setPageBgColor] = useState<string>('transparent');
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
    isVisible: boolean;
  }>({
    message: '',
    type: 'success',
    isVisible: false
  });
  
  const playlistId = params.id as string;
  const playlist = playlists.find(p => p.id === playlistId);

  if (!playlist) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🚫</div>
          <h2 className={`text-2xl font-bold mb-4 ${currentTheme.text}`}>Playlist Not Found</h2>
          <p className="text-gray-300 mb-6">
            The playlist you&apos;re looking for doesn&apos;t exist.
          </p>
          <button
            onClick={() => router.push('/playlists')}
            className={`${currentTheme.bg} text-gray-900 px-6 py-3 rounded-full font-semibold ${currentTheme.bgHover} transition-colors`}
          >
            Back to Playlists
          </button>
        </div>
      </div>
    );
  }

  // compute page background color for cutout icons
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const bg = getComputedStyle(document.body).backgroundColor || getComputedStyle(document.documentElement).backgroundColor;
      setPageBgColor(bg);
    }
  }, []);

  const handleDeletePlaylist = () => {
    if (confirm(`Are you sure you want to delete &quot;${playlist.title}&quot;? This action cannot be undone.`)) {
      deletePlaylist(playlist.id);
      router.push('/playlists');
    }
  };

  const handleRemoveSong = (songTitle: string, songId: string) => {
    removeFromPlaylist(playlist.id, songId);
    setNotification({
      message: `"${songTitle}" removed from playlist`,
      type: 'info',
      isVisible: true
    });
  };

  const hideNotification = () => {
    setNotification(prev => ({
      ...prev,
      isVisible: false
    }));
  };

  // Play function for local tracks
  const handlePlaySong = async (song: Song) => {
    try {
      // Try to play locally using the global playTrack function
      if (song.audioUrl && (window as WindowWithPlayTrack).playTrack) {
        const trackData = {
          title: song.title,
          artist: song.artist,
          audioUrl: song.audioUrl,
          id: song.id // Pass the song ID for file lookup
        };
        (window as WindowWithPlayTrack).playTrack!(trackData);
        setNotification({
          message: `Playing "${song.title}"`,
          type: 'success',
          isVisible: true
        });
      }
      // If no audio file is available
      else {
        setNotification({
          message: `Cannot play "${song.title}" - no audio file available`,
          type: 'error',
          isVisible: true
        });
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Playback failed:', error);
      setNotification({
        message: `Failed to play "${song.title}": ${errorMessage}`,
        type: 'error',
        isVisible: true
      });
    }
  };

  const handlePlayPlaylist = async () => {
    if (playlist && playlist.songs.length > 0) {
      const firstSong = playlist.songs[0];
      await handlePlaySong(firstSong);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={() => router.push('/playlists')}
          className={`${currentTheme.text} ${currentTheme.textHover} flex items-center space-x-2`}
        >
          <span>←</span>
          <span>Back to Playlists</span>
        </button>
        
        <button
          onClick={handleDeletePlaylist}
          className="text-red-400 hover:text-red-300 px-4 py-2 rounded-md border border-red-400 hover:border-red-300 transition-colors"
        >
          Delete Playlist
        </button>
      </div>

      <div className="mb-8">
        <h1 className={`text-4xl font-bold bg-gradient-to-r ${currentTheme.gradient} text-transparent bg-clip-text mb-2`}>
          {playlist.title}
        </h1>
        {playlist.description && (
          <p className="text-gray-400 text-lg mb-4">{playlist.description}</p>
        )}
        
        <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
                <p className="text-gray-300">
              {playlist.songs.length} {playlist.songs.length === 1 ? 'song' : 'songs'}
            </p>
            {playlist.songs.length > 0 && (
              <div className="flex items-center space-x-2 text-xs">
                <span className="text-gray-300 bg-blue-900/30 px-2 py-1 rounded">
                  {playlist.songs.length} Local
                </span>
              </div>
            )}
          </div>
          {playlist.songs.length > 0 && (
            <button
              onClick={handlePlayPlaylist}
              className={`${currentTheme.bg} text-gray-300 px-6 py-3 rounded-full font-semibold ${currentTheme.bgHover} transition-colors flex items-center space-x-2`}
            >
              <span>▶</span>
              <span>Play All</span>
            </button>
          )}
        </div>
      </div>

      {playlist.songs.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🎵</div>
          <h2 className={`text-2xl font-bold mb-4 ${currentTheme.text}`}>Empty Playlist</h2>
          <p className="text-gray-300 mb-6">
            This playlist doesn&apos;t have any songs yet.
          </p>
          <button
            onClick={() => router.push('/playlists')}
            className={`${currentTheme.bg} text-gray-900 px-6 py-3 rounded-full font-semibold ${currentTheme.bgHover} transition-colors`}
          >
            Add Songs
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {playlist.songs.map((song, index) => (
            <div key={song.id} className="flex items-center justify-between p-4 bg-gray-800 rounded-lg hover:bg-gray-750 transition-colors">
              <div className="flex items-center space-x-4">
                <span className="text-gray-400 font-mono text-sm w-8 text-center">
                  {(index + 1).toString().padStart(2, '0')}
                </span>
                <button
                  onClick={() => handlePlaySong(song)}
                  className={`text-gray-300 p-2 rounded-full transition-colors`}
                  title="Play this song locally"
                >
                  ▶
                </button>
                <div className="flex items-center space-x-3">
                  <div>
                    <h3 className="text-white font-semibold">{song.title}</h3>
                    <div className="flex items-center space-x-2">
                      <p className={`${(song.artist === 'Local Upload' || (song.audioUrl && song.audioUrl.startsWith('blob:'))) ? 'text-gray-300' : 'text-gray-400'} text-sm`}>{song.artist}</p>
                      {song.audioUrl && (
                        <span className="text-gray-300 text-sm px-2 py-0.5 bg-blue-900/30 rounded-full">
                          Local
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-gray-300 text-sm">{song.duration}</span>
                <button
                  onClick={() => handleRemoveSong(song.title, song.id)}
                  className={`w-9 h-9 rounded-full ${currentTheme.bg} ${currentTheme.bgHover} ${currentTheme.text} flex items-center justify-center hover:scale-105 transition-all`}
                  title="Remove from playlist"
                >
                  <span style={{ color: pageBgColor }}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-4 h-4" aria-hidden="true">
                      <path d="M6 6 L18 18 M6 18 L18 6" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                    </svg>
                  </span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Notification */}
      <Notification
        message={notification.message}
        type={notification.type}
        isVisible={notification.isVisible}
        onClose={hideNotification}
      />
    </div>
  );
}