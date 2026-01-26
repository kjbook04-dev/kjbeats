import { NextRequest, NextResponse } from 'next/server';
import { writeFile, readFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

const LIBRARY_DIR = path.join(process.cwd(), 'data');
const LIBRARY_FILE = path.join(LIBRARY_DIR, 'shared-library.json');

interface LibrarySong {
  id: string;
  source: 'youtube' | 'soundcloud' | 'hosted';
  externalId: string;
  title: string;
  artist: string;
  thumbnail: string;
  duration?: number;
  addedBy: string;
  addedAt: string;
  playCount: number;
  approved: boolean;
}

async function ensureLibraryFile() {
  if (!existsSync(LIBRARY_DIR)) {
    await mkdir(LIBRARY_DIR, { recursive: true });
  }
  
  if (!existsSync(LIBRARY_FILE)) {
    await writeFile(LIBRARY_FILE, JSON.stringify([]));
  }
}

async function getLibrary(): Promise<LibrarySong[]> {
  await ensureLibraryFile();
  const data = await readFile(LIBRARY_FILE, 'utf8');
  return JSON.parse(data);
}

async function saveLibrary(songs: LibrarySong[]) {
  await ensureLibraryFile();
  await writeFile(LIBRARY_FILE, JSON.stringify(songs, null, 2));
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.toLowerCase() || '';
    const source = searchParams.get('source') as 'youtube' | 'soundcloud' | 'hosted' | null;
    
    const library = await getLibrary();
    
    let filteredSongs = library.filter(song => song.approved);
    
    if (query) {
      filteredSongs = filteredSongs.filter(song => 
        song.title.toLowerCase().includes(query) || 
        song.artist.toLowerCase().includes(query)
      );
    }
    
    if (source) {
      filteredSongs = filteredSongs.filter(song => song.source === source);
    }
    
    // Sort by play count and recent additions
    filteredSongs.sort((a, b) => {
      const scoreA = a.playCount + (new Date(a.addedAt).getTime() / 1000000);
      const scoreB = b.playCount + (new Date(b.addedAt).getTime() / 1000000);
      return scoreB - scoreA;
    });
    
    return NextResponse.json({
      songs: filteredSongs,
      total: filteredSongs.length
    });
    
  } catch (error) {
    console.error('Library GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch library' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { source, externalId, title, artist, thumbnail, duration } = body;
    
    if (!source || !externalId || !title || !artist) {
      return NextResponse.json({ 
        error: 'Missing required fields: source, externalId, title, artist' 
      }, { status: 400 });
    }
    
    const library = await getLibrary();
    
    // Check if song already exists
    const existingSong = library.find(song => 
      song.source === source && song.externalId === externalId
    );
    
    if (existingSong) {
      return NextResponse.json({ 
        error: 'Song already in library',
        song: existingSong 
      }, { status: 409 });
    }
    
    const newSong: LibrarySong = {
      id: `${source}_${externalId}_${Date.now()}`,
      source,
      externalId,
      title,
      artist,
      thumbnail: thumbnail || '',
      duration,
      addedBy: 'user', // TODO: Get from auth
      addedAt: new Date().toISOString(),
      playCount: 0,
      approved: true // Auto-approve for now
    };
    
    library.push(newSong);
    await saveLibrary(library);
    
    return NextResponse.json({ 
      message: 'Song added to library',
      song: newSong 
    }, { status: 201 });
    
  } catch (error) {
    console.error('Library POST error:', error);
    return NextResponse.json({ error: 'Failed to add song to library' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const songId = searchParams.get('id');
    
    if (!songId) {
      return NextResponse.json({ error: 'Song ID required' }, { status: 400 });
    }
    
    const library = await getLibrary();
    const songIndex = library.findIndex(song => song.id === songId);
    
    if (songIndex === -1) {
      return NextResponse.json({ error: 'Song not found' }, { status: 404 });
    }
    
    library.splice(songIndex, 1);
    await saveLibrary(library);
    
    return NextResponse.json({ message: 'Song removed from library' });
    
  } catch (error) {
    console.error('Library DELETE error:', error);
    return NextResponse.json({ error: 'Failed to remove song from library' }, { status: 500 });
  }
}