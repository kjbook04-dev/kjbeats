'use client';

import Link from 'next/link';
import { useTheme } from '../context/ThemeContext';
import { gradientTextStyle } from '../context/themeHelpers';

export default function Footer() {
  const { currentTheme } = useTheme();
  const gText = gradientTextStyle();
  return (
    <footer className="bg-gray-900 py-8">
      <div className="container mx-auto px-4">
  <div className="grid grid-cols-1 md:grid-cols-3 items-start gap-8 md:gap-x-[2px]">
          <div className="md:transform md:translate-x-[75px]">
            <h3 className="text-xl font-bold mb-4" style={gText}>KJBeats</h3>
            <p className="text-gray-300">Your ultimate destination for music exploration.</p>
          </div>
          <div className="justify-self-center text-center">
            <h4 className={`text-lg font-semibold mb-4`} style={gText}>Quick Links</h4>
            <ul className="space-y-2">
              <li><Link href="/about" className="text-gray-300 hover:text-white">About Us</Link></li>
              <li><Link href="/contact" className="text-gray-300 hover:text-white">Contact</Link></li>
              <li><Link href="/privacy" className="text-gray-300 hover:text-white">Privacy Policy</Link></li>
            </ul>
          </div>
          <div className="justify-self-end md:transform md:-translate-x-[125px]">
            <div className="flex flex-col items-end">
              <h4 className={`text-lg font-semibold mb-4 self-center md:transform md:-translate-x-2`} style={gText}>Connect With Us</h4>
              <div className="flex space-x-4">
              <a href="#" className="text-gray-300 hover:text-white">
                Twitter
              </a>
              <a href="https://instagram.com/kbook04" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white">
                Instagram
              </a>
              <a href="#" className="text-gray-300 hover:text-white">
                Facebook
              </a>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-gray-800 text-center text-gray-400">
          <p>&copy; {new Date().getFullYear()} KJBeats. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
