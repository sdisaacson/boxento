import React, { useState, useEffect, useCallback } from 'react';
import { 
  Container, 
  ExternalLink, 
  RefreshCw,
  AlertTriangle,
  Layers
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
import { ScrollArea } from '../../ui/scroll-area';
import WidgetHeader from '../common/WidgetHeader';
import { 
  DockerMonitorWidgetProps, 
  DockerMonitorWidgetConfig, 
  DockerContainer, 
  ContainerInfo 
} from './types';

const KANSO_LABELS = {
  NAME: 'kanso.name',
  DESCRIPTION: 'kanso.description',
  URL: 'kanso.url'
};

const DockerMonitorWidget: React.FC<DockerMonitorWidgetProps> = ({ width: _width, height: _height, config }) => {
  const defaultConfig: DockerMonitorWidgetConfig = {
    title: 'Docker Monitor',
    refreshInterval: 60, // 1 minute
    apiEndpoint: '/api/docker'
  };

  const [showSettings, setShowSettings] = useState(false);
  const [localConfig, setLocalConfig] = useState<DockerMonitorWidgetConfig>({
    ...defaultConfig,
    ...config
  });
  
  const [containers, setContainers] = useState<ContainerInfo[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLocalConfig(prev => ({
      ...prev,
      ...config
    }));
  }, [config]);

  const parseContainer = (container: DockerContainer): ContainerInfo => {
    const labels = container.Labels || {};
    
    // Default name from Docker (removing leading slash)
    const dockerName = container.Names && container.Names.length > 0 
      ? container.Names[0].replace(/^\//, '') 
      : container.Id.substring(0, 12);

    return {
      id: container.Id,
      name: labels[KANSO_LABELS.NAME] || dockerName,
      description: labels[KANSO_LABELS.DESCRIPTION],
      url: labels[KANSO_LABELS.URL],
      isRunning: container.State === 'running',
      status: container.Status,
      image: container.Image
    };
  };

  const fetchContainers = useCallback(async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    setError(null);
    
    try {
      const endpoint = localConfig.apiEndpoint || '/api/docker';
      const response = await fetch(`${endpoint}/containers/json?all=1`);
      
      if (!response.ok) {
        throw new Error(`Docker API error: ${response.status} ${response.statusText}`);
      }
      
      const data: DockerContainer[] = await response.json();
      const parsed = data.map(parseContainer);
      
      // Sort: running first, then by name
      parsed.sort((a, b) => {
        if (a.isRunning && !b.isRunning) return -1;
        if (!a.isRunning && b.isRunning) return 1;
        return a.name.localeCompare(b.name);
      });
      
      setContainers(parsed);
    } catch (err) {
      console.error('Failed to fetch Docker containers:', err);
      setError(err instanceof Error ? err.message : 'Failed to connect to Docker API');
    } finally {
      setIsRefreshing(false);
    }
  }, [localConfig.apiEndpoint, isRefreshing]);

  // Initial fetch and interval
  useEffect(() => {
    fetchContainers();
    
    const intervalId = setInterval(fetchContainers, localConfig.refreshInterval * 1000);
    return () => clearInterval(intervalId);
  }, [localConfig.refreshInterval, fetchContainers]);

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
            onClick={() => fetchContainers()}
            className="h-8 text-xs"
          >
            <RefreshCw className="h-3 w-3 mr-2" />
            Retry
          </Button>
        </div>
      );
    }

    if (containers.length === 0 && !isRefreshing) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
          <Layers className="h-8 w-8 mb-2 opacity-20" />
          <p className="text-xs">No containers found</p>
        </div>
      );
    }

    return (
      <ScrollArea className="h-full pr-3">
        <div className="space-y-3">
          {containers.map((site) => (
            <div 
              key={site.id} 
              className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50 group"
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <div className={site.isRunning ? "text-blue-500" : "text-muted-foreground opacity-50"}>
                  <Container className="h-4 w-4" />
                </div>
                <div className="flex flex-col overflow-hidden">
                  <div className="flex items-center gap-2">
                    {site.url ? (
                      <a 
                        href={site.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm font-medium hover:underline flex items-center gap-1 truncate"
                      >
                        {site.name}
                        <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-50 transition-opacity" />
                      </a>
                    ) : (
                      <span className="text-sm font-medium truncate">{site.name}</span>
                    )}
                  </div>
                  {site.description && (
                    <span className="text-[10px] text-muted-foreground truncate leading-tight">
                      {site.description}
                    </span>
                  )}
                  <span className="text-[9px] text-muted-foreground/60 truncate italic">
                    {site.status}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                {site.isRunning ? (
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[9px] font-bold text-green-600 dark:text-green-400 uppercase tracking-tighter">Running</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 opacity-50">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                    <span className="text-[9px] font-bold text-red-600 dark:text-red-400 uppercase tracking-tighter">Stopped</span>
                  </div>
                )}
              </div>
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
            <DialogTitle>Docker Monitor Settings</DialogTitle>
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
                placeholder="/api/docker"
              />
              <p className="text-[10px] text-muted-foreground">
                Path to Docker socket proxy. Expects Docker Remote API format.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="refresh">Refresh Interval (seconds)</Label>
              <Input
                id="refresh"
                type="number"
                min="5"
                value={localConfig.refreshInterval}
                onChange={(e) => setLocalConfig({ ...localConfig, refreshInterval: parseInt(e.target.value) || 30 })}
              />
            </div>
            
            <div className="pt-2 border-t mt-2">
              <Label className="text-xs font-bold uppercase text-muted-foreground">Label Configuration</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div className="p-2 rounded border bg-muted/30 text-[10px]">
                  <span className="font-bold block">kanso.name</span>
                  Display Name
                </div>
                <div className="p-2 rounded border bg-muted/30 text-[10px]">
                  <span className="font-bold block">kanso.url</span>
                  Clickable URL
                </div>
                <div className="p-2 rounded border bg-muted/30 text-[10px] col-span-2">
                  <span className="font-bold block">kanso.description</span>
                  Short Description
                </div>
              </div>
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
        title={localConfig.title || 'Docker Monitor'} 
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

export default DockerMonitorWidget;
