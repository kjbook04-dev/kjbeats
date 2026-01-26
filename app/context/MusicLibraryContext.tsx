"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import type { Song } from "../types/music";
import { useUser } from "./UserContext";

interface MusicLibraryContextType {
  songs: Song[];
  addSongs: (newSongs: Song[]) => void;
  removeSong: (songId: string) => void;
}

const MusicLibraryContext = createContext<MusicLibraryContextType | undefined>(undefined);

export function useMusicLibrary() {
  const ctx = useContext(MusicLibraryContext);
  if (!ctx) throw new Error("useMusicLibrary must be used within MusicLibraryProvider");
  return ctx;
}

export function MusicLibraryProvider({ children }: { children: ReactNode }) {
  const [songs, setSongs] = useState<Song[]>([]);
  const { user } = useUser();

  // Load user's songs when user changes
  useEffect(() => {
    if (user) {
      const userSongs = JSON.parse(localStorage.getItem(`kjbeats_songs_${user.id}`) || '[]');
      setSongs(userSongs);
    } else {
      setSongs([]);
    }
  }, [user]);

  // Save songs to localStorage whenever they change
  useEffect(() => {
    if (user && songs.length >= 0) {
      localStorage.setItem(`kjbeats_songs_${user.id}`, JSON.stringify(songs));
    }
  }, [songs, user]);

  const addSongs = (newSongs: Song[]) => {
    if (!user) return; // Only logged-in users can add songs
    
    const songsWithUser = newSongs.map(song => ({
      ...song,
      userId: user.id,
      uploadedBy: user.firstName || user.username
    }));
    
    setSongs(prev => [...prev, ...songsWithUser]);
  };

  const removeSong = (songId: string) => {
    if (!user) return; // Only logged-in users can remove songs
    setSongs(prev => prev.filter(song => song.id !== songId));
  };

  return (
    <MusicLibraryContext.Provider value={{ 
      songs, 
      addSongs,
      removeSong
    }}>
      {children}
    </MusicLibraryContext.Provider>
  );
}