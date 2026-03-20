import { WidgetProps } from '@/types';

/**
 * Represents a Hostinger VPS Virtual Machine
 */
export interface VPSInstance {
  id: number;
  subscription_id: string;
  plan: string;
  hostname: string;
  state: 'running' | 'stopped' | 'suspended' | 'initial' | 'provisioning' | 'error' | 'starting' | 'stopping' | 'creating' | 'recreating' | 'recovery';
  actions_lock: 'locked' | 'unlocked';
  cpus: number;
  memory: number;
  disk: number;
  bandwidth: number;
  ns1: string | null;
  ns2: string | null;
  ipv4: IPAddress[] | null;
  ipv6: IPAddress[] | null;
  template: {
    id: number;
    name: string;
  } | null;
  created_at: string;
}

export interface IPAddress {
  id: number;
  address: string;
  type: 'ipv4' | 'ipv6';
}

/**
 * Represents a single metrics data point
 */
export interface MetricsDataPoint {
  time: string;
  timestamp: number;
  cpu_usage: number;
  ram_usage: number;
  disk_space: number;
  incoming_traffic: number;
  outgoing_traffic: number;
}

/**
 * Raw API metrics response structure
 */
export interface RawMetricsResource {
  unit: string;
  usage: { [timestamp: string]: number };
}

export interface RawMetricsResponse {
  cpu_usage: RawMetricsResource | null;
  ram_usage: RawMetricsResource | null;
  disk_space: RawMetricsResource | null;
  outgoing_traffic: RawMetricsResource | null;
  incoming_traffic: RawMetricsResource | null;
  uptime: RawMetricsResource | null;
}

/**
 * Represents VPS metrics collection
 */
export interface VPSMetrics {
  vpsId: number;
  hostname: string;
  data: MetricsDataPoint[];
}

/**
 * Configuration options for the Hostinger VPS widget
 */
export interface HostingerVPSWidgetConfig {
  id?: string;
  apiToken?: string;
  apiUrl?: string;
  selectedVPS?: number[];
  layout?: 'vertical' | 'horizontal';
  itemsPerRow?: number;
  onUpdate?: (config: HostingerVPSWidgetConfig) => void;
  [key: string]: unknown;
}

/**
 * Props for the Hostinger VPS widget component
 */
export type HostingerVPSWidgetProps = WidgetProps<HostingerVPSWidgetConfig>;

/**
 * API Response types
 */
export interface VPSListResponse {
  data: VPSInstance[];
}

export interface MetricsResponse {
  data: {
    time: string;
    cpu_usage: number;
    memory_usage: number;
    disk_usage: number;
    network_in: number;
    network_out: number;
  }[];
}
