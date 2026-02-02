'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '../context/UserContext';
import { useTheme } from '../context/ThemeContext';
import { usePathname } from 'next/navigation';
import { AuthModal } from './AuthModal';
import { gradientTextStyle } from '../context/themeHelpers';

export default function Header() {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const { user, logout } = useUser();
  const { currentTheme } = useTheme();
  // Make the top/header logout a subtle see-through/ghost button on every page.
  const logoutClass = 'bg-transparent hover:bg-white/5 text-white px-3 py-1 rounded-md text-sm transition-colors border border-white/10';

  // Use helper-backed gradient text style (ThemeProvider ensures --theme-gradient exists)
  const gText = gradientTextStyle();

  return (
    <header className="bg-gray-900 p-4">
      <div className="container mx-auto flex justify-between items-center">
  <Link href="/" className={`text-2xl font-bold flex items-center`} style={gText}>
          <svg
            aria-hidden="true"
            role="img"
            className="w-8 h-8 mr-2 flex-shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <title>KJBeats headphones</title>
            <defs>
              <linearGradient id="kjbeats-logo-grad" x1="0" x2="1">
                <stop offset="0%" stopColor={currentTheme.primary} />
                <stop offset="100%" stopColor={currentTheme.secondary} />
              </linearGradient>
            </defs>
            {/* band */}
            <path d="M4 12a8 8 0 0116 0v1" stroke="url(#kjbeats-logo-grad)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            {/* left earcup */}
            <path d="M5 13.5v2.5a2 2 0 002 2h0a1 1 0 001-1v-3a2 2 0 00-2-2H6a1 1 0 00-1 1z" stroke="url(#kjbeats-logo-grad)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            {/* right earcup */}
            <path d="M19 13.5v2.5a2 2 0 01-2 2h0a1 1 0 01-1-1v-3a2 2 0 012-2h0a1 1 0 011 1z" stroke="url(#kjbeats-logo-grad)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </svg>
          <span style={gText}>KJBeats</span>
        </Link>

        {/* Mobile menu button */}
        <button
          className="md:hidden"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          <svg
            className="w-6 h-6"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            {isMenuOpen ? (
              <path d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>

        {/* Navigation links */}
        <nav
          className={`${
            isMenuOpen ? 'block' : 'hidden'
          } md:block absolute md:relative top-16 md:top-0 left-0 right-0 bg-black md:bg-transparent`}
        >
          <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-8 p-4 md:p-0">
            <ul className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-8">
              <li>
                <Link href="/" className={`${currentTheme.text} ${currentTheme.textHover}`}>
                  <span style={gText}>Home</span>
                </Link>
              </li>
              {/* Library tab removed per request */}
              {user && (
                <li>
        <Link href="/playlists" className={`${currentTheme.text} ${currentTheme.textHover}`}>
        <span style={gText}>Playlists</span>
        </Link>
                </li>
              )}
              {user && (
                <li>
                  <Link href="/manage" className={`${currentTheme.text} ${currentTheme.textHover}`}>
                    <span style={gText}>Manage Music</span>
                  </Link>
                </li>
              )}
              {user && (
                <li>
                  <Link href="/friends" className={`${currentTheme.text} ${currentTheme.textHover}`}>
                    <span style={gText}>Friends</span>
                  </Link>
                </li>
              )}
              <li>
                <Link href="/about" className={`${currentTheme.text} ${currentTheme.textHover}`}>
                  <span style={gText}>About</span>
                </Link>
              </li>
            </ul>
            
            {/* Auth Section */}
            <div className="flex items-center space-x-4">
              {user ? (
                <div className="flex items-center space-x-4">
                  <Link href="/profile" className={`flex items-center space-x-2 ${currentTheme.text} ${currentTheme.textHover} transition-colors`}>
                              {user.profilePicture ? (
                                // Show a small bordered circular avatar whose inner color matches the current theme
                                <div
                                    className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${currentTheme.border} shadow-sm cursor-pointer`}
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => router.push('/profile')}
                                    onKeyDown={(e) => { if (e.key === 'Enter') router.push('/profile'); }}
                                  >
                                      {/* centered dark "cutout" inner circle with plus icon */}
                                      <div className="w-6 h-6 rounded-full bg-gray-900 flex items-center justify-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-4 h-4 text-white" fill="none" stroke="white">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                        </svg>
                                      </div>
                                    </div>
                              ) : (
                                // Match the profile page's "circle-in-a-circle" placeholder but scaled for the header.
                                <div
                                  className={`w-8 h-8 rounded-full border-2 ${currentTheme.border} shadow-sm overflow-hidden relative flex items-center justify-center cursor-pointer`}
                                  role="button"
                                  tabIndex={0}
                                  onClick={() => router.push('/profile')}
                                  onKeyDown={(e) => { if (e.key === 'Enter') router.push('/profile'); }}
                                >
                                  {/* inner dark "cutout" circle with plus icon to match profile placeholder */}
                                  <div className="w-6 h-6 rounded-full bg-gray-900 flex items-center justify-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-4 h-4 text-white" fill="none" stroke="white">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                    </svg>
                                  </div>
                                  {/* subtle crescent shadow at top-left to mimic profile shading */}
                                  <div className="absolute -top-0.5 -left-0.5 w-3 h-3 rounded-full bg-black/30 transform rotate-6" />
                                </div>
                              )}
                              <span style={gText}>{user.firstName || user.username}</span>
                  </Link>
                  <button
                    onClick={logout}
                    className={logoutClass}
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      setAuthMode('login');
                      setShowAuthModal(true);
                    }}
                    className="px-3 py-1 text-sm transition-colors hover:opacity-80"
                    style={{ color: currentTheme.primary }}
                  >
                    Login
                  </button>
                  <button
                    onClick={() => {
                      setAuthMode('signup');
                      setShowAuthModal(true);
                    }}
                    className={`${currentTheme.bg} ${currentTheme.bgHover} text-gray-900 px-3 py-1 rounded-md text-sm transition-colors`}
                  >
                    Sign Up
                  </button>
                </div>
              )}
            </div>
          </div>
        </nav>
        
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          initialMode={authMode}
        />
      </div>
    </header>
  );
}
