"use client";

import React, { createContext, useContext } from 'react';

export interface UniversalTrack {
  id: string;
  title: string;
  artist?: string;
  platform?: string;
  thumbnail?: string;
  audioUrl?: string;
}

type UniversalPlayerAPI = {
  state: { currentTrack: UniversalTrack | null };
  playTrack: (track: UniversalTrack) => Promise<void>;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  seekTo: (time: number) => void;
  setVolume: (v: number) => void;
  toggleMute: () => void;
  setYouTubePlayer: (p: any) => void;
  initializeAudioElement: (el: HTMLAudioElement | null) => void;
};

const noopAsync = async () => {};
const noop = () => {};

const DEFAULT: UniversalPlayerAPI = {
  state: { currentTrack: null },
  playTrack: noopAsync,
  pause: noop,
  resume: noop,
  stop: noop,
  seekTo: noop,
  setVolume: noop,
  toggleMute: noop,
  setYouTubePlayer: noop,
  initializeAudioElement: noop,
};

const UniversalPlayerContext = createContext<UniversalPlayerAPI>(DEFAULT);

export function UniversalPlayerProvider({ children }: { children: React.ReactNode }) {
  return <UniversalPlayerContext.Provider value={DEFAULT}>{children}</UniversalPlayerContext.Provider>;
}

export function useUniversalPlayer() {
  return useContext(UniversalPlayerContext);
}

export default UniversalPlayerProvider;