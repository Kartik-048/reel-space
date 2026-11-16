import { NextRequest, NextResponse } from 'next/server';
import { memoryStore } from '@/lib/storage/store';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const cursor = parseInt(searchParams.get('cursor') || '0', 10);
    const limit = parseInt(searchParams.get('limit') || '8', 10);
    const explorationRatio = parseFloat(searchParams.get('explorationRatio') || '0.25');
    const topicFilter = searchParams.get('topic') || undefined;

    const result = memoryStore.getRankedFeed({
      cursor,
      limit,
      explorationRatio,
      topicFilter,
    });

    return NextResponse.json({
      videos: result.videos,
      next_cursor: result.hasMore ? (cursor + limit).toString() : null,
      has_more: result.hasMore,
      personalization_version: 'v1.4.0-hybrid-dynamic',
      exploration_ratio: explorationRatio,
    });
  } catch (error) {
    console.error('Feed generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate personalized feed' },
      { status: 500 }
    );
  }
}
