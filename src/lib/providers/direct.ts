import { ContentProvider, IngestionInput, ProviderResult } from './types';
import { Video, AvailabilityStatus } from '@/types';
import { classifyContent } from '../recommendation/taxonomy';

export class DirectVideoProvider implements ContentProvider {
  name = 'direct' as const;

  canHandle(url: string): boolean {
    const cleanUrl = url.trim().toLowerCase();
    return (
      cleanUrl.endsWith('.mp4') ||
      cleanUrl.endsWith('.webm') ||
      cleanUrl.includes('pexels.com') ||
      cleanUrl.includes('wikimedia.org') ||
      cleanUrl.includes('commondatastorage.googleapis.com') ||
      cleanUrl.includes('assets.reelspace.app')
    );
  }

  async ingest(input: IngestionInput): Promise<ProviderResult> {
    const cleanUrl = input.url.trim();
    const id = `vid_${Math.abs(cleanUrl.split('').reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0)).toString(36)}`;

    const caption = input.suggestedCaption || 'Native short video on REELSPACE';
    const hashtags = input.suggestedHashtags || [];
    const { primary_topic, secondary_topics } = classifyContent(caption, hashtags);

    const creatorUsername = input.suggestedCreator?.username || 'reelspace_creator';
    const creatorDisplayName = input.suggestedCreator?.displayName || 'Creative Producer';

    const video: Video = {
      id,
      provider: 'direct',
      external_id: id,
      original_url: cleanUrl,
      video_url: cleanUrl,
      creator_id: `cr_direct_${creatorUsername}`,
      creator: {
        id: `cr_direct_${creatorUsername}`,
        provider: 'direct',
        external_id: creatorUsername,
        username: creatorUsername,
        display_name: creatorDisplayName,
        profile_image: input.suggestedCreator?.profileImage || `https://api.dicebear.com/7.x/identicon/svg?seed=${creatorUsername}`,
      },
      caption,
      thumbnail_url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=80',
      hashtags,
      topics: [primary_topic, ...secondary_topics],
      primary_topic,
      secondary_topics,
      availability_status: 'native_playable',
      source_permissions: 'Public Domain / Creative Commons / Authorized Stream',
      likes_count: 0,
      saves_count: 0,
      comments_count: 0,
      views_count: 0,
      created_at: new Date().toISOString(),
    };

    return {
      success: true,
      video,
    };
  }
}
