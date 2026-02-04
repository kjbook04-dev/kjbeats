'use client';

import { useUser } from '../context/UserContext';
import { useMusicLibrary } from '../context/MusicLibraryContext';
import { useTheme } from '../context/ThemeContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ProfilePictureUpload } from '../components/ProfilePictureUpload';
import { gradientTextStyle, gradientBgStyle } from '../context/themeHelpers';
import { ColorPicker } from '../components/ColorPicker';
import { ProfileStatsTopTracks } from '../components/ProfileStatsTopTracks';
import { ProfileFriends } from '../components/ProfileFriends';
import { Notification } from '../components/Notification';


export default function ProfilePage() {
  const { user, logout, updateProfilePicture, updateUserProfile } = useUser();
  const { songs } = useMusicLibrary();
  const { currentTheme } = useTheme();
  const router = useRouter();
  const [isUpdatingPicture, setIsUpdatingPicture] = useState(false);
  const [bio, setBio] = useState(user?.bio || '');
  const [website, setWebsite] = useState(user?.website || '');
  const [publicProfile, setPublicProfile] = useState<boolean>(!!user?.publicProfile);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const gText = gradientTextStyle();
  const gBg = gradientBgStyle();
  const [pageBgColor, setPageBgColor] = useState<string>('transparent');

  useEffect(() => {
    try {
      const color = getComputedStyle(document.body).backgroundColor;
      setPageBgColor(color || 'transparent');
    } catch (e) {
      setPageBgColor('transparent');
    }
  }, []);

  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info'; isVisible: boolean }>({
    message: '',
    type: 'success',
    isVisible: false,
  });

  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setNotification({ message, type, isVisible: true });
  };

  const hideNotification = () => {
    setNotification((prev) => ({ ...prev, isVisible: false }));
  };

  const handleSaveProfile = async () => {
    setIsSavingProfile(true);
    const ok = await updateUserProfile({ bio, website, publicProfile });
    setIsSavingProfile(false);
    if (!ok) {
      showNotification('Failed to save profile info', 'error');
    } else {
      showNotification('Profile changes saved', 'success');
    }
  };

  useEffect(() => {
    // sync when user changes (e.g. after update)
    if (!user) return;
    setBio(user.bio || '');
    setWebsite(user.website || '');
    setPublicProfile(!!user.publicProfile);
  }, [user]);

  useEffect(() => {
    if (!user) {
      router.push('/');
    }
  }, [user, router]);

  if (!user) {
    return <div>Loading...</div>;
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleProfilePictureUpdate = async (imageFile: File) => {
    setIsUpdatingPicture(true);
    const success = await updateProfilePicture(imageFile);
    if (success) {
      // Profile picture updated successfully
    } else {
      alert('Failed to update profile picture. Please try again.');
    }
    setIsUpdatingPicture(false);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Profile Header / Cover */}
      <div className="rounded-lg overflow-hidden mb-6 card">
            <div
              className="w-full h-36 md:h-44"
          style={currentTheme.backgroundCss ? { background: currentTheme.backgroundCss } : { background: `linear-gradient(90deg, ${currentTheme.primary}, ${currentTheme.secondary})` }}
        />
      <div className="-mt-2 px-4 pb-4 flex flex-wrap items-end sm:items-center justify-between gap-3 sm:gap-4">
              <div className="flex items-end gap-4 min-w-0">
            <div className={`w-20 h-20 md:w-28 md:h-28 aspect-square rounded-full ${user.profilePicture ? 'border-0' : `border-4 ${currentTheme.border}`} shadow-lg overflow-hidden bg-gray-800 relative -mt-4 z-20`}>
              <ProfilePictureUpload currentImage={user.profilePicture} originalImage={user.profilePictureOriginal || user.profilePicture} onImageSelect={handleProfilePictureUpdate} className="w-full h-full" />
            </div>
            <div className="min-w-0 mt-2 sm:mt-0">
              <h1 className="text-2xl md:text-3xl font-bold text-white break-words mt-2 sm:mt-0">{user.firstName || user.username}</h1>
              <p className="muted">@{user.username} • Member since {formatDate(user.createdAt)}</p>
            </div>
          </div>
          <div className="flex w-full sm:w-auto items-center justify-end gap-3 mt-2 sm:mt-5 sm:ml-auto">
            <button
              onClick={logout}
              className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-md text-sm transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
      {/* Notification */}
      <Notification
        message={notification.message}
        type={notification.type}
        isVisible={notification.isVisible}
        onClose={hideNotification}
        duration={3500}
      />

      {/* Profile Card */}
  <div className="card mb-6 p-3" style={{ paddingBottom: 'calc(1rem - 10px)' }}>
  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 items-stretch">
      <div className="md:col-span-2 flex flex-col h-full justify-between md:min-h-[calc(20rem-15px)]">
        {/* Top: heading + email */}
        <div>
          <h3 className={`text-lg font-semibold mb-2 ${currentTheme.text}`}>Account</h3>
          <div className="mb-3">
            <div className="text-sm font-medium">
              <div className="mt-1">
                <input
                  readOnly
                  value={user.email}
                  className={`input w-full text-sm rounded-md pl-2 py-2 border ${currentTheme.border} bg-gray-900 text-white`}
                />
              </div>
            </div>
          </div>
        </div>

    {/* Middle: Short bio - sits between top and bottom due to parent justify-between */}
    <div className="flex-1 flex items-center mb-3 md:-mt-6">
          <div className="w-full">
            <label className="card-sub mb-1">Short bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              onFocus={(e) => e.currentTarget.select()}
              placeholder="Tell people a bit about yourself"
              className={`input mt-1 text-sm leading-5 w-full h-24 md:h-32 resize-y pl-2 py-2 border ${currentTheme.border} focus:outline-none focus:ring-2 focus:ring-[var(--accent)] bg-gray-900 text-white rounded-md`}
              rows={5}
            />
          </div>
        </div>

  {/* Bottom: Website / Friends / Visibility / Save */}
  <div className="md:-mt-6">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
            <div className="md:col-span-2 space-y-4">
              <div>
                <label className="card-sub mb-1">Website / Link</label>
                <div className="flex mt-1">
                  <input
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://your-site.example"
                    className={`input flex-1 text-sm rounded-l-md pl-2 py-2 border ${currentTheme.border} focus:outline-none focus:ring-2 focus:ring-[var(--accent)] bg-gray-900 text-white`}
                  />
                  <button
                    onClick={() => { if (website) window.open(website.startsWith('http') ? website : `https://${website}`, '_blank'); }}
                    className={`rounded-r-md px-3 hover:scale-105 transition-all`}
                    style={gBg}
                    title="Open link"
                  >
                    <span style={{ color: pageBgColor }}>↗</span>
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <label className="card-sub mb-1">Profile Visibility</label>
                  <div className="mt-1">
                    <button
                      onClick={() => {
                        setPublicProfile(p => {
                          const next = !p;
                          showNotification(next ? 'Profile set to public' : 'Profile set to private', 'success');
                          return next;
                        });
                      }}
                      className={`px-2 py-1 h-8 text-sm rounded-md`}
                      style={publicProfile ? gBg : undefined}
                    >
                      {publicProfile ? <span style={{ color: pageBgColor }}>Public</span> : 'Private'}
                    </button>
                  </div>
                </div>

                <div className="ml-auto">
                  <button
                    onClick={handleSaveProfile}
                    className={`px-3 py-1 h-8 text-sm rounded-md hover:scale-105 transition-all`}
                    style={gBg}
                  >
                    <span style={{ color: pageBgColor }}>{isSavingProfile ? 'Saving...' : 'Save profile'}</span>
                  </button>
                </div>
              </div>
            </div>
            <div className="md:col-span-1 min-w-0">
              <ProfileFriends compact />
            </div>
          </div>
        </div>
      </div>

          {/* Theme Customization */}
                <div className="self-start flex flex-col justify-start md:min-h-[calc(20rem+16px)]">
            <div className="mb-0 flex h-full flex-col">
              <h3 className={`text-lg font-semibold mb-2 ${currentTheme.text}`}>Theme</h3>
              
                 <div className="card pt-1 pb-3 px-3 flex flex-1 flex-col" style={{ transform: 'translateY(0px)' }}>
                <div className="-mt-2" style={{ minHeight: 'calc(9rem + 20px)' }}>
                  <ColorPicker />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Expanded Top Tracks (moved below stats to sit directly above the music library) */}

  {/* Music Library Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gray-800 p-6 rounded-lg">
          <h3 className={`text-lg font-semibold ${currentTheme.text} mb-2`}>Total Songs</h3>
          <p className="text-3xl font-bold text-white">{songs.length}</p>
        </div>
        <div className="bg-gray-800 p-6 rounded-lg">
          <h3 className={`text-lg font-semibold ${currentTheme.text} mb-2`}>Total Duration</h3>
          <p className="text-3xl font-bold text-white">
            {songs.reduce((total, song) => {
              const [minutes, seconds] = song.duration.split(':').map(Number);
              return total + minutes + (seconds / 60);
            }, 0).toFixed(0)} min
          </p>
        </div>
        <div className="bg-gray-800 p-6 rounded-lg">
          <h3 className={`text-lg font-semibold ${currentTheme.text} mb-2`}>Recent Uploads</h3>
          <p className="text-3xl font-bold text-white">
            {songs.filter(song => {
              if (!song.uploadedAt) return false;
              const uploadDate = new Date(song.uploadedAt);
              const weekAgo = new Date();
              weekAgo.setDate(weekAgo.getDate() - 7);
              return uploadDate > weekAgo;
            }).length}
          </p>
        </div>
      </div>

      {/* Top Tracks (component renders its own heading/card) */}
      <div className="mb-8">
        <ProfileStatsTopTracks />
      </div>

      {/* (Friends removed) */}

      {/* Your Music Library removed from profile page per request */}
    </div>
  );
}
