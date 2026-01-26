import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // Log client errors to the server console so the developer can see them
    console.error('📣 CLIENT ERROR REPORT:', JSON.stringify(body, null, 2));
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('📣 CLIENT ERROR REPORT: failed to parse body', err);
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
