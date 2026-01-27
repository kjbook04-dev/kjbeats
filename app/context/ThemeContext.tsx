'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useUser } from './UserContext';

export interface ColorTheme {
  name: string;
  primary: string;
  secondary: string;
  gradient: string;
  gradientHover: string;
  text: string;
  textHover: string;
  border: string;
  borderHover: string;
  bg: string;
  bgHover: string;
  backgroundCss?: string;
}

export const COLOR_THEMES: Record<string, ColorTheme> = {
  pink: {
    name: 'Pink',
    primary: 'rgb(236 72 153)', // pink-500
    secondary: 'rgb(219 39 119)', // pink-600
    gradient: 'from-pink-300 to-pink-500',
    gradientHover: 'from-pink-400 to-pink-600',
    text: 'text-pink-300',
    textHover: 'hover:text-pink-400',
    border: 'border-pink-400',
    borderHover: 'hover:border-pink-400',
    bg: 'bg-pink-500',
    bgHover: 'hover:bg-pink-600'
  },
  red: {
    name: 'Red',
    primary: 'rgb(239 68 68)', // red-500
    secondary: 'rgb(220 38 38)', // red-600
    gradient: 'from-red-300 to-red-500',
    gradientHover: 'from-red-400 to-red-600',
    text: 'text-red-300',
    textHover: 'hover:text-red-400',
    border: 'border-red-400',
    borderHover: 'hover:border-red-400',
    bg: 'bg-red-500',
    bgHover: 'hover:bg-red-600'
  },
  orange: {
    name: 'Orange',
    primary: 'rgb(249 115 22)', // orange-500
    secondary: 'rgb(234 88 12)', // orange-600
    gradient: 'from-orange-300 to-orange-500',
    gradientHover: 'from-orange-400 to-orange-600',
    text: 'text-orange-300',
    textHover: 'hover:text-orange-400',
    border: 'border-orange-400',
    borderHover: 'hover:border-orange-400',
    bg: 'bg-orange-500',
    bgHover: 'hover:bg-orange-600'
  },
  yellow: {
    name: 'Yellow',
    primary: 'rgb(234 179 8)', // yellow-500
    secondary: 'rgb(202 138 4)', // yellow-600
    gradient: 'from-yellow-300 to-yellow-500',
    gradientHover: 'from-yellow-400 to-yellow-600',
    text: 'text-yellow-300',
    textHover: 'hover:text-yellow-400',
    border: 'border-yellow-400',
    borderHover: 'hover:border-yellow-400',
    bg: 'bg-yellow-500',
    bgHover: 'hover:bg-yellow-600'
  },
  green: {
    name: 'Green',
    primary: 'rgb(34 197 94)', // green-500
    secondary: 'rgb(22 163 74)', // green-600
    gradient: 'from-green-300 to-green-500',
    gradientHover: 'from-green-400 to-green-600',
    text: 'text-green-300',
    textHover: 'hover:text-green-400',
    border: 'border-green-400',
    borderHover: 'hover:border-green-400',
    bg: 'bg-green-500',
    bgHover: 'hover:bg-green-600'
  },
  blue: {
    name: 'Blue',
    primary: 'rgb(59 130 246)', // blue-500
    secondary: 'rgb(37 99 235)', // blue-600
    gradient: 'from-blue-300 to-blue-500',
    gradientHover: 'from-blue-400 to-blue-600',
    text: 'text-blue-300',
    textHover: 'hover:text-blue-400',
    border: 'border-blue-400',
    borderHover: 'hover:border-blue-400',
    bg: 'bg-blue-500',
    bgHover: 'hover:bg-blue-600'
  },
  purple: {
    name: 'Purple',
    primary: 'rgb(168 85 247)', // purple-500
    secondary: 'rgb(147 51 234)', // purple-600
    gradient: 'from-purple-300 to-purple-500',
    gradientHover: 'from-purple-400 to-purple-600',
    text: 'text-purple-300',
    textHover: 'hover:text-purple-400',
    border: 'border-purple-400',
    borderHover: 'hover:border-purple-400',
    bg: 'bg-purple-500',
    bgHover: 'hover:bg-purple-600'
  },
  gray: {
    name: 'Light Gray',
    primary: 'rgb(156 163 175)', // gray-400
    secondary: 'rgb(107 114 128)', // gray-500
    gradient: 'from-gray-300 to-gray-500',
    gradientHover: 'from-gray-400 to-gray-600',
    text: 'text-gray-300',
    textHover: 'hover:text-gray-400',
    border: 'border-gray-400',
    borderHover: 'hover:border-gray-400',
    bg: 'bg-gray-500',
    bgHover: 'hover:bg-gray-600'
  }
};

interface ThemeContextType {
  currentTheme: ColorTheme;
  changeTheme: (colorKey: string) => void;
  availableThemes: Record<string, ColorTheme>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const { user, updateUserTheme } = useUser();

  const currentTheme = COLOR_THEMES[user?.themeColor || 'pink'];

  const changeTheme = async (colorKey: string) => {
    if (user && COLOR_THEMES[colorKey]) {
      await updateUserTheme(colorKey);
    }
  };

  return (
    <ThemeContext.Provider value={{
      currentTheme,
      changeTheme,
      availableThemes: COLOR_THEMES
    }}>
      {children}
    </ThemeContext.Provider>
  );
};