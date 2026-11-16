import { ContentProvider, IngestionInput, ProviderResult } from './types';
import { InstagramProvider } from './instagram';
import { DirectVideoProvider } from './direct';
import { Video } from '@/types';
import { classifyContent } from '../recommendation/taxonomy';

export class ContentProviderManager {
  private providers: ContentProvider[] = [];

  constructor() {
    this.providers = [
      new InstagramProvider(),
      new DirectVideoProvider(),
    ];
  }

  public registerProvider(provider: ContentProvider) {
    this.providers.push(provider);
  }

  public findProvider(url: string): ContentProvider | undefined {
    return this.providers.find((p) => p.canHandle(url));
  }

  public async ingestVideo(input: IngestionInput): Promise<ProviderResult> {
    const provider = this.findProvider(input.url);

    if (provider) {
      return provider.ingest(input);
    }

    // Fallback: User submitted general video link
    const cleanUrl = input.url.trim();
    const id = `user_${Date.now().toString(36)}`;
    const caption = input.suggestedCaption || 'User discovered video';
    const hashtags = input.suggestedHashtags || [];
    const { primary_topic, secondary_topics } = classifyContent(caption, hashtags);
    const username = input.suggestedCreator?.username || 'curator';

    const video: Video = {
      id,
      provider: 'user_submitted',
      external_id: id,
      original_url: cleanUrl,
      creator_id: `cr_user_${username}`,
      creator: {
        id: `cr_user_${username}`,
        provider: 'user_submitted',
        external_id: username,
        username,
        display_name: input.suggestedCreator?.displayName || 'Community Curator',
        profile_image: `https://api.dicebear.com/7.x/identicon/svg?seed=${username}`,
      },
      caption,
      thumbnail_url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&q=80',
      hashtags,
      topics: [primary_topic, ...secondary_topics],
      primary_topic,
      secondary_topics,
      availability_status: 'external_only',
      source_permissions: 'User Submitted Link',
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

export const providerManager = new ContentProviderManager();
