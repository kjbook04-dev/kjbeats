import React from 'react';

// Return style object for gradient text using the provider CSS variable --theme-gradient
export const gradientTextStyle = (): React.CSSProperties => ({
  backgroundImage: 'var(--theme-gradient)',
  WebkitBackgroundClip: 'text',
  backgroundClip: 'text',
  color: 'transparent'
});

// Return style object for gradient background using the provider CSS variable --theme-gradient
export const gradientBgStyle = (): React.CSSProperties => ({
  backgroundImage: 'var(--theme-gradient)'
});
