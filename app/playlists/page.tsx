"use client";
import { useState, useEffect } from 'react';
import { usePlaylist } from "../context/PlaylistContext";
import { useMusicLibrary } from "../context/MusicLibraryContext";
import { useTheme } from "../context/ThemeContext";
import { Song, Playlist } from "../types/music";

interface WindowWithPlayTrack {
  playTrack?: (data: { title: string; artist: string; audioUrl: string; id: string }) => void;
}

import { Notification } from "../components/Notification";
import { gradientTextStyle, gradientBgStyle } from "../context/themeHelpers";

export default function PlaylistsPage() {
  const { playlists, createPlaylist, deletePlaylist, addToPlaylist, removeFromPlaylist, updatePlaylistCover } = usePlaylist();
  const { songs: allSongs } = useMusicLibrary();
  const { currentTheme } = useTheme();
  const gText = gradientTextStyle();
  const gBg = gradientBgStyle();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddSongsModal, setShowAddSongsModal] = useState(false);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string>('');
  const [newPlaylistTitle, setNewPlaylistTitle] = useState('');
  const [newPlaylistDescription, setNewPlaylistDescription] = useState('');
  const [newPlaylistCover, setNewPlaylistCover] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
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

  const handleCreatePlaylist = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPlaylistTitle.trim()) {
      createPlaylist(newPlaylistTitle.trim(), newPlaylistDescription.trim(), newPlaylistCover || undefined);
      showNotification(`Playlist "${newPlaylistTitle.trim()}" created successfully!`);
      setNewPlaylistTitle('');
      setNewPlaylistDescription('');
      setNewPlaylistCover(null);
      setShowCreateModal(false);
    }
  };

  const handleAddSongs = (playlistId: string) => {
    setSelectedPlaylistId(playlistId);
    setShowAddSongsModal(true);
  };

  // image file -> data URL helper
  const handleCoverFile = (file?: File | null) => {
    if (!file) {
      setNewPlaylistCover(null);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setNewPlaylistCover(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleAddSongToPlaylist = (song: Song) => {
    if (selectedPlaylistId) {
      const playlist = playlists.find(p => p.id === selectedPlaylistId);
      const songAlreadyExists = playlist?.songs.some(s => s.id === song.id);
      if (!songAlreadyExists) {
        addToPlaylist(selectedPlaylistId, song);
        // Force a refresh to ensure UI updates
        setRefreshKey(prev => prev + 1);
        setNotification({
          message: `"${song.title}" added to playlist successfully!`,
          type: 'success',
          isVisible: true
        });
      }
    }
  };

  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setNotification({
      message,
      type,
      isVisible: true
    });
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const bg = getComputedStyle(document.body).backgroundColor || getComputedStyle(document.documentElement).backgroundColor;
      setPageBgColor(bg);
    }
  }, []);

  const hideNotification = () => {
    setNotification(prev => ({
      ...prev,
      isVisible: false
    }));
  };

  const handlePlayPlaylist = async (playlist: Playlist) => {
    if (!playlist.songs || playlist.songs.length === 0) {
      showNotification('This playlist is empty', 'info');
      return;
    }

    const firstSong = playlist.songs[0];
    
    try {
      // Try to play locally using the global playTrack function
      if (firstSong.audioUrl && (window as WindowWithPlayTrack).playTrack) {
        const trackData = {
          title: firstSong.title,
          artist: firstSong.artist,
          audioUrl: firstSong.audioUrl,
          id: firstSong.id // Pass the song ID for file lookup
        };
        (window as WindowWithPlayTrack).playTrack!(trackData);
        showNotification(`Playing "${playlist.title}"`, 'success');
      }
      // If no playback method is available
      else {
        showNotification(`Cannot play "${playlist.title}" - no audio files available`, 'error');
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Playlist playback failed:', error);
      showNotification(`Failed to play "${playlist.title}": ${errorMessage}`, 'error');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const parseDurationToSeconds = (dur: any) => {
    if (!dur) return 0;
    if (typeof dur === 'number') return Math.floor(dur);
    const str = String(dur);
    const parts = str.split(':').map((p) => parseInt(p, 10));
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    return parseInt(str, 10) || 0;
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
  <h1 className="text-4xl font-bold">
    {currentTheme.name === 'Iridescent' ? (
      <span style={gText}>Your Playlists</span>
    ) : (
      <span style={{ color: currentTheme.primary }}>Your Playlists</span>
    )}
  </h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className={`${currentTheme.bg} text-gray-900 px-6 py-3 rounded-full font-semibold ${currentTheme.bgHover} transition-colors`}
        >
          Create Playlist
        </button>
      </div>

      {playlists.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🎵</div>
          <h2 className={`text-2xl font-bold mb-4 ${currentTheme.text}`}>No Playlists Yet</h2>
          <p className="text-gray-200 mb-6">
            Create your first playlist to organize your music.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className={`${currentTheme.bg} text-gray-900 px-6 py-3 rounded-full font-semibold ${currentTheme.bgHover} transition-colors`}
          >
            Create Your First Playlist
          </button>
        </div>
      ) : (
        <div key={refreshKey} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {playlists.map((playlist) => {
            const totalSecs = (playlist.songs || []).reduce((acc, s) => acc + parseDurationToSeconds((s as any).duration || ''), 0);
            const totalStr = formatSeconds(totalSecs);
            return (
              <div key={playlist.id} className="bg-gray-800 rounded-lg p-6">
                {playlist.coverUrl ? (
                  <img src={playlist.coverUrl} alt={playlist.title} className="w-full h-32 object-cover rounded-md mb-4" />
                ) : (
                  <div className="w-full h-32 bg-gray-700 rounded-md mb-4 flex items-center justify-center text-gray-400">
                    <label htmlFor={`cover-input-${playlist.id}`} className="cursor-pointer px-4 py-2 rounded-md bg-gray-700 hover:bg-gray-600 flex items-center">
                      <span className="mr-2 text-lg font-bold">+</span>
                      <span>Add cover</span>
                    </label>
                    <input
                      id={`cover-input-${playlist.id}`}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files ? e.target.files[0] : undefined;
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = () => {
                          const dataUrl = reader.result as string;
                          updatePlaylistCover(playlist.id, dataUrl);
                          // force refresh key so list updates visually
                          setRefreshKey(prev => prev + 1);
                        };
                        reader.readAsDataURL(file);
                      }}
                    />
                  </div>
                )}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className={`text-xl font-bold mb-2 ${currentTheme.text}`}>{playlist.title}</h3>
                    {playlist.description && (
                      <p className="text-gray-400 text-sm mb-2">{playlist.description}</p>
                    )}
                    <p className="text-gray-200 text-sm">{playlist.songs.length} songs • {totalStr}</p>
                  </div>
                  <button
                    onClick={() => deletePlaylist(playlist.id)}
                    className="text-red-400 hover:text-red-300 text-sm"
                  >
                    Delete
                  </button>
                </div>

                <div className="space-y-2 mb-4">
                  {playlist.songs.slice(0, 3).map((song) => (
                    <div key={song.id} className="flex justify-between items-center text-sm">
                      <div className="flex items-center space-x-2 flex-1 min-w-0">
                        <div className="min-w-0 flex-1">
                          <p className="text-white font-semibold truncate">{song.title}</p>
                          <p className={`${(song.artist === 'Local Upload' || (song.audioUrl && song.audioUrl.startsWith('blob:'))) ? 'text-gray-300' : 'text-gray-400'} truncate`}>{song.artist}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => removeFromPlaylist(playlist.id, song.id)}
                        className={`w-9 h-9 rounded-full ${currentTheme.bg} ${currentTheme.bgHover} ${currentTheme.text} flex items-center justify-center hover:scale-105 transition-all`}
                        title="Remove"
                      >
                        <span style={{ color: pageBgColor }}>
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-4 h-4" aria-hidden="true">
                            <path d="M6 6 L18 18 M6 18 L18 6" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                          </svg>
                        </span>
                      </button>
                    </div>
                  ))}
                  {playlist.songs.length > 3 && (
                    <p className="text-gray-200 text-sm">+{playlist.songs.length - 3} more songs</p>
                  )}
                </div>

                <div className="flex space-x-2">
                  {playlist.songs.length > 0 && (
                    <button
                      onClick={() => handlePlayPlaylist(playlist)}
                      className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium hover:scale-105 transition-all flex items-center justify-center space-x-2`}
                      style={gBg}
                    >
                      <span style={{ color: pageBgColor }}>▶</span>
                      <span style={{ color: pageBgColor }}>Play</span>
                    </button>
                  )}
                  <button
                    onClick={() => handleAddSongs(playlist.id)}
                    className={`${playlist.songs.length > 0 ? 'flex-1' : 'flex-1'} border ${currentTheme.border} ${currentTheme.text} px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-700 transition-colors`}
                  >
                    Add Songs
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Playlist Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-900 p-8 rounded-lg w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">Create New Playlist</h2>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-white text-xl"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePlaylist} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Playlist Name *
                </label>
                <input
                  type="text"
                  value={newPlaylistTitle}
                  onChange={(e) => setNewPlaylistTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                  placeholder="My Awesome Playlist"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  value={newPlaylistDescription}
                  onChange={(e) => setNewPlaylistDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-pink-500 h-20 resize-none"
                  placeholder="Describe your playlist..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Cover Image (optional)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleCoverFile(e.target.files ? e.target.files[0] : null)}
                  className="w-full text-sm text-gray-300"
                />
                {newPlaylistCover && (
                  <div className="mt-3">
                    <img src={newPlaylistCover} alt="preview" className="w-full h-32 object-cover rounded-md" />
                  </div>
                )}
              </div>

              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 border border-gray-600 text-gray-300 px-4 py-2 rounded-md font-medium hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`flex-1 ${currentTheme.bg} text-gray-900 px-4 py-2 rounded-md font-medium ${currentTheme.bgHover} transition-colors`}
                >
                  Create Playlist
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Songs Modal */}
      {showAddSongsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-900 p-8 rounded-lg w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">Add Songs to Playlist</h2>
              <button 
                onClick={() => setShowAddSongsModal(false)}
                className="text-gray-400 hover:text-white text-xl"
              >
                ✕
              </button>
            </div>

            {allSongs.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-400 mb-4">No songs in your library</p>
                <a
                  href="/manage"
                  className={`${currentTheme.bg} text-gray-900 px-4 py-2 rounded-md font-medium ${currentTheme.bgHover} transition-colors`}
                >
                  Upload Music
                </a>
              </div>
            ) : (
              <div className="space-y-2">
                {allSongs.map((song) => {
                  const playlist = playlists.find(p => p.id === selectedPlaylistId);
                  const isAdded = !!playlist?.songs.some(s => s.id === song.id);
                  return (
                    <div key={song.id} className="flex items-center justify-between p-3 bg-gray-800 rounded-md">
                      <div>
                        <p className="text-white font-semibold">{song.title}</p>
                        <p className="text-gray-300 text-sm">{song.artist} • {song.duration}</p>
                      </div>
                      <button
                        onClick={() => handleAddSongToPlaylist(song)}
                        disabled={isAdded}
                        className={`${isAdded ? 'opacity-60 cursor-default border border-gray-600 text-gray-300' : `${currentTheme.bg} text-gray-900 ${currentTheme.bgHover}`} px-4 py-2 rounded-md text-sm font-medium transition-colors`}
                      >
                        {isAdded ? 'Added' : 'Add'}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
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
