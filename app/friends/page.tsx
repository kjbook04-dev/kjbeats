"use client";

import React, { useEffect, useMemo, useState } from 'react';
import {
  addDoc,
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { useTheme } from '../context/ThemeContext';
import { useUser } from '../context/UserContext';
import { useMusicLibrary } from '../context/MusicLibraryContext';
import { usePlaylist } from '../context/PlaylistContext';
import { gradientTextStyle, gradientBgStyle } from '../context/themeHelpers';
import { db } from '../lib/firebase';
import type { Song, Playlist } from '../types/music';

type ChatMessage = {
  id: string;
  senderId: string;
  senderName: string;
  text?: string;
  type: 'text' | 'song' | 'playlist';
  song?: Song;
  playlist?: Playlist;
  createdAt?: any;
};

const conversationIdFor = (a: string, b: string) => [a, b].sort().join('__');

export default function FriendsPage() {
  const { currentTheme } = useTheme();
  const { user } = useUser();
  const { songs, addSongs } = useMusicLibrary();
  const { playlists, createPlaylist, addToPlaylist } = usePlaylist();
  const [selectedFriend, setSelectedFriend] = useState<string>('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [selectedFriendUid, setSelectedFriendUid] = useState<string>('');
  const [newText, setNewText] = useState('');
  const [shareSongId, setShareSongId] = useState('');
  const [sharePlaylistId, setSharePlaylistId] = useState('');
  const gText = gradientTextStyle();
  const gBg = gradientBgStyle();

  const friends = user?.friends || [];

  const selectedSong = useMemo(
    () => songs.find((s) => s.id === shareSongId),
    [songs, shareSongId]
  );
  const selectedPlaylist = useMemo(
    () => playlists.find((p) => p.id === sharePlaylistId),
    [playlists, sharePlaylistId]
  );

  useEffect(() => {
    const resolveFriend = async () => {
      if (!db || !selectedFriend) {
        setSelectedFriendUid('');
        return;
      }
      const uname = selectedFriend.trim().toLowerCase();
      const snap = await getDoc(doc(db, 'usernames', uname));
      setSelectedFriendUid((snap.data()?.uid as string) || '');
    };
    resolveFriend();
  }, [selectedFriend]);

  useEffect(() => {
    if (!db || !user || !selectedFriendUid) {
      setMessages([]);
      return;
    }
    const conversationId = conversationIdFor(user.id, selectedFriendUid);
    const messagesRef = collection(db, 'conversations', conversationId, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'asc'));
    return onSnapshot(q, (snapshot) => {
      const next = snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ChatMessage, 'id'>) }));
      setMessages(next);
    });
  }, [selectedFriendUid, user]);

  const ensureConversation = async () => {
    if (!db || !user || !selectedFriendUid) return null;
    const id = conversationIdFor(user.id, selectedFriendUid);
    await setDoc(
      doc(db, 'conversations', id),
      {
        participants: [user.id, selectedFriendUid].sort(),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
    return id;
  };

  const sendText = async () => {
    if (!db || !user || !newText.trim() || !selectedFriendUid) return;
    const conversationId = await ensureConversation();
    if (!conversationId) return;
    await addDoc(collection(db, 'conversations', conversationId, 'messages'), {
      senderId: user.id,
      senderName: user.firstName || user.username,
      type: 'text',
      text: newText.trim(),
      createdAt: serverTimestamp(),
    });
    await updateDoc(doc(db, 'conversations', conversationId), { updatedAt: serverTimestamp() });
    setNewText('');
  };

  const sendSong = async () => {
    if (!db || !user || !selectedFriendUid || !selectedSong) return;
    const conversationId = await ensureConversation();
    if (!conversationId) return;
    await addDoc(collection(db, 'conversations', conversationId, 'messages'), {
      senderId: user.id,
      senderName: user.firstName || user.username,
      type: 'song',
      song: selectedSong,
      createdAt: serverTimestamp(),
    });
    await updateDoc(doc(db, 'conversations', conversationId), { updatedAt: serverTimestamp() });
    setShareSongId('');
  };

  const sendPlaylist = async () => {
    if (!db || !user || !selectedFriendUid || !selectedPlaylist) return;
    const conversationId = await ensureConversation();
    if (!conversationId) return;
    await addDoc(collection(db, 'conversations', conversationId, 'messages'), {
      senderId: user.id,
      senderName: user.firstName || user.username,
      type: 'playlist',
      playlist: selectedPlaylist,
      createdAt: serverTimestamp(),
    });
    await updateDoc(doc(db, 'conversations', conversationId), { updatedAt: serverTimestamp() });
    setSharePlaylistId('');
  };

  const saveSharedSong = async (song?: Song) => {
    if (!song) return;
    const copy: Song = {
      ...song,
      id: `shared-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      sharedFromUserId: song.ownerId || song.userId,
      uploadedAt: new Date().toISOString(),
    };
    await addSongs([copy]);
  };

  const saveSharedPlaylist = async (playlist?: Playlist) => {
    if (!playlist) return;
    const newId = await createPlaylist(`${playlist.title} (Shared)`, playlist.description || '', playlist.coverUrl);
    if (!newId) return;
    for (const song of playlist.songs || []) {
      await addToPlaylist(newId, {
        ...song,
        id: `shared-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        sharedFromUserId: song.ownerId || song.userId,
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-6" style={gText}>Friends</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
          <h2 className="text-xl font-semibold mb-3" style={gText}>Your Friends</h2>
          {friends.length === 0 ? (
            <p className="text-gray-300 text-sm">No friends yet. Add friends from your profile page.</p>
          ) : (
            <div className="space-y-2">
              {friends.map((friendName) => (
                <button
                  key={friendName}
                  onClick={() => setSelectedFriend(friendName)}
                  className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                    selectedFriend === friendName ? 'bg-gray-700 text-white' : 'text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  {friendName}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="md:col-span-2 bg-gray-800 p-4 rounded-lg border border-gray-700 min-h-[28rem] flex flex-col">
          <h2 className="text-xl font-semibold mb-3" style={gText}>
            {selectedFriend ? `DM with ${selectedFriend}` : 'Select a friend to start chatting'}
          </h2>

          <div className="flex-1 overflow-y-auto space-y-2 mb-4">
            {messages.map((msg) => (
              <div key={msg.id} className={`p-3 rounded-md ${msg.senderId === user?.id ? 'bg-gray-700 ml-8' : 'bg-gray-900 mr-8'}`}>
                <p className="text-xs text-gray-400 mb-1">{msg.senderName}</p>
                {msg.type === 'text' && <p className="text-gray-100">{msg.text}</p>}
                {msg.type === 'song' && (
                  <div className="text-gray-100">
                    <p className="font-semibold">Shared Song: {msg.song?.title}</p>
                    <p className="text-sm text-gray-300">{msg.song?.artist}</p>
                    <button onClick={() => saveSharedSong(msg.song)} className="mt-2 px-3 py-1 rounded-md text-gray-900 text-sm" style={gBg}>
                      Save to My Library
                    </button>
                  </div>
                )}
                {msg.type === 'playlist' && (
                  <div className="text-gray-100">
                    <p className="font-semibold">Shared Playlist: {msg.playlist?.title}</p>
                    <p className="text-sm text-gray-300">{msg.playlist?.songs?.length || 0} songs</p>
                    <button onClick={() => saveSharedPlaylist(msg.playlist)} className="mt-2 px-3 py-1 rounded-md text-gray-900 text-sm" style={gBg}>
                      Add Playlist
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="space-y-2 border-t border-gray-700 pt-3">
            <div className="flex gap-2">
              <input
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 px-3 py-2 bg-gray-900 border border-gray-700 rounded-md text-white"
                disabled={!selectedFriend}
              />
              <button onClick={sendText} disabled={!selectedFriend} className="px-4 py-2 rounded-md text-gray-900 disabled:opacity-50" style={gBg}>
                Send
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div className="flex gap-2">
                <select
                  value={shareSongId}
                  onChange={(e) => setShareSongId(e.target.value)}
                  className="flex-1 px-3 py-2 bg-gray-900 border border-gray-700 rounded-md text-white"
                  disabled={!selectedFriend}
                >
                  <option value="">Share a song...</option>
                  {songs.map((song) => (
                    <option key={song.id} value={song.id}>{song.title}</option>
                  ))}
                </select>
                <button onClick={sendSong} disabled={!shareSongId || !selectedFriend} className="px-3 py-2 rounded-md text-gray-900 disabled:opacity-50" style={gBg}>
                  Share
                </button>
              </div>

              <div className="flex gap-2">
                <select
                  value={sharePlaylistId}
                  onChange={(e) => setSharePlaylistId(e.target.value)}
                  className="flex-1 px-3 py-2 bg-gray-900 border border-gray-700 rounded-md text-white"
                  disabled={!selectedFriend}
                >
                  <option value="">Share a playlist...</option>
                  {playlists.map((playlist) => (
                    <option key={playlist.id} value={playlist.id}>{playlist.title}</option>
                  ))}
                </select>
                <button onClick={sendPlaylist} disabled={!sharePlaylistId || !selectedFriend} className="px-3 py-2 rounded-md text-gray-900 disabled:opacity-50" style={gBg}>
                  Share
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
