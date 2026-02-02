 'use client';

import React, { ButtonHTMLAttributes, useId } from 'react';
import { useTheme } from '../context/ThemeContext';

interface CutoutButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
}

export const CutoutButton: React.FC<CutoutButtonProps> = ({ label, className = '', children, ...rest }) => {
  const { currentTheme } = useTheme();
  const id = useId();
  // Use the theme's primary color (a CSS color string) for the filled rect.
  const fill = currentTheme.primary || '#ff77aa';

  // SVG viewBox and text sizing are tuned for typical button sizes. The
  // mask punches out the text so the page background shows through.
  return (
    <button
      {...rest}
      className={`relative overflow-hidden inline-flex items-center justify-center ${className}`}
      // ensure the button itself still handles focus/keyboard
    >
      {/* Render an SVG that fills the button and uses a mask to "cut out" the label */}
      <svg className="absolute inset-0 w-full h-full left-0 top-0" viewBox="0 0 200 48" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
        <defs>
          <mask id={`cutout-mask-${id}`}>
            {/* white keeps visible, black hides (punched out) */}
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            <text x="50%" y="50%" fill="black" textAnchor="middle" dominantBaseline="middle" style={{ fontFamily: 'inherit', fontSize: 'inherit', fontWeight: 'inherit' }}>
              {label}
            </text>
          </mask>
        </defs>
        <rect x="0" y="0" width="100%" height="100%" fill={fill} mask={`url(#cutout-mask-${id})`} />
      </svg>

      {/* Keep the visible text for screen readers and layout — invisible visually */}
      <span className="relative z-10 opacity-0">{label}</span>
      {/* Allow children (e.g. icon) fallback if provided */}
      {children}
    </button>
  );
};

export default CutoutButton;
