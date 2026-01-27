'use client';

import { useEffect, useState } from 'react';
import MusicUpload from '../components/MusicUpload';
import { useTheme } from '../context/ThemeContext';
import { useMusicLibrary } from '../context/MusicLibraryContext';
import { useLastPlayed } from '../context/LastPlayedContext';
import { useUser } from '../context/UserContext';
import { AuthModal } from '../components/AuthModal';

export default function ManageMusicPage() {
  const { currentTheme } = useTheme();
  const { songs, removeSong } = useMusicLibrary();
  const { playAudio, currentSong, isPlaying, togglePlay, setCurrentSong, setIsPlaying } = useLastPlayed();
  const [pageBgColor, setPageBgColor] = useState<string>('transparent');
  const { user } = useUser();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const bg = getComputedStyle(document.body).backgroundColor || getComputedStyle(document.documentElement).backgroundColor;
      setPageBgColor(bg);
    }
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className={`text-4xl font-bold mb-8 bg-gradient-to-r ${currentTheme.gradient} text-transparent bg-clip-text`}>
        Manage Music
      </h1>

      <div className="max-w-4xl mx-auto space-y-8">
        {/* Simple layout: Library + Upload only */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <h3 className={`text-xl font-semibold mb-3 ${currentTheme.text}`}>Your Library</h3>
            <p className="text-gray-300 mb-4">View and manage your saved music collection</p>

            {songs.length === 0 ? (
              <div className="text-gray-400">No songs yet. Upload something to see it here.</div>
            ) : (
              <div className="space-y-3">
                {songs.map((s) => (
                  <div key={s.id} className="flex items-center justify-between bg-gray-900 p-2 rounded">
                    <div className="min-w-0">
                      <div className="text-white truncate font-semibold">{s.title}</div>
                      <div className="text-gray-400 text-sm truncate">{s.artist}</div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      {(() => {
                        const isThisPlaying = !!currentSong && currentSong.id === s.id && isPlaying;
                        return (
                          <button
                            onClick={() => {
                              if (isThisPlaying) {
                                if (togglePlay) togglePlay();
                                else setIsPlaying(false);
                                return;
                              }

                              if (playAudio) {
                                playAudio(s);
                              } else {
                                // fallback
                                setCurrentSong(s);
                                setIsPlaying(true);
                              }
                            }}
                            className={`w-9 h-9 rounded-full ${currentTheme.bg} ${currentTheme.bgHover} text-gray-300 flex items-center justify-center hover:scale-105 transition-all`}
                            title={isThisPlaying ? 'Pause' : 'Play'}
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
                        onClick={() => removeSong(s.id)}
                        className={`w-9 h-9 rounded-full ${currentTheme.bg} ${currentTheme.bgHover} ${currentTheme.text} flex items-center justify-center hover:scale-105 transition-all`}
                        title="Remove"
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
            )}
          </div>

          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <h3 className={`text-xl font-semibold mb-3 ${currentTheme.text}`}>Upload Your Music</h3>
            <p className="text-gray-300 mb-4">Upload audio files to add to your personal collection.</p>
            <div>
              {user ? (
                <MusicUpload />
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-400 mb-4">Please login to upload your music.</p>
                  <div className="flex items-center justify-center gap-4">
                    <button
                      onClick={() => { setAuthMode('login'); setShowAuthModal(true); }}
                      className={`${currentTheme.text} ${currentTheme.textHover} px-4 py-2 rounded-md`}
                    >
                      Login
                    </button>
                    <button
                      onClick={() => { setAuthMode('signup'); setShowAuthModal(true); }}
                      className={`${currentTheme.bg} ${currentTheme.bgHover} text-white px-4 py-2 rounded-md`}
                    >
                      Sign Up
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode={authMode}
      />
    </div>
  );
}