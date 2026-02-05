"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  setDoc,
  query,
  where,
} from "firebase/firestore";
import { deleteObject, getDownloadURL, ref, uploadBytes } from "firebase/storage";
import type { Song } from "../types/music";
import { useUser } from "./UserContext";
import { db, storage } from "../lib/firebase";

interface MusicLibraryContextType {
  songs: Song[];
  addSongs: (newSongs: Song[], files?: File[]) => Promise<void>;
  removeSong: (songId: string) => Promise<void>;
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

  useEffect(() => {
    const loadSongs = async () => {
      if (!user || !db) {
        setSongs([]);
        return;
      }
      try {
        const songsRef = collection(db, "songs");
        let snapshot = await getDocs(query(songsRef, where("ownerId", "==", user.id)));
        let loaded = snapshot.docs.map((d) => d.data() as Song);
        if (loaded.length === 0) {
          snapshot = await getDocs(query(songsRef, where("userId", "==", user.id)));
          loaded = snapshot.docs.map((d) => d.data() as Song);
        }
        if (loaded.length === 0) {
          try {
            const legacyRef = collection(db, "users", user.id, "songs");
            const legacySnap = await getDocs(legacyRef);
            loaded = legacySnap.docs.map((d) => d.data() as Song);
          } catch {
            // ignore legacy permission errors
          }
        }
        loaded.sort((a, b) => {
          const aT = Date.parse(a.uploadedAt || '') || 0;
          const bT = Date.parse(b.uploadedAt || '') || 0;
          return bT - aT;
        });
        setSongs(loaded);
      } catch (error) {
        console.error("Failed loading songs from Firestore", error);
        setSongs([]);
      }
    };
    loadSongs();
  }, [user]);

  const addSongs = async (newSongs: Song[], files?: File[]) => {
    if (!user || !db) return;

    const uploaded: Song[] = [];
    for (let i = 0; i < newSongs.length; i += 1) {
      const incoming = newSongs[i];
      let audioUrl = incoming.audioUrl;
      let storagePath = incoming.storagePath;

      // If this upload includes a local file, store it in Firebase Storage.
      const file = files?.[i];
      if (file && storage) {
        const path = `users/${user.id}/songs/${incoming.id}-${file.name}`;
        const fileRef = ref(storage, path);
        await uploadBytes(fileRef, file);
        audioUrl = await getDownloadURL(fileRef);
        storagePath = path;
      }

      const song: Song = {
        ...incoming,
        audioUrl,
        storagePath,
        userId: user.id,
        ownerId: incoming.ownerId || user.id,
        uploadedBy: incoming.uploadedBy || user.firstName || user.username,
        uploadedAt: incoming.uploadedAt || new Date().toISOString(),
      };

      // Firestore does not allow undefined values in documents.
      const cleaned = Object.fromEntries(
        Object.entries(song).filter(([, value]) => value !== undefined)
      ) as Song;

      await setDoc(doc(db, "songs", song.id), cleaned, { merge: true });
      uploaded.push(song);
    }

    if (uploaded.length) {
      setSongs((prev) => {
        const merged = [...uploaded, ...prev];
        const unique = new Map<string, Song>();
        merged.forEach((s) => unique.set(s.id, s));
        return Array.from(unique.values());
      });
    }
  };

  const removeSong = async (songId: string) => {
    if (!user || !db) return;
    const toDelete = songs.find((song) => song.id === songId);
    try {
      await deleteDoc(doc(db, "songs", songId));
      if (toDelete?.storagePath && storage) {
        await deleteObject(ref(storage, toDelete.storagePath)).catch(() => {
          // ignore storage deletion errors
        });
      }
      setSongs((prev) => prev.filter((song) => song.id !== songId));
    } catch (error) {
      console.error("Failed removing song", error);
    }
  };

  return (
    <MusicLibraryContext.Provider value={{ songs, addSongs, removeSong }}>
      {children}
    </MusicLibraryContext.Provider>
  );
}
