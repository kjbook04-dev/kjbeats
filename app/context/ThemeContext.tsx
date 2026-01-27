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
  red: {
    name: 'Red',
    primary: 'rgb(239 68 68)',
    secondary: 'rgb(220 38 38)',
    gradient: 'from-red-400 to-red-600',
    gradientHover: 'from-red-500 to-red-700',
    text: 'text-red-300',
    textHover: 'hover:text-red-400',
    border: 'border-red-400',
    borderHover: 'hover:border-red-400',
    bg: 'bg-red-500',
    bgHover: 'hover:bg-red-600'
  },
  orange: {
    name: 'Orange',
    primary: 'rgb(249 115 22)',
    secondary: 'rgb(234 88 12)',
    gradient: 'from-orange-400 to-orange-600',
    gradientHover: 'from-orange-500 to-orange-700',
    text: 'text-orange-300',
    textHover: 'hover:text-orange-400',
    border: 'border-orange-400',
    borderHover: 'hover:border-orange-400',
    bg: 'bg-orange-500',
    bgHover: 'hover:bg-orange-600'
  },
  yellow: {
    name: 'Yellow',
    primary: 'rgb(234 179 8)',
    secondary: 'rgb(202 138 4)',
    gradient: 'from-yellow-400 to-yellow-600',
    gradientHover: 'from-yellow-500 to-yellow-700',
    text: 'text-yellow-300',
    textHover: 'hover:text-yellow-400',
    border: 'border-yellow-400',
    borderHover: 'hover:border-yellow-400',
    bg: 'bg-yellow-500',
    bgHover: 'hover:bg-yellow-600'
  },
  green: {
    name: 'Green',
    primary: 'rgb(34 197 94)',
    secondary: 'rgb(22 163 74)',
    gradient: 'from-green-400 to-green-600',
    gradientHover: 'from-green-500 to-green-700',
    text: 'text-green-300',
    textHover: 'hover:text-green-400',
    border: 'border-green-400',
    borderHover: 'hover:border-green-400',
    bg: 'bg-green-500',
    bgHover: 'hover:bg-green-600'
  },
  chartreuse: {
    name: 'Chartreuse',
    primary: 'rgb(163 230 53)',
    secondary: 'rgb(132 204 22)',
    gradient: 'from-lime-400 to-lime-600',
    gradientHover: 'from-lime-500 to-lime-700',
    text: 'text-lime-300',
    textHover: 'hover:text-lime-400',
    border: 'border-lime-400',
    borderHover: 'hover:border-lime-400',
    bg: 'bg-lime-500',
    bgHover: 'hover:bg-lime-600'
  },
  cyan: {
    name: 'Cyan',
    primary: 'rgb(6 182 212)',
    secondary: 'rgb(13 148 136)',
    gradient: 'from-cyan-400 to-cyan-600',
    gradientHover: 'from-cyan-500 to-cyan-700',
    text: 'text-cyan-300',
    textHover: 'hover:text-cyan-400',
    border: 'border-cyan-400',
    borderHover: 'hover:border-cyan-400',
    bg: 'bg-cyan-500',
    bgHover: 'hover:bg-cyan-600'
  },
  blue: {
    name: 'Blue',
    primary: 'rgb(59 130 246)',
    secondary: 'rgb(37 99 235)',
    gradient: 'from-blue-400 to-blue-600',
    gradientHover: 'from-blue-500 to-blue-700',
    text: 'text-blue-300',
    textHover: 'hover:text-blue-400',
    border: 'border-blue-400',
    borderHover: 'hover:border-blue-400',
    bg: 'bg-blue-500',
    bgHover: 'hover:bg-blue-600'
  },
  lavender: {
    name: 'Lavender',
    primary: 'rgb(199 210 254)',
    secondary: 'rgb(167 139 250)',
    gradient: 'from-violet-300 to-violet-500',
    gradientHover: 'from-violet-400 to-violet-600',
    text: 'text-violet-300',
    textHover: 'hover:text-violet-400',
    border: 'border-violet-400',
    borderHover: 'hover:border-violet-400',
    bg: 'bg-violet-500',
    bgHover: 'hover:bg-violet-600'
  },
  purple: {
    name: 'Purple',
    primary: 'rgb(147 51 234)',
    secondary: 'rgb(124 58 237)',
    gradient: 'from-purple-400 to-purple-600',
    gradientHover: 'from-purple-500 to-purple-700',
    text: 'text-purple-300',
    textHover: 'hover:text-purple-400',
    border: 'border-purple-400',
    borderHover: 'hover:border-purple-400',
    bg: 'bg-purple-500',
    bgHover: 'hover:bg-purple-600'
  },
  gray: {
    name: 'Light Gray',
    primary: 'rgb(156 163 175)',
    secondary: 'rgb(107 114 128)',
    gradient: 'from-gray-300 to-gray-500',
    gradientHover: 'from-gray-400 to-gray-600',
    text: 'text-gray-300',
    textHover: 'hover:text-gray-400',
    border: 'border-gray-400',
    borderHover: 'hover:border-gray-400',
    bg: 'bg-gray-500',
    bgHover: 'hover:bg-gray-600'
  },
  // Gradients (chosen presets)
  iridescent: {
    name: 'Iridescent',
    primary: 'rgb(255 214 240)',
    secondary: 'rgb(198 255 245)',
    gradient: 'from-pink-200 to-cyan-200',
    gradientHover: 'from-pink-300 to-cyan-300',
    text: 'text-pink-300',
    textHover: 'hover:text-pink-400',
    border: 'border-pink-200',
    borderHover: 'hover:border-pink-300',
    bg: 'bg-pink-100',
    bgHover: 'hover:bg-pink-200',
    backgroundCss: 'linear-gradient(135deg, #ffd6f0 0%, #e9d5ff 25%, #d6e6ff 50%, #c7fff3 75%, #fffad6 100%)'
  },
  aurora: {
    name: 'Aurora',
    primary: 'rgb(129 140 248)',
    secondary: 'rgb(34 197 94)',
    gradient: 'from-violet-300 to-green-300',
    gradientHover: 'from-violet-400 to-green-400',
    text: 'text-violet-300',
    textHover: 'hover:text-violet-400',
    border: 'border-violet-400',
    borderHover: 'hover:border-violet-400',
    bg: 'bg-violet-500',
    bgHover: 'hover:bg-violet-600',
    backgroundCss: 'linear-gradient(135deg, #8e9eff 0%, #7bf2d9 40%, #b8fff9 70%)'
  },
  sunset: {
    name: 'Sunset',
    primary: 'rgb(249 115 22)',
    secondary: 'rgb(236 72 153)',
    gradient: 'from-orange-300 to-pink-400',
    gradientHover: 'from-orange-400 to-pink-500',
    text: 'text-orange-300',
    textHover: 'hover:text-orange-400',
    border: 'border-orange-400',
    borderHover: 'hover:border-orange-400',
    bg: 'bg-orange-500',
    bgHover: 'hover:bg-orange-600',
    backgroundCss: 'linear-gradient(135deg, #ff9a8b 0%, #ff758c 35%, #ffb199 100%)'
  },
  prismatic: {
    name: 'Prismatic',
    primary: 'rgb(255 107 107)',
    secondary: 'rgb(107 188 255)',
    gradient: 'from-rose-400 to-sky-400',
    gradientHover: 'from-rose-500 to-sky-500',
    text: 'text-rose-300',
    textHover: 'hover:text-rose-400',
    border: 'border-rose-300',
    borderHover: 'hover:border-rose-400',
    bg: 'bg-rose-400',
    bgHover: 'hover:bg-rose-500',
    backgroundCss: 'linear-gradient(135deg, #ff6b6b 0%, #f7b267 25%, #ffd93d 50%, #6be8b0 75%, #6bbcff 100%)'
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
    // Defensive fallback: if ThemeProvider is not present for any reason,
    // return a safe default theme so client components don't crash.
    return {
      currentTheme: COLOR_THEMES.red,
      changeTheme: async () => {},
      availableThemes: COLOR_THEMES,
    } as const;
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const { user, updateUserTheme } = useUser();

  // Ensure we always pick a valid theme key. If user.themeColor is missing or not
  // present in COLOR_THEMES, fall back to 'pink'. This guards against undefined
  // currentTheme at runtime.
  const themeKey = (user && user.themeColor && COLOR_THEMES[user.themeColor]) ? user.themeColor : 'red';
  const currentTheme = COLOR_THEMES[themeKey];

  const changeTheme = async (colorKey: string) => {
    if (COLOR_THEMES[colorKey]) {
      if (user) {
        await updateUserTheme(colorKey);
      }
    }
  };

  // Expose CSS variables for consistent theme usage across components.
  // --theme-gradient: used for background-image on banners/buttons
  // --theme-primary / --theme-secondary: primary color fallbacks
  const themeGradient = currentTheme.backgroundCss ? currentTheme.backgroundCss : `linear-gradient(90deg, ${currentTheme.primary}, ${currentTheme.secondary})`;

  const wrapperStyle: React.CSSProperties = {
    // CSS custom properties (kebab-case) must be casted for TS
    ['--theme-gradient' as any]: themeGradient,
    ['--theme-primary' as any]: currentTheme.primary,
    ['--theme-secondary' as any]: currentTheme.secondary,
    ['--theme-text' as any]: currentTheme.primary,
  };

  return (
    <ThemeContext.Provider value={{
      currentTheme,
      changeTheme,
      availableThemes: COLOR_THEMES
    }}>
      <div style={wrapperStyle}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
};