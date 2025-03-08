import { WidgetProps } from '@/types';

/**
 * Configuration options for the YouTube widget
 * 
 * @interface YouTubeWidgetConfig
 * @property {string} [id] - Unique identifier for the widget instance
 * @property {string} [title] - Title to display in the widget header
 * @property {string} [videoId] - YouTube video ID to display
 * @property {boolean} [autoplay] - Whether to autoplay the video
 * @property {boolean} [showControls] - Whether to show video controls
 * @property {boolean} [mute] - Whether to mute the video (helps with autoplay)
 * @property {boolean} [_expandedView] - Internal state tracking if small widget is in expanded play mode
 */
export interface YouTubeWidgetConfig {
  id?: string;
  title?: string;
  videoId?: string;
  autoplay?: boolean;
  showControls?: boolean;
  mute?: boolean;
  _expandedView?: boolean; // Internal state to track if small widgets should show player
  onUpdate?: (config: YouTubeWidgetConfig) => void;
  onDelete?: () => void;
}

/**
 * Props for the YouTube widget component
 * 
 * @type YouTubeWidgetProps
 */
export type YouTubeWidgetProps = WidgetProps<YouTubeWidgetConfig>; 