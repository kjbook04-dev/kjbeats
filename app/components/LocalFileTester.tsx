'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Song } from '../types/music';
import { useLastPlayed } from '../context/LastPlayedContext';

export default function LocalFileTester() {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [current, setCurrent] = useState<Song | undefined>(undefined);
  const { setCurrentSong, setIsPlaying } = useLastPlayed();

  // Create/revoke object URLs for selected files
  const audioUrl = useMemo(() => (audioFile ? URL.createObjectURL(audioFile) : ''), [audioFile]);
  const coverUrl = useMemo(() => (coverFile ? URL.createObjectURL(coverFile) : undefined), [coverFile]);

  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      if (coverUrl) URL.revokeObjectURL(coverUrl);
    };
  }, [audioUrl, coverUrl]);

  const onSelectAudio = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setAudioFile(f);
  };

  const onSelectCover = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setCoverFile(f);
  };

  const playLocal = () => {
    if (!audioFile || !audioUrl) return;
    const baseTitle = audioFile.name.replace(/\.[^/.]+$/, '');
    const song: Song = {
      id: `local-${audioFile.name}-${audioFile.size}`,
      title: baseTitle || 'Local Audio',
      artist: 'Local File',
      duration: '—',
      audioUrl,
      coverUrl,
    };
    setCurrent(song);
    // Also set in LastPlayed context so PersistentPlayer picks it up
    setCurrentSong(song);
    setIsPlaying(true);
  };

  return (
    <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
      <h2 className="text-xl font-semibold mb-4 bg-gradient-to-r from-pink-300 to-pink-500 text-transparent bg-clip-text">
        Test Local Audio (No Upload)
      </h2>

      <div className="space-y-4">
        <div>
          <label className="block text-pink-200 mb-2">Choose audio file</label>
          <input
            type="file"
            accept="audio/*"
            onChange={onSelectAudio}
            className="block w-full text-pink-200 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-pink-500 file:text-gray-900 hover:file:bg-pink-600 cursor-pointer"
          />
          {audioFile && (
            <p className="text-pink-300 text-sm mt-1">Selected: {audioFile.name}</p>
          )}
        </div>

        <div>
          <label className="block text-pink-200 mb-2">Optional cover image</label>
          <input
            type="file"
            accept="image/*"
            onChange={onSelectCover}
            className="block w-full text-pink-200 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-pink-500 file:text-gray-900 hover:file:bg-pink-600 cursor-pointer"
          />
          {coverFile && (
            <p className="text-pink-300 text-sm mt-1">Selected: {coverFile.name}</p>
          )}
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={playLocal}
            disabled={!audioFile}
            className={`px-4 py-2 rounded-full bg-pink-500 text-gray-900 font-semibold ${
              !audioFile ? 'opacity-50 cursor-not-allowed' : 'hover:bg-pink-600'
            }`}
          >
            Play Local File
          </button>
        </div>

        {coverUrl && (
          <div className="mt-4 flex items-center space-x-3">
            <img src={coverUrl} alt="Cover preview" className="w-16 h-16 rounded bg-gray-900 object-cover" />
            <div>
              <p className="text-pink-200 text-sm">Cover preview</p>
            </div>
          </div>
        )}
      </div>

  {/* PersistentPlayer reads from LastPlayed context and renders itself; no direct player prop needed */}
    </div>
  );
}
