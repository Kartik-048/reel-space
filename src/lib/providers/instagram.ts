import { ContentProvider, IngestionInput, ProviderResult } from './types';
import { Video, AvailabilityStatus } from '@/types';
import { classifyContent } from '../recommendation/taxonomy';

export class InstagramProvider implements ContentProvider {
  name = 'instagram' as const;

  canHandle(url: string): boolean {
    return /^https?:\/\/(www\.)?instagram\.com\/(reel|p)\/[A-Za-z0-9_-]+/i.test(url.trim());
  }

  public extractShortcode(url: string): string | null {
    const match = url.trim().match(/(?:reel|p)\/([A-Za-z0-9_-]+)/i);
    return match ? match[1] : null;
  }

  async ingest(input: IngestionInput): Promise<ProviderResult> {
    const cleanUrl = input.url.trim();
    const shortcode = this.extractShortcode(cleanUrl);

    if (!shortcode) {
      return {
        success: false,
        error: 'Invalid Instagram Reel URL format. Expected format: https://www.instagram.com/reel/[code]/',
      };
    }

    let caption = input.suggestedCaption || '';
    let authorName = input.suggestedCreator?.displayName || 'Instagram Creator';
    let authorUsername = input.suggestedCreator?.username || 'instagram_user';
    let thumbnailUrl = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&q=80';
    let availability: AvailabilityStatus = 'oembed_displayable';

    // Attempt official oEmbed API if available
    try {
      // Official Meta oEmbed endpoint for Instagram
      const oembedUrl = `https://api.instagram.com/oembed/?url=${encodeURIComponent(cleanUrl)}`;
      const res = await fetch(oembedUrl, {
        headers: { 'User-Agent': 'REELSPACE-Discovery-Engine/1.0' },
        next: { revalidate: 3600 },
      });

      if (res.ok) {
        const data = await res.json();
        if (data.title) caption = data.title;
        if (data.author_name) {
          authorName = data.author_name;
          authorUsername = data.author_name.toLowerCase().replace(/[^a-z0-9_]/g, '_');
        }
        if (data.thumbnail_url) thumbnailUrl = data.thumbnail_url;
      } else {
        // Meta oEmbed requires an App Access Token in production. If not configured, mark as external_only fallback
        availability = 'external_only';
      }
    } catch {
      // Network or Meta rate limit fallback
      availability = 'external_only';
    }

    // Extract hashtags from caption or use suggested
    const extractedHashtags = (caption.match(/#[a-zA-Z0-9_]+/g) || []).map((h) => h.toLowerCase());
    const hashtags = Array.from(new Set([...extractedHashtags, ...(input.suggestedHashtags || [])]));

    const { primary_topic, secondary_topics } = classifyContent(caption, hashtags);

    const video: Video = {
      id: `ig_${shortcode}`,
      provider: 'instagram',
      external_id: shortcode,
      original_url: cleanUrl,
      creator_id: `cr_ig_${authorUsername}`,
      creator: {
        id: `cr_ig_${authorUsername}`,
        provider: 'instagram',
        external_id: authorUsername,
        username: authorUsername,
        display_name: authorName,
        profile_image: input.suggestedCreator?.profileImage || `https://api.dicebear.com/7.x/identicon/svg?seed=${authorUsername}`,
      },
      caption: caption || 'Instagram Reel discovery on REELSPACE',
      thumbnail_url: thumbnailUrl,
      hashtags,
      topics: [primary_topic, ...secondary_topics],
      primary_topic,
      secondary_topics,
      availability_status: availability,
      source_permissions: 'Instagram Public Embed Guidelines',
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
