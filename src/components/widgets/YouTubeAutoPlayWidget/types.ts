import { WidgetProps } from '@/types';

export interface YouTubeAutoPlayWidgetConfig {
  id?: string;
  title?: string;

  /** Seconds to play each channel's newest video before switching. */
  secondsPerVideo?: number;

  /** Mute is recommended to allow autoplay in most browsers. */
  mute?: boolean;

  /** Show YouTube player controls. */
  showControls?: boolean;

  /** Whether to loop continuously through channels. */
  loop?: boolean;

  /** Refresh interval (minutes) for re-reading favorites + latest videos. */
  refreshInterval?: number;

  onUpdate?: (config: YouTubeAutoPlayWidgetConfig) => void;
  onDelete?: () => void;
  [key: string]: unknown;
}

export type YouTubeAutoPlayWidgetProps = WidgetProps<YouTubeAutoPlayWidgetConfig>;
