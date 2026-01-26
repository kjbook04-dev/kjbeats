 'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useLastPlayed } from '../context/LastPlayedContext';
import { useMusicLibrary } from '../context/MusicLibraryContext';
import { useTheme } from '../context/ThemeContext';
import type { Song } from '../types/music';

interface WindowWithPlayerToggle extends Window {
  playerTogglePlay?: () => void;
}

export default function PersistentPlayer() {
  const { currentSong, setCurrentSong, isPlaying, setIsPlaying, setLastPlayed, setPlayAudio, setTogglePlay } = useLastPlayed();
  const { songs } = useMusicLibrary();
  const { currentTheme } = useTheme();
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [previousVolume, setPreviousVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const currentSongIdRef = useRef<string | null>(null);
  const [hasUniversal, setHasUniversal] = useState(false);



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
  }, [playAudio, togglePlay, setPlayAudio, setTogglePlay]);

  // Expose togglePlay to window so other components can call it (legacy support)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as WindowWithPlayerToggle).playerTogglePlay = togglePlay;
      return () => {
        delete (window as WindowWithPlayerToggle).playerTogglePlay;
      };
    }
  }, [togglePlay]);

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
    // New UX: first press restarts the current song; pressing again (within a short window)
    // goes to the previous track. This mirrors common music player behavior.
    if (!currentSong || songs.length <= 1) return;

    const now = Date.now();
    // store last press timestamp in a ref-like property on the function
    if (!(skipToPrevious as any)._lastPress) (skipToPrevious as any)._lastPress = 0;
    const lastPress = (skipToPrevious as any)._lastPress as number;
    const DOUBLE_PRESS_MS = 800;

    const currentIndex = songs.findIndex(song => song.id === currentSong.id);
    if (currentIndex === -1) return;

    // If the track is at the very start (<= 1s), go to previous immediately
    const currentTimeSeconds = audioRef.current ? Math.floor(audioRef.current.currentTime) : 0;
    if (currentTimeSeconds <= 1) {
      const previousIndex = currentIndex === 0 ? songs.length - 1 : currentIndex - 1;
      const previousSong = songs[previousIndex];
      console.log('At start: skipping to previous:', previousSong.title);
      setCurrentSong(previousSong);
      if (isPlaying) setIsPlaying(true);
      // reset lastPress
      (skipToPrevious as any)._lastPress = 0;
      return;
    }

    if (now - lastPress <= DOUBLE_PRESS_MS) {
      // Treat as "go to previous track" on quick double-press
      const previousIndex = currentIndex === 0 ? songs.length - 1 : currentIndex - 1;
      const previousSong = songs[previousIndex];
      console.log('Double-press: skipping to previous:', previousSong.title);
      setCurrentSong(previousSong);
      if (isPlaying) setIsPlaying(true);
      // reset lastPress
      (skipToPrevious as any)._lastPress = 0;
    } else {
      // Single press: restart current track
      console.log('Single-press: restarting current song');
      if (audioRef.current) {
        try {
          audioRef.current.currentTime = 0;
        } catch (e) {
          // ignore
        }
      }
      // record this press time
      (skipToPrevious as any)._lastPress = now;
      // schedule reset after the window to avoid stale state
      setTimeout(() => { (skipToPrevious as any)._lastPress = 0; }, DOUBLE_PRESS_MS + 50);
    }
  };

  const skipToNext = () => {
    if (!currentSong || songs.length <= 1) return;
    
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
      
      <div className="container mx-auto flex items-center justify-between">
        {/* Song Info */}
        <div className="flex items-center space-x-3 flex-shrink-0">
          {currentSong.coverUrl && (
            <img
              src={currentSong.coverUrl}
              alt={currentSong.title}
              className="w-10 h-10 rounded bg-gray-800"
            />
          )}
          <div className="min-w-0">
            <h3 className={`${currentTheme.text} font-medium text-sm truncate`}>{currentSong.title}</h3>
            <p className="text-gray-300 text-xs truncate">{currentSong.artist}</p>
          </div>
        </div>

    {/* Controls */}
    <div className="flex-1 mx-6">
      {/* Regular Audio Controls */}
            <div className="flex items-center justify-between space-x-3">
              {/* Previous Button */}
              <button
                onClick={skipToPrevious}
                disabled={songs.length <= 1}
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
                disabled={songs.length <= 1}
                className={`${currentTheme.text} ${currentTheme.textHover} disabled:text-gray-600 disabled:opacity-50 text-sm font-bold flex-shrink-0 transition-colors`}
                title="Next song"
              >
                ⏭
              </button>
              
              {/* Progress Bar */}
              <div className="flex items-center space-x-3 flex-1">
                <span className="text-gray-300 text-sm w-10">{formatTime(currentTime)}</span>
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
                <span className="text-gray-300 text-sm w-10">{formatTime(duration)}</span>
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
                  className={`w-18 h-1.5 bg-gray-700 rounded-lg appearance-none`}
                  style={{
                    ['--thumb-color' as any]: currentTheme.primary,
                  } as React.CSSProperties}
                />
                <span className="text-gray-300 text-sm w-8">{Math.round(volume * 100)}%</span>
              </div>
            </div>
        </div>

        {/* Close Button */}
        <div className="flex-shrink-0">
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