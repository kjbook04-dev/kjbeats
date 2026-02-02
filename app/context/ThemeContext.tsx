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
  // Optional full-css background (linear-gradient(...)) used by some themes
  backgroundCss?: string;
}

export const COLOR_THEMES: Record<string, ColorTheme> = {
  // Base colors (left-to-right in the picker)
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
  chartreuse: {
    name: 'Chartreuse',
    primary: 'rgb(132 204 22)', // lime-400
    secondary: 'rgb(77 124 15)',
    gradient: 'from-lime-300 to-lime-500',
    gradientHover: 'from-lime-400 to-lime-600',
    text: 'text-lime-200',
    textHover: 'hover:text-lime-300',
    border: 'border-lime-200',
    borderHover: 'hover:border-lime-300',
    bg: 'bg-lime-400',
    bgHover: 'hover:bg-lime-500'
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
  cyan: {
    name: 'Cyan',
    primary: 'rgb(6 182 212)', // cyan-400
    secondary: 'rgb(14 165 233)', // cyan-500
    gradient: 'from-cyan-300 to-cyan-500',
    gradientHover: 'from-cyan-400 to-cyan-600',
    text: 'text-cyan-200',
    textHover: 'hover:text-cyan-300',
    border: 'border-cyan-300',
    borderHover: 'hover:border-cyan-400',
    bg: 'bg-cyan-400',
    bgHover: 'hover:bg-cyan-500'
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
  lavender: {
    name: 'Lavender',
    primary: 'rgb(196 181 253)', // lavender-300
    secondary: 'rgb(167 139 250)', // lavender-400
    gradient: 'from-purple-100 to-purple-300',
    gradientHover: 'from-purple-200 to-purple-400',
    text: 'text-purple-200',
    textHover: 'hover:text-purple-300',
    border: 'border-purple-200',
    borderHover: 'hover:border-purple-300',
    bg: 'bg-purple-200',
    bgHover: 'hover:bg-purple-300'
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
  },
  white: {
    name: 'White',
    // Use pure/strong whites for the white theme so accent elements (thumbs, dot)
    // and gradients appear fully white instead of a pale gray.
    primary: '#ffffff',
    secondary: '#f3f4f6', // gray-100
    gradient: 'from-white to-gray-100',
    gradientHover: 'from-white to-gray-200',
    // Use white text classes for strong white accents where text is intended
    // to be white. Consumers that render on white backgrounds should take care
    // to apply appropriate background classes (the theme provides both).
    text: 'text-white',
    textHover: 'hover:text-white',
    border: 'border-white',
    borderHover: 'hover:border-gray-200',
    bg: 'bg-white',
    bgHover: 'hover:bg-gray-100'
  },
  // Gradient/preview-only themes go at the end
  iridescent: {
    name: 'Iridescent',
    // subtle iridescent gradient; primary is a mid-tone used for small accents
    primary: '#b38be6',
    secondary: '#f7c6ff',
  backgroundCss: 'linear-gradient(120deg, #c7f9ff 0%, #ffd6e0 25%, #e7c6ff 50%, #d0f0ff 75%, #c7f9ff 100%)',
    gradient: 'from-cyan-100 to-pink-100',
    gradientHover: 'from-purple-100 to-pink-100',
    text: 'text-purple-200',
    textHover: 'hover:text-purple-300',
    border: 'border-purple-200',
    borderHover: 'hover:border-pink-200',
    // Fallback background class for components that read currentTheme.bg
    bg: 'bg-purple-200',
    bgHover: 'hover:opacity-95'
  },
  sunset: {
    name: 'Sunset',
    primary: '#ff7a59',
    secondary: '#ffd56b',
    backgroundCss: 'linear-gradient(120deg, #ff7a59 0%, #ffb199 40%, #ffd56b 100%)',
    gradient: 'from-orange-300 to-yellow-300',
    gradientHover: 'from-orange-400 to-yellow-400',
    text: 'text-orange-200',
    textHover: 'hover:text-orange-300',
    border: 'border-orange-200',
    borderHover: 'hover:border-yellow-200',
    bg: 'bg-orange-300',
    bgHover: 'hover:bg-orange-400'
  },
  ocean: {
    name: 'Ocean',
    primary: '#2ec4b6',
    secondary: '#8bd3ff',
    backgroundCss: 'linear-gradient(120deg, #2ec4b6 0%, #7be3d6 40%, #8bd3ff 100%)',
    gradient: 'from-cyan-300 to-blue-200',
    gradientHover: 'from-cyan-400 to-blue-300',
    text: 'text-cyan-200',
    textHover: 'hover:text-cyan-300',
    border: 'border-cyan-200',
    borderHover: 'hover:border-blue-200',
    bg: 'bg-cyan-300',
    bgHover: 'hover:bg-cyan-400'
  },
  aurora: {
    name: 'Aurora',
    primary: '#9be7ff',
    secondary: '#b8ffb0',
    backgroundCss: 'linear-gradient(120deg, #9be7ff 0%, #d7b7ff 40%, #b8ffb0 100%)',
    gradient: 'from-cyan-100 to-green-100',
    gradientHover: 'from-purple-100 to-green-100',
    text: 'text-green-200',
    textHover: 'hover:text-green-300',
    border: 'border-green-200',
    borderHover: 'hover:border-purple-200',
    bg: 'bg-green-100',
    bgHover: 'hover:bg-green-200'
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
  const [themeKey, setThemeKey] = React.useState<string>('pink');

  // Restore last used theme for guests/logged-out state.
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem('kjbeats_theme');
      if (stored && COLOR_THEMES[stored]) {
        setThemeKey(stored);
      }
    } catch (e) {
      // ignore storage read errors
    }
  }, []);

  // If a logged-in user has a saved theme, let it become the active theme.
  React.useEffect(() => {
    if (!user?.themeColor || !COLOR_THEMES[user.themeColor]) return;
    setThemeKey(user.themeColor);
    try {
      localStorage.setItem('kjbeats_theme', user.themeColor);
    } catch (e) {
      // ignore storage write errors
    }
  }, [user?.themeColor]);

  const currentThemeKey = themeKey;
  // Guard against a user-selected theme that no longer exists (removed by user).
  // Fall back to 'pink' to avoid undefined theme crashes.
  const currentTheme = COLOR_THEMES[currentThemeKey] || COLOR_THEMES['pink'];

  // Apply a theme-specific class to the document body so global styles
  // (like extra outlines for the black theme) can be targeted via CSS.
  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    // Remove any existing theme- classes we may have added previously
    Object.keys(COLOR_THEMES).forEach(k => document.body.classList.remove(`theme-${k}`));
    document.body.classList.add(`theme-${currentThemeKey}`);
    // Expose primary/secondary colors as CSS variables so components that
    // rely on var(--accent) or other variables will follow the selected
    // theme dynamically (e.g. .btn-primary uses --accent).
    try {
      const root = document.documentElement;
      if (currentTheme.primary) root.style.setProperty('--accent', currentTheme.primary);
      if (currentTheme.secondary) root.style.setProperty('--accent-secondary', currentTheme.secondary);
      // Player thumb uses --player-thumb-color in globals.css; keep it in sync
      if (currentTheme.primary) root.style.setProperty('--player-thumb-color', currentTheme.primary);
      // Expose the full multi-stop gradient string so components using
      // gradientTextStyle()/gradientBgStyle() can reference it as
      // var(--theme-gradient). backgroundCss is expected to be a
      // `linear-gradient(...)` string when present.
      // Always expose --theme-gradient so components using the helper
      // functions (gradientTextStyle/gradientBgStyle) can rely on a
      // consistent variable. For solid themes we emit a single-color
      // linear-gradient (primary -> primary) which renders visually as
      // a solid color while still allowing the same bg-clip trick to be
      // used by text and background helpers. For full multi-stop themes
      // the theme's backgroundCss is used directly.
      if (currentTheme.backgroundCss) {
        root.style.setProperty('--theme-gradient', currentTheme.backgroundCss);
      } else if (currentTheme.primary) {
        const primary = currentTheme.primary;
        root.style.setProperty('--theme-gradient', `linear-gradient(90deg, ${primary} 0%, ${primary} 100%)`);
      } else {
        root.style.removeProperty('--theme-gradient');
      }
    } catch (e) {
      // ignore in environments where CSS vars can't be set
    }
    // Do NOT apply full-page gradients to document.body here. The user asked
    // that gradient/iridescent themes behave like other themes (i.e. color
    // accents and text), so we limit gradient usage to previews and small
    // accents. Cleanup just removes any added body classes.
    return () => {
      Object.keys(COLOR_THEMES).forEach(k => document.body.classList.remove(`theme-${k}`));
    };
  }, [currentThemeKey]);

  const changeTheme = async (colorKey: string) => {
    if (!COLOR_THEMES[colorKey]) return;
    setThemeKey(colorKey);
    try {
      localStorage.setItem('kjbeats_theme', colorKey);
    } catch (e) {
      // ignore storage write errors
    }
    if (user) await updateUserTheme(colorKey);
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
