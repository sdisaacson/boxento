import { WidgetProps } from '@/types';

/**
 * Configuration options for the Monthly Calendar widget
 * 
 * @interface CalendarMonthlyWidgetConfig
 * @property {string} [id] - Unique identifier for the widget instance
 * @property {number} [startOfWeek] - 0 for Sunday, 1 for Monday, etc.
 * @property {string} [title] - Custom title for the widget
 * @property {boolean} [showTodayButton] - Whether to show a button to jump back to today
 */
export interface CalendarMonthlyWidgetConfig {
  id?: string;
  startOfWeek?: 0 | 1;
  title?: string;
  showTodayButton?: boolean;
  onUpdate?: (config: CalendarMonthlyWidgetConfig) => void;
  onDelete?: () => void;
  [key: string]: unknown;
}

/**
 * Props for the Monthly Calendar widget component
 * 
 * @type CalendarMonthlyWidgetProps
 */
export type CalendarMonthlyWidgetProps = WidgetProps<CalendarMonthlyWidgetConfig>;
