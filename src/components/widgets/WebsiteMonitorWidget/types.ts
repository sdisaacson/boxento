import { WidgetProps } from '@/types';

/**
 * Individual website configuration for the monitor
 */
export interface MonitoredWebsite {
  id: string;
  name: string;
  url: string;
}

/**
 * Current status of a monitored website
 */
export interface WebsiteStatus {
  isOk: boolean;
  responseTime: number | null;
  error?: string;
  lastChecked: number;
}

/**
 * Configuration options for the Website Monitor widget
 * 
 * @interface WebsiteMonitorWidgetConfig
 */
export interface WebsiteMonitorWidgetConfig {
  id?: string;
  title?: string;
  websites: MonitoredWebsite[];
  onUpdate?: (config: any) => void;
  onDelete?: () => void;
  [key: string]: unknown;
}

/**
 * Props for the Website Monitor widget component
 * 
 * @type WebsiteMonitorWidgetProps
 */
export type WebsiteMonitorWidgetProps = WidgetProps<any>;
