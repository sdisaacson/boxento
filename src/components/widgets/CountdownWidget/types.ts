import { WidgetProps } from '@/types';

export interface CountdownWidgetConfig {
  id?: string;
  title?: string;
  targetDate?: string; // ISO date string
  eventName?: string;
  showTime?: boolean; // Show hours/minutes/seconds
  onUpdate?: (config: CountdownWidgetConfig) => void;
  onDelete?: () => void;
  [key: string]: unknown;
}

export type CountdownWidgetProps = WidgetProps<CountdownWidgetConfig>;

export interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isPast: boolean;
}
