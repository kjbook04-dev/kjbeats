'use client';

import { useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';

export function DynamicFavicon() {
  const { currentTheme } = useTheme();

  useEffect(() => {
    // Create a canvas to generate the favicon
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      // Clear canvas
      ctx.clearRect(0, 0, 32, 32);

      // Create gradient background
      const gradient = ctx.createLinearGradient(0, 0, 32, 32);
      gradient.addColorStop(0, currentTheme.primary);
      gradient.addColorStop(1, currentTheme.secondary);

      // Draw circle background
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(16, 16, 14, 0, 2 * Math.PI);
      ctx.fill();

      // Draw headphones icon to match the site logo mark
      ctx.strokeStyle = '#ffffff';
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // band
      ctx.lineWidth = 2.1;
      ctx.beginPath();
      ctx.arc(16, 14, 6.2, Math.PI, 2 * Math.PI);
      ctx.stroke();

      // left earcup
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.roundRect(7.4, 14.4, 4.1, 8.2, 2);
      ctx.stroke();

      // right earcup
      ctx.beginPath();
      ctx.roundRect(20.5, 14.4, 4.1, 8.2, 2);
      ctx.stroke();

      // Convert canvas to data URL
      const dataURL = canvas.toDataURL('image/png');

      // Update favicon
      let favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
      if (!favicon) {
        favicon = document.createElement('link');
        favicon.rel = 'icon';
        favicon.type = 'image/png';
        document.head.appendChild(favicon);
      }
      favicon.href = dataURL;

      // Also update apple-touch-icon if it exists
      let appleTouchIcon = document.querySelector('link[rel="apple-touch-icon"]') as HTMLLinkElement;
      if (!appleTouchIcon) {
        appleTouchIcon = document.createElement('link');
        appleTouchIcon.rel = 'apple-touch-icon';
        appleTouchIcon.type = 'image/png';
        document.head.appendChild(appleTouchIcon);
      }
      appleTouchIcon.href = dataURL;

      // Update theme-color meta tag for mobile browsers
      let themeColorMeta = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement;
      if (!themeColorMeta) {
        themeColorMeta = document.createElement('meta');
        themeColorMeta.name = 'theme-color';
        document.head.appendChild(themeColorMeta);
      }
      themeColorMeta.content = currentTheme.primary;
    }
  }, [currentTheme]);

  return null; // This component doesn't render anything
}
