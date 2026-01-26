"use client";

// Centralized playback: re-export the retained player implementation so
// imports expecting SimpleAudioPlayer continue to work.
export { default } from './PersistentPlayer';
