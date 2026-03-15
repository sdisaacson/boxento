import { WidgetProps } from '@/types';

/**
 * Docker container information
 */
export interface DockerContainer {
  Id: string;
  Names: string[];
  Image: string;
  State: string;
  Status: string;
  Labels: Record<string, string>;
}

/**
 * Parsed container information for display
 */
export interface ContainerInfo {
  id: string;
  name: string;
  description?: string;
  url?: string;
  isRunning: boolean;
  status: string;
  image: string;
}

/**
 * Configuration options for the Docker Monitor widget
 * 
 * @interface DockerMonitorWidgetConfig
 */
export interface DockerMonitorWidgetConfig {
  id?: string;
  title?: string;
  refreshInterval: number; // in seconds
  apiEndpoint?: string; // e.g. /api/docker
  onUpdate?: (config: any) => void;
  onDelete?: () => void;
  [key: string]: unknown;
}

/**
 * Props for the Docker Monitor widget component
 * 
 * @type DockerMonitorWidgetProps
 */
export type DockerMonitorWidgetProps = WidgetProps<any>;
