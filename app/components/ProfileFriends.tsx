"use client";

import React, { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { useTheme } from '../context/ThemeContext';
import { gradientBgStyle } from '../context/themeHelpers';

interface ProfileFriendsProps {
  compact?: boolean;
}

export const ProfileFriends: React.FC<ProfileFriendsProps> = ({ compact = false }) => {
  const { user, addFriend, removeFriend } = useUser();
  const { currentTheme } = useTheme();
  const [newFriend, setNewFriend] = useState('');
  const [busy, setBusy] = useState(false);
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

  const handleAdd = async () => {
    if (!newFriend.trim()) return;
    setBusy(true);
    const res = await addFriend(newFriend.trim());
    setBusy(false);
    if (!res.success) {
      alert(res.error || 'Could not add friend');
    } else {
      setNewFriend('');
    }
  };

  const handleRemove = async (username: string) => {
    if (!confirm(`Remove ${username} from your friends?`)) return;
    setBusy(true);
    await removeFriend(username);
    setBusy(false);
  };

  return (
    // heading sits above the panel surface now
    <>
  <h3 className={`card-sub mb-1`}>Friends</h3>
      <div className={`${compact ? 'p-2' : 'p-3'} rounded-lg panel-surface`}>
  <div className={`${compact ? '-mt-1 mb-2' : 'mb-4'}`}>
          <label className={`block muted text-sm ${compact ? 'mb-1' : 'mb-2'}`}>Add friend by username</label>
          <div className={`flex items-center min-w-0 ${compact ? 'space-x-2' : 'space-x-2'}`}>
            <input
              value={newFriend}
              onChange={(e) => setNewFriend(e.target.value)}
              className={`input flex-1 min-w-0 text-sm py-2 pl-2 rounded-md border ${currentTheme.border} focus:outline-none focus:ring-2 focus:ring-[var(--accent)] bg-gray-900 text-white`}
              placeholder="username"
            />
            <button
              onClick={handleAdd}
              disabled={busy}
              className={`${compact ? 'px-3 py-1 text-sm' : 'px-4 py-2'} flex-shrink-0 rounded-md hover:scale-105 transition-all ${busy ? 'opacity-60 cursor-not-allowed' : ''}`}
              style={gBg}
            >
              <span style={{ color: pageBgColor }}>{busy ? 'Adding...' : 'Add'}</span>
            </button>
          </div>
        </div>

        <div className={`${compact ? 'space-y-2' : 'space-y-2'}`}>
          {(user?.friends || []).length === 0 ? (
            <div className="muted text-sm">You have no friends added yet.</div>
          ) : (
            (user!.friends || []).map((f) => (
              <div key={f} className={`${compact ? 'flex items-center justify-between p-1' : 'flex items-center justify-between p-2'} panel-surface rounded-md`}>
                <div className={`${compact ? 'text-sm pl-2' : 'text-white pl-2'}`}>{f}</div>
                <button onClick={() => handleRemove(f)} className={`text-sm btn btn-ghost text-red-400 hover:text-red-300 ${compact ? 'px-2 py-0.5' : ''}`}>Remove</button>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
};
