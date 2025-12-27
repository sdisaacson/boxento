import { WidgetProps } from '@/types';

/**
 * Configuration options for the Iframe widget
 *
 * @interface IframeWidgetConfig
 * @property {string} [id] - Unique identifier for the widget instance
 * @property {string} [title] - Title to display in the widget header
 * @property {string} [url] - URL to display in the iframe
 */
export interface IframeWidgetConfig {
  id?: string;
  title?: string;
  url?: string;
  onUpdate?: (config: IframeWidgetConfig) => void;
  onDelete?: () => void;
  [key: string]: unknown;
}

/**
 * Props for the Iframe widget component
 *
 * @type IframeWidgetProps
 */
export type IframeWidgetProps = WidgetProps<IframeWidgetConfig>;
