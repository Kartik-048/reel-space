import { NextRequest, NextResponse } from 'next/server';
import { memoryStore } from '@/lib/storage/store';
import { EventType } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { event_type, video_id, metadata } = body;

    if (!event_type || !video_id) {
      return NextResponse.json(
        { error: 'Missing event_type or video_id' },
        { status: 400 }
      );
    }

    const { event, updatedInterests } = memoryStore.recordEvent(
      event_type as EventType,
      video_id,
      metadata
    );

    return NextResponse.json({
      success: true,
      event,
      user_interests: updatedInterests,
    });
  } catch (error) {
    console.error('Event recording error:', error);
    return NextResponse.json(
      { error: 'Failed to record interaction event' },
      { status: 500 }
    );
  }
}
