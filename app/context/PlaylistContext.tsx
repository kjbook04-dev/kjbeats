'use client';

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  orderBy,
} from 'firebase/firestore';
import type { Playlist, Song } from '../types/music';
import { useUser } from './UserContext';
import { db } from '../lib/firebase';

interface PlaylistContextType {
  playlists: Playlist[];
  createPlaylist: (title: string, description: string, coverUrl?: string) => Promise<string | null>;
  addToPlaylist: (playlistId: string, song: Song) => Promise<void>;
  removeFromPlaylist: (playlistId: string, songId: string) => Promise<void>;
  deletePlaylist: (playlistId: string) => Promise<void>;
  updatePlaylistCover: (playlistId: string, coverUrl?: string) => Promise<void>;
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

  useEffect(() => {
    const loadPlaylists = async () => {
      if (!user || !db) {
        setPlaylists([]);
        return;
      }
      try {
        const colRef = collection(db, 'users', user.id, 'playlists');
        const snapshot = await getDocs(query(colRef, orderBy('updatedAt', 'desc')));
        setPlaylists(snapshot.docs.map((d) => d.data() as Playlist));
      } catch (error) {
        console.error('Failed loading playlists', error);
        setPlaylists([]);
      }
    };
    loadPlaylists();
  }, [user]);

  const createPlaylist = async (title: string, description: string, coverUrl?: string): Promise<string | null> => {
    if (!user || !db) return null;

    const id = Date.now().toString();
    const newPlaylist: Playlist = {
      id,
      title,
      description,
      coverUrl,
      songs: [],
      ownerId: user.id,
      updatedAt: new Date().toISOString(),
    };
    await setDoc(doc(db, 'users', user.id, 'playlists', id), newPlaylist);
    setPlaylists((prev) => [newPlaylist, ...prev]);
    return id;
  };

  const updatePlaylistCover = async (playlistId: string, coverUrl?: string) => {
    if (!user || !db) return;
    await updateDoc(doc(db, 'users', user.id, 'playlists', playlistId), {
      coverUrl: coverUrl || null,
      updatedAt: new Date().toISOString(),
    });
    setPlaylists((prev) =>
      prev.map((pl) =>
        pl.id === playlistId ? { ...pl, coverUrl, updatedAt: new Date().toISOString() } : pl
      )
    );
  };

  const addToPlaylist = async (playlistId: string, song: Song) => {
    if (!user || !db) return;
    let updatedSongs: Song[] = [];
    setPlaylists((prev) =>
      prev.map((playlist) => {
        if (playlist.id !== playlistId) return playlist;
        if (playlist.songs.some((s) => s.id === song.id)) return playlist;
        updatedSongs = [...playlist.songs, song];
        return { ...playlist, songs: updatedSongs, updatedAt: new Date().toISOString() };
      })
    );
    if (updatedSongs.length > 0) {
      await updateDoc(doc(db, 'users', user.id, 'playlists', playlistId), {
        songs: updatedSongs,
        updatedAt: new Date().toISOString(),
      });
    }
  };

  const removeFromPlaylist = async (playlistId: string, songId: string) => {
    if (!user || !db) return;
    let updatedSongs: Song[] = [];
    setPlaylists((prev) =>
      prev.map((playlist) => {
        if (playlist.id !== playlistId) return playlist;
        updatedSongs = playlist.songs.filter((song) => song.id !== songId);
        return { ...playlist, songs: updatedSongs, updatedAt: new Date().toISOString() };
      })
    );
    await updateDoc(doc(db, 'users', user.id, 'playlists', playlistId), {
      songs: updatedSongs,
      updatedAt: new Date().toISOString(),
    });
  };

  const deletePlaylist = async (playlistId: string) => {
    if (!user || !db) return;
    await deleteDoc(doc(db, 'users', user.id, 'playlists', playlistId));
    setPlaylists((prev) => prev.filter((playlist) => playlist.id !== playlistId));
  };

  return (
    <PlaylistContext.Provider
      value={{
        playlists,
        createPlaylist,
        addToPlaylist,
        removeFromPlaylist,
        deletePlaylist,
        updatePlaylistCover,
      }}
    >
      {children}
    </PlaylistContext.Provider>
  );
}
