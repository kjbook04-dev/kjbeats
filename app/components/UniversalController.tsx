'use client';

import { useUniversalPlayer } from '../context/UniversalPlayerContext';
import { useTheme } from '../context/ThemeContext';

export default function UniversalController() {
  const { state, pause, resume, stop, seekTo, setVolume, toggleMute } = useUniversalPlayer();
  const { currentTheme } = useTheme();

  console.log('🎵 UNIVERSAL CONTROLLER: Rendering');
  console.log('🎵 Current track:', state.currentTrack?.title);
  console.log('🎵 Is playing:', state.isPlaying);
  console.log('🎵 Platform:', state.currentTrack?.platform);

  const handlePlayPause = () => {
    console.log('🎵 UNIVERSAL CONTROLLER: Play/pause clicked');
    if (state.isPlaying) {
      pause();
    } else {
      resume();
    }
  };

  const handleStop = () => {
    console.log('🎵 UNIVERSAL CONTROLLER: Stop clicked');
    stop();
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!state.duration) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    const newTime = percentage * state.duration;
    
    console.log('🎵 UNIVERSAL CONTROLLER: Seeking to', newTime);
    seekTo(newTime);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseInt(e.target.value);
    console.log('🎵 UNIVERSAL CONTROLLER: Volume changed to', newVolume);
    setVolume(newVolume);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercentage = state.duration > 0 ? (state.currentTime / state.duration) * 100 : 0;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-700 p-4 z-50">
      {state.error && (
        <div className="bg-red-600 text-white p-2 rounded mb-2 text-sm">
          Error: {state.error}
        </div>
      )}
      
      <div className="container mx-auto">
        {!state.currentTrack ? (
          <div className="text-center">
            <p className="text-gray-400 text-sm">
              🎵 Universal Player Ready - All Platforms
            </p>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            {/* Song Info */}
            <div className="flex items-center space-x-3 flex-shrink-0 min-w-0 flex-1">
              {state.currentTrack.thumbnail && (
                <img
                  src={state.currentTrack.thumbnail}
                  alt="Track thumbnail"
                  className="w-12 h-12 rounded bg-gray-800 object-cover"
                  onError={(e) => {
                    console.log('🎵 UNIVERSAL CONTROLLER: Thumbnail failed to load');
                    e.currentTarget.style.display = 'none';
                  }}
                />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-white text-sm font-medium truncate">
                  {state.currentTrack.title}
                </p>
                <p className="text-gray-400 text-xs truncate">
                  {state.currentTrack.artist}
                </p>
                <div className="flex items-center space-x-2 mt-1">
                  <span className={`text-xs px-2 py-1 rounded ${
                    state.currentTrack!.platform === 'youtube' ? 'bg-red-600' :
                    state.currentTrack!.platform === 'spotify' ? 'bg-green-600' :
                    state.currentTrack!.platform === 'soundcloud' ? 'bg-orange-600' :
                    'bg-gray-600'
                  } text-white`}>
                    {(state.currentTrack!.platform || 'direct').toUpperCase()}
                  </span>
                  {state.isLoading && (
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                      <span className="text-gray-400 text-xs">Loading...</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Center Controls */}
            <div className="flex items-center space-x-4 flex-shrink-0">
              {/* Stop Button */}
              <button
                onClick={handleStop}
                className="w-8 h-8 rounded-full bg-gray-700 hover:bg-gray-600 flex items-center justify-center text-white transition-all"
                title="Stop"
              >
                ⏹️
              </button>

              {/* Play/Pause Button */}
              <button
                onClick={handlePlayPause}
                disabled={state.isLoading}
                className={`w-10 h-10 rounded-full bg-gradient-to-r ${currentTheme.gradient} hover:scale-105 flex items-center justify-center text-gray-900 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed`}
                title={state.isPlaying ? "Pause" : "Play"}
              >
                {state.isLoading ? (
                  <div className="w-4 h-4 border-2 border-gray-900 border-t-transparent rounded-full animate-spin"></div>
                ) : state.isPlaying ? (
                  '⏸️'
                ) : (
                  '▶️'
                )}
              </button>

              {/* Progress Display */}
              <div className="text-white text-xs whitespace-nowrap">
                {formatTime(state.currentTime)} / {formatTime(state.duration)}
              </div>
            </div>

            {/* Volume Controls */}
            <div className="flex items-center space-x-2 flex-shrink-0">
              <button
                onClick={toggleMute}
                className="text-white hover:text-gray-300 transition-colors"
                title={state.isMuted ? "Unmute" : "Mute"}
              >
                {state.isMuted || state.volume === 0 ? '🔇' : state.volume < 50 ? '🔉' : '🔊'}
              </button>
              <input
                type="range"
                min="0"
                max="100"
                value={state.volume}
                onChange={handleVolumeChange}
                className="w-20 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                title={`Volume: ${state.volume}%`}
              />
            </div>
          </div>
        )}

        {/* Progress Bar */}
        {state.currentTrack && state.duration > 0 && (
          <div className="mt-3">
            <div
              onClick={handleProgressClick}
              className="w-full h-2 bg-gray-700 rounded-full cursor-pointer hover:bg-gray-600 transition-colors"
              title="Click to seek"
            >
              <div
                    className={`h-full bg-gradient-to-r ${currentTheme.gradient} rounded-full transition-all duration-300`}
                    style={{ width: `${progressPercentage}%` }}
                  />
            </div>
          </div>
        )}

        {/* Platform-Specific Info */}
        {state.currentTrack && (
          <div className="mt-2 text-center">
            <p className="text-gray-500 text-xs">
              {state.currentTrack.platform === 'youtube' && '🎥 Playing from YouTube'}
              {state.currentTrack.platform === 'spotify' && '🎵 Playing from Spotify'}
              {state.currentTrack.platform === 'soundcloud' && '☁️ Playing from SoundCloud'}
              {state.currentTrack.platform === 'direct' && '🎶 Playing direct audio'}
              {state.isPlaying && (
                <span className="ml-2 animate-pulse">♪</span>
              )}
            </p>
          </div>
        )}
      </div>

      {/* Custom Styles for the volume slider */}
          <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: linear-gradient(to right, ${currentTheme.gradient.split(' ')[1]}, ${currentTheme.gradient.split(' ')[2]});
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }
        .slider::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: linear-gradient(to right, ${currentTheme.gradient.split(' ')[1]}, ${currentTheme.gradient.split(' ')[2]});
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }
      `}</style>
    </div>
  );
}