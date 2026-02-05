"use client";

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  arrayUnion,
  limit,
  where,
} from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { useTheme } from '../context/ThemeContext';
import { useUser } from '../context/UserContext';
import { useMusicLibrary } from '../context/MusicLibraryContext';
import { usePlaylist } from '../context/PlaylistContext';
import { gradientTextStyle, gradientBgStyle } from '../context/themeHelpers';
import { db, storage } from '../lib/firebase';
import type { Song, Playlist } from '../types/music';
import { Notification } from '../components/Notification';

type ChatMessage = {
  id: string;
  senderId: string;
  senderName: string;
  text?: string;
  type: 'text' | 'song' | 'playlist';
  song?: Song;
  playlist?: Playlist;
  createdAt?: any;
  likedBy?: string[];
};

type ConversationSummary = {
  id: string;
  participants: string[];
  updatedAt?: any;
  lastMessageSenderId?: string;
  friendshipEstablished?: boolean;
};

type FriendProfile = {
  username?: string;
  firstName?: string;
  profilePicture?: string;
  publicProfile?: boolean;
  bio?: string;
  website?: string;
};

const conversationIdFor = (a: string, b: string) => [a, b].sort().join('__');

export default function FriendsPage() {
  const { currentTheme } = useTheme();
  const { user, removeFriend, acceptFriendRequest, declineFriendRequest, addFriend, hideConversation } = useUser();
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
  const [selectedFriendProfile, setSelectedFriendProfile] = useState<FriendProfile | null>(null);
  const [requestSentFor, setRequestSentFor] = useState<Record<string, boolean>>({});
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info'; isVisible: boolean }>({
    message: '',
    type: 'success',
    isVisible: false,
  });
  const lastReadWriteAtRef = useRef<number>(0);
  const gText = gradientTextStyle();
  const gBg = gradientBgStyle();
  const friends = user?.friends || [];
  const friendRequests = user?.friendRequests || [];
  const hiddenConversations = user?.hiddenConversations || [];
  const isFriend = (name: string) => friends.some((f) => f.toLowerCase() === name.toLowerCase());
  const isSelectedFriend = Boolean(selectedFriend && isFriend(selectedFriend));
  const selectedConversation = useMemo(() => {
    if (!user?.id || !selectedFriendUid) return null;
    const convoId = conversationIdFor(user.id, selectedFriendUid);
    return conversations.find((c) => c.id === convoId) || null;
  }, [conversations, selectedFriendUid, user?.id]);
  const canChat = Boolean(
    selectedFriend &&
      selectedFriendUid &&
      (isSelectedFriend ||
        user?.friendHistory?.includes(selectedFriendUid) ||
        selectedConversation?.friendshipEstablished ||
        selectedConversation?.lastMessageSenderId)
  );

  useEffect(() => {
    if (!db || !user || !selectedFriendUid || !selectedConversation) return;
    if (user.friendHistory?.includes(selectedFriendUid)) return;
    updateDoc(doc(db, 'users', user.id), { friendHistory: arrayUnion(selectedFriendUid) }).catch(() => {});
  }, [db, user, selectedFriendUid, selectedConversation]);

  useEffect(() => {
    if (!isSelectedFriend) {
      setSelectedFriendProfile(null);
    }
  }, [isSelectedFriend, selectedFriend]);

  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setNotification({ message, type, isVisible: true });
  };

  const hideNotification = () => {
    setNotification((prev) => ({ ...prev, isVisible: false }));
  };

 

  const selectedSong = useMemo(
    () => songs.find((s) => s.id === shareSongId),
    [songs, shareSongId]
  );
  const selectedPlaylist = useMemo(
    () => playlists.find((p) => p.id === sharePlaylistId),
    [playlists, sharePlaylistId]
  );
  const visibleConversations = useMemo(() => {
    if (!user) return [];
    return conversations.filter((convo) => {
      const otherId = convo.participants?.find((id) => id !== user.id) || '';
      const name = participantNames[otherId];
      return !!name && !hiddenConversations.includes(convo.id);
    });
  }, [conversations, participantNames, user, hiddenConversations]);

  useEffect(() => {
    const resolveFriend = async () => {
      if (!db || !selectedFriend) {
        setSelectedFriendUid('');
        return;
      }
      if (user) {
        const convo = conversations.find((c) => {
          const otherId = c.participants?.find((id) => id !== user.id) || '';
          const name = participantNames[otherId];
          return name && name.toLowerCase() === selectedFriend.toLowerCase();
        });
        if (convo) {
          const otherId = convo.participants?.find((id) => id !== user.id) || '';
          if (otherId) {
            setSelectedFriendUid(otherId);
            return;
          }
        }
      }
      const uname = selectedFriend.trim().toLowerCase();
      const snap = await getDoc(doc(db, 'usernames', uname));
      if (snap.exists()) {
        setSelectedFriendUid((snap.data()?.uid as string) || '');
        return;
      }
      const usersQuery = query(collection(db, 'users'), where('usernameLower', '==', uname), limit(1));
      const usersSnap = await getDocs(usersQuery);
      setSelectedFriendUid(usersSnap.empty ? '' : usersSnap.docs[0].id);
    };
    resolveFriend();
  }, [selectedFriend]);

  useEffect(() => {
    if (!selectedFriend) {
      setSelectedFriendProfile(null);
    }
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
    if (!db || !user || !selectedFriendUid || !isSelectedFriend) {
      setMessages([]);
      setSelectedFriendProfile(null);
      return;
    }
    const dbClient = db;
    let unsubscribe: (() => void) | undefined;
    const setup = async () => {
      const conversationId = await ensureConversation(false);
      if (!conversationId) return;
      try {
        const convoSnap = await getDoc(doc(dbClient, 'conversations', conversationId));
        const updatedAt = convoSnap.data()?.updatedAt?.seconds
          ? convoSnap.data()?.updatedAt.seconds * 1000
          : 0;
        const lastReadStr = user?.conversationReads?.[conversationId];
        const lastReadMs = lastReadStr ? Date.parse(lastReadStr) : 0;
        if (updatedAt > lastReadMs) {
          await markConversationRead(conversationId);
        }
      } catch {
        // ignore
      }
      try {
        const profileSnap = await getDoc(doc(dbClient, 'users', selectedFriendUid));
        if (profileSnap.exists()) {
          const data = profileSnap.data();
          setSelectedFriendProfile({
            username: data.username,
            firstName: data.firstName,
            profilePicture: data.profilePicture,
            publicProfile: data.publicProfile,
            bio: data.bio,
            website: data.website,
          });
        } else {
          setSelectedFriendProfile(null);
        }
      } catch (error) {
        console.error('Failed to load friend profile', error);
        setSelectedFriendProfile(null);
      }
      const messagesRef = collection(dbClient, 'conversations', conversationId, 'messages');
      const q = query(messagesRef, orderBy('createdAt', 'asc'));
      unsubscribe = onSnapshot(q, (snapshot) => {
        const next = snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ChatMessage, 'id'>) }));
        setMessages(next);
        const lastReadStr = user?.conversationReads?.[conversationId];
        const lastReadMs = lastReadStr ? Date.parse(lastReadStr) : 0;
        let newestMs = 0;
        snapshot.docs.forEach((docSnap) => {
          const data = docSnap.data() as { createdAt?: any };
          const createdMs = data.createdAt?.seconds ? data.createdAt.seconds * 1000 : 0;
          if (createdMs > newestMs) newestMs = createdMs;
        });
        const now = Date.now();
        if (newestMs && newestMs > lastReadMs && now - lastReadWriteAtRef.current > 30000) {
          lastReadWriteAtRef.current = now;
          markConversationRead(conversationId);
        }
      });
    };
    setup();
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [selectedFriendUid, user]);

  useEffect(() => {
    lastReadWriteAtRef.current = 0;
  }, [selectedFriendUid]);

  const ensureConversation = async (touchUpdatedAt: boolean = true) => {
    if (!db || !user || !selectedFriendUid) return null;
    const id = conversationIdFor(user.id, selectedFriendUid);
    await setDoc(
      doc(db, 'conversations', id),
      {
        participants: [user.id, selectedFriendUid].sort(),
        ...(touchUpdatedAt ? { updatedAt: serverTimestamp() } : {}),
      },
      { merge: true }
    );
    return id;
  };

  const markConversationRead = async (conversationId: string) => {
    if (!db || !user) return;
    const lastRead = user.conversationReads?.[conversationId];
    if (lastRead) {
      const last = Date.parse(lastRead);
      if (!Number.isNaN(last) && Date.now() - last < 30000) {
        return;
      }
    }
    try {
      await updateDoc(doc(db, 'users', user.id), {
        [`conversationReads.${conversationId}`]: new Date().toISOString(),
      });
    } catch (error) {
      try {
        await updateDoc(doc(db, 'users', user.id), { conversationReads: {} });
        await updateDoc(doc(db, 'users', user.id), {
          [`conversationReads.${conversationId}`]: new Date().toISOString(),
        });
      } catch (inner) {
        console.error('Failed to mark conversation read', inner);
      }
    }
  };

  const sendText = async () => {
    if (!db || !user || !newText.trim() || !selectedFriendUid || !canChat) return;
    const conversationId = await ensureConversation(true);
    if (!conversationId) return;
    await addDoc(collection(db, 'conversations', conversationId, 'messages'), {
      senderId: user.id,
      senderName: user.firstName || user.username,
      type: 'text',
      text: newText.trim(),
      createdAt: serverTimestamp(),
      likedBy: [],
    });
    await updateDoc(doc(db, 'conversations', conversationId), {
      updatedAt: serverTimestamp(),
      lastMessageSenderId: user.id,
    });
    setNewText('');
  };

  const toggleLikeMessage = async (msg: ChatMessage) => {
    if (!db || !user || !selectedFriendUid) return;
    const conversationId = conversationIdFor(user.id, selectedFriendUid);
    const likedBy = Array.isArray(msg.likedBy) ? msg.likedBy : [];
    const next = likedBy.includes(user.id)
      ? likedBy.filter((id) => id !== user.id)
      : [...likedBy, user.id];
    try {
      await updateDoc(doc(db, 'conversations', conversationId, 'messages', msg.id), { likedBy: next });
    } catch (error) {
      console.error('Failed to like message', error);
    }
  };

  const sendSong = async () => {
    if (!db || !user || !selectedFriendUid || !selectedSong || !canChat) return;
    const conversationId = await ensureConversation(true);
    if (!conversationId) return;
    await addDoc(collection(db, 'conversations', conversationId, 'messages'), {
      senderId: user.id,
      senderName: user.firstName || user.username,
      type: 'song',
      song: selectedSong,
      createdAt: serverTimestamp(),
    });
    await updateDoc(doc(db, 'conversations', conversationId), {
      updatedAt: serverTimestamp(),
      lastMessageSenderId: user.id,
    });
    setShareSongId('');
  };

  const sendPlaylist = async () => {
    if (!db || !user || !selectedFriendUid || !selectedPlaylist || !canChat) return;
    const conversationId = await ensureConversation(true);
    if (!conversationId) return;
    await addDoc(collection(db, 'conversations', conversationId, 'messages'), {
      senderId: user.id,
      senderName: user.firstName || user.username,
      type: 'playlist',
      playlist: selectedPlaylist,
      createdAt: serverTimestamp(),
    });
    await updateDoc(doc(db, 'conversations', conversationId), {
      updatedAt: serverTimestamp(),
      lastMessageSenderId: user.id,
    });
    setSharePlaylistId('');
  };

  const isSongAlreadyAdded = (song?: Song) => {
    if (!song) return false;
    return songs.some((s) =>
      (song.storagePath && s.storagePath === song.storagePath)
      || (song.audioUrl && s.audioUrl === song.audioUrl)
      || (s.title === song.title && s.artist === song.artist)
    );
  };

  const saveSharedSong = async (song?: Song) => {
    if (!song || isSongAlreadyAdded(song)) return;
    let audioUrl = song.audioUrl;
    let storagePath = song.storagePath;
    if (audioUrl && audioUrl.startsWith('https://firebasestorage.googleapis.com') && storage && user) {
      try {
        const res = await fetch(audioUrl);
        const blob = await res.blob();
        const ext = song.title?.toLowerCase().includes('.mp3') ? '' : '.mp3';
        const path = `users/${user.id}/songs/shared-${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
        const fileRef = ref(storage, path);
        await uploadBytes(fileRef, blob);
        audioUrl = await getDownloadURL(fileRef);
        storagePath = path;
      } catch (error) {
        console.error('Failed to copy shared song to storage', error);
      }
    }
    const copy: Song = {
      ...song,
      id: `shared-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      sharedFromUserId: song.ownerId || song.userId,
      uploadedAt: new Date().toISOString(),
      audioUrl,
      storagePath,
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

          {selectedFriendProfile && isSelectedFriend && (
            <div className="mt-4 rounded-2xl border border-white/10 bg-gray-900/70 p-3 shadow-inner">
              <div className="flex items-center gap-3">
                {selectedFriendProfile.profilePicture ? (
                  <img
                    src={selectedFriendProfile.profilePicture}
                    alt={selectedFriendProfile.username || selectedFriend}
                    className="w-10 h-10 aspect-square rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 aspect-square rounded-full bg-gray-800 flex items-center justify-center text-gray-400 text-sm">
                    {selectedFriendProfile.firstName?.[0] || selectedFriendProfile.username?.[0] || 'U'}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-sm text-white font-semibold truncate">
                    {selectedFriendProfile.firstName || selectedFriendProfile.username || selectedFriend}
                  </p>
                  <p className="text-xs text-gray-400 truncate">@{selectedFriendProfile.username || selectedFriend}</p>
                </div>
                {!selectedFriendProfile.publicProfile && (
                  <span className="ml-auto text-xs text-gray-400">Private</span>
                )}
              </div>
              {selectedFriendProfile.publicProfile ? (
                <div className="mt-2 text-sm text-gray-300 space-y-1">
                  {selectedFriendProfile.bio && <p>{selectedFriendProfile.bio}</p>}
                  {selectedFriendProfile.website && (
                    <p className="text-gray-400">{selectedFriendProfile.website}</p>
                  )}
                </div>
              ) : (
                <p className="mt-2 text-xs text-gray-400">This profile is private.</p>
              )}
            </div>
          )}
        </div>

        <div className="md:col-span-2 bg-gray-800/80 p-4 rounded-2xl border border-white/10 shadow-xl min-h-[28rem] flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {selectedFriend && (
                <button
                  onClick={() => {
                    setSelectedFriend('');
                    setSelectedFriendUid('');
                  }}
                  className="text-sm text-gray-300 hover:text-white border-0 rounded-none bg-transparent p-0 focus:outline-none"
                  aria-label="Back to DM list"
                  title="Back"
                >
                  <svg viewBox="0 0 24 24" className="w-4 h-4" aria-hidden="true">
                    <path d="M14 6L8 12L14 18" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              )}
              <h3 className={`text-xl font-semibold ${currentTheme.text}`}>
                {selectedFriend ? `DM with ${selectedFriend}` : 'Select a friend to start chatting'}
              </h3>
            </div>
            {selectedFriend && <span className="text-xs text-gray-400">Private thread</span>}
          </div>

          <div className="mb-3 rounded-2xl border border-white/10 bg-gray-900/70 p-3 shadow-inner">
            <h4 className={`text-xs font-semibold uppercase tracking-wide mb-2 ${currentTheme.text}`}>Direct Messages</h4>
            {visibleConversations.length === 0 ? (
              <div className="text-gray-400 text-sm">No DMs yet.</div>
            ) : (
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {visibleConversations.map((convo) => {
                  const otherId = convo.participants?.find((id) => id !== user?.id) || '';
                  const name = participantNames[otherId] || 'Friend';
                  const isActive = selectedFriendUid === otherId;
                  return (
                    <div key={convo.id} className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedFriend(name);
                          setSelectedFriendUid(otherId);
                        }}
                        className={`flex-1 text-left px-3 py-2 rounded-xl transition-colors border border-transparent ${
                          isActive ? 'bg-gray-700 text-white border-white/10' : 'text-gray-300 hover:bg-gray-700/70'
                        }`}
                      >
                        {name}
                      </button>
                      <button
                        onClick={() => {
                          hideConversation(convo.id);
                          if (selectedFriendUid === otherId) {
                            setSelectedFriend('');
                            setSelectedFriendUid('');
                            setMessages([]);
                          }
                        }}
                        className="h-8 w-8 rounded-full text-gray-300 hover:text-white border border-white/10 hover:border-white/30"
                        aria-label={`Hide conversation with ${name}`}
                        title="Hide chat"
                        type="button"
                      >
                        ×
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex-1 bg-gray-900/70 border border-white/10 rounded-2xl p-3 overflow-y-auto space-y-3 mb-4 max-h-[20rem] shadow-inner">
            {!selectedFriend ? (
              <div className="text-gray-400 text-sm">Choose a friend to view and send messages.</div>
            ) : messages.length === 0 ? (
              <div className="text-gray-400 text-sm">No messages yet. Say hi!</div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  onDoubleClick={() => toggleLikeMessage(msg)}
                  className={`p-3 rounded-2xl shadow-sm border border-white/10 ${
                    msg.senderId === user?.id ? 'bg-gray-700/90 ml-8' : 'bg-gray-800/90 mr-8'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs text-gray-400">{msg.senderName}</p>
                    {msg.likedBy?.length ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300">♥ {msg.likedBy.length}</span>
                    ) : null}
                  </div>
                  {msg.type === 'text' && <p className="text-gray-100">{msg.text}</p>}
                  {msg.type === 'song' && (
                    <div className="text-gray-100">
                      <p className="font-semibold">Shared Song: {msg.song?.title}</p>
                      <p className="text-sm text-gray-300">{msg.song?.artist}</p>
                      <button
                        onClick={() => saveSharedSong(msg.song)}
                        disabled={isSongAlreadyAdded(msg.song)}
                        className="mt-2 px-3 py-1 rounded-md text-gray-900 text-sm disabled:opacity-60 disabled:cursor-default"
                        style={gBg}
                      >
                        {isSongAlreadyAdded(msg.song) ? 'Saved to Library' : 'Save to My Library'}
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

          {selectedFriend && !canChat && (
            <div className="mt-2 text-sm text-gray-300">
              Friend request pending — you can’t send messages until they accept.
            </div>
          )}

          {selectedFriend && canChat && (
            <div className="space-y-3 border-t border-white/10 pt-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1 uppercase tracking-wide">Message</label>
                <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2 items-stretch">
                  <input
                    value={newText}
                    onChange={(e) => setNewText(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-2 bg-gray-900/70 border border-white/10 rounded-full text-white h-10"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendText();
                      }
                    }}
                  />
                  <button onClick={sendText} className="px-5 py-2 rounded-full text-gray-900 h-10 w-full sm:w-auto" style={gBg}>
                    Send
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 items-stretch">
                <div>
                  <label className="block text-xs text-gray-400 mb-1 uppercase tracking-wide">Share a song</label>
                  <div className="flex flex-col md:flex-row md:items-stretch gap-2">
                    <select
                      value={shareSongId}
                      onChange={(e) => setShareSongId(e.target.value)}
                      className="flex-1 min-w-0 px-3 pr-12 py-2 bg-gray-900/70 border border-white/10 rounded-full text-white h-10 appearance-none bg-no-repeat"
                      style={{
                        backgroundImage:
                          "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M6 9l6 6 6-6'/></svg>\")",
                        backgroundPosition: 'right 0.75rem center',
                        backgroundSize: '14px',
                      }}
                    >
                      <option value="">Select a song...</option>
                      {songs.map((song) => (
                        <option key={song.id} value={song.id}>{song.title}</option>
                      ))}
                    </select>
                    <button onClick={sendSong} disabled={!shareSongId} className="px-4 py-2 rounded-full text-gray-900 disabled:opacity-50 h-10 w-full md:w-24 md:flex-shrink-0" style={gBg}>
                      Share
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-gray-400 mb-1 uppercase tracking-wide">Share a playlist</label>
                  <div className="flex flex-col md:flex-row md:items-stretch gap-2">
                    <select
                      value={sharePlaylistId}
                      onChange={(e) => setSharePlaylistId(e.target.value)}
                      className="flex-1 min-w-0 px-3 pr-12 py-2 bg-gray-900/70 border border-white/10 rounded-full text-white h-10 appearance-none bg-no-repeat"
                      style={{
                        backgroundImage:
                          "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M6 9l6 6 6-6'/></svg>\")",
                        backgroundPosition: 'right 0.75rem center',
                        backgroundSize: '14px',
                      }}
                    >
                      <option value="">Select a playlist...</option>
                      {playlists.map((playlist) => (
                        <option key={playlist.id} value={playlist.id}>{playlist.title}</option>
                      ))}
                    </select>
                    <button onClick={sendPlaylist} disabled={!sharePlaylistId} className="px-4 py-2 rounded-full text-gray-900 disabled:opacity-50 h-10 w-full md:w-24 md:flex-shrink-0" style={gBg}>
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
      <Notification
        message={notification.message}
        type={notification.type}
        isVisible={notification.isVisible}
        onClose={hideNotification}
      />
    </div>
  );
}
