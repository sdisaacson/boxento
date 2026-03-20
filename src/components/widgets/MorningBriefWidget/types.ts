import { WidgetProps } from '@/types';

/**
 * Configuration options for the Morning Brief widget
 *
 * @interface MorningBriefWidgetConfig
 * @property {string} [id] - Unique identifier for the widget instance
 * @property {string} [title] - Title to display in the widget header
 * @property {string} [url] - URL to fetch the morning brief HTML from
 */
export interface MorningBriefWidgetConfig {
  id?: string;
  title?: string;
  url?: string;
  onUpdate?: (config: MorningBriefWidgetConfig) => void;
  onDelete?: () => void;
  [key: string]: unknown;
}

/**
 * Props for the Morning Brief widget component
 *
 * @type MorningBriefWidgetProps
 */
export type MorningBriefWidgetProps = WidgetProps<MorningBriefWidgetConfig>;
