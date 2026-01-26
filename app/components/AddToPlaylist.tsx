'use client';

import { useState } from 'react';
import type { Song } from '../types/music';
import { usePlaylist } from '../context/PlaylistContext';

interface AddToPlaylistProps {
  song: Song;
  onClose: () => void;
}

export default function AddToPlaylist({ song, onClose }: AddToPlaylistProps) {
  const { playlists, addToPlaylist } = usePlaylist();
  const [selectedPlaylist, setSelectedPlaylist] = useState('');

  const handleAddToPlaylist = () => {
    if (selectedPlaylist) {
      addToPlaylist(selectedPlaylist, song);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 max-w-md w-full">
        <h2 className="text-xl font-semibold mb-4 bg-gradient-to-r from-pink-300 to-pink-500 text-transparent bg-clip-text">
          Add to Playlist
        </h2>
        
        <div className="mb-4">
          <label className="block text-pink-200 mb-2">Select Playlist</label>
          {playlists.length === 0 ? (
            <p className="text-pink-300">No playlists available. Create one first!</p>
          ) : (
            <select
              value={selectedPlaylist}
              onChange={(e) => setSelectedPlaylist(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-gray-900 border border-pink-400 text-pink-200"
            >
              <option value="">Choose a playlist...</option>
              {playlists.map((playlist) => (
                <option key={playlist.id} value={playlist.id}>
                  {playlist.title}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="flex justify-end space-x-4">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-full border border-pink-400 text-pink-400 hover:bg-pink-400 hover:text-gray-900"
          >
            Cancel
          </button>
          <button
            onClick={handleAddToPlaylist}
            disabled={!selectedPlaylist}
            className={`px-4 py-2 rounded-full bg-pink-500 text-gray-900 font-semibold ${
              !selectedPlaylist ? 'opacity-50 cursor-not-allowed' : 'hover:bg-pink-600'
            }`}
          >
            Add to Playlist
          </button>
        </div>
      </div>
    </div>
  );
}