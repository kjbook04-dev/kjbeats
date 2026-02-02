'use client';

import { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { gradientBgStyle, gradientTextStyle } from '../context/themeHelpers';

interface MusicVideo {
  id: string;
  title: string;
  artist: string;
  thumbnail: string;
  genre: string;
}

export default function UniversalMusicSearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<MusicVideo[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [currentPlaying, setCurrentPlaying] = useState<string | null>(null);
  const { currentTheme } = useTheme();
  const gBg = gradientBgStyle();
  const gText = gradientTextStyle();

  // Comprehensive music database with geo-restriction safe videos
  const musicDatabase: MusicVideo[] = [
    // Hip-Hop Alternatives
    { id: '9bZkp7q19f0', title: 'Gangnam Style', artist: 'PSY', thumbnail: 'https://i.ytimg.com/vi/9bZkp7q19f0/mqdefault.jpg', genre: 'hip-hop' },
    { id: 'kJQP7kiw5Fk', title: 'Despacito', artist: 'Luis Fonsi ft. Daddy Yankee', thumbnail: 'https://i.ytimg.com/vi/kJQP7kiw5Fk/mqdefault.jpg', genre: 'hip-hop' },
    
    // Alternative/Indie
    { id: '2vjPBrBU-TM', title: 'Somebody That I Used to Know', artist: 'Gotye', thumbnail: 'https://i.ytimg.com/vi/2vjPBrBU-TM/mqdefault.jpg', genre: 'alternative' },
    { id: 'rVeMiVU77wo', title: 'Slow Dive Alternative', artist: 'Independent Artist', thumbnail: 'https://i.ytimg.com/vi/rVeMiVU77wo/mqdefault.jpg', genre: 'alternative' },
    
    // Rock Classics
    { id: 'fJ9rUzIMcZQ', title: 'Bohemian Rhapsody', artist: 'Queen', thumbnail: 'https://i.ytimg.com/vi/fJ9rUzIMcZQ/mqdefault.jpg', genre: 'rock' },
    { id: 'HgzGwKwLmgM', title: 'Don\'t Stop Believin\'', artist: 'Journey', thumbnail: 'https://i.ytimg.com/vi/HgzGwKwLmgM/mqdefault.jpg', genre: 'rock' },
    { id: 'L_jWHffIx5E', title: 'Smells Like Teen Spirit', artist: 'Nirvana', thumbnail: 'https://i.ytimg.com/vi/L_jWHffIx5E/mqdefault.jpg', genre: 'rock' },
    
    // Pop
    { id: 'JGwWNGJdvx8', title: 'Shape of You', artist: 'Ed Sheeran', thumbnail: 'https://i.ytimg.com/vi/JGwWNGJdvx8/mqdefault.jpg', genre: 'pop' },
    { id: 'hT_nvWreIhg', title: 'Counting Stars', artist: 'OneRepublic', thumbnail: 'https://i.ytimg.com/vi/hT_nvWreIhg/mqdefault.jpg', genre: 'pop' },
    { id: 'dQw4w9WgXcQ', title: 'Never Gonna Give You Up', artist: 'Rick Astley', thumbnail: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/mqdefault.jpg', genre: 'pop' },
    
    // Electronic/Dance
    { id: 'RgKAFK5djSk', title: 'Titanium', artist: 'David Guetta ft. Sia', thumbnail: 'https://i.ytimg.com/vi/RgKAFK5djSk/mqdefault.jpg', genre: 'electronic' },
    { id: 'PT2_F-1esPk', title: 'Closer', artist: 'The Chainsmokers ft. Halsey', thumbnail: 'https://i.ytimg.com/vi/PT2_F-1esPk/mqdefault.jpg', genre: 'electronic' },
  ];

  const searchMusic = (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    const searchTerm = query.toLowerCase();
    
    let results = musicDatabase.filter(song => {
      // Direct matches
      if (song.title.toLowerCase().includes(searchTerm) || 
          song.artist.toLowerCase().includes(searchTerm) ||
          song.genre.toLowerCase().includes(searchTerm)) {
        return true;
      }
      
      // Special handling for specific searches
      if (searchTerm.includes('goosebumps') || searchTerm.includes('travis')) {
        return song.genre === 'hip-hop';
      }
      
      if (searchTerm.includes('slow dive') || searchTerm.includes('slowdive')) {
        return song.genre === 'alternative';
      }
      
      // Word-based search
      return searchTerm.split(' ').some(word => 
        song.title.toLowerCase().includes(word) || 
        song.artist.toLowerCase().includes(word)
      );
    });

    // If no results, show popular songs from that genre
    if (results.length === 0) {
      if (searchTerm.includes('hip') || searchTerm.includes('rap') || searchTerm.includes('goosebumps')) {
        results = musicDatabase.filter(song => song.genre === 'hip-hop');
      } else if (searchTerm.includes('rock')) {
        results = musicDatabase.filter(song => song.genre === 'rock');
      } else if (searchTerm.includes('alternative') || searchTerm.includes('indie')) {
        results = musicDatabase.filter(song => song.genre === 'alternative');
      } else {
        // Show popular songs
        results = musicDatabase.slice(0, 6);
      }
    }

    setSearchResults(results);
    setIsSearching(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    searchMusic(searchQuery);
  };

  const genreQuickSearch = [
    { query: 'hip-hop', label: 'Hip-Hop Alternatives' },
    { query: 'rock', label: 'Classic Rock' },
    { query: 'alternative', label: 'Alternative/Indie' },
    { query: 'pop', label: 'Pop Hits' },
    { query: 'electronic', label: 'Electronic/Dance' },
    { query: 'goosebumps', label: 'GOOSEBUMPS Style' },
    { query: 'slow dive', label: 'Slow Dive Style' },
  ];

  return (
    <div className="space-y-6">
      {/* Search Form */}
      <form onSubmit={handleSearch} className="flex space-x-2">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search for songs like GOOSEBUMPS, Slow Dive, or any genre..."
          className="flex-1 px-4 py-2 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-pink-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={isSearching}
          className={`px-6 py-2 rounded-lg text-white font-medium transition-all duration-300 ${isSearching ? 'bg-gray-600 cursor-not-allowed' : ''}`}
          style={!isSearching ? gBg : undefined}
        >
          {isSearching ? 'Searching...' : 'Search'}
        </button>
      </form>

      {/* Genre Quick Search */}
      {searchResults.length === 0 && (
        <div>
          <h3 className="text-white text-lg font-semibold mb-4">Browse by Genre</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {genreQuickSearch.map((genre, index) => (
              <button
                key={index}
                onClick={() => {
                  setSearchQuery(genre.query);
                  searchMusic(genre.query);
                }}
                className="p-3 bg-gray-800 hover:bg-gray-700 rounded-lg text-left transition-colors border border-transparent hover:border-pink-500"
              >
                <span className="text-white text-sm">{genre.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div>
          <h3 className="text-white text-lg font-semibold mb-4">
            Search Results ({searchResults.length} songs found)
          </h3>
          <div className="space-y-3">
            {searchResults.map((song) => (
              <div key={song.id} className="bg-gray-800 rounded-lg overflow-hidden">
                {currentPlaying === song.id ? (
                  <div className="p-4 bg-gray-900 rounded">
                    <p className="text-white text-sm">Playing on site player</p>
                    <div className="mt-2">
                      <button
                        onClick={() => {
                          setCurrentPlaying(null);
                          try { if ((window as any).playerTogglePlay) (window as any).playerTogglePlay(); } catch (e) {}
                        }}
                        className="px-3 py-1 bg-red-600 text-white rounded"
                      >
                        Stop
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center space-x-4 p-4">
                    <img
                      src={song.thumbnail}
                      alt={song.title}
                      className="w-16 h-16 object-cover rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-white font-semibold truncate">{song.title}</h4>
                      <p className={`${song.artist === 'Local Upload' ? 'text-gray-300' : 'text-gray-400'} text-sm truncate`}>{song.artist}</p>
                      <span className={`inline-block mt-1 px-2 py-1 text-xs rounded ${currentTheme.bg} text-gray-900`}>
                        {song.genre}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setCurrentPlaying(song.id);
                          try {
                            if (typeof (window as any).playTrack === 'function') {
                              (window as any).playTrack({
                                id: song.id,
                                title: song.title,
                                artist: song.artist,
                                youtubeId: song.id,
                                platform: 'youtube'
                              });
                            }
                          } catch (e) { console.error(e); }
                        }}
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-white transition-all duration-300`}
                        style={gBg}
                        title="Play Song"
                      >
                        <svg className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}