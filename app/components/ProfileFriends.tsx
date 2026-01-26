'use client';

import React, { useState } from 'react';
import { useUser } from '../context/UserContext';

export const ProfileFriends: React.FC = () => {
  const { user, addFriend, removeFriend } = useUser();
  const [newFriend, setNewFriend] = useState('');
  const [busy, setBusy] = useState(false);

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
  <h3 className="card-sub mb-2">Friends</h3>
      <div className="p-3 rounded-lg panel-surface">
      <div className="mb-4">
        <label className="block muted text-sm mb-2">Add friend by username</label>
        <div className="flex items-center space-x-2">
          <input
            value={newFriend}
            onChange={(e) => setNewFriend(e.target.value)}
            className="input flex-1"
            placeholder="username"
          />
          <button onClick={handleAdd} disabled={busy} className="btn btn-primary">{busy ? 'Adding...' : 'Add'}</button>
        </div>
      </div>

  <div className="space-y-2">
        {(user?.friends || []).length === 0 ? (
          <div className="muted">You have no friends added yet.</div>
        ) : (
          (user!.friends || []).map((f) => (
            <div key={f} className="flex items-center justify-between p-2 panel-surface rounded-md">
              <div className="text-white">{f}</div>
              <button onClick={() => handleRemove(f)} className="text-sm btn btn-ghost text-red-400 hover:text-red-300">Remove</button>
            </div>
          ))
        )}
      </div>
      </div>
    </>
  );
};
