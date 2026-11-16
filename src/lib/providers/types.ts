import { Video, ProviderType, AvailabilityStatus } from '@/types';

export interface IngestionInput {
  url: string;
  suggestedCaption?: string;
  suggestedHashtags?: string[];
  suggestedCreator?: {
    username: string;
    displayName?: string;
    profileImage?: string;
  };
}

export interface ProviderResult {
  success: boolean;
  video?: Video;
  error?: string;
}

export interface ContentProvider {
  name: ProviderType;
  canHandle(url: string): boolean;
  ingest(input: IngestionInput): Promise<ProviderResult>;
}
