import { NextResponse } from 'next/server';

export async function POST() {
  const client_id = process.env.SPOTIFY_CLIENT_ID;
  const client_secret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!client_id || !client_secret) {
    return NextResponse.json({ error: 'Spotify credentials not configured' }, { status: 500 });
  }

  try {
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${client_id}:${client_secret}`).toString('base64')}`,
      },
      body: 'grant_type=client_credentials',
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Spotify token error:', error);
    return NextResponse.json({ error: 'Failed to get Spotify token' }, { status: 500 });
  }
}