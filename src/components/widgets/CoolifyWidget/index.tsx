import React, { useState, useEffect, useCallback } from 'react';
import { 
  Server, 
  HardDrive, 
  Activity, 
  RefreshCw,
  AlertTriangle,
  Cpu,
  Layers,
  Container
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '../../ui/dialog';
import { Button } from '../../ui/button';
import { Label } from '../../ui/label';
import { Input } from '../../ui/input';
import { Checkbox } from '../../ui/checkbox';
import { ScrollArea } from '../../ui/scroll-area';
import WidgetHeader from '../common/WidgetHeader';
import { 
  CoolifyWidgetProps, 
  CoolifyWidgetConfig, 
  CoolifyServer, 
  CoolifyResource 
} from './types';

const CoolifyWidget: React.FC<CoolifyWidgetProps> = ({ width: _width, height: _height, config }) => {
  const defaultConfig: CoolifyWidgetConfig = {
    title: 'Coolify Status',
    apiEndpoint: '/api/coolify/v1',
    bearerToken: 'jmUZ9TZI6UbymEvWA9l2xVX5vsbL9vzc8mrRc95E7562f211',
    showDockerInfo: true
  };

  const [showSettings, setShowSettings] = useState(false);
  const [localConfig, setLocalConfig] = useState<CoolifyWidgetConfig>({
    ...defaultConfig,
    ...config
  });
  
  const [servers, setServers] = useState<CoolifyServer[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLocalConfig(prev => ({
      ...prev,
      ...config
    }));
  }, [config]);

  const fetchData = useCallback(async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    setError(null);
    
    try {
      const endpoint = localConfig.apiEndpoint.replace(/\/$/, '');
      const headers = {
        'Authorization': `Bearer ${localConfig.bearerToken}`,
        'Accept': 'application/json'
      };

      // 1. Fetch Servers
      const serversResponse = await fetch(`${endpoint}/servers`, { headers });
      
      if (!serversResponse.ok) {
        throw new Error(`Coolify API error: ${serversResponse.status} ${serversResponse.statusText}`);
      }
      
      const serversData: CoolifyServer[] = await serversResponse.json();
      
      // 2. Fetch resources for each server if Docker info is requested
      const enhancedServers = await Promise.all(serversData.map(async (server) => {
        if (localConfig.showDockerInfo) {
          try {
            const resourcesResponse = await fetch(`${endpoint}/servers/${server.uuid}/resources`, { headers });
            if (resourcesResponse.ok) {
              const resources: CoolifyResource[] = await resourcesResponse.json();
              return { ...server, resources };
            }
          } catch (resErr) {
            console.error(`Failed to fetch resources for server ${server.uuid}:`, resErr);
          }
        }
        return server;
      }));
      
      setServers(enhancedServers);
    } catch (err) {
      console.error('Failed to fetch Coolify data:', err);
      setError(err instanceof Error ? err.message : 'Failed to connect to Coolify API');
    } finally {
      setIsRefreshing(false);
    }
  }, [localConfig, isRefreshing]);

  // Initial fetch and interval
  useEffect(() => {
    fetchData();
    
    // Hardcoded 60s refresh
    const intervalId = setInterval(fetchData, 60000);
    return () => clearInterval(intervalId);
  }, [fetchData]);

  const saveSettings = () => {
    if (config?.onUpdate) {
      config.onUpdate(localConfig);
    }
    setShowSettings(false);
  };

  const renderContent = () => {
    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center px-4">
          <AlertTriangle className="h-8 w-8 text-yellow-500 mb-2" />
          <p className="text-xs font-medium text-destructive mb-1">Connection Error</p>
          <p className="text-[10px] text-muted-foreground mb-3">{error}</p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => fetchData()}
            className="h-8 text-xs"
          >
            <RefreshCw className="h-3 w-3 mr-2" />
            Retry
          </Button>
        </div>
      );
    }

    if (servers.length === 0 && !isRefreshing) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
          <Server className="h-8 w-8 mb-2 opacity-20" />
          <p className="text-xs">No servers found</p>
        </div>
      );
    }

    return (
      <ScrollArea className="h-full pr-3">
        <div className="space-y-4">
          {servers.map((server) => (
            <div 
              key={server.uuid} 
              className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50"
            >
              {/* Server Header */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 overflow-hidden">
                  <div className="text-blue-500 p-1.5 bg-blue-500/10 rounded-md">
                    <Server className="h-4 w-4" />
                  </div>
                  <div className="flex flex-col overflow-hidden">
                    <span className="text-sm font-bold truncate leading-none mb-1">{server.name}</span>
                    <span className="text-[10px] text-muted-foreground font-mono truncate">{server.ip}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <div className={`w-1.5 h-1.5 rounded-full ${server.status === 'online' || !server.status ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span className="text-[9px] font-bold uppercase tracking-tighter opacity-70">
                    {server.status || 'Active'}
                  </span>
                </div>
              </div>

              {/* Server Details */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="flex items-center gap-1.5 p-1.5 rounded bg-white dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800">
                  <Cpu className="h-3 w-3 text-muted-foreground" />
                  <div className="flex flex-col">
                    <span className="text-[8px] text-muted-foreground uppercase font-bold leading-none">CPU</span>
                    <span className="text-[10px] font-medium leading-none mt-1">N/A</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 p-1.5 rounded bg-white dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800">
                  <Activity className="h-3 w-3 text-muted-foreground" />
                  <div className="flex flex-col">
                    <span className="text-[8px] text-muted-foreground uppercase font-bold leading-none">RAM</span>
                    <span className="text-[10px] font-medium leading-none mt-1">N/A</span>
                  </div>
                </div>
              </div>

              {/* Resources / Docker Info */}
              {localConfig.showDockerInfo && server.resources && server.resources.length > 0 && (
                <div className="space-y-1.5 mt-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                  <div className="flex items-center gap-1 mb-1">
                    <Layers className="h-3 w-3 text-blue-500" />
                    <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">Resources ({server.resources.length})</span>
                  </div>
                  <div className="space-y-1">
                    {server.resources.map((res) => (
                      <div key={res.uuid} className="flex items-center justify-between py-1 px-2 rounded bg-black/5 dark:bg-white/5 text-[10px]">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <Container className="h-2.5 w-2.5 opacity-50" />
                          <span className="truncate max-w-[120px] font-medium">{res.name}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`px-1 rounded-[2px] text-[8px] font-bold uppercase ${
                            res.status?.includes('running') || res.status?.includes('online') 
                              ? 'bg-green-500/20 text-green-600 dark:text-green-400' 
                              : 'bg-yellow-500/20 text-yellow-600'
                          }`}>
                            {res.status || 'Unknown'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
    );
  };

  const renderSettings = () => {
    return (
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Coolify Monitor Settings</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Widget Title</Label>
              <Input
                id="title"
                value={localConfig.title}
                onChange={(e) => setLocalConfig({ ...localConfig, title: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="api">API Endpoint</Label>
              <Input
                id="api"
                value={localConfig.apiEndpoint}
                onChange={(e) => setLocalConfig({ ...localConfig, apiEndpoint: e.target.value })}
                placeholder="https://app.coolify.io/api/v1"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="token">Bearer Token</Label>
              <Input
                id="token"
                type="password"
                value={localConfig.bearerToken}
                onChange={(e) => setLocalConfig({ ...localConfig, bearerToken: e.target.value })}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox 
                id="dockerInfo" 
                checked={localConfig.showDockerInfo}
                onCheckedChange={(checked) => 
                  setLocalConfig({ ...localConfig, showDockerInfo: checked === true })
                }
              />
              <Label htmlFor="dockerInfo" className="text-sm font-medium leading-none cursor-pointer">
                Include Docker information (Resources)
              </Label>
            </div>
          </div>
          
          <DialogFooter>
            <div className="flex justify-between w-full">
              {config?.onDelete && (
                <Button
                  variant="destructive"
                  onClick={() => config.onDelete?.()}
                >
                  Delete
                </Button>
              )}
              <Button onClick={saveSettings}>Save</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <div className="widget-container h-full flex flex-col">
      <WidgetHeader 
        title={localConfig.title || 'Coolify Status'} 
        onSettingsClick={() => setShowSettings(true)}
      />
      
      <div className="flex-grow p-4 overflow-hidden relative">
        {renderContent()}
        {isRefreshing && (
          <div className="absolute top-1 right-1">
            <RefreshCw className="h-2 w-2 animate-spin text-muted-foreground opacity-30" />
          </div>
        )}
      </div>
      
      {renderSettings()}
    </div>
  );
};

export default CoolifyWidget;
