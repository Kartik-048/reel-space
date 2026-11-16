import { NextRequest, NextResponse } from 'next/server';
import { memoryStore } from '@/lib/storage/store';

export async function GET() {
  try {
    const profile = memoryStore.getProfile();
    const interests = memoryStore.getUserInterests();
    const trending = memoryStore.getTrendingTopics();

    return NextResponse.json({
      profile,
      interests,
      trending,
    });
  } catch (error) {
    console.error('Fetch profile error:', error);
    return NextResponse.json({ error: 'Failed to retrieve profile data' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { behavioral_tracking_enabled, full_name, username } = body;

    const updates: Record<string, unknown> = {};
    if (typeof behavioral_tracking_enabled === 'boolean') {
      updates.behavioral_tracking_enabled = behavioral_tracking_enabled;
    }
    if (full_name) updates.full_name = full_name;
    if (username) updates.username = username;

    const updated = memoryStore.updateProfile(updates);
    return NextResponse.json({ success: true, profile: updated });
  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');

    if (action === 'history') {
      memoryStore.clearHistory();
      return NextResponse.json({ success: true, message: 'Viewing history cleared' });
    }

    if (action === 'reset_recommendations') {
      memoryStore.resetRecommendationProfile();
      return NextResponse.json({ success: true, message: 'Recommendation profile reset' });
    }

    return NextResponse.json({ error: 'Invalid reset action' }, { status: 400 });
  } catch (error) {
    console.error('Reset error:', error);
    return NextResponse.json({ error: 'Failed to reset data' }, { status: 500 });
  }
}
