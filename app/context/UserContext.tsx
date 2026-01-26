'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

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
  login: (username: string, password: string) => Promise<{success: boolean, error?: string}>;
  signup: (firstName: string, username: string, email: string, password: string) => Promise<{success: boolean, error?: string}>;
  logout: () => void;
  updateProfilePicture: (imageFile: File) => Promise<boolean>;
  updateUserTheme: (themeColor: string) => Promise<boolean>;
  updateUserProfile: (data: { bio?: string; website?: string; publicProfile?: boolean }) => Promise<boolean>;
  clearAllUserData: () => void;
  isLoading: boolean;
  addFriend: (friendUsername: string) => Promise<{success: boolean, error?: string}>;
  removeFriend: (friendUsername: string) => Promise<{success: boolean, error?: string}>;
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

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('kjbeats_user');
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        // ensure friends array exists
        if (!userData.friends) userData.friends = [];
        if (typeof userData.bio === 'undefined') userData.bio = '';
        if (typeof userData.website === 'undefined') userData.website = '';
        if (typeof userData.publicProfile === 'undefined') userData.publicProfile = false;
        // Handle backward compatibility for users without firstName
        if (!userData.firstName) {
          // Auto-migrate: use username as firstName for backward compatibility
          userData.firstName = userData.username || 'User';
          
          // Update the saved user data
          localStorage.setItem('kjbeats_user', JSON.stringify(userData));
          
          // Also update in the users list if it exists
          try {
            const allUsers = JSON.parse(localStorage.getItem('kjbeats_users') || '[]');
            const userIndex = allUsers.findIndex((u: User) => u.id === userData.id);
            if (userIndex !== -1) {
              allUsers[userIndex].firstName = userData.firstName;
              localStorage.setItem('kjbeats_users', JSON.stringify(allUsers));
            }
          } catch (e) {
            console.log('No users list to update');
          }
        }
        setUser(userData);
      } catch (error) {
        console.error('Error parsing saved user:', error);
        localStorage.removeItem('kjbeats_user');
      }
    }
    
    // Clean up old users without firstName from the users list
    try {
      const allUsers = JSON.parse(localStorage.getItem('kjbeats_users') || '[]');
      const validUsers = allUsers.filter((user: User) => user.firstName);
      if (validUsers.length !== allUsers.length) {
        localStorage.setItem('kjbeats_users', JSON.stringify(validUsers));
      }
    } catch (error) {
      console.error('Error cleaning up user data:', error);
    }
    
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string): Promise<{success: boolean, error?: string}> => {
    setIsLoading(true);
    
    // Get all users from localStorage
    const users = JSON.parse(localStorage.getItem('kjbeats_users') || '[]');
    const foundUser = users.find((u: User & { password: string }) => 
      u.username === username && u.password === password
    );

    if (foundUser) {
      // Handle backward compatibility for users without firstName
      if (!foundUser.firstName) {
        // Auto-update the user with firstName = username for backward compatibility
        foundUser.firstName = foundUser.username;
        
        // Update the user in the users array
        const userIndex = users.findIndex((u: User) => u.id === foundUser.id);
        if (userIndex !== -1) {
          users[userIndex] = foundUser;
          localStorage.setItem('kjbeats_users', JSON.stringify(users));
        }
      }
      
      const userSession = {
        id: foundUser.id,
        username: foundUser.username,
        firstName: foundUser.firstName,
        email: foundUser.email,
        createdAt: foundUser.createdAt,
        profilePicture: foundUser.profilePicture
      };
      setUser(userSession);
      localStorage.setItem('kjbeats_user', JSON.stringify(userSession));
      setIsLoading(false);
      return { success: true };
    }

    setIsLoading(false);
    return { success: false, error: 'Invalid username or password' };
  };

  const signup = async (firstName: string, username: string, email: string, password: string): Promise<{success: boolean, error?: string}> => {
    setIsLoading(true);

    // Get existing users
    const users = JSON.parse(localStorage.getItem('kjbeats_users') || '[]');
    
    // Check if username or email already exists (only valid users with firstName)
    const existingUser = users.find((u: User) => 
      u.username === username || u.email === email
    );

    if (existingUser) {
      setIsLoading(false);
      if (existingUser.username === username) {
        return { success: false, error: 'Username already exists' };
      } else {
        return { success: false, error: 'Email already registered' };
      }
    }

    // Create new user
    const newUser = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      firstName,
      username,
      email,
      password, // In a real app, this would be hashed
      createdAt: new Date().toISOString(),
      friends: [],
      bio: '',
      website: '',
      publicProfile: false
    };

    users.push(newUser);
    localStorage.setItem('kjbeats_users', JSON.stringify(users));

    // Auto-login the new user
    const userSession = {
      id: newUser.id,
      username: newUser.username,
      firstName: newUser.firstName,
      email: newUser.email,
      createdAt: newUser.createdAt
    };
    setUser(userSession);
    localStorage.setItem('kjbeats_user', JSON.stringify(userSession));

    setIsLoading(false);
    return { success: true };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('kjbeats_user');
  };

  const clearAllUserData = () => {
    localStorage.removeItem('kjbeats_users');
    localStorage.removeItem('kjbeats_user');
    setUser(null);
  };

  const updateUserTheme = async (themeColor: string): Promise<boolean> => {
    if (!user) return false;

    try {
      // Update user in localStorage
      const users = JSON.parse(localStorage.getItem('kjbeats_users') || '[]');
      const userIndex = users.findIndex((u: User) => u.id === user.id);
      
      if (userIndex !== -1) {
        users[userIndex].themeColor = themeColor;
        localStorage.setItem('kjbeats_users', JSON.stringify(users));
        
        // Update current user session
        const updatedUser = { ...user, themeColor };
        setUser(updatedUser);
        localStorage.setItem('kjbeats_user', JSON.stringify(updatedUser));
        
        return true;
      }
    } catch (error) {
      console.error('Error updating user theme:', error);
    }
    
    return false;
  };

  const updateUserProfile = async (data: { bio?: string; website?: string; publicProfile?: boolean }): Promise<boolean> => {
    if (!user) return false;
    try {
      const users = JSON.parse(localStorage.getItem('kjbeats_users') || '[]');
      const userIndex = users.findIndex((u: User) => u.id === user.id);

      const updatedUser = { ...user, ...data } as User;

      if (userIndex !== -1) {
        users[userIndex] = { ...users[userIndex], ...data };
        localStorage.setItem('kjbeats_users', JSON.stringify(users));
      }

      setUser(updatedUser);
      localStorage.setItem('kjbeats_user', JSON.stringify(updatedUser));
      return true;
    } catch (e) {
      console.error('updateUserProfile failed', e);
      return false;
    }
  };

  const updateProfilePicture = async (imageFile: File): Promise<boolean> => {
    if (!user) return false;

    try {
      // Create a blob URL for the image
      const imageUrl = URL.createObjectURL(imageFile);
      
      // Update user in localStorage
      const users = JSON.parse(localStorage.getItem('kjbeats_users') || '[]');
      const userIndex = users.findIndex((u: User) => u.id === user.id);
      
      if (userIndex !== -1) {
        users[userIndex].profilePicture = imageUrl;
        localStorage.setItem('kjbeats_users', JSON.stringify(users));
        
        // Update current user session
        const updatedUser = { ...user, profilePicture: imageUrl };
  if (!updatedUser.friends) updatedUser.friends = [];
        setUser(updatedUser);
        localStorage.setItem('kjbeats_user', JSON.stringify(updatedUser));
        
        // Store the file for later use (client-side only)
        if (typeof window !== 'undefined') {
          (window as typeof window & {profilePictures?: Map<string, File>}).profilePictures = 
            (window as typeof window & {profilePictures?: Map<string, File>}).profilePictures || new Map();
          (window as typeof window & {profilePictures?: Map<string, File>}).profilePictures!.set(user.id, imageFile);
        }
        
        return true;
      }
    } catch (error) {
      console.error('Error updating profile picture:', error);
    }
    
    return false;
  };

  const addFriend = async (friendUsername: string): Promise<{success: boolean, error?: string}> => {
    if (!user) return { success: false, error: 'Not signed in' };
    try {
      const users = JSON.parse(localStorage.getItem('kjbeats_users') || '[]');
      const found = users.find((u: any) => u.username === friendUsername);
      if (!found) return { success: false, error: 'User not found' };

      const updatedUser = { ...user, friends: Array.from(new Set([...(user.friends || []), friendUsername])) };

      // update users list if present
      const idx = users.findIndex((u: any) => u.id === user.id);
      if (idx !== -1) {
        users[idx].friends = updatedUser.friends;
        localStorage.setItem('kjbeats_users', JSON.stringify(users));
      }

      setUser(updatedUser);
      localStorage.setItem('kjbeats_user', JSON.stringify(updatedUser));
      return { success: true };
    } catch (e) {
      console.error('addFriend failed', e);
      return { success: false, error: 'Failed to add friend' };
    }
  };

  const removeFriend = async (friendUsername: string): Promise<{success: boolean, error?: string}> => {
    if (!user) return { success: false, error: 'Not signed in' };
    try {
      const users = JSON.parse(localStorage.getItem('kjbeats_users') || '[]');
      const updatedFriends = (user.friends || []).filter(f => f !== friendUsername);
      const updatedUser = { ...user, friends: updatedFriends };

      const idx = users.findIndex((u: any) => u.id === user.id);
      if (idx !== -1) {
        users[idx].friends = updatedFriends;
        localStorage.setItem('kjbeats_users', JSON.stringify(users));
      }

      setUser(updatedUser);
      localStorage.setItem('kjbeats_user', JSON.stringify(updatedUser));
      return { success: true };
    } catch (e) {
      console.error('removeFriend failed', e);
      return { success: false, error: 'Failed to remove friend' };
    }
  };

  return (
    <UserContext.Provider value={{
      user,
      login,
      signup,
      logout,
      updateProfilePicture,
      updateUserTheme,
      updateUserProfile,
      clearAllUserData,
      addFriend,
      removeFriend,
      isLoading
    }}>
      {children}
    </UserContext.Provider>
  );
};