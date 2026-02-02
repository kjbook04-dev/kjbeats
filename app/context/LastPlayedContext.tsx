"use client";
import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import type { Song } from "../types/music";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useUser } from "./UserContext";
import { db } from "../lib/firebase";

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
  const { user } = useUser();

  useEffect(() => {
    const loadLastPlayed = async () => {
      const stored = localStorage.getItem("lastPlayedSong");
      if (stored) setLastPlayedState(JSON.parse(stored));
      if (!user || !db) return;
      try {
        const snap = await getDoc(doc(db, "users", user.id));
        const cloudSong = snap.data()?.lastPlayedSong as Song | undefined;
        if (cloudSong) setLastPlayedState(cloudSong);
      } catch (error) {
        console.error("Failed loading cloud last-played", error);
      }
    };
    loadLastPlayed();
  }, [user]);

  const setLastPlayed = (song: Song) => {
    setLastPlayedState(song);
    localStorage.setItem("lastPlayedSong", JSON.stringify(song));
    if (user && db) {
      updateDoc(doc(db, "users", user.id), { lastPlayedSong: song }).catch(() => {
        // ignore cloud sync failures
      });
    }
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
