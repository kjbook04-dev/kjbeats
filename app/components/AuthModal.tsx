'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '../context/UserContext';
import { useTheme } from '../context/ThemeContext';
import { ProfilePictureUpload } from './ProfilePictureUpload';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'signup';
}

export const AuthModal: React.FC<AuthModalProps> = ({ 
  isOpen, 
  onClose, 
  initialMode = 'login' 
}) => {
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [formData, setFormData] = useState({
    firstName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rememberMe, setRememberMe] = useState<boolean>(true);
  const { login, signup, updateProfilePicture, clearAllUserData } = useUser();
  const { currentTheme } = useTheme();
  const router = useRouter();

  // Reset mode when modal opens with different initialMode
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setFormData({
        firstName: '',
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
      });
      setProfilePicture(null);
      setRememberMe(true);
      setError('');
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      if (mode === 'signup') {
        if (formData.password !== formData.confirmPassword) {
          setError('Passwords do not match');
          setIsSubmitting(false);
          return;
        }
        if (formData.password.length < 3) {
          setError('Password must be at least 3 characters');
          setIsSubmitting(false);
          return;
        }

  const result = await signup(formData.firstName, formData.username, formData.email, formData.password, rememberMe);
        if (result.success) {
          // If there's a profile picture, update it after signup
          if (profilePicture) {
            await updateProfilePicture(profilePicture);
          }
          onClose();
          // Redirect to home after successful signup
          try { router.push('/'); } catch (e) { /* ignore navigation errors */ }
        } else {
          setError(result.error || 'Signup failed');
        }
      } else {
  const result = await login(formData.username, formData.password, rememberMe);
        if (result.success) {
          onClose();
          // Redirect to home after successful login
          try { router.push('/'); } catch (e) { /* ignore navigation errors */ }
        } else {
          setError(result.error || 'Login failed');
        }
      }
    } catch {
      setError('An error occurred. Please try again.');
    }

    setIsSubmitting(false);
  };

  const resetForm = () => {
    setFormData({
      firstName: '',
      username: '',
      email: '',
      password: '',
      confirmPassword: ''
    });
    setProfilePicture(null);
    setError('');
  };

  const switchMode = () => {
    setMode(mode === 'login' ? 'signup' : 'login');
    resetForm();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-900 p-8 rounded-lg w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">
            {mode === 'login' ? 'Login' : 'Sign Up'}
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white text-xl"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                First Name
              </label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-${currentTheme.primary.split(' ')[0]}`}
                required
              />
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Username
            </label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-${currentTheme.primary.split(' ')[0]}`}
              required
            />
            {mode === 'signup' && (
              <p className="text-xs text-gray-400 mt-1">This is how other users will find you</p>
            )}
          </div>

          {mode === 'signup' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-${currentTheme.primary.split(' ')[0]}`}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Profile Picture (Optional)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setProfilePicture(file);
                  }}
                  className="themed-file-input w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white"
                  style={{ '--file-theme-bg': currentTheme.primary } as React.CSSProperties}
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Password
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-${currentTheme.primary.split(' ')[0]}`}
              required
            />
          </div>

          {mode === 'signup' && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Confirm Password
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-${currentTheme.primary.split(' ')[0]}`}
                required
              />
            </div>
          )}

          {/* Stay signed in option for login */}
          {mode === 'login' && (
            <div className="flex items-center space-x-2">
              <input
                id="rememberMe"
                type="checkbox"
                checked={rememberMe}
                onChange={() => setRememberMe(!rememberMe)}
                className="h-4 w-4 bg-gray-800 border-gray-700 rounded"
                style={{ accentColor: currentTheme.primary }}
              />
              <label htmlFor="rememberMe" className="text-sm text-gray-300">Stay signed in</label>
            </div>
          )}

          {error && (
            <div className="text-red-400 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full ${currentTheme.bg} ${currentTheme.bgHover} disabled:opacity-70 text-gray-900 py-2 px-4 rounded-md font-medium transition-colors`}
          >
            {isSubmitting ? 'Please wait...' : (mode === 'login' ? 'Login' : 'Sign Up')}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-400">
            {mode === 'login' ? "Don't have an account?" : "Already have an account?"}
          </p>
          <button
            onClick={switchMode}
            className={`${currentTheme.text} ${currentTheme.textHover} font-medium`}
          >
            {mode === 'login' ? 'Sign Up' : 'Login'}
          </button>
          
          {error && error.includes('already exists') && (
            <div className="mt-4 pt-4 border-t border-gray-700">
              <p className="text-gray-400 text-sm mb-2">Having trouble? Clear all data and start fresh:</p>
              <button
                onClick={() => {
                  clearAllUserData();
                  setError('');
                  resetForm();
                }}
                className="text-red-400 hover:text-red-300 text-sm font-medium"
              >
                Clear All Data & Start Over
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
