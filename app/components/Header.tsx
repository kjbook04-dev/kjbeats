'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '../context/UserContext';
import { useTheme } from '../context/ThemeContext';
import { usePathname } from 'next/navigation';
import { AuthModal } from './AuthModal';
import { gradientTextStyle } from '../context/themeHelpers';
import { Notification } from './Notification';
import { collection, doc, onSnapshot, query, updateDoc, where } from 'firebase/firestore';
import { db } from '../lib/firebase';

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const { user, logout, clearFriendNotifications } = useUser();
  const { currentTheme } = useTheme();
  // Make the top/header logout a subtle see-through/ghost button on every page.
  const logoutClass = 'bg-transparent hover:bg-white/5 text-white px-3 py-1 rounded-md text-sm transition-colors border border-white/10';

  // Use helper-backed gradient text style (ThemeProvider ensures --theme-gradient exists)
  const gText = gradientTextStyle();
  const friendNotificationCount = user?.friendNotifications?.length || 0;
  const latestFriendNotification = user?.friendNotifications?.[user.friendNotifications.length - 1];
  const [showFriendToast, setShowFriendToast] = useState(false);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [showMessageToast, setShowMessageToast] = useState(false);
  const lastUnreadCountRef = useRef(0);

  useEffect(() => {
    if (friendNotificationCount > 0) {
      setShowFriendToast(true);
    }
  }, [friendNotificationCount]);

  useEffect(() => {
    if (!db || !user) {
      setUnreadMessageCount(0);
      return;
    }
    const dbClient = db;
    const convRef = collection(dbClient, 'conversations');
    const q = query(convRef, where('participants', 'array-contains', user.id));
    return onSnapshot(q, (snapshot) => {
      const reads = user.conversationReads && typeof user.conversationReads === 'object' ? user.conversationReads : {};
      let unread = 0;
      let hasNew = false;
      snapshot.docs.forEach((docSnap) => {
        const data = docSnap.data() as { updatedAt?: any };
        const updatedAt = data.updatedAt?.seconds ? data.updatedAt.seconds * 1000 : 0;
        const lastRead = reads[docSnap.id] ? Date.parse(reads[docSnap.id]) : 0;
        if (!lastRead && updatedAt) {
          // First time seeing this convo; mark as read to avoid false positives.
          updateDoc(doc(dbClient, 'users', user.id), {
            [`conversationReads.${docSnap.id}`]: new Date(updatedAt).toISOString(),
          }).catch(() => {});
          return;
        }
        if (updatedAt > lastRead) {
          unread += 1;
          hasNew = true;
        }
      });
      setUnreadMessageCount(unread);
      if (hasNew && unread > lastUnreadCountRef.current) {
        setShowMessageToast(true);
      }
      if (unread === 0) {
        setShowMessageToast(false);
      }
      lastUnreadCountRef.current = unread;
    });
  }, [user]);

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

        {/* Mobile menu button removed; bottom tabs handle mobile navigation */}

        {/* Navigation links */}
        <nav
          className={`hidden md:block absolute md:relative top-16 md:top-0 left-0 right-0 bg-black/90 backdrop-blur border-b border-white/10 md:border-0 md:bg-transparent z-40 max-h-[70vh] overflow-y-auto md:max-h-none md:overflow-visible`}
        >
          <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-8 p-4 md:p-0">
            <ul className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-8">
              <li>
                <Link href="/" className={`${currentTheme.text} ${currentTheme.textHover}`} onClick={() => setIsMenuOpen(false)}>
                  <span style={gText}>Home</span>
                </Link>
              </li>
              {/* Library tab removed per request */}
              {user && (
                <li>
        <Link href="/playlists" className={`${currentTheme.text} ${currentTheme.textHover}`} onClick={() => setIsMenuOpen(false)}>
        <span style={gText}>Playlists</span>
        </Link>
                </li>
              )}
              {user && (
                <li>
                  <Link href="/manage" className={`${currentTheme.text} ${currentTheme.textHover}`} onClick={() => setIsMenuOpen(false)}>
                    <span style={gText}>Manage Music</span>
                  </Link>
                </li>
              )}
              {user && (
                <li>
                  <Link
                    href="/friends"
                    className={`${currentTheme.text} ${currentTheme.textHover}`}
                    onClick={() => {
                      clearFriendNotifications();
                      setShowFriendToast(false);
                      setIsMenuOpen(false);
                    }}
                  >
                    <span className="relative inline-flex items-center" style={gText}>
                      Friends
                      {(friendNotificationCount > 0 || unreadMessageCount > 0) && (
                        <span
                          className="absolute -top-2 -right-3 min-w-[1.1rem] h-4 px-1 rounded-full text-[10px] leading-4 text-white text-center bg-red-500"
                        >
                          {friendNotificationCount + unreadMessageCount > 9 ? '9+' : friendNotificationCount + unreadMessageCount}
                        </span>
                      )}
                    </span>
                  </Link>
                </li>
              )}
              <li>
                <Link href="/about" className={`${currentTheme.text} ${currentTheme.textHover}`} onClick={() => setIsMenuOpen(false)}>
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
                                <div
                                  className={`w-8 h-8 aspect-square rounded-full ${user.profilePicture ? 'border-0' : `border-2 ${currentTheme.border}`} shadow-sm overflow-hidden flex items-center justify-center cursor-pointer`}
                                  role="button"
                                  tabIndex={0}
                                  onClick={() => router.push('/profile')}
                                  onKeyDown={(e) => { if (e.key === 'Enter') router.push('/profile'); }}
                                >
                                  <img src={user.profilePicture} alt="Profile" className="w-full h-full object-cover" />
                                </div>
                              ) : (
                                // Match the profile page's "circle-in-a-circle" placeholder but scaled for the header.
                                <div
                                  className={`w-8 h-8 aspect-square rounded-full border-2 ${currentTheme.border} shadow-sm overflow-hidden relative flex items-center justify-center cursor-pointer`}
                                  role="button"
                                  tabIndex={0}
                                  onClick={() => router.push('/profile')}
                                  onKeyDown={(e) => { if (e.key === 'Enter') router.push('/profile'); }}
                                >
                                  {/* inner dark "cutout" circle with plus icon to match profile placeholder */}
                                  <div className="w-6 h-6 aspect-square rounded-full bg-gray-900 flex items-center justify-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-4 h-4 text-white" fill="none" stroke="white">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                    </svg>
                                  </div>
                                  {/* subtle crescent shadow at top-left to mimic profile shading */}
                                  <div className="absolute -top-0.5 -left-0.5 w-3 h-3 rounded-full bg-black/30 transform rotate-6" />
                                </div>
                              )}
                              <span className={currentTheme.text}>{user.firstName || user.username}</span>
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

        <Notification
          message={
            latestFriendNotification?.type === 'friend_accepted'
              ? `${latestFriendNotification.from} accepted your friend request.`
              : latestFriendNotification?.type === 'friend_request'
                ? `New friend request from ${latestFriendNotification.from}.`
                : `You have ${friendNotificationCount} new friend ${friendNotificationCount === 1 ? 'update' : 'updates'}.`
          }
          type="success"
          isVisible={showFriendToast}
          onClose={() => setShowFriendToast(false)}
        />
        <Notification
          message={`You have ${unreadMessageCount} new message${unreadMessageCount === 1 ? '' : 's'}.`}
          type="success"
          isVisible={showMessageToast && unreadMessageCount > 0}
          onClose={() => setShowMessageToast(false)}
        />

        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          initialMode={authMode}
        />
      </div>

      {/* Mobile bottom tabs */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-gray-900/90 backdrop-blur">
        <nav className="mx-auto max-w-screen-sm px-2">
          <ul className="grid grid-cols-5 py-2">
            <li>
              <Link href="/" className="flex flex-col items-center gap-1 text-[10px]" onClick={() => setIsMenuOpen(false)}>
                <svg viewBox="0 0 24 24" className={`h-5 w-5 ${pathname === '/' ? currentTheme.text : 'text-gray-400'}`} aria-hidden="true">
                  <path d="M3 10.5L12 3l9 7.5V21a1 1 0 0 1-1 1h-6v-6H10v6H4a1 1 0 0 1-1-1v-10.5z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
                </svg>
                <span className={`${pathname === '/' ? currentTheme.text : 'text-gray-400'}`}>Home</span>
              </Link>
            </li>
            <li>
              <Link href="/playlists" className="flex flex-col items-center gap-1 text-[10px]" onClick={() => setIsMenuOpen(false)}>
                <svg viewBox="0 0 24 24" className={`h-5 w-5 ${pathname?.startsWith('/playlists') ? currentTheme.text : 'text-gray-400'}`} aria-hidden="true">
                  <path d="M4 6h12M4 12h12M4 18h8" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
                <span className={`${pathname?.startsWith('/playlists') ? currentTheme.text : 'text-gray-400'}`}>Playlists</span>
              </Link>
            </li>
            <li>
              <Link href="/manage" className="flex flex-col items-center gap-1 text-[10px]" onClick={() => setIsMenuOpen(false)}>
                <svg viewBox="0 0 24 24" className={`h-5 w-5 ${pathname === '/manage' ? currentTheme.text : 'text-gray-400'}`} aria-hidden="true">
                  <path d="M10 4v11.2a3 3 0 1 1-2-2.83V6.2l10-2v8.7a3 3 0 1 1-2-2.83V5.4l-6 1.2" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className={`${pathname === '/manage' ? currentTheme.text : 'text-gray-400'}`}>Music</span>
              </Link>
            </li>
            <li>
              <Link
                href="/friends"
                className="relative flex flex-col items-center gap-1 text-[10px]"
                onClick={() => {
                  clearFriendNotifications();
                  setShowFriendToast(false);
                  setIsMenuOpen(false);
                }}
              >
                <svg viewBox="0 0 24 24" className={`h-5 w-5 ${pathname === '/friends' ? currentTheme.text : 'text-gray-400'}`} aria-hidden="true">
                  <path d="M7 13a3 3 0 1 0-3-3 3 3 0 0 0 3 3zm10 0a3 3 0 1 0-3-3 3 3 0 0 0 3 3zM4 20a4 4 0 0 1 6-3.4M14 20a4 4 0 0 1 6-3.4" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
                <span className={`${pathname === '/friends' ? currentTheme.text : 'text-gray-400'}`}>Friends</span>
                {(friendNotificationCount > 0 || unreadMessageCount > 0) && (
                  <span className="absolute -top-1 right-3 min-w-[1.1rem] h-4 px-1 rounded-full text-[10px] leading-4 text-white text-center bg-red-500">
                    {friendNotificationCount + unreadMessageCount > 9 ? '9+' : friendNotificationCount + unreadMessageCount}
                  </span>
                )}
              </Link>
            </li>
            <li>
              <Link href="/profile" className="flex flex-col items-center gap-1 text-[10px]" onClick={() => setIsMenuOpen(false)}>
                <svg viewBox="0 0 24 24" className={`h-5 w-5 ${pathname === '/profile' ? currentTheme.text : 'text-gray-400'}`} aria-hidden="true">
                  <path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4zm-7 8a7 7 0 0 1 14 0" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                <span className={`${pathname === '/profile' ? currentTheme.text : 'text-gray-400'}`}>Profile</span>
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
