import { NextRequest, NextResponse } from 'next/server';
import { providerManager } from '@/lib/providers/manager';
import { memoryStore } from '@/lib/storage/store';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q');
    const topic = searchParams.get('topic');

    if (query) {
      const searchResult = memoryStore.searchContent(query);
      return NextResponse.json(searchResult);
    }

    let videos = memoryStore.getAllVideos();
    if (topic && topic !== 'All') {
      videos = videos.filter(
        (v) =>
          v.primary_topic.toLowerCase() === topic.toLowerCase() ||
          v.topics.some((t) => t.toLowerCase() === topic.toLowerCase())
      );
    }

    return NextResponse.json({ videos });
  } catch (error) {
    console.error('Query videos error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve videos' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url, caption, hashtags, creator } = body;

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    const result = await providerManager.ingestVideo({
      url,
      suggestedCaption: caption,
      suggestedHashtags: hashtags,
      suggestedCreator: creator,
    });

    if (!result.success || !result.video) {
      return NextResponse.json(
        { error: result.error || 'Failed to ingest video' },
        { status: 422 }
      );
    }

    const addedVideo = memoryStore.addVideo(result.video);

    return NextResponse.json({
      success: true,
      video: addedVideo,
      message: 'Video successfully ingested with automated topic classification',
    });
  } catch (error) {
    console.error('Ingest video error:', error);
    return NextResponse.json(
      { error: 'Failed to ingest video' },
      { status: 500 }
    );
  }
}
