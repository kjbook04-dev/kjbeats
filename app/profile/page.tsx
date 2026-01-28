'use client';

import { useUser } from '../context/UserContext';
import { useMusicLibrary } from '../context/MusicLibraryContext';
import { useTheme } from '../context/ThemeContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ProfilePictureUpload } from '../components/ProfilePictureUpload';
import { ColorPicker } from '../components/ColorPicker';
import { ProfileStatsTopTracks } from '../components/ProfileStatsTopTracks';
import { ProfileFriends } from '../components/ProfileFriends';

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
    <div className="container p-6 max-w-6xl mt-12">
      {/* Profile Header / Cover */}
      <div className="rounded-lg overflow-hidden mb-8 card">
        <div
          className="w-full h-40 md:h-44"
          style={currentTheme.backgroundCss ? { background: currentTheme.backgroundCss } : { background: `linear-gradient(90deg, ${currentTheme.primary}, ${currentTheme.secondary})` }}
        />
  <div className="-mt-2 px-6 pb-6 flex items-end justify-between">
          <div className="flex items-end gap-4">
            <div className="w-24 h-24 md:w-28 md:h-28 rounded-full border-4 border-white shadow-lg overflow-hidden bg-gray-800 relative -mt-1 z-20">
              <ProfilePictureUpload onImageSelect={handleProfilePictureUpdate} />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">{user.firstName || user.username}</h1>
              <p className="muted">@{user.username} • Member since {formatDate(user.createdAt)}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 -mt-3">
            <button
              onClick={logout}
              className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-md text-sm transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Profile Card */}
  <div className="card mb-8 p-4" style={{ paddingBottom: 'calc(1rem - 10px)' }}>
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
          <div className="md:col-span-2 flex flex-col h-full" style={{ minHeight: 'calc(20rem - 15px)' }}>
            <div className="mb-0">
                  <h3 className="card-title mb-3">Account</h3>
              <div className="p-3 rounded-lg panel-surface mb-3">
                <div className="muted text-sm">{user.email}</div>
              </div>
            </div>

            <div className="mb-3">
              <label className="card-sub">Short bio</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell people a bit about yourself"
                className="input mt-2 text-sm"
                rows={4}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
              <div className="flex flex-col h-full justify-between">
                <div>
                  <label className="card-sub">Website / Link</label>
                  <div className="flex mt-2">
                    <input
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      placeholder="https://your-site.example"
                      className="input flex-1 rounded-l"
                    />
                    <button
                      onClick={() => { if (website) window.open(website.startsWith('http') ? website : `https://${website}`, '_blank'); }}
                      className="btn btn-ghost rounded-r"
                      title="Open link"
                    >
                      ↗
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between w-full -mt-3">
                  <div className="flex items-center gap-4">
                    <div style={{ marginTop: '-101px' }}>
                      <label className="card-sub mb-8">Profile Visibility</label>
                      <div>
                        <button
                          onClick={() => setPublicProfile(p => !p)}
                          className={`btn px-3 py-1 h-9 ${publicProfile ? 'btn-primary' : 'btn-ghost'}`}
                        >
                          {publicProfile ? 'Public' : 'Private'}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="mt-auto flex justify-end" style={{ marginTop: '-78.5px' }}>
                    <button
                      onClick={async () => {
                        setIsSavingProfile(true);
                        const ok = await updateUserProfile({ bio, website, publicProfile });
                        setIsSavingProfile(false);
                        if (!ok) alert('Failed to save profile info');
                      }}
                      className="btn btn-primary"
                    >
                      {isSavingProfile ? 'Saving...' : 'Save profile'}
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex flex-col self-start mt-0">
                <ProfileFriends />
              </div>
            </div>
          </div>

          {/* Theme Customization - align to top so it lines up with Account heading */}
          <div className="self-stretch flex flex-col justify-start">
            <div className="mb-4">
              <h3 className="card-title">Theme</h3>
              <p className="muted text-sm font-normal mb-3">Pick your accent color</p>
                 <div className="card pt-1 pb-3 px-3 flex flex-col" style={{ transform: 'translateY(0px)', minHeight: '22.25rem' }}>
                <div className="-mt-2">
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