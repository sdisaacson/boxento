import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,

} from 'recharts';
import {
  Server,
  Cpu,
  HardDrive,
  Network,
  Activity,
  Settings,
  X,
  RefreshCw,
  Globe,
  Power,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import WidgetHeader from '@/components/widgets/common/WidgetHeader';
import {
  HostingerVPSWidgetProps,
  HostingerVPSWidgetConfig,
  VPSInstance,
  VPSMetrics,
  MetricsDataPoint,
} from './types';

// Use proxy in development, direct API in production
const DEFAULT_API_URL = import.meta.env.DEV 
  ? '/api/hostinger' 
  : 'https://developers.hostinger.com';

/**
 * Hostinger VPS Widget Component
 *
 * Displays all VPS instances with their information and historical metrics.
 * Shows line graphs for CPU, memory, disk, and network usage over the last 6 months.
 *
 * @component
 * @param {HostingerVPSWidgetProps} props - Component props
 * @returns Hostinger VPS widget component
 */
const HostingerVPSWidget: React.FC<HostingerVPSWidgetProps> = ({
  width = 4,
  height = 4,
  config,
}) => {
  const [localConfig, setLocalConfig] = useState<HostingerVPSWidgetConfig>(
    config || { id: '' }
  );
  const [vpsList, setVpsList] = useState<VPSInstance[]>([]);
  const [metrics, setMetrics] = useState<Map<number, VPSMetrics>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedVPSId, setSelectedVPSId] = useState<string>('all');
  const [error, setError] = useState<string | null>(null);

  // Sync config prop changes to localConfig
  useEffect(() => {
    if (config) {
      setLocalConfig(config);
    }
  }, [config]);

  const updateConfig = useCallback(
    (
      newConfig:
        | HostingerVPSWidgetConfig
        | ((prev: HostingerVPSWidgetConfig) => HostingerVPSWidgetConfig)
    ) => {
      setLocalConfig((prevConfig) => {
        const updatedConfig =
          typeof newConfig === 'function' ? newConfig(prevConfig) : newConfig;
        if (config?.onUpdate) {
          config.onUpdate(updatedConfig);
        }
        return updatedConfig;
      });
    },
    [config]
  );

  const apiToken = localConfig.apiToken || '';
  // Always use the default API URL (proxy in dev, direct in production)
  const apiUrl = DEFAULT_API_URL;

  /**
   * Fetch list of all VPS instances
   */
  const fetchVPSList = useCallback(async () => {
    if (!apiToken) {
      console.log('No API token provided');
      return;
    }

    const url = `${apiUrl}/api/vps/v1/virtual-machines`;
    console.log('Fetching VPS list from:', url);
    console.log('Using API URL:', apiUrl);

    try {
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('VPS list response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`Failed to fetch VPS list: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('VPS list response data:', data);
      
      // Handle different response structures
      const vpsData = data.data || data;
      setVpsList(Array.isArray(vpsData) ? vpsData : []);
      return Array.isArray(vpsData) ? vpsData : [];
    } catch (error) {
      console.error('Error fetching VPS list:', error);
      toast.error('Failed to fetch VPS list', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
      return [];
    }
  }, [apiToken, apiUrl]);

  /**
   * Fetch metrics for a specific VPS (past 3 hours)
   */
  const fetchVPSMetrics = useCallback(
    async (vpsId: number, hostname: string) => {
      if (!apiToken) return;

      try {
        // Calculate date range (3 hours ago to now)
        const dateTo = new Date();
        const dateFrom = new Date();
        dateFrom.setHours(dateFrom.getHours() - 3);

        const params = new URLSearchParams({
          date_from: dateFrom.toISOString(),
          date_to: dateTo.toISOString(),
        });

        const response = await fetch(
          `${apiUrl}/api/vps/v1/virtual-machines/${vpsId}/metrics?${params}`,
          {
            headers: {
              Authorization: `Bearer ${apiToken}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch metrics: ${response.statusText}`);
        }

        const data = await response.json();
        console.log(`Raw metrics response for VPS ${vpsId}:`, data);

        // Transform the nested metrics data into chart-friendly format
        // The API returns: { cpu_usage: { unit: '%', usage: { 'timestamp': value } }, ... }
        const timestamps = new Set<string>();
        
        // Collect all timestamps from all metrics
        ['cpu_usage', 'ram_usage', 'disk_space', 'incoming_traffic', 'outgoing_traffic'].forEach((key) => {
          const metric = data[key as keyof typeof data] as { usage?: { [k: string]: number } } | null;
          if (metric?.usage) {
            Object.keys(metric.usage).forEach(ts => timestamps.add(ts));
          }
        });

        console.log('Found timestamps:', Array.from(timestamps).sort());

        // Create data points for each timestamp
        const transformedData: MetricsDataPoint[] = Array.from(timestamps)
          .sort()
          .map((ts) => {
            const timestampNum = parseInt(ts);
            const cpuData = data.cpu_usage?.usage?.[ts];
            const ramData = data.ram_usage?.usage?.[ts];
            const diskData = data.disk_space?.usage?.[ts];
            const inTraffic = data.incoming_traffic?.usage?.[ts];
            const outTraffic = data.outgoing_traffic?.usage?.[ts];

            return {
              time: new Date(timestampNum * 1000).toLocaleTimeString('default', {
                hour: '2-digit',
                minute: '2-digit',
              }),
              timestamp: timestampNum,
              cpu_usage: cpuData !== undefined ? Math.round(cpuData * 100) / 100 : 0,
              ram_usage: ramData !== undefined ? Math.round((ramData / 1024 / 1024 / 1024) * 100) / 100 : 0, // Convert to GB
              disk_space: diskData !== undefined ? Math.round((diskData / 1024 / 1024 / 1024) * 100) / 100 : 0, // Convert to GB
              incoming_traffic: inTraffic !== undefined ? Math.round((inTraffic / 1024 / 1024) * 100) / 100 : 0, // Convert to MB
              outgoing_traffic: outTraffic !== undefined ? Math.round((outTraffic / 1024 / 1024) * 100) / 100 : 0, // Convert to MB
            };
          });

        console.log(`Transformed ${transformedData.length} data points`);

        setMetrics((prev) => {
          const newMetrics = new Map(prev);
          newMetrics.set(vpsId, {
            vpsId,
            hostname,
            data: transformedData,
          });
          return newMetrics;
        });
      } catch (error) {
        console.error(`Error fetching metrics for VPS ${vpsId}:`, error);
      }
    },
    [apiToken, apiUrl]
  );

  /**
   * Fetch all data (VPS list and metrics)
   */
  const fetchAllData = useCallback(async () => {
    if (!apiToken) {
      setIsSettingsOpen(true);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const vpsInstances = await fetchVPSList();

      // Fetch metrics for each VPS in parallel
      if (vpsInstances && vpsInstances.length > 0) {
        await Promise.all(
          vpsInstances.map((vps: VPSInstance) =>
            fetchVPSMetrics(vps.id, vps.hostname)
          )
        );
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [apiToken, fetchVPSList, fetchVPSMetrics]);

  // Initial data fetch
  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // No auto-refresh - data only loads once on mount or when manually triggered

  const getStateColor = (state: VPSInstance['state']) => {
    switch (state) {
      case 'running':
        return 'text-green-500';
      case 'stopped':
        return 'text-gray-500';
      case 'suspended':
        return 'text-yellow-500';
      case 'error':
        return 'text-red-500';
      case 'starting':
      case 'creating':
      case 'recreating':
        return 'text-blue-500';
      case 'stopping':
        return 'text-orange-500';
      default:
        return 'text-gray-400';
    }
  };

  const getStateIcon = (state: VPSInstance['state']) => {
    switch (state) {
      case 'running':
        return <Power size={14} className="text-green-500" />;
      case 'stopped':
        return <Power size={14} className="text-gray-500" />;
      case 'error':
        return <AlertCircle size={14} className="text-red-500" />;
      case 'starting':
      case 'creating':
      case 'recreating':
        return <RefreshCw size={14} className="text-blue-500 animate-spin" />;
      default:
        return <Activity size={14} className="text-gray-400" />;
    }
  };

  // Prepare chart data based on selected VPS
  const chartData = useMemo(() => {
    console.log('metrics Map:', metrics);
    console.log('metrics size:', metrics.size);
    console.log('selectedVPSId:', selectedVPSId);
    
    if (selectedVPSId === 'all') {
      // For now, just show the first VPS data when 'all' is selected
      // Combining multiple VPS metrics doesn't make sense for most metrics
      const firstMetrics = Array.from(metrics.values())[0];
      console.log('First metrics:', firstMetrics);
      return firstMetrics?.data || [];
    } else {
      const vpsMetrics = metrics.get(parseInt(selectedVPSId));
      console.log('Selected VPS metrics:', vpsMetrics);
      return vpsMetrics?.data || [];
    }
  }, [metrics, selectedVPSId]);

  const renderCompactView = () => {
    const runningCount = vpsList.filter((vps) => vps.state === 'running').length;
    const totalCount = vpsList.length;

    if (!apiToken) {
      return (
        <div className="h-full flex flex-col justify-center items-center text-center p-2">
          <AlertCircle size={24} className="text-yellow-500 mb-2" />
          <div className="text-xs text-gray-500">
            Configure API token in settings
          </div>
        </div>
      );
    }

    if (isLoading) {
      return (
        <div className="h-full flex flex-col justify-center items-center">
          <RefreshCw size={24} className="animate-spin text-blue-500 mb-2" />
          <div className="text-xs text-gray-500">Loading...</div>
        </div>
      );
    }

    return (
      <div className="h-full flex flex-col justify-center items-center">
        <div className="text-4xl font-bold text-blue-500 mb-2">{totalCount}</div>
        <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
          VPS Instances
        </div>
        <div className="text-xs text-green-500 flex items-center gap-1">
          <Power size={12} />
          {runningCount} running
        </div>
      </div>
    );
  };

  const renderVPSCard = (vps: VPSInstance, isHorizontal: boolean) => {
    if (isHorizontal) {
      return (
        <div
          key={vps.id}
          className="p-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex flex-col w-full"
        >
          <div className="flex items-center justify-center mb-1">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30">
              {getStateIcon(vps.state)}
            </div>
          </div>
          <div className="text-center">
            <div className="font-medium text-xs truncate">{vps.hostname}</div>
            <div className={`text-[10px] capitalize ${getStateColor(vps.state)}`}>
              {vps.state}
            </div>
            <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">
              {vps.cpus} vCPU
            </div>
          </div>
        </div>
      );
    }

    return (
      <div
        key={vps.id}
        className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Server size={16} className="text-blue-500" />
            <span className="font-medium text-sm">{vps.hostname}</span>
          </div>
          <div className="flex items-center gap-2">
            {getStateIcon(vps.state)}
            <span className={`text-xs capitalize ${getStateColor(vps.state)}`}>
              {vps.state}
            </span>
          </div>
        </div>
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 space-y-1">
          <div className="flex items-center gap-1">
            <Globe size={12} />
            <span>{vps.ipv4 && vps.ipv4.length > 0 ? vps.ipv4[0].address : 'No IP'}</span>
          </div>
          <div className="flex items-center gap-1">
            <Activity size={12} />
            <span>{vps.template?.name || 'Unknown OS'}</span>
          </div>
          <div className="flex items-center gap-1">
            <Cpu size={12} />
            <span>{vps.cpus} CPU • {(vps.memory / 1024).toFixed(1)} GB • {(vps.disk / 1024).toFixed(0)} GB SSD</span>
          </div>
        </div>
      </div>
    );
  };

  const renderVPSList = () => {
    const layout = localConfig.layout || 'vertical';
    const itemsPerRow = localConfig.itemsPerRow || 3;

    if (layout === 'horizontal') {
      // Calculate width percentage based on items per row
      const itemWidth = `calc(${100 / itemsPerRow}% - ${(itemsPerRow - 1) * 8 / itemsPerRow}px)`;
      
      return (
        <div className="h-full overflow-y-auto">
          <div className="flex flex-wrap gap-2 content-start">
            {vpsList.map((vps) => (
              <div key={vps.id} style={{ width: itemWidth, flex: '0 0 auto' }}>
                {renderVPSCard(vps, true)}
              </div>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {vpsList.map((vps) => renderVPSCard(vps, false))}
      </div>
    );
  };

  const renderSingleChart = (
    dataKey: keyof MetricsDataPoint,
    color: string,
    label: string,
    domain: [number, number] | ['auto', 'auto'] = [0, 100],
    unit: string = '%'
  ) => {
    if (chartData.length === 0) {
      return (
        <div className="h-24 flex items-center justify-center text-gray-500 text-xs">
          No data
        </div>
      );
    }

    return (
      <div className="h-24">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
            <XAxis dataKey="time" tick={{ fontSize: 9 }} interval="preserveStartEnd" minTickGap={40} />
            <YAxis 
              tick={{ fontSize: 9 }} 
              domain={domain}
              width={45}
              tickFormatter={(value) => `${value}${unit}`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                border: 'none',
                borderRadius: '4px',
                fontSize: '11px',
                padding: '8px',
              }}
              labelStyle={{ color: '#fff', marginBottom: '4px' }}
              formatter={(value) => [`${value}${unit}`, label]}
            />
            <Line
              type="monotone"
              dataKey={dataKey as string}
              stroke={color}
              strokeWidth={1.5}
              dot={false}
              activeDot={{ r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  };

  const renderAllMetricsCharts = () => {
    return (
      <div className="space-y-2">
        {/* CPU % */}
        <div>
          <div className="flex items-center gap-1 text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
            <Cpu size={12} className="text-blue-500" />
            CPU %
          </div>
          {renderSingleChart('cpu_usage', '#3b82f6', 'CPU', [0, 100], '%')}
        </div>

        {/* RAM Usage */}
        <div>
          <div className="flex items-center gap-1 text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
            <Activity size={12} className="text-purple-500" />
            RAM Usage (GB)
          </div>
          {renderSingleChart('ram_usage', '#8b5cf6', 'RAM', ['auto', 'auto'], ' GB')}
        </div>

        {/* Disk Space */}
        <div>
          <div className="flex items-center gap-1 text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
            <HardDrive size={12} className="text-green-500" />
            Disk Space (GB)
          </div>
          {renderSingleChart('disk_space', '#10b981', 'Disk', ['auto', 'auto'], ' GB')}
        </div>

        {/* Outgoing Traffic */}
        <div>
          <div className="flex items-center gap-1 text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
            <Network size={12} className="text-orange-500" />
            Outgoing Traffic (MB)
          </div>
          {renderSingleChart('outgoing_traffic', '#f97316', 'Outbound', ['auto', 'auto'], ' MB')}
        </div>

        {/* Incoming Traffic */}
        <div>
          <div className="flex items-center gap-1 text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
            <Network size={12} className="text-cyan-500" />
            Incoming Traffic (MB)
          </div>
          {renderSingleChart('incoming_traffic', '#06b6d4', 'Inbound', ['auto', 'auto'], ' MB')}
        </div>
      </div>
    );
  };

  const renderFullView = () => {
    if (!apiToken) {
      return (
        <div className="h-full flex flex-col justify-center items-center text-center p-4">
          <AlertCircle size={32} className="text-yellow-500 mb-3" />
          <div className="text-sm font-medium mb-1">API Token Required</div>
          <div className="text-xs text-gray-500 mb-3">
            Please configure your Hostinger API token in settings
          </div>
          <Button variant="outline" size="sm" onClick={() => setIsSettingsOpen(true)}>
            Open Settings
          </Button>
        </div>
      );
    }

    if (isLoading && vpsList.length === 0) {
      return (
        <div className="h-full flex flex-col justify-center items-center">
          <RefreshCw size={32} className="animate-spin text-blue-500 mb-3" />
          <div className="text-sm text-gray-500">Loading VPS data...</div>
        </div>
      );
    }

    if (error && vpsList.length === 0) {
      return (
        <div className="h-full flex flex-col justify-center items-center text-center p-4">
          <AlertCircle size={32} className="text-red-500 mb-3" />
          <div className="text-sm font-medium mb-1 text-red-500">Error</div>
          <div className="text-xs text-gray-500 mb-3">{error}</div>
          <Button variant="outline" size="sm" onClick={fetchAllData}>
            <RefreshCw size={14} className="mr-1" />
            Retry
          </Button>
        </div>
      );
    }

    return (
    <div className="h-full flex flex-col">
      {/* Header with VPS selector */}
      <div className="flex items-center justify-between mb-4">
        <Select value={selectedVPSId} onValueChange={setSelectedVPSId}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Select VPS" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All VPS (Average)</SelectItem>
            {vpsList.map((vps) => (
              <SelectItem key={vps.id} value={vps.id.toString()}>
                {vps.hostname}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchAllData}
          disabled={isLoading}
        >
          <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
        </Button>
      </div>

      {/* VPS Info - unified look without cards */}
      <div className="mb-3 pb-3 border-b border-gray-200 dark:border-gray-700">
        {(localConfig.layout === 'horizontal' && width >= 3) ? (
          // Horizontal layout - unified inline style
          (() => {
            const itemsPerRow = localConfig.itemsPerRow || 3;
            const itemWidth = `calc(${100 / itemsPerRow}% - ${(itemsPerRow - 1) * 8 / itemsPerRow}px)`;
            return (
              <div className="flex flex-wrap gap-2">
                {vpsList.map((vps) => (
                  <div key={vps.id} className="flex items-center gap-2 flex-1 min-w-0" title={vps.hostname}>
                    <div className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/30 shrink-0">
                      {getStateIcon(vps.state)}
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium text-xs whitespace-nowrap overflow-visible">{vps.hostname}</div>
                      <div className={`text-[10px] capitalize ${getStateColor(vps.state)}`}>
                        {vps.state} • {vps.cpus} vCPU
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            );
          })()
        ) : (
          // Vertical layout (default)
          <>
            {vpsList.slice(0, 1).map((vps) => (
              <div key={vps.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30">
                    {getStateIcon(vps.state)}
                  </div>
                  <div>
                    <div className="font-medium text-sm">{vps.hostname}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {vps.ipv4 && vps.ipv4.length > 0 ? vps.ipv4[0].address : 'No IP'} • {vps.plan}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-xs font-medium capitalize ${getStateColor(vps.state)}`}>
                    {vps.state}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {vps.cpus} vCPU • {(vps.memory / 1024).toFixed(1)} GB
                  </div>
                </div>
              </div>
            ))}
            {vpsList.length > 1 && (
              <div className="text-xs text-gray-500 mt-2">
                +{vpsList.length - 1} more VPS instance{vpsList.length > 2 ? 's' : ''}
              </div>
            )}
          </>
        )}
      </div>

      {/* Metrics Charts - Stacked */}
      <div className="flex-1 overflow-y-auto pr-1">
        {renderAllMetricsCharts()}
      </div>
    </div>
  );
};

  // Render based on widget size
  const renderContent = () => {
    if (width <= 2 && height <= 2) {
      return renderCompactView();
    } else if (width <= 2) {
      return (
        <div className="h-full overflow-y-auto">
          <div className="text-xs font-medium mb-2">VPS Instances</div>
          {renderVPSList()}
        </div>
      );
    } else {
      return renderFullView();
    }
  };

  return (
    <div className="widget-container h-full flex flex-col">
      <WidgetHeader
        title="Hostinger VPS"
        onSettingsClick={() => setIsSettingsOpen(true)}
        
      />

      <div className="flex-1 p-3 overflow-hidden">{renderContent()}</div>

      {/* Settings Dialog */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings size={18} />
              Hostinger VPS Settings
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="api-token">API Token</Label>
              <Input
                id="api-token"
                type="password"
                value={apiToken}
                onChange={(e) =>
                  updateConfig({ ...localConfig, apiToken: e.target.value })
                }
                placeholder="Enter your Hostinger API token"
              />
              <p className="text-xs text-gray-500">
                Get your API token from the{' '}
                <a
                  href="https://hpanel.hostinger.com/profile/api"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline"
                >
                  Hostinger API page
                </a>
              </p>
              <p className="text-xs text-gray-400">
                API Endpoint: {apiUrl}
              </p>
            </div>

            {/* Layout Settings */}
            <div className="space-y-2">
              <Label>Layout</Label>
              <div className="flex gap-2">
                <Button
                  variant={localConfig.layout === 'vertical' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => updateConfig({ ...localConfig, layout: 'vertical' })}
                  className="flex-1"
                >
                  Vertical
                </Button>
                <Button
                  variant={localConfig.layout === 'horizontal' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => updateConfig({ ...localConfig, layout: 'horizontal' })}
                  className="flex-1"
                >
                  Horizontal
                </Button>
              </div>
            </div>

            {localConfig.layout === 'horizontal' && (
              <div className="space-y-2">
                <Label htmlFor="items-per-row">VPS per row</Label>
                <Input
                  id="items-per-row"
                  type="number"
                  min={1}
                  max={10}
                  value={localConfig.itemsPerRow || 3}
                  onChange={(e) =>
                    updateConfig({ ...localConfig, itemsPerRow: parseInt(e.target.value) || 3 })
                  }
                />
              </div>
            )}

            {vpsList.length > 0 && (
              <div className="space-y-2">
                <Label>VPS Instances ({vpsList.length})</Label>
                <div className="max-h-40 overflow-y-auto space-y-2 border rounded p-2">
                  {vpsList.map((vps) => (
                    <div
                      key={vps.id}
                      className="flex items-center justify-between text-sm"
                    >
                      <div className="flex items-center gap-2">
                        {getStateIcon(vps.state)}
                        <span>{vps.hostname}</span>
                      </div>
                      <span
                        className={`text-xs ${getStateColor(vps.state)} capitalize`}
                      >
                        {vps.state}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            {config?.onDelete && (
              <Button
                variant="outline"
                className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 border-transparent hover:border-red-200 dark:hover:border-red-800"
                onClick={() => {
                  if (config.onDelete) {
                    config.onDelete();
                  }
                }}
              >
                Delete Widget
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => setIsSettingsOpen(false)}
            >
              <X size={14} className="mr-1" />
              Cancel
            </Button>
            <Button 
              onClick={() => {
                // Save is automatic via updateConfig, just close the dialog
                setIsSettingsOpen(false);
                // Fetch data after closing if we have a token
                if (apiToken) {
                  fetchAllData();
                }
              }} 
              disabled={!apiToken}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HostingerVPSWidget;
