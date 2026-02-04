'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  browserLocalPersistence,
  browserSessionPersistence,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import {
  arrayRemove,
  arrayUnion,
  doc,
  getDoc,
  onSnapshot,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { auth, db, firebaseConfigured, storage } from '../lib/firebase';

export interface User {
  id: string;
  username: string;
  firstName: string;
  email: string;
  createdAt: string;
  profilePicture?: string;
  profilePictureOriginal?: string;
  themeColor?: string;
  friends?: string[];
  friendNotifications?: Array<{ from: string; createdAt?: string; type?: string }>;
  friendRequests?: string[];
  conversationReads?: Record<string, string>;
  bio?: string;
  website?: string;
  publicProfile?: boolean;
}

interface UserContextType {
  user: User | null;
  login: (username: string, password: string, remember?: boolean) => Promise<{ success: boolean; error?: string }>;
  signup: (firstName: string, username: string, email: string, password: string, remember?: boolean) => Promise<{ success: boolean; error?: string }>;
  requestPasswordReset: (usernameOrEmail: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateProfilePicture: (imageFile: File, originalFile?: File) => Promise<boolean>;
  updateUserTheme: (themeColor: string) => Promise<boolean>;
  clearAllUserData: () => void;
  isLoading: boolean;
  addFriend: (username: string) => Promise<{ success: boolean; error?: string }>;
  removeFriend: (username: string) => Promise<boolean>;
  acceptFriendRequest: (username: string) => Promise<boolean>;
  declineFriendRequest: (username: string) => Promise<boolean>;
  clearFriendNotifications: () => Promise<void>;
  updateUserProfile: (data: { bio?: string; website?: string; publicProfile?: boolean }) => Promise<boolean>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

interface UserProviderProps {
  children: ReactNode;
}

const normalizeUsername = (value: string) => value.trim().toLowerCase();

const userDocToSession = (uid: string, data: any): User => ({
  id: uid,
  username: data.username || '',
  firstName: data.firstName || data.username || 'User',
  email: data.email || '',
  createdAt: data.createdAt || new Date().toISOString(),
  profilePicture: data.profilePicture,
  profilePictureOriginal: data.profilePictureOriginal,
  themeColor: data.themeColor,
  friends: Array.isArray(data.friends) ? data.friends : [],
  friendNotifications: Array.isArray(data.friendNotifications) ? data.friendNotifications : [],
  friendRequests: Array.isArray(data.friendRequests) ? data.friendRequests : [],
  conversationReads: data.conversationReads || {},
  bio: data.bio || '',
  website: data.website || '',
  publicProfile: !!data.publicProfile,
});

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const authClient = auth;
    const dbClient = db;
    if (!firebaseConfigured || !authClient || !dbClient) {
      setIsLoading(false);
      return;
    }

    let userDocUnsub: (() => void) | null = null;
    const unsubscribe = onAuthStateChanged(authClient, async (authUser) => {
      if (!authUser) {
        if (userDocUnsub) {
          userDocUnsub();
          userDocUnsub = null;
        }
        setUser(null);
        setIsLoading(false);
        return;
      }

      try {
        const snap = await getDoc(doc(dbClient, 'users', authUser.uid));
        if (!snap.exists()) {
          const fallback: User = {
            id: authUser.uid,
            username: authUser.email?.split('@')[0] || 'user',
            firstName: authUser.displayName || authUser.email?.split('@')[0] || 'User',
            email: authUser.email || '',
            createdAt: new Date().toISOString(),
            friends: [],
            friendNotifications: [],
            friendRequests: [],
          };
          await setDoc(doc(dbClient, 'users', authUser.uid), {
            ...fallback,
            usernameLower: normalizeUsername(fallback.username),
          }, { merge: true });
        }

        if (userDocUnsub) userDocUnsub();
        userDocUnsub = onSnapshot(doc(dbClient, 'users', authUser.uid), (userSnap) => {
          if (!userSnap.exists()) {
            setUser(null);
            return;
          }
          setUser(userDocToSession(authUser.uid, userSnap.data()));
          setIsLoading(false);
        });
      } catch (error) {
        console.error('Failed loading user profile', error);
        setUser(null);
        setIsLoading(false);
      }
    });

    return () => {
      unsubscribe();
      if (userDocUnsub) userDocUnsub();
    };
  }, []);

  const login = async (username: string, password: string, remember: boolean = true): Promise<{ success: boolean; error?: string }> => {
    const authClient = auth;
    const dbClient = db;
    if (!firebaseConfigured || !authClient || !dbClient) {
      return { success: false, error: 'Firebase is not configured yet' };
    }

    setIsLoading(true);
    try {
      await setPersistence(authClient, remember ? browserLocalPersistence : browserSessionPersistence);
      const uname = normalizeUsername(username);

      // Username-based login: lookup email by username in Firestore.
      const usernameDoc = await getDoc(doc(dbClient, 'usernames', uname));
      if (!usernameDoc.exists()) {
        setIsLoading(false);
        return { success: false, error: 'Invalid username or password' };
      }

      const data = usernameDoc.data();
      const email = data.email as string;
      await signInWithEmailAndPassword(authClient, email, password);
      setIsLoading(false);
      return { success: true };
    } catch (error) {
      setIsLoading(false);
      return { success: false, error: 'Invalid username or password' };
    }
  };

  const requestPasswordReset = async (usernameOrEmail: string): Promise<{ success: boolean; error?: string }> => {
    const authClient = auth;
    const dbClient = db;
    if (!firebaseConfigured || !authClient || !dbClient) {
      return { success: false, error: 'Firebase is not configured yet' };
    }
    const input = usernameOrEmail.trim();
    if (!input) return { success: false, error: 'Enter your username or email' };

    try {
      // If input looks like email, use it directly. Otherwise resolve username -> email.
      let email = input;
      if (!input.includes('@')) {
        const uname = normalizeUsername(input);
        const usernameDoc = await getDoc(doc(dbClient, 'usernames', uname));
        if (!usernameDoc.exists()) {
          return { success: false, error: 'No account found for that username' };
        }
        email = usernameDoc.data().email as string;
      }
      await sendPasswordResetEmail(authClient, email);
      return { success: true };
    } catch (error) {
      console.error('Password reset failed', error);
      return { success: false, error: 'Unable to send reset email' };
    }
  };

  const signup = async (
    firstName: string,
    username: string,
    email: string,
    password: string,
    remember: boolean = true
  ): Promise<{ success: boolean; error?: string }> => {
    const authClient = auth;
    const dbClient = db;
    if (!firebaseConfigured || !authClient || !dbClient) {
      return { success: false, error: 'Firebase is not configured yet' };
    }

    setIsLoading(true);
    try {
      const uname = normalizeUsername(username);
      const usernameRef = doc(dbClient, 'usernames', uname);
      const existingUsername = await getDoc(usernameRef);
      if (existingUsername.exists()) {
        setIsLoading(false);
        return { success: false, error: 'Username already exists' };
      }

      await setPersistence(authClient, remember ? browserLocalPersistence : browserSessionPersistence);
      const cred = await createUserWithEmailAndPassword(authClient, email.trim(), password);
      const createdAt = new Date().toISOString();
      const userProfile = {
        id: cred.user.uid,
        username: username.trim(),
        usernameLower: uname,
        firstName: firstName.trim() || username.trim(),
        email: email.trim(),
        createdAt,
        friends: [] as string[],
        friendNotifications: [] as Array<{ from: string; createdAt?: string; type?: string }>,
        friendRequests: [] as string[],
        bio: '',
        website: '',
        publicProfile: false,
      };

      await setDoc(doc(dbClient, 'users', cred.user.uid), userProfile);
      await setDoc(usernameRef, { uid: cred.user.uid, email: email.trim(), username: username.trim() });
      setIsLoading(false);
      return { success: true };
    } catch (error: any) {
      setIsLoading(false);
      if (error?.code === 'auth/email-already-in-use') {
        return { success: false, error: 'Email already registered' };
      }
      return { success: false, error: 'Signup failed' };
    }
  };

  const logout = async () => {
    const authClient = auth;
    if (authClient) {
      try {
        await signOut(authClient);
      } catch (error) {
        console.error('Logout failed', error);
      }
    }
    setUser(null);
  };

  const clearAllUserData = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('kjbeats_user');
      localStorage.removeItem('kjbeats_users');
      sessionStorage.removeItem('kjbeats_user');
    }
  };

  const updateUserTheme = async (themeColor: string): Promise<boolean> => {
    if (!user || !db) return false;
    try {
      await updateDoc(doc(db, 'users', user.id), { themeColor });
      setUser((prev) => (prev ? { ...prev, themeColor } : prev));
      return true;
    } catch (error) {
      console.error('Error updating user theme:', error);
      return false;
    }
  };

  const addFriend = async (usernameToAdd: string): Promise<{ success: boolean; error?: string }> => {
    if (!user || !db) return { success: false, error: 'Not authenticated' };
    try {
      const uname = normalizeUsername(usernameToAdd);
      if (!uname) return { success: false, error: 'Enter a username' };
      if (normalizeUsername(user.username) === uname) return { success: false, error: 'You cannot add yourself' };

      const targetSnap = await getDoc(doc(db, 'usernames', uname));
      if (!targetSnap.exists()) return { success: false, error: 'User not found' };

      const canonical = (targetSnap.data().username as string) || usernameToAdd.trim();
      const targetUid = targetSnap.data().uid as string;
      const targetUserSnap = await getDoc(doc(db, 'users', targetUid));
      const targetData = targetUserSnap.exists() ? targetUserSnap.data() : {};
      const targetFriends = Array.isArray(targetData.friends) ? targetData.friends : [];
      const targetRequests = Array.isArray(targetData.friendRequests) ? targetData.friendRequests : [];
      if (targetFriends.includes(user.username)) {
        return { success: false, error: 'You are already friends.' };
      }
      if (targetRequests.includes(user.username)) {
        return { success: false, error: 'Friend request already sent.' };
      }
      if (targetUid) {
        await updateDoc(doc(db, 'users', targetUid), {
          friendNotifications: arrayUnion({
            from: user.username,
            createdAt: new Date().toISOString(),
            type: 'friend_request',
          }),
          friendRequests: arrayUnion(user.username),
        });
      }
      return { success: true };
    } catch (error) {
      console.error('Failed to add friend', error);
      return { success: false, error: 'Failed to add friend' };
    }
  };

  const removeFriend = async (usernameToRemove: string): Promise<boolean> => {
    if (!user || !db) return false;
    try {
      await updateDoc(doc(db, 'users', user.id), { friends: arrayRemove(usernameToRemove) });
      setUser((prev) => {
        if (!prev) return prev;
        return { ...prev, friends: (prev.friends || []).filter((f) => f !== usernameToRemove) };
      });
      return true;
    } catch (error) {
      console.error('Failed to remove friend', error);
      return false;
    }
  };

  const acceptFriendRequest = async (usernameToAccept: string): Promise<boolean> => {
    if (!user || !db) return false;
    try {
      const targetSnap = await getDoc(doc(db, 'usernames', normalizeUsername(usernameToAccept)));
      const targetUid = targetSnap.exists() ? (targetSnap.data().uid as string) : '';
      await updateDoc(doc(db, 'users', user.id), {
        friends: arrayUnion(usernameToAccept),
        friendRequests: arrayRemove(usernameToAccept),
      });
      setUser((prev) => {
        if (!prev) return prev;
        const nextFriends = Array.from(new Set([...(prev.friends || []), usernameToAccept]));
        const nextRequests = (prev.friendRequests || []).filter((r) => r !== usernameToAccept);
        return { ...prev, friends: nextFriends, friendRequests: nextRequests };
      });
      if (targetUid) {
        await updateDoc(doc(db, 'users', targetUid), {
          friends: arrayUnion(user.username),
          friendNotifications: arrayUnion({
            from: user.username,
            createdAt: new Date().toISOString(),
            type: 'friend_accepted',
          }),
        });
      }
      return true;
    } catch (error) {
      console.error('Failed to accept friend request', error);
      return false;
    }
  };

  const declineFriendRequest = async (usernameToDecline: string): Promise<boolean> => {
    if (!user || !db) return false;
    try {
      await updateDoc(doc(db, 'users', user.id), {
        friendRequests: arrayRemove(usernameToDecline),
      });
      setUser((prev) => {
        if (!prev) return prev;
        const nextRequests = (prev.friendRequests || []).filter((r) => r !== usernameToDecline);
        return { ...prev, friendRequests: nextRequests };
      });
      return true;
    } catch (error) {
      console.error('Failed to decline friend request', error);
      return false;
    }
  };

  const clearFriendNotifications = async () => {
    if (!user || !db) return;
    try {
      await updateDoc(doc(db, 'users', user.id), { friendNotifications: [] });
      setUser((prev) => (prev ? { ...prev, friendNotifications: [] } : prev));
    } catch (error) {
      console.error('Failed to clear friend notifications', error);
    }
  };

  const updateUserProfile = async (data: { bio?: string; website?: string; publicProfile?: boolean }): Promise<boolean> => {
    if (!user || !db) return false;
    try {
      const payload: Record<string, any> = {};
      if (data.bio !== undefined) payload.bio = data.bio;
      if (data.website !== undefined) payload.website = data.website;
      if (data.publicProfile !== undefined) payload.publicProfile = data.publicProfile;
      await updateDoc(doc(db, 'users', user.id), payload);
      setUser((prev) => (prev ? { ...prev, ...payload } : prev));
      return true;
    } catch (error) {
      console.error('Failed to update profile', error);
      return false;
    }
  };

  const updateProfilePicture = async (imageFile: File, originalFile?: File): Promise<boolean> => {
    if (!user || !db) return false;
    try {
      let imageUrl = URL.createObjectURL(imageFile);
      let originalUrl = user.profilePictureOriginal;
      if (storage) {
        const path = `users/${user.id}/profile/${Date.now()}-${imageFile.name}`;
        const fileRef = ref(storage, path);
        await uploadBytes(fileRef, imageFile);
        imageUrl = await getDownloadURL(fileRef);
        if (originalFile) {
          const originalPath = `users/${user.id}/profile/original/${Date.now()}-${originalFile.name}`;
          const originalRef = ref(storage, originalPath);
          await uploadBytes(originalRef, originalFile);
          originalUrl = await getDownloadURL(originalRef);
        }
      }
      await updateDoc(doc(db, 'users', user.id), {
        profilePicture: imageUrl,
        ...(originalUrl ? { profilePictureOriginal: originalUrl } : {}),
      });
      setUser((prev) =>
        prev
          ? { ...prev, profilePicture: imageUrl, ...(originalUrl ? { profilePictureOriginal: originalUrl } : {}) }
          : prev
      );

      if (typeof window !== 'undefined') {
        const win = window as typeof window & { profilePictures?: Map<string, File> };
        win.profilePictures = win.profilePictures || new Map();
        win.profilePictures.set(user.id, imageFile);
      }
      return true;
    } catch (error) {
      console.error('Error updating profile picture:', error);
      return false;
    }
  };

  return (
    <UserContext.Provider
      value={{
        user,
        login,
        signup,
        requestPasswordReset,
        logout,
        updateProfilePicture,
        updateUserTheme,
        clearAllUserData,
        addFriend,
        removeFriend,
        acceptFriendRequest,
        declineFriendRequest,
        clearFriendNotifications,
        updateUserProfile,
        isLoading,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};
