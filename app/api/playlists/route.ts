import { NextResponse } from 'next/server';

export async function GET() {
	return NextResponse.json({ message: 'Playlists API not implemented' }, { status: 404 });
}
