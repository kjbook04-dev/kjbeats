"use client";
import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import type { Song } from "../types/music";

interface LastPlayedContextType {
  lastPlayed: Song | null;
  setLastPlayed: (song: Song) => void;
  history: Song[];
  clearHistory: () => void;
  currentSong: Song | null;
  setCurrentSong: (song: Song | null) => void;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  playAudio: ((song: Song) => void) | null;
  setPlayAudio: (fn: (song: Song) => void) => void;
  togglePlay: (() => void) | null;
  setTogglePlay: (fn: () => void) => void;
}

const LastPlayedContext = createContext<LastPlayedContextType | undefined>(undefined);

export function useLastPlayed() {
  const ctx = useContext(LastPlayedContext);
  if (!ctx) throw new Error("useLastPlayed must be used within LastPlayedProvider");
  return ctx;
}

export function LastPlayedProvider({ children }: { children: ReactNode }) {
  const [lastPlayed, setLastPlayedState] = useState<Song | null>(null);
  const [history, setHistory] = useState<Song[]>([]);
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playAudio, setPlayAudio] = useState<((song: Song) => void) | null>(null);
  const [togglePlay, setTogglePlay] = useState<(() => void) | null>(null);

  useEffect(() => {
    // Load from localStorage on mount
    const stored = localStorage.getItem("lastPlayedSong");
    if (stored) setLastPlayedState(JSON.parse(stored));
    const rawHistory = localStorage.getItem('kjbeats_play_history');
    if (rawHistory) {
      try {
        setHistory(JSON.parse(rawHistory));
      } catch (e) {
        console.warn('Failed to parse play history', e);
      }
    }
  }, []);

  const setLastPlayed = (song: Song) => {
    setLastPlayedState(song);
    localStorage.setItem("lastPlayedSong", JSON.stringify(song));
    try {
      setHistory(prev => {
        const dedup = [song, ...prev.filter(s => s.id !== song.id)];
        const clipped = dedup.slice(0, 50);
        localStorage.setItem('kjbeats_play_history', JSON.stringify(clipped));
        return clipped;
      });
    } catch (e) {
      console.warn('Failed to update play history', e);
    }
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('kjbeats_play_history');
  };

  return (
    <LastPlayedContext.Provider value={{ 
      lastPlayed, 
      setLastPlayed,
      history,
      clearHistory,
      currentSong,
      setCurrentSong,
      isPlaying,
      setIsPlaying,
      playAudio,
      setPlayAudio,
      togglePlay,
      setTogglePlay
    }}>
      {children}
    </LastPlayedContext.Provider>
  );
}
