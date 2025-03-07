import { WidgetProps } from '@/types';

/**
 * Configuration options for the Template widget
 * 
 * @interface TemplateWidgetConfig
 * @property {string} [id] - Unique identifier for the widget instance
 * @property {string} [title] - Title to display in the widget header
 */
export interface TemplateWidgetConfig {
  id?: string;
  title?: string;
  onUpdate?: (config: TemplateWidgetConfig) => void;
  onDelete?: () => void;
}

/**
 * Props for the Template widget component
 * 
 * @type TemplateWidgetProps
 */
export type TemplateWidgetProps = WidgetProps<TemplateWidgetConfig>; 