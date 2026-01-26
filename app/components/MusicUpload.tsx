'use client';

import { useState, useEffect } from 'react';
import type { Song } from '../types/music';
import { useMusicLibrary } from '../context/MusicLibraryContext';
import { useUser } from '../context/UserContext';
import { useTheme } from '../context/ThemeContext';
import { useLastPlayed } from '../context/LastPlayedContext';
import { Notification } from './Notification';

interface PlayTrackData {
  name: string;
  artist: string;
  url: string;
  coverUrl?: string;
  songId: string;
}

interface WindowWithUploadedFiles extends Window {
  uploadedFiles?: Map<string, File>;
  playTrack?: (trackData: PlayTrackData) => void;
}

export default function MusicUpload() {
  const [uploading, setUploading] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const { songs: uploadedSongs, addSongs, removeSong } = useMusicLibrary();
  const { user } = useUser();
  const { currentTheme } = useTheme();
  const { playAudio, setCurrentSong, setIsPlaying, currentSong, isPlaying, togglePlay } = useLastPlayed();
  const [pageBgColor, setPageBgColor] = useState<string>('transparent');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const bg = getComputedStyle(document.body).backgroundColor || getComputedStyle(document.documentElement).backgroundColor;
      setPageBgColor(bg);
    }
  }, []);
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
    isVisible: boolean;
  }>({ message: '', type: 'success', isVisible: false });

  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setNotification({ message, type, isVisible: true });
  };

  const hideNotification = () => {
    setNotification(prev => ({ ...prev, isVisible: false }));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleUpload = async () => {
    setUploading(true);
    
    try {
      const newSongs: Song[] = [];
      
      for (const file of files) {
        if (file.type.startsWith('audio/')) {
          // Create a blob URL that we'll manage properly
          const audioUrl = URL.createObjectURL(file);
          const fileName = file.name.replace(/\.[^/.]+$/, '');
          
          // Calculate duration using audio element
          const duration = await new Promise<string>((resolve) => {
            const audio = new Audio(audioUrl);
            audio.addEventListener('loadedmetadata', () => {
              const minutes = Math.floor(audio.duration / 60);
              const seconds = Math.floor(audio.duration % 60);
              resolve(`${minutes}:${seconds.toString().padStart(2, '0')}`);
            });
            audio.addEventListener('error', () => {
              resolve('—'); // Fallback if duration can't be determined
            });
          });
          
          const song: Song = {
            id: `uploaded-${Date.now()}-${Math.random()}`,
            title: fileName,
            artist: 'Local Upload',
            duration: duration,
            audioUrl: audioUrl,
            coverUrl: undefined,
            userId: user?.id,
            uploadedBy: user?.username,
            uploadedAt: new Date().toISOString()
          };
          
          newSongs.push(song);
          
          // Store the file for later use if needed (client-side only)
          if (typeof window !== 'undefined') {
            // Initialize the uploadedFiles Map if it doesn't exist
            if (!(window as WindowWithUploadedFiles).uploadedFiles) {
              (window as WindowWithUploadedFiles).uploadedFiles = new Map();
            }
            
            // Store the file with the song ID for later blob URL regeneration
            (window as WindowWithUploadedFiles).uploadedFiles!.set(song.id, file);
            console.log(`📁 Stored file for song: ${song.title} (ID: ${song.id})`);
          }
        }
      }
      
      // Add songs to the global library
      addSongs(newSongs);
      
      setFiles([]);
      showNotification(`Successfully added ${newSongs.length} song(s) to your library! 🎉`, 'success');
    } catch {
      showNotification('Upload failed. Please try again.', 'error');
    }
    
    setUploading(false);
  };

  if (!user) {
    return (
      <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 text-center">
        <h2 className={`text-xl font-semibold mb-4 bg-gradient-to-r ${currentTheme.gradient} text-transparent bg-clip-text`}>
          Add Music
        </h2>
        <p className="text-gray-300 mb-4">Please log in to upload your music.</p>
        <p className="text-sm text-gray-400">Create an account to start building your personal music library!</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
      <h2 className={`text-xl font-semibold mb-4 bg-gradient-to-r ${currentTheme.gradient} text-transparent bg-clip-text`}>
        Add Music
      </h2>
      
      <div className="mb-4">
        <label className="block text-gray-300 mb-2">Select Audio Files</label>
        <div className="relative">
          <input
            type="file"
            accept="audio/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            id="audio-file-input"
          />
          <label
            htmlFor="audio-file-input"
            className={`inline-block ${currentTheme.bg} ${currentTheme.bgHover} text-gray-900 px-6 py-3 rounded-full font-semibold cursor-pointer transition-colors`}
          >
            Choose Audio Files
          </label>
          {files.length > 0 && (
            <span className="ml-3 text-gray-300 text-sm">
              {files.length} file{files.length !== 1 ? 's' : ''} selected
            </span>
          )}
        </div>
      </div>

      {files.length > 0 && (
        <div className="mb-4">
          <h3 className={`${currentTheme.text} mb-2`}>Selected Files:</h3>
          <ul className="space-y-2">
            {files.map((file, index) => (
              <li key={index} className="text-gray-300 text-sm">
                {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
              </li>
            ))}
          </ul>
        </div>
      )}

      <button
        onClick={handleUpload}
        disabled={files.length === 0 || uploading}
        className={`${currentTheme.bg} ${files.length === 0 || uploading ? 'opacity-50 cursor-not-allowed' : currentTheme.bgHover} text-gray-900 px-6 py-3 rounded-full font-semibold transition-all`}
      >
        {uploading ? 'Adding to Library...' : 'Add to Library'}
      </button>

      {uploadedSongs.length > 0 && (
        <div className="mt-6">
          <h3 className={`text-lg font-semibold mb-3 bg-gradient-to-r ${currentTheme.gradient} text-transparent bg-clip-text`}>
            Your Uploaded Music ({uploadedSongs.length} songs)
          </h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {uploadedSongs.map((song) => (
              <div key={song.id} className="flex items-center justify-between p-3 bg-gray-900 rounded border border-gray-700">
                <div className="flex-1">
                  <p className="text-gray-200 font-medium">{song.title}</p>
                  <p className={`${currentTheme.text} text-sm`}>{song.artist} • {song.duration}</p>
                </div>
                <div className="flex items-center gap-2">
                  {(() => {
                    const isThisPlaying = !!currentSong && currentSong.id === song.id && isPlaying;
                    return (
                      <button
                        onClick={() => {
                          console.log('🎵 Playing uploaded song:', song.title);

                          if (isThisPlaying) {
                            if (togglePlay) togglePlay();
                            else setIsPlaying(false);
                            return;
                          }

                          // Prefer context playAudio if available
                          if (playAudio) {
                            try {
                              playAudio(song);
                            } catch (e) {
                              console.error('Error calling playAudio from context', e);
                              showNotification('Player not ready. Please refresh the page and try again.', 'error');
                            }
                            return;
                          }

                          // Fallback: set current song and start playing
                          try {
                            setCurrentSong(song);
                            setIsPlaying(true);
                          } catch (e) {
                            console.error('Error setting current song directly', e);
                            showNotification('Player not ready. Please refresh the page and try again.', 'error');
                          }
                        }}
                        className={`w-8 h-8 rounded-full ${currentTheme.bg} ${currentTheme.bgHover} ${currentTheme.text} flex items-center justify-center hover:scale-105 transition-all`}
                        title={isThisPlaying ? 'Pause this song' : 'Play this song'}
                      >
                        <span style={{ color: pageBgColor }}>
                          {isThisPlaying ? (
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" className="w-4 h-4" aria-hidden="true">
                              <rect x="4" y="3" width="3" height="10" rx="1" fill="currentColor" />
                              <rect x="9" y="3" width="3" height="10" rx="1" fill="currentColor" />
                            </svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor" aria-hidden="true">
                              <path d="M8 5v14l11-7z" />
                            </svg>
                          )}
                        </span>
                      </button>
                    );
                  })()}
                  <button
                    onClick={() => {
                      removeSong(song.id);
                      
                      // Clean up stored file and blob URL
                      if (typeof window !== 'undefined') {
                        const windowWithFiles = window as typeof window & {uploadedFiles?: Map<string, File>};
                        if (windowWithFiles.uploadedFiles) {
                          windowWithFiles.uploadedFiles.delete(song.id);
                        }
                      }
                      if (song.audioUrl.startsWith('blob:')) {
                        URL.revokeObjectURL(song.audioUrl);
                      }
                    }}
                    className={`w-8 h-8 rounded-full ${currentTheme.bg} ${currentTheme.bgHover} ${currentTheme.text} flex items-center justify-center hover:scale-105 transition-all text-sm`}
                    title="Remove this song"
                  >
                    <span style={{ color: pageBgColor }}>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-4 h-4" aria-hidden="true">
                        <path d="M6 6 L18 18 M6 18 L18 6" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                      </svg>
                    </span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notification for cute messages */}
      <Notification
        message={notification.message}
        type={notification.type}
        isVisible={notification.isVisible}
        onClose={hideNotification}
        duration={3500}
      />
    </div>
  );
}