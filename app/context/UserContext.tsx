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
  themeColor?: string;
  friends?: string[];
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
  updateProfilePicture: (imageFile: File) => Promise<boolean>;
  updateUserTheme: (themeColor: string) => Promise<boolean>;
  clearAllUserData: () => void;
  isLoading: boolean;
  addFriend: (username: string) => Promise<{ success: boolean; error?: string }>;
  removeFriend: (username: string) => Promise<boolean>;
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
  themeColor: data.themeColor,
  friends: Array.isArray(data.friends) ? data.friends : [],
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

    const unsubscribe = onAuthStateChanged(authClient, async (authUser) => {
      if (!authUser) {
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
          };
          await setDoc(doc(dbClient, 'users', authUser.uid), {
            ...fallback,
            usernameLower: normalizeUsername(fallback.username),
          }, { merge: true });
          setUser(fallback);
        } else {
          setUser(userDocToSession(authUser.uid, snap.data()));
        }
      } catch (error) {
        console.error('Failed loading user profile', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
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
      await updateDoc(doc(db, 'users', user.id), { friends: arrayUnion(canonical) });
      setUser((prev) => {
        if (!prev) return prev;
        const next = Array.from(new Set([...(prev.friends || []), canonical]));
        return { ...prev, friends: next };
      });
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

  const updateProfilePicture = async (imageFile: File): Promise<boolean> => {
    if (!user || !db) return false;
    try {
      let imageUrl = URL.createObjectURL(imageFile);
      if (storage) {
        const path = `users/${user.id}/profile/${Date.now()}-${imageFile.name}`;
        const fileRef = ref(storage, path);
        await uploadBytes(fileRef, imageFile);
        imageUrl = await getDownloadURL(fileRef);
      }
      await updateDoc(doc(db, 'users', user.id), { profilePicture: imageUrl });
      setUser((prev) => (prev ? { ...prev, profilePicture: imageUrl } : prev));

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
        updateUserProfile,
        isLoading,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};
