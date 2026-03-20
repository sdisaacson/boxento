import { WidgetProps } from '@/types';

export interface CoolifyWidgetConfig {
  title?: string;
  apiEndpoint: string;
  bearerToken: string;
  showDockerInfo: boolean;
  [key: string]: unknown;
}

export interface CoolifyServer {
  uuid: string;
  name: string;
  description: string | null;
  ip: string;
  user: string;
  port: number;
  status?: string;
  resources?: CoolifyResource[];
}

export interface CoolifyResource {
  uuid: string;
  name: string;
  type: string;
  status: string;
  // Resource usage if available
  cpu_usage?: string;
  memory_usage?: string;
}

export type CoolifyWidgetProps = WidgetProps<CoolifyWidgetConfig>;
