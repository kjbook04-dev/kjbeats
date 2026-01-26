# KJBeats - Getting Started

## Quick Start Guide

Your music website is now ready! Here's how to use it:

### 🎵 Adding Your Own Music

1. **Go to "Manage Music"** (click the link in the header)
2. **Click "Choose Files"** in the "Add Music" section
3. **Select MP3 or other audio files** from your computer
4. **Click "Add to Library"** - your files will be stored locally in your browser
5. **Your uploaded songs** will appear in the list below

### 🎧 Testing Audio Playback

1. **Use the "Test Local Audio" section** on the Manage page
2. **Select any audio file** to test it immediately
3. **Optionally add a cover image** for visual appeal
4. **Click "Play Local File"** - the player will appear at the bottom

### 📚 Playing Your Music

1. **Go to "Playlists"** to see all available songs
2. **Your uploaded music** will appear alongside sample tracks
3. **Click "Play"** on any song to start playback
4. **Use "Add to Playlist"** to organize your music

### 🔧 Advanced Features

- **Create Playlists**: Organize your music into custom playlists
- **Search Songs**: Use the search bar to find specific tracks
- **Dynamic Backgrounds**: The home page background changes based on the last played song
- **Local Storage**: All your music stays in your browser - no server uploads needed

### 📁 Adding Sample Files (Optional)

To replace the placeholder sample tracks with real audio:

1. **Create the directory**: `public/samples/` in your project
2. **Add MP3 files**: Place your audio files there (e.g., `demo-song-1.mp3`)
3. **Add cover images**: Optionally add JPG/PNG images for album art
4. **Update paths**: The sample songs in `app/data/songs.ts` will automatically use these files

### 🎨 Customization

- **Colors**: Edit the pink/gray theme in `app/globals.css`
- **Layouts**: Modify components in `app/components/`
- **Add pages**: Create new pages in the `app/` directory
- **Styling**: Uses TailwindCSS for easy customization

### 🚀 Deployment

When ready to share your music site:

```bash
npm run build
npm start
```

Or deploy to Vercel, Netlify, or any hosting service that supports Next.js.

---

**Need help?** Check the components in `app/components/` to see how everything works!