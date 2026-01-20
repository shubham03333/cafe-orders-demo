import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const now = new Date();
    const formattedTime = now.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    return NextResponse.json({ currentTime: formattedTime });
  } catch (error) {
    console.error('Error fetching current time:', error);
    return NextResponse.json({ error: 'Failed to fetch current time' }, { status: 500 });
  }
}
