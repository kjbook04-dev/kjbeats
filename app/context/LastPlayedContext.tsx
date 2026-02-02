"use client";
import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import type { Song } from "../types/music";

interface LastPlayedContextType {
  lastPlayed: Song | null;
  setLastPlayed: (song: Song) => void;
  currentSong: Song | null;
  setCurrentSong: (song: Song | null) => void;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  playAudio: ((song: Song) => void) | null;
  setPlayAudio: (fn: (song: Song) => void) => void;
  togglePlay: (() => void) | null;
  setTogglePlay: (fn: () => void) => void;
  restartCurrentSong: (() => void) | null;
  setRestartCurrentSong: (fn: () => void) => void;
}

const LastPlayedContext = createContext<LastPlayedContextType | undefined>(undefined);

export function useLastPlayed() {
  const ctx = useContext(LastPlayedContext);
  if (!ctx) throw new Error("useLastPlayed must be used within LastPlayedProvider");
  return ctx;
}

export function LastPlayedProvider({ children }: { children: ReactNode }) {
  const [lastPlayed, setLastPlayedState] = useState<Song | null>(null);
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playAudio, setPlayAudio] = useState<((song: Song) => void) | null>(null);
  const [togglePlay, setTogglePlay] = useState<(() => void) | null>(null);
  const [restartCurrentSong, setRestartCurrentSong] = useState<(() => void) | null>(null);

  useEffect(() => {
    // Load from localStorage on mount
    const stored = localStorage.getItem("lastPlayedSong");
    if (stored) setLastPlayedState(JSON.parse(stored));
  }, []);

  const setLastPlayed = (song: Song) => {
    setLastPlayedState(song);
    localStorage.setItem("lastPlayedSong", JSON.stringify(song));
  };

  return (
    <LastPlayedContext.Provider value={{ 
      lastPlayed, 
      setLastPlayed,
      currentSong,
      setCurrentSong,
      isPlaying,
      setIsPlaying,
      playAudio,
      setPlayAudio,
      togglePlay,
      setTogglePlay,
      restartCurrentSong,
      setRestartCurrentSong
    }}>
      {children}
    </LastPlayedContext.Provider>
  );
}
