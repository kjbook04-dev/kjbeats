'use client';

import React from 'react';
import { useTheme, COLOR_THEMES } from '../context/ThemeContext';

interface ColorPickerProps {
  className?: string;
}

export const ColorPicker: React.FC<ColorPickerProps> = ({ className = '' }) => {
  const { currentTheme, changeTheme, availableThemes } = useTheme();

  return (
    <div className={`${className}`}>
      <h3 className="text-lg font-semibold text-white mb-4">Choose Your Theme Color</h3>
      <div className="grid grid-cols-4 gap-3">
        {Object.entries(availableThemes).map(([key, theme]) => (
          <button
            key={key}
            onClick={() => changeTheme(key)}
            className={`
              relative w-16 h-16 rounded-full transition-all duration-200
              ${currentTheme.name === theme.name 
                ? 'ring-4 ring-white ring-opacity-60 scale-110' 
                : 'hover:scale-105'
              }
            `}
            style={{
              // Prefer an explicit multi-stop gradient when available (backgroundCss),
              // otherwise fall back to a simple two-stop gradient using primary/secondary.
              background: theme.backgroundCss ? theme.backgroundCss : `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`
            }}
            title={theme.name}
          >
            {currentTheme.name === theme.name && (
              <div className="absolute inset-0 flex items-center justify-center">
                <svg 
                  className="w-6 h-6 text-white drop-shadow-lg" 
                  fill="currentColor" 
                  viewBox="0 0 20 20"
                >
                  <path 
                    fillRule="evenodd" 
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" 
                    clipRule="evenodd" 
                  />
                </svg>
              </div>
            )}
          </button>
        ))}
      </div>
      <p className="text-gray-400 text-sm mt-3">
        Current theme: <span className="font-medium">{currentTheme.name}</span>
      </p>
    </div>
  );
};