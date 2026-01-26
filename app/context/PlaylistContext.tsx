'use client';

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import type { Playlist, Song } from '../types/music';
import { useUser } from './UserContext';

interface PlaylistContextType {
  playlists: Playlist[];
  createPlaylist: (title: string, description: string, coverUrl?: string) => void;
  addToPlaylist: (playlistId: string, song: Song) => void;
  removeFromPlaylist: (playlistId: string, songId: string) => void;
  deletePlaylist: (playlistId: string) => void;
  updatePlaylistCover: (playlistId: string, coverUrl?: string) => void;
}

const PlaylistContext = createContext<PlaylistContextType | undefined>(undefined);

export function usePlaylist() {
  const context = useContext(PlaylistContext);
  if (!context) {
    throw new Error('usePlaylist must be used within a PlaylistProvider');
  }
  return context;
}

export function PlaylistProvider({ children }: { children: ReactNode }) {
  const { user } = useUser();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);

  // Load user's playlists when user changes
  useEffect(() => {
    if (user) {
      const userPlaylists = JSON.parse(localStorage.getItem(`kjbeats_playlists_${user.id}`) || '[]');
      setPlaylists(userPlaylists);
    } else {
      setPlaylists([]);
    }
  }, [user]);

  // Save playlists to localStorage whenever they change
  useEffect(() => {
    if (user && playlists.length >= 0) {
      localStorage.setItem(`kjbeats_playlists_${user.id}`, JSON.stringify(playlists));
    }
  }, [playlists, user]);

  const createPlaylist = (title: string, description: string, coverUrl?: string) => {
    if (!user) return; // Only logged-in users can create playlists
    
    const newPlaylist: Playlist = {
      id: Date.now().toString(),
      title,
      description,
      coverUrl,
      songs: []
    };
    setPlaylists(prev => [...prev, newPlaylist]);
  };
  
  const updatePlaylistCover = (playlistId: string, coverUrl?: string) => {
    if (!user) return;
    setPlaylists(prev => prev.map(pl => pl.id === playlistId ? { ...pl, coverUrl } : pl));
  };

  const addToPlaylist = (playlistId: string, song: Song) => {
    if (!user) return; // Only logged-in users can modify playlists
    
    setPlaylists(prev => prev.map(playlist => {
      if (playlist.id === playlistId) {
        // Check if song already exists in playlist
        if (!playlist.songs.some(s => s.id === song.id)) {
          return {
            ...playlist,
            songs: [...playlist.songs, song]
          };
        }
      }
      return playlist;
    }));
  };

  const removeFromPlaylist = (playlistId: string, songId: string) => {
    if (!user) return; // Only logged-in users can modify playlists
    
    setPlaylists(prev => prev.map(playlist => {
      if (playlist.id === playlistId) {
        return {
          ...playlist,
          songs: playlist.songs.filter(song => song.id !== songId)
        };
      }
      return playlist;
    }));
  };

  const deletePlaylist = (playlistId: string) => {
    if (!user) return; // Only logged-in users can delete playlists
    
    setPlaylists(prev => prev.filter(playlist => playlist.id !== playlistId));
  };

  return (
    <PlaylistContext.Provider value={{
      playlists,
      createPlaylist,
      addToPlaylist,
      removeFromPlaylist,
      deletePlaylist
      ,
      updatePlaylistCover
    }}>
      {children}
    </PlaylistContext.Provider>
  );
}