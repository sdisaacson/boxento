import { WidgetProps } from '@/types';

export type YouTubeFavoritesOrientation = 'vertical' | 'horizontal';

export interface YouTubeFavoritesWidgetConfig {
  id?: string;
  title?: string;
  channelIds?: string[]; // YouTube channel IDs
  videoCount?: number;
  orientation?: YouTubeFavoritesOrientation;
  onUpdate?: (config: YouTubeFavoritesWidgetConfig) => void;
  onDelete?: () => void;
  [key: string]: unknown;
}

export type YouTubeFavoritesWidgetProps = WidgetProps<YouTubeFavoritesWidgetConfig>;
