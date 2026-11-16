import { NextRequest, NextResponse } from 'next/server';
import { memoryStore } from '@/lib/storage/store';

export async function GET() {
  try {
    const interests = memoryStore.getUserInterests();
    return NextResponse.json({ interests });
  } catch (error) {
    console.error('Fetch interests error:', error);
    return NextResponse.json({ error: 'Failed to retrieve interests' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, topic, score } = body;

    if (action === 'set_score' && topic && typeof score === 'number') {
      const updated = memoryStore.setInterestScore(topic, score);
      return NextResponse.json({ success: true, interest: updated });
    }

    if (action === 'block' && topic) {
      memoryStore.blockTopic(topic);
      return NextResponse.json({ success: true, message: `Topic ${topic} blocked from recommendations` });
    }

    if (action === 'unblock' && topic) {
      memoryStore.unblockTopic(topic);
      return NextResponse.json({ success: true, message: `Topic ${topic} unblocked` });
    }

    return NextResponse.json({ error: 'Invalid interest action' }, { status: 400 });
  } catch (error) {
    console.error('Interest update error:', error);
    return NextResponse.json({ error: 'Failed to update interest' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    if (searchParams.get('action') === 'export') {
      const data = memoryStore.exportData();
      return NextResponse.json(data);
    }
    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ error: 'Failed to export data' }, { status: 500 });
  }
}
