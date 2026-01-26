import { NextRequest, NextResponse } from 'next/server';
import { writeFile, readFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

const LIBRARY_FILE = path.join(process.cwd(), 'data', 'shared-library.json');

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const songId = searchParams.get('id');
    
    if (!songId) {
      return NextResponse.json({ error: 'Song ID required' }, { status: 400 });
    }
    
    if (!existsSync(LIBRARY_FILE)) {
      return NextResponse.json({ error: 'Library not found' }, { status: 404 });
    }
    
    const data = await readFile(LIBRARY_FILE, 'utf8');
    const library = JSON.parse(data);
    
    const song = library.find((s: { id: string; playCount?: number }) => s.id === songId);
    if (!song) {
      return NextResponse.json({ error: 'Song not found' }, { status: 404 });
    }
    
    song.playCount = (song.playCount || 0) + 1;
    
    await writeFile(LIBRARY_FILE, JSON.stringify(library, null, 2));
    
    return NextResponse.json({ 
      message: 'Play count updated',
      playCount: song.playCount 
    });
    
  } catch (error) {
    console.error('Play count update error:', error);
    return NextResponse.json({ error: 'Failed to update play count' }, { status: 500 });
  }
}