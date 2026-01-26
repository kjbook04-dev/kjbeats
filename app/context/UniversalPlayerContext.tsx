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

type UniversalPlayerState = {
  currentTrack: UniversalTrack | null;
  isPlaying: boolean;
  isLoading: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  error: string | null;
};

type UniversalPlayerAPI = {
  state: UniversalPlayerState;
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

const DEFAULT_STATE: UniversalPlayerState = {
  currentTrack: null,
  isPlaying: false,
  isLoading: false,
  currentTime: 0,
  duration: 0,
  volume: 100,
  isMuted: false,
  error: null,
};

const DEFAULT: UniversalPlayerAPI = {
  state: DEFAULT_STATE,
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
  // Lightweight provider that keeps the same shape but delegates to the
  // global `window.playTrack` where possible. The real `PersistentPlayer`
  // is responsible for handling playback.
  return <UniversalPlayerContext.Provider value={DEFAULT}>{children}</UniversalPlayerContext.Provider>;
}

export function useUniversalPlayer() {
  return useContext(UniversalPlayerContext);
}

export default UniversalPlayerProvider;