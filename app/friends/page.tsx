"use client";

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
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
  where,
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

type ConversationSummary = {
  id: string;
  participants: string[];
  updatedAt?: any;
};

const conversationIdFor = (a: string, b: string) => [a, b].sort().join('__');

export default function FriendsPage() {
  const { currentTheme } = useTheme();
  const { user, removeFriend, acceptFriendRequest, declineFriendRequest } = useUser();
  const { songs, addSongs } = useMusicLibrary();
  const { playlists, createPlaylist, addToPlaylist } = usePlaylist();
  const [selectedFriend, setSelectedFriend] = useState<string>('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [selectedFriendUid, setSelectedFriendUid] = useState<string>('');
  const [newText, setNewText] = useState('');
  const [shareSongId, setShareSongId] = useState('');
  const [sharePlaylistId, setSharePlaylistId] = useState('');
  const [removeTarget, setRemoveTarget] = useState<string>('');
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [participantNames, setParticipantNames] = useState<Record<string, string>>({});
  const gText = gradientTextStyle();
  const gBg = gradientBgStyle();
  const canChat = Boolean(selectedFriend && selectedFriendUid);

  const friends = user?.friends || [];
  const friendRequests = user?.friendRequests || [];

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
    if (!db || !user) {
      setConversations([]);
      return;
    }
    const convRef = collection(db, 'conversations');
    const q = query(convRef, where('participants', 'array-contains', user.id));
    return onSnapshot(q, (snapshot) => {
      const next = snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ConversationSummary, 'id'>) }));
      const sorted = [...next].sort((a, b) => {
        const aTs = a.updatedAt?.seconds || 0;
        const bTs = b.updatedAt?.seconds || 0;
        return bTs - aTs;
      });
      setConversations(sorted);
    });
  }, [user]);

  useEffect(() => {
    if (!db || !user || conversations.length === 0) return;
    const dbClient = db;
    const loadNames = async () => {
      const updates: Record<string, string> = {};
      for (const convo of conversations) {
        const otherId = convo.participants?.find((id) => id !== user.id);
        if (!otherId || participantNames[otherId]) continue;
        const snap = await getDoc(doc(dbClient, 'users', otherId));
        if (snap.exists()) {
          updates[otherId] = snap.data().username || snap.data().firstName || 'Friend';
        }
      }
      if (Object.keys(updates).length) {
        setParticipantNames((prev) => ({ ...prev, ...updates }));
      }
    };
    loadNames();
  }, [conversations, user, participantNames]);

  useEffect(() => {
    if (!db || !user || !selectedFriendUid) {
      setMessages([]);
      return;
    }
    const dbClient = db;
    let unsubscribe: (() => void) | undefined;
    const setup = async () => {
      const conversationId = await ensureConversation();
      if (!conversationId) return;
      const messagesRef = collection(dbClient, 'conversations', conversationId, 'messages');
      const q = query(messagesRef, orderBy('createdAt', 'asc'));
      unsubscribe = onSnapshot(q, (snapshot) => {
        const next = snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ChatMessage, 'id'>) }));
        setMessages(next);
      });
    };
    setup();
    return () => {
      if (unsubscribe) unsubscribe();
    };
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
          <div className="mb-4">
            <h3 className={`text-xl font-semibold mb-3 ${currentTheme.text}`}>Requests</h3>
            {friendRequests.length === 0 ? (
              <p className="text-gray-400 text-sm">No requests right now.</p>
            ) : (
              <div className="space-y-2">
                {friendRequests.map((req) => (
                  <div key={req} className="flex items-center justify-between bg-gray-900 rounded-md px-3 py-2">
                    <span className="text-gray-200 text-sm">{req}</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => acceptFriendRequest(req)}
                        className="px-2 py-1 text-xs rounded-md text-gray-900"
                        style={gBg}
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => declineFriendRequest(req)}
                        className="px-2 py-1 text-xs rounded-md border border-white/10 text-gray-300 hover:bg-white/5"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-gray-700 pt-4">
            <h3 className={`text-xl font-semibold mb-3 ${currentTheme.text}`}>Your Friends</h3>
            {friends.length === 0 ? (
              <>
                <p className="text-gray-400 mb-4">No friends yet. Add friends from your profile page.</p>
                <div className="text-center">
                  <Link
                    href="/profile"
                    className="inline-block px-4 py-2 rounded-md text-sm font-medium hover:scale-105 transition-all text-gray-900"
                    style={gBg}
                  >
                    Go to Profile → Add Friends
                  </Link>
                </div>
              </>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {friends.map((friendName) => (
                  <div
                    key={friendName}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-md transition-colors ${
                      selectedFriend === friendName ? 'bg-gray-700 text-white' : 'text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    <button onClick={() => setSelectedFriend(friendName)} className="flex-1 text-left">
                      {friendName}
                    </button>
                    <button
                      onClick={() => setRemoveTarget(friendName)}
                      className="ml-2 text-white hover:text-white/80 text-2xl leading-none"
                      aria-label={`Remove ${friendName}`}
                      title={`Remove ${friendName}`}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="md:col-span-2 bg-gray-800 p-4 rounded-lg border border-gray-700 min-h-[28rem] flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h3 className={`text-xl font-semibold ${currentTheme.text}`}>
              {selectedFriend ? `DM with ${selectedFriend}` : 'Select a friend to start chatting'}
            </h3>
            {selectedFriend && <span className="text-xs text-gray-400">Private thread</span>}
          </div>

          <div className="mb-3 rounded-lg border border-gray-700 bg-gray-900 p-3">
            <h4 className={`text-sm font-semibold mb-2 ${currentTheme.text}`}>Direct Messages</h4>
            {conversations.length === 0 ? (
              <div className="text-gray-400 text-sm">No DMs yet.</div>
            ) : (
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {conversations.map((convo) => {
                  const otherId = convo.participants?.find((id) => id !== user?.id) || '';
                  const name = participantNames[otherId] || 'Friend';
                  const isActive = selectedFriendUid === otherId;
                  return (
                    <button
                      key={convo.id}
                      onClick={() => {
                        setSelectedFriend(name);
                        setSelectedFriendUid(otherId);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                        isActive ? 'bg-gray-700 text-white' : 'text-gray-300 hover:bg-gray-700'
                      }`}
                    >
                      {name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex-1 bg-gray-900 border border-gray-700 rounded-lg p-3 overflow-y-auto space-y-2 mb-4 max-h-[28rem]">
            {!selectedFriend ? (
              <div className="text-gray-400 text-sm">Choose a friend to view and send messages.</div>
            ) : messages.length === 0 ? (
              <div className="text-gray-400 text-sm">No messages yet. Say hi!</div>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className={`p-3 rounded-md ${msg.senderId === user?.id ? 'bg-gray-700 ml-8' : 'bg-gray-800 mr-8'}`}>
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
              ))
            )}
          </div>

          {selectedFriend && (
            <div className="space-y-3 border-t border-gray-700 pt-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Message</label>
                <div className="flex gap-2">
                  <input
                    value={newText}
                    onChange={(e) => setNewText(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 px-3 py-2 bg-gray-900 border border-gray-700 rounded-md text-white"
                  />
                  <button onClick={sendText} className="px-4 py-2 rounded-md text-gray-900" style={gBg}>
                    Send
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Share a song</label>
                  <div className="flex gap-2">
                    <select
                      value={shareSongId}
                      onChange={(e) => setShareSongId(e.target.value)}
                      className="flex-1 px-3 py-2 bg-gray-900 border border-gray-700 rounded-md text-white"
                    >
                      <option value="">Select a song...</option>
                      {songs.map((song) => (
                        <option key={song.id} value={song.id}>{song.title}</option>
                      ))}
                    </select>
                    <button onClick={sendSong} disabled={!shareSongId} className="px-3 py-2 rounded-md text-gray-900 disabled:opacity-50" style={gBg}>
                      Share
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-gray-400 mb-1">Share a playlist</label>
                  <div className="flex gap-2">
                    <select
                      value={sharePlaylistId}
                      onChange={(e) => setSharePlaylistId(e.target.value)}
                      className="flex-1 px-3 py-2 bg-gray-900 border border-gray-700 rounded-md text-white"
                    >
                      <option value="">Select a playlist...</option>
                      {playlists.map((playlist) => (
                        <option key={playlist.id} value={playlist.id}>{playlist.title}</option>
                      ))}
                    </select>
                    <button onClick={sendPlaylist} disabled={!sharePlaylistId} className="px-3 py-2 rounded-md text-gray-900 disabled:opacity-50" style={gBg}>
                      Share
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {removeTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="w-full max-w-sm rounded-lg border border-gray-700 bg-gray-900 p-5 shadow-xl">
            <h4 className={`text-lg font-semibold ${currentTheme.text}`}>Remove friend?</h4>
            <p className="text-sm text-white mt-2">
              Are you sure you want to remove <span className="text-white font-semibold">{removeTarget}</span> as a friend?
            </p>
            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                onClick={() => setRemoveTarget('')}
                className="px-3 py-2 rounded-md text-sm text-gray-300 hover:text-white border border-white/10 hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  removeFriend(removeTarget);
                  setRemoveTarget('');
                }}
                className="px-3 py-2 rounded-md text-sm text-gray-900"
                style={gBg}
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
