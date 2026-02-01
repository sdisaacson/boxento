import { WidgetProps } from '@/types';

export type YouTubeFavoritesOrientation = 'vertical' | 'horizontal';

/**
 * A single YouTube video entry (from the channel uploads feed).
 */
export interface YouTubeFavoriteVideo {
  videoId: string;
  title: string;
  url: string;
  publishedAt?: string;
  channelId: string;
  channelTitle?: string;
  thumbnailUrl?: string;
}

/**
 * Configuration options for the YouTube Favorites widget
 *
 * Users provide YouTube channel IDs and the widget displays the most recent videos.
 */
export interface YouTubeFavoritesWidgetConfig {
  id?: string;
  title?: string;

  /** YouTube channel IDs (not usernames / handles). */
  channelIds: string[];

  /** How many videos to fetch per channel (starting from most recent). */
  videosToList?: number;

  /** How many videos should fit in the viewport at once. */
  videosToDisplay?: number;

  orientation?: YouTubeFavoritesOrientation;
  autoScroll?: boolean;
  openInNewTab?: boolean;
  refreshInterval?: number; // minutes

  onUpdate?: (config: YouTubeFavoritesWidgetConfig) => void;
  onDelete?: () => void;
  [key: string]: unknown;
}

export type YouTubeFavoritesWidgetProps = WidgetProps<YouTubeFavoritesWidgetConfig>;
