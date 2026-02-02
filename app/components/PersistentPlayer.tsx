 'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useLastPlayed } from '../context/LastPlayedContext';
import { useMusicLibrary } from '../context/MusicLibraryContext';
import { useTheme } from '../context/ThemeContext';
import { useUser } from '../context/UserContext';
import { db } from '../lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import type { Song } from '../types/music';

interface WindowWithPlayerToggle extends Window {
  playerTogglePlay?: () => void;
}

export default function PersistentPlayer() {
  const { currentSong, setCurrentSong, isPlaying, setIsPlaying, setLastPlayed, setPlayAudio, setTogglePlay, setRestartCurrentSong } = useLastPlayed();
  const { songs } = useMusicLibrary();
  const { currentTheme } = useTheme();
  const { user } = useUser();
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [previousVolume, setPreviousVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const currentSongIdRef = useRef<string | null>(null);
  const previousPressAtRef = useRef<number>(0);
  const previousPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [hasUniversal, setHasUniversal] = useState(false);

  useEffect(() => {
    return () => {
      if (previousPressTimerRef.current) {
        clearTimeout(previousPressTimerRef.current);
      }
    };
  }, []);



  // Load new song when the song changes
  useEffect(() => {
    if (currentSong && audioRef.current && currentSong.id !== currentSongIdRef.current) {
      console.log('Loading new song:', currentSong.title);
      currentSongIdRef.current = currentSong.id;

      // Load the new audio
      audioRef.current.src = currentSong.audioUrl;
      audioRef.current.load();
      audioRef.current.volume = volume;

      setLastPlayed(currentSong);
    }
  }, [currentSong, volume, setLastPlayed]);

  // Handle play state changes
  useEffect(() => {
    if (!audioRef.current || !currentSong) return;

    if (isPlaying && currentSong.id === currentSongIdRef.current) {
      console.log('Should be playing, starting audio');
      const playAudio = async () => {
        try {
          await audioRef.current?.play();
          console.log('Audio started successfully');
        } catch (error) {
          console.error('Failed to play:', error);
          setIsPlaying(false);
        }
      };

      if (audioRef.current.readyState >= 2) {
        playAudio();
      } else {
        audioRef.current.addEventListener('canplay', playAudio, { once: true });
      }
    }
  }, [isPlaying, currentSong, setIsPlaying]);

  // Ensure we pause the audio element when isPlaying becomes false from elsewhere
  useEffect(() => {
    if (!audioRef.current) return;
    try {
      if (!isPlaying && !audioRef.current.paused) {
        audioRef.current.pause();
        console.log('Audio paused due to isPlaying=false');
      }
    } catch (e) {
      // ignore
    }
  }, [isPlaying]);

  // Handle volume changes without affecting playback
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // Persist volume to localStorage so the slider stays at last value across reloads
  useEffect(() => {
    const loadVolume = async () => {
      try {
        const stored = localStorage.getItem('playerVolume');
        if (stored !== null) {
          const v = Number(stored);
          if (!Number.isNaN(v)) {
            setVolume(v);
            if (v > 0) setPreviousVolume(v);
            setIsMuted(v === 0);
            if (audioRef.current) audioRef.current.volume = v;
          }
        }
        if (user && db) {
          const snap = await getDoc(doc(db, 'users', user.id));
          const cloudVolume = snap.data()?.playerVolume;
          if (typeof cloudVolume === 'number' && !Number.isNaN(cloudVolume)) {
            setVolume(cloudVolume);
            if (cloudVolume > 0) setPreviousVolume(cloudVolume);
            setIsMuted(cloudVolume === 0);
            if (audioRef.current) audioRef.current.volume = cloudVolume;
          }
        }
      } catch (e) {
        // ignore storage errors
      }
    };
    loadVolume();
  }, [user]);

  useEffect(() => {
    try {
      localStorage.setItem('playerVolume', String(volume));
      if (user && db) {
        updateDoc(doc(db, 'users', user.id), { playerVolume: volume }).catch(() => {
          // ignore cloud sync errors
        });
      }
    } catch (e) {
      // ignore storage errors
    }
  }, [volume, user]);

  const togglePlay = useCallback(async () => {
    if (!currentSong) return;
    
    // No special handling for any platform; control audio element directly
    
  if (!audioRef.current) return;
    
    console.log('togglePlay called:', { isPlaying, readyState: audioRef.current.readyState });
    
    try {
      if (isPlaying) {
        // Pause
        console.log('Pausing audio');
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        // Play
        console.log('Attempting to play audio');
        if (audioRef.current.readyState >= 2) {
          // Audio is ready
          await audioRef.current.play();
          setIsPlaying(true);
          console.log('Audio started playing');
        } else {
          // Audio is still loading, wait for it to be ready
          console.log('Audio not ready, waiting...');
          const playWhenReady = async () => {
            try {
              await audioRef.current?.play();
              setIsPlaying(true);
              console.log('Audio started playing after loading');
            } catch (error) {
              console.error('Failed to play audio:', error);
              setIsPlaying(false);
            }
          };
          audioRef.current.addEventListener('canplay', playWhenReady, { once: true });
        }
      }
    } catch (error) {
      console.error('Audio playback error:', error);
      setIsPlaying(false);
    }
  }, [currentSong, isPlaying, setIsPlaying]);

  const restartCurrentSong = useCallback(async () => {
    if (!currentSong) return;
    if (!audioRef.current) return;

    try {
      // Try to seek to start and play
      audioRef.current.currentTime = 0;
      if (audioRef.current.readyState >= 2) {
        await audioRef.current.play();
        setIsPlaying(true);
      } else {
        // Wait until canplay
        const playWhenReady = async () => {
          try {
            await audioRef.current?.play();
            setIsPlaying(true);
          } catch (error) {
            console.error('Failed to restart audio:', error);
            setIsPlaying(false);
          }
        };
        audioRef.current.addEventListener('canplay', playWhenReady, { once: true });
      }
    } catch (e) {
      console.error('Error restarting current song', e);
      setIsPlaying(false);
    }
  }, [currentSong, setIsPlaying]);

  // Create play function that can be called by other components
  const playAudio = useCallback((song: Song) => {
    console.log('playAudio called with song:', song.title);
    setCurrentSong(song);
    setIsPlaying(true);
  }, [setCurrentSong, setIsPlaying]);

  // Expose functions to context so other components can use them
  // Include playAudio and togglePlay in deps so the context always has the latest
  // callbacks (otherwise other components may call a stale togglePlay that
  // captured old `isPlaying` state and won't pause correctly).
  useEffect(() => {
    setPlayAudio(() => playAudio);
    setTogglePlay(() => togglePlay);
    setRestartCurrentSong(() => restartCurrentSong);
  }, [playAudio, togglePlay, restartCurrentSong, setPlayAudio, setTogglePlay, setRestartCurrentSong]);

  // Expose togglePlay to window so other components can call it (legacy support)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as WindowWithPlayerToggle).playerTogglePlay = togglePlay;
      return () => {
        delete (window as WindowWithPlayerToggle).playerTogglePlay;
      };
    }
  }, [togglePlay]);

  // Register a lightweight universalPlayer for legacy callers (window.playTrack)
  // and drain any queued calls that EarlyUniversalShim may have stored.
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const win = window as any;

    // Create the universal player object that other code can call.
    win.universalPlayer = win.universalPlayer || {};
    win.universalPlayer.playTrack = (data: any) => {
      try {
        // Normalize incoming data to our Song shape as best-effort.
        const song = {
          id: data.id || data.youtubeId || `legacy-${Date.now()}`,
          title: data.title || data.name || data.song?.title || 'Unknown',
          artist: data.artist || data.song?.artist || 'Unknown',
          duration: data.duration || data.song?.duration || '0:00',
          audioUrl: data.audioUrl || data.url || data.youtubeId || '',
          coverUrl: data.coverUrl || data.song?.coverUrl || undefined,
        } as Song;

        // If this exact track is already loaded, restart it from the beginning.
        if (audioRef.current && currentSongIdRef.current === song.id) {
          try {
            audioRef.current.currentTime = 0;
            if (audioRef.current.readyState >= 2) {
              audioRef.current.play().catch(() => {
                setIsPlaying(false);
              });
            } else {
              const playWhenReady = () => {
                audioRef.current?.play().catch(() => {
                  setIsPlaying(false);
                });
              };
              audioRef.current.addEventListener('canplay', playWhenReady, { once: true });
            }
            setIsPlaying(true);
            return;
          } catch (e) {
            // Fall through to normal setCurrentSong path.
          }
        }

        // If we have an audioUrl, set it and start playback. Otherwise, just set current song.
        setCurrentSong(song);
        setIsPlaying(true);
      } catch (e) {
        console.warn('universalPlayer.playTrack failed to play', e, data);
      }
    };

    // Provide a pause method for updateSimplePlayerState compatibility
    win.universalPlayer.pause = () => {
      try {
        if (audioRef.current && !audioRef.current.paused) audioRef.current.pause();
        setIsPlaying(false);
      } catch (e) {
        // ignore
      }
    };

    // Drain any queued playTrack calls created by EarlyUniversalShim
    try {
      const q = win._playTrackQueue || [];
      if (Array.isArray(q) && q.length > 0) {
        // Drain in order
        q.forEach((d: any) => {
          try { win.universalPlayer.playTrack(d); } catch (e) { /* ignore per-call */ }
        });
        win._playTrackQueue = [];
      }

      const uq = win._updateStateQueue || [];
      if (Array.isArray(uq) && uq.length > 0) {
        uq.forEach((playing: boolean) => {
          if (!playing && win.universalPlayer && typeof win.universalPlayer.pause === 'function') {
            try { win.universalPlayer.pause(); } catch (e) { /* ignore */ }
          }
        });
        win._updateStateQueue = [];
      }
    } catch (e) {
      // ignore queue drain errors
    }

    return () => {
      try {
        // Do not delete the object entirely; remove only our methods to avoid stomping other providers.
        if (win && win.universalPlayer) {
          delete win.universalPlayer.playTrack;
          delete win.universalPlayer.pause;
        }
      } catch (e) {
        // ignore
      }
    };
  }, [setCurrentSong, setIsPlaying]);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = Number(e.target.value);
    setVolume(newVolume);
    
    // If volume is being changed from slider and it's not 0, update previous volume and unmute
    if (newVolume > 0) {
      setPreviousVolume(newVolume);
      setIsMuted(false);
    } else {
      setIsMuted(true);
    }
    
    // Update audio volume immediately to avoid useEffect issues
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  const toggleMute = () => {
    if (isMuted || volume === 0) {
      // Unmute - restore previous volume
      const restoreVolume = previousVolume > 0 ? previousVolume : 0.5;
      setVolume(restoreVolume);
      setIsMuted(false);
      if (audioRef.current) {
        audioRef.current.volume = restoreVolume;
      }
    } else {
      // Mute - save current volume and set to 0
      setPreviousVolume(volume);
      setVolume(0);
      setIsMuted(true);
      if (audioRef.current) {
        audioRef.current.volume = 0;
      }
    }
  };

  const skipToPrevious = () => {
    // UX: first press restarts and plays the current song from the beginning.
    // If the user presses again within 2000ms of that restart, go to the previous track.
    // Also, if the track is already at the very start (<= 1s), go to previous immediately.
    if (!currentSong) return;

    const now = Date.now();
    const firstPressAt = previousPressAtRef.current;
    const RESTART_WINDOW_MS = 2000; // 2 seconds

    const currentIndex = songs.findIndex(song => song.id === currentSong.id);
    if (currentIndex === -1) return;

    // Determine current time in seconds
    const currentTimeSeconds = audioRef.current ? audioRef.current.currentTime : 0;

    // If this is a second press within the restart window, go to the previous track.
    // Otherwise, treat as a restart.
    if (firstPressAt && (now - firstPressAt) <= RESTART_WINDOW_MS) {
      const previousIndex = currentIndex === 0 ? songs.length - 1 : currentIndex - 1;
      const previousSong = songs[previousIndex];
      console.log('Second press within window: skipping to previous:', previousSong.title);
      setCurrentSong(previousSong);
      if (isPlaying) setIsPlaying(true);
      previousPressAtRef.current = 0;
      if (previousPressTimerRef.current) {
        clearTimeout(previousPressTimerRef.current);
        previousPressTimerRef.current = null;
      }
      return;
    }

    // No recent first-press or conditions not met: treat this as a restart and start a window
    console.log('Restarting current song and starting 2s window for previous');
    if (audioRef.current) {
      try {
        audioRef.current.currentTime = 0;
        // Ensure playback resumes
        if (audioRef.current.readyState >= 2) {
          audioRef.current.play().catch(() => { /* ignore play errors */ });
        } else {
          const playWhenReady = () => { audioRef.current?.play().catch(() => {}); };
          audioRef.current.addEventListener('canplay', playWhenReady, { once: true });
        }
      } catch (e) {
        // ignore
      }
    }
    setIsPlaying(true);

    // record this press time as the first press
    previousPressAtRef.current = now;
    // clear the window after RESTART_WINDOW_MS
    if (previousPressTimerRef.current) {
      clearTimeout(previousPressTimerRef.current);
    }
    previousPressTimerRef.current = setTimeout(() => {
      previousPressAtRef.current = 0;
      previousPressTimerRef.current = null;
    }, RESTART_WINDOW_MS + 50);
  };

  const skipToNext = () => {
    if (!currentSong || songs.length === 0) return;
    
    const currentIndex = songs.findIndex(song => song.id === currentSong.id);
    if (currentIndex === -1) return;
    
    // Go to next song, or wrap to first song if at end
    const nextIndex = currentIndex === songs.length - 1 ? 0 : currentIndex + 1;
    const nextSong = songs[nextIndex];
    
    console.log('Skipping to next:', nextSong.title);
    setCurrentSong(nextSong);
    if (isPlaying) {
      // Keep playing the new song
      setIsPlaying(true);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
  };

  const handleError = (e: React.SyntheticEvent<HTMLAudioElement, Event>) => {
    console.error('Audio error for:', currentSong?.title);
    console.error('Audio URL:', currentSong?.audioUrl);
    console.error('Error details:', e.currentTarget.error);
    setIsPlaying(false);
    alert(`Error playing "${currentSong?.title}". The audio file may be corrupted or no longer available.`);
  };

  const handleCanPlay = () => {
    console.log('Audio ready to play:', currentSong?.title);
  };

  const handleLoadStart = () => {
    console.log('Loading audio:', currentSong?.title);
    console.log('Audio URL:', currentSong?.audioUrl);
  };

  if (!currentSong) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-700 p-3 z-50">
      <style>{`
        /* Scoped slider thumb styling for player ranges */
        [data-range] { --thumb-color: rgb(236 72 153); }
  [data-range]::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 14px; height: 14px; border-radius: 9999px; background: var(--thumb-color); border: none; box-shadow: none; transform: translateY(-4px); }
  [data-range]::-moz-range-thumb { width: 14px; height: 14px; border-radius: 9999px; background: var(--thumb-color); border: none; box-shadow: none; transform: translateY(-4px); }
        [data-range]::-webkit-slider-runnable-track { height: 6px; background: #374151; border-radius: 9999px; }
        [data-range]::-moz-range-track { height: 6px; background: #374151; border-radius: 9999px; }
      `}</style>
      {/* Audio element for playback */}
      <audio
        ref={audioRef}
        src={currentSong.audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        onError={handleError}
        onCanPlay={handleCanPlay}
        onLoadStart={handleLoadStart}
        preload="metadata"
      />
      
      <div className="container mx-auto flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        {/* Song Info */}
        <div className="flex items-center space-x-3 md:flex-shrink-0 min-w-0">
          {currentSong.coverUrl && (
            <img
              src={currentSong.coverUrl}
              alt={currentSong.title}
              className="w-10 h-10 rounded bg-gray-800 flex-shrink-0"
            />
          )}
          <div className="min-w-0">
            <h3 className={`${currentTheme.text} font-medium text-sm truncate`}>{currentSong.title}</h3>
            <p className="text-gray-300 text-xs truncate">{currentSong.artist}</p>
          </div>
        </div>

    {/* Controls */}
    <div className="w-full md:flex-1 md:mx-6">
      {/* Regular Audio Controls */}
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between md:space-x-3">
              {/* Previous Button */}
              <button
                onClick={skipToPrevious}
                disabled={!currentSong || songs.length === 0}
                className={`${currentTheme.text} ${currentTheme.textHover} disabled:text-gray-600 disabled:opacity-50 text-sm font-bold flex-shrink-0 transition-colors`}
                title="Previous song"
              >
                ⏮
              </button>
              
              {/* Play Button */}
              <button
                onClick={togglePlay}
                className={`w-10 h-10 rounded-full ${currentTheme.bg} ${currentTheme.bgHover} flex items-center justify-center text-gray-900 text-base font-bold flex-shrink-0`}
              >
                {isPlaying ? (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" className="w-5 h-5" aria-hidden="true">
                    <rect x="4" y="3" width="3" height="10" rx="1" fill="currentColor" />
                    <rect x="9" y="3" width="3" height="10" rx="1" fill="currentColor" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor" aria-hidden="true">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </button>
              
              {/* Next Button */}
              <button
                onClick={skipToNext}
                disabled={!currentSong || songs.length === 0}
                className={`${currentTheme.text} ${currentTheme.textHover} disabled:text-gray-600 disabled:opacity-50 text-sm font-bold flex-shrink-0 transition-colors`}
                title="Next song"
              >
                ⏭
              </button>
              
              {/* Progress Bar */}
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <span className="text-gray-300 text-sm w-10 hidden sm:inline">{formatTime(currentTime)}</span>
                <input
                  data-range
                  type="range"
                  min={0}
                  max={duration || 0}
                  value={currentTime}
                  onChange={handleSeek}
                  className={`flex-1 h-1.5 bg-gray-700 rounded-lg appearance-none`}
                  style={{
                    ['--thumb-color' as any]: currentTheme.primary,
                  } as React.CSSProperties}
                />
                <span className="text-gray-300 text-sm w-10 hidden sm:inline">{formatTime(duration)}</span>
              </div>
              
              {/* Volume */}
              <div className="flex items-center space-x-2 flex-shrink-0">
                <button
                  onClick={toggleMute}
                  className="text-gray-300 hover:text-white text-sm transition-colors"
                  title={isMuted || volume === 0 ? "Unmute" : "Mute"}
                >
                  {isMuted || volume === 0 ? '🔇' : volume < 0.5 ? '🔉' : '🔊'}
                </button>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={volume}
                  onChange={handleVolumeChange}
                  data-range
                  className={`w-16 sm:w-20 h-1.5 bg-gray-700 rounded-lg appearance-none`}
                  style={{
                    ['--thumb-color' as any]: currentTheme.primary,
                  } as React.CSSProperties}
                />
                <span className="text-gray-300 text-sm w-8 hidden sm:inline">{Math.round(volume * 100)}%</span>
              </div>
            </div>
        </div>

        {/* Close Button */}
        <div className="flex-shrink-0 self-end md:self-auto">
          <button
            onClick={() => setCurrentSong(null)}
            className={`${currentTheme.text} ${currentTheme.textHover} text-sm`}
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
