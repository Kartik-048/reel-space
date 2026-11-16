import { NextRequest, NextResponse } from 'next/server';
import { memoryStore } from '@/lib/storage/store';

export async function GET() {
  try {
    const collections = memoryStore.getCollections();
    return NextResponse.json({ collections });
  } catch (error) {
    console.error('Fetch collections error:', error);
    return NextResponse.json({ error: 'Failed to retrieve collections' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, description, icon } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Collection name is required' }, { status: 400 });
    }

    const collection = memoryStore.createCollection(name.trim(), description, icon);
    return NextResponse.json({ success: true, collection });
  } catch (error) {
    console.error('Create collection error:', error);
    return NextResponse.json({ error: 'Failed to create collection' }, { status: 500 });
  }
}
