import { WidgetProps } from '@/types';

export interface DailyScheduleEvent {
  uid?: string;
  summary?: string;
  description?: string;
  location?: string;
  start: Date;
  end: Date;
  allDay?: boolean;
}

export interface DailyScheduleWidgetConfig {
  id?: string;
  title?: string;

  /** Publicly-accessible URL to an .ics file */
  icsUrl?: string;

  /** Number of days into the future to show (including today). */
  daysAhead?: number;

  /** Refresh interval in minutes (0 disables auto-refresh). */
  refreshInterval?: number;

  /** Show event location (if present). */
  showLocation?: boolean;

  /** Show event description (if present). */
  showDescription?: boolean;

  onUpdate?: (config: DailyScheduleWidgetConfig) => void;
  onDelete?: () => void;
  [key: string]: unknown;
}

export type DailyScheduleWidgetProps = WidgetProps<DailyScheduleWidgetConfig>;
