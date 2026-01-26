"use client";

import { useEffect } from 'react';

export default function EarlyUniversalShim() {
  useEffect(() => {
    // Provide lightweight queuing stubs so legacy callers won't throw
    // before the real universal player mounts and replaces these.
    if (typeof window === 'undefined') return;

    // Queue for playTrack calls
    if (typeof (window as any).playTrack !== 'function') {
      (window as any)._playTrackQueue = (window as any)._playTrackQueue || [];
      (window as any).playTrack = (data: any) => {
        try {
          const up = (window as any).universalPlayer;
          if (up && typeof up.playTrack === 'function') {
            up.playTrack(data);
            return;
          }
        } catch (e) {}

        (window as any)._playTrackQueue.push(data);
      };
    }

    // Queue for updateSimplePlayerState calls (legacy)
    if (typeof (window as any).updateSimplePlayerState !== 'function') {
      (window as any)._updateStateQueue = (window as any)._updateStateQueue || [];
      (window as any).updateSimplePlayerState = (playing: boolean) => {
        try {
          const up = (window as any).universalPlayer;
          if (up && typeof up.pause === 'function') {
            // best-effort: if playing === false, call pause()
            if (!playing && typeof up.pause === 'function') up.pause();
            return;
          }
        } catch (e) {}

        (window as any)._updateStateQueue.push(playing);
      };
    }

    return () => {
      // don't delete — provider will replace these when ready
    };
  }, []);

  return null;
}
