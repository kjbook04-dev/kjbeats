"use client";

import { useTheme } from '../context/ThemeContext';
import { useLastPlayed } from '../context/LastPlayedContext';

// Simplified play button: try the legacy global `playTrack` first, then
// fall back to the LastPlayedContext `playAudio` (PersistentPlayer).
interface TrackLike {
  id?: string;
  title: string;
  artist?: string;
  audioUrl?: string;
  coverUrl?: string;
  platform?: string;
}

interface UniversalPlayButtonProps {
  track: TrackLike;
  size?: 'small' | 'medium' | 'large';
  variant?: 'circle' | 'square' | 'text';
  className?: string;
  showTooltip?: boolean;
}

export default function UniversalPlayButton({
  track,
  size = 'medium',
  variant = 'circle',
  className = '',
  showTooltip = true
}: UniversalPlayButtonProps) {
  const { currentTheme } = useTheme();
  const { playAudio } = useLastPlayed();

  const isLoading = false;
  const isPlaying = false;

  const handleClick = () => {
    // Prefer the global playTrack if present (legacy), it may know how to
    // handle platform-specific playback. Otherwise, use PersistentPlayer
    // via LastPlayedContext's playAudio.
    if (typeof (window as any).playTrack === 'function') {
      try {
        (window as any).playTrack({
          title: track.title,
          artist: track.artist || '',
          audioUrl: track.audioUrl || '',
          id: track.id || `direct_${Date.now()}`,
        });
        return;
      } catch (e) {
        console.error('legacy playTrack failed', e);
      }
    }

    // Fallback: call the persisted player
    if (playAudio && track.audioUrl) {
      playAudio({
        id: track.id || `direct_${Date.now()}`,
        title: track.title,
        artist: track.artist || '',
        audioUrl: track.audioUrl,
        coverUrl: track.coverUrl || '',
        duration: '0'
      });
    } else {
      console.warn('No playback available for track', track);
    }
  };

  // Simple rendering: a circular button that triggers the playback handler.
  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className={`inline-flex items-center justify-center w-10 h-10 rounded-full ${currentTheme.bg} ${currentTheme.bgHover} text-white shadow ${className}`}
      title={showTooltip ? `Play ${track.title}` : undefined}
      aria-label={`Play ${track.title}`}
    >
      {isLoading ? (
        <div className="border-2 border-white border-t-transparent rounded-full animate-spin w-4 h-4" />
      ) : (
        <span className="text-base">▶</span>
      )}
    </button>
  );
}

// Convenience components for common use cases
export function SmallPlayButton(props: Omit<UniversalPlayButtonProps, 'size'>) {
  return <UniversalPlayButton {...props} size="small" />;
}

export function LargePlayButton(props: Omit<UniversalPlayButtonProps, 'size'>) {
  return <UniversalPlayButton {...props} size="large" />;
}

export function TextPlayButton(props: Omit<UniversalPlayButtonProps, 'variant'>) {
  return <UniversalPlayButton {...props} variant="text" />;
}

export function SquarePlayButton(props: Omit<UniversalPlayButtonProps, 'variant'>) {
  return <UniversalPlayButton {...props} variant="square" />;
}