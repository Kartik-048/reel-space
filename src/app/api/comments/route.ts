import { NextRequest, NextResponse } from 'next/server';
import { memoryStore } from '@/lib/storage/store';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const videoId = searchParams.get('videoId');

    if (!videoId) {
      return NextResponse.json({ error: 'videoId is required' }, { status: 400 });
    }

    const comments = memoryStore.getComments(videoId);
    return NextResponse.json({ comments });
  } catch (error) {
    console.error('Fetch comments error:', error);
    return NextResponse.json({ error: 'Failed to retrieve comments' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { videoId, content } = body;

    if (!videoId || !content || !content.trim()) {
      return NextResponse.json(
        { error: 'videoId and non-empty content are required' },
        { status: 400 }
      );
    }

    const comment = memoryStore.addComment(videoId, content.trim());
    return NextResponse.json({ success: true, comment });
  } catch (error) {
    console.error('Add comment error:', error);
    return NextResponse.json({ error: 'Failed to post comment' }, { status: 500 });
  }
}
