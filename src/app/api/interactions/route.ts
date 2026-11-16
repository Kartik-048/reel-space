import { NextRequest, NextResponse } from 'next/server';
import { memoryStore } from '@/lib/storage/store';

export async function GET() {
  try {
    const likedVideos = memoryStore.getLikedVideos().map((v) => v.id);
    const savedVideos = memoryStore.getSavedVideos().map((v) => v.id);
    const followedCreators = memoryStore.getFollowedCreators().map((c) => c.id);

    return NextResponse.json({
      likes: likedVideos,
      saves: savedVideos,
      follows: followedCreators,
    });
  } catch (error) {
    console.error('Fetch interactions error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve interaction states' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, video_id, creator_id, collection_id } = body;

    if (action === 'like' && video_id) {
      const result = memoryStore.toggleLike(video_id);
      return NextResponse.json(result);
    }

    if (action === 'save' && video_id) {
      const result = memoryStore.toggleSave(video_id, collection_id);
      return NextResponse.json(result);
    }

    if (action === 'follow' && creator_id) {
      const isFollowed = memoryStore.toggleFollowCreator(creator_id);
      return NextResponse.json({ isFollowed });
    }

    return NextResponse.json({ error: 'Invalid interaction action' }, { status: 400 });
  } catch (error) {
    console.error('Interaction toggle error:', error);
    return NextResponse.json(
      { error: 'Failed to update interaction' },
      { status: 500 }
    );
  }
}
