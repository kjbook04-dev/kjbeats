"use client";
import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import type { Song } from "../types/music";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useUser } from "./UserContext";
import { db } from "../lib/firebase";

interface LastPlayedContextType {
  lastPlayed: Song | null;
  lastPlayedHistory: Song[];
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
  const [lastPlayedHistory, setLastPlayedHistory] = useState<Song[]>([]);
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playAudio, setPlayAudio] = useState<((song: Song) => void) | null>(null);
  const [togglePlay, setTogglePlay] = useState<(() => void) | null>(null);
  const [restartCurrentSong, setRestartCurrentSong] = useState<(() => void) | null>(null);
  const { user } = useUser();
  const historyLimit = 50;

  const cleanSong = (song: Song) =>
    Object.fromEntries(Object.entries(song).filter(([, value]) => value !== undefined)) as Song;

  const getSongKey = (song: Song) => song.id || song.audioUrl || `${song.title}-${song.artist}`;

  useEffect(() => {
    const loadLastPlayed = async () => {
      const stored = localStorage.getItem("lastPlayedSong");
      if (stored) setLastPlayedState(JSON.parse(stored));
      const storedHistory = localStorage.getItem("lastPlayedHistory");
      if (storedHistory) setLastPlayedHistory(JSON.parse(storedHistory));
      if (!user || !db) return;
      try {
        const snap = await getDoc(doc(db, "users", user.id));
        const cloudSong = snap.data()?.lastPlayedSong as Song | undefined;
        const cloudHistory = snap.data()?.lastPlayedHistory as Song[] | undefined;
        if (cloudSong) setLastPlayedState(cloudSong);
        if (cloudHistory?.length) setLastPlayedHistory(cloudHistory);
      } catch (error) {
        console.error("Failed loading cloud last-played", error);
      }
    };
    loadLastPlayed();
  }, [user]);

  const setLastPlayed = (song: Song) => {
    // Firestore does not allow undefined values in documents.
    const cleaned = cleanSong(song);
    setLastPlayedState(cleaned);
    localStorage.setItem("lastPlayedSong", JSON.stringify(cleaned));
    setLastPlayedHistory((prev) => {
      const next = [cleaned, ...prev.filter((item) => getSongKey(item) !== getSongKey(cleaned))].slice(0, historyLimit);
      localStorage.setItem("lastPlayedHistory", JSON.stringify(next));
      if (user && db) {
        updateDoc(doc(db, "users", user.id), {
          lastPlayedSong: cleaned,
          lastPlayedHistory: next,
        }).catch(() => {
          // ignore cloud sync failures
        });
      }
      return next;
    });
  };

  return (
    <LastPlayedContext.Provider value={{ 
      lastPlayed, 
      lastPlayedHistory,
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
