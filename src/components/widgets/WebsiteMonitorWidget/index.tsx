import React, { useState, useEffect, useCallback } from 'react';
import { 
  Plus, 
  Trash2, 
  Globe, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ExternalLink, 
  RefreshCw
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
  WebsiteMonitorWidgetProps, 
  WebsiteMonitorWidgetConfig, 
  MonitoredWebsite, 
  WebsiteStatus 
} from './types';

const CORS_PROXY = 'https://api.allorigins.win/raw?url=';
const FAVICON_SERVICE = 'https://www.google.com/s2/favicons?sz=32&domain=';

const WebsiteMonitorWidget: React.FC<WebsiteMonitorWidgetProps> = ({ width: _width, height: _height, config }) => {
  const defaultConfig: WebsiteMonitorWidgetConfig = {
    title: 'Website Monitor',
    websites: [
      { id: '1', name: 'Google', url: 'https://www.google.com' },
      { id: '2', name: 'GitHub', url: 'https://github.com' }
    ]
  };

  const [showSettings, setShowSettings] = useState(false);
  const [localConfig, setLocalConfig] = useState<WebsiteMonitorWidgetConfig>({
    ...defaultConfig,
    ...config
  });
  
  const [statuses, setStatuses] = useState<Record<string, WebsiteStatus>>({});
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // For settings modal
  const [newSiteName, setNewSiteName] = useState('');
  const [newSiteUrl, setNewSiteUrl] = useState('');

  useEffect(() => {
    setLocalConfig(prev => ({
      ...prev,
      ...config
    }));
  }, [config]);

  const checkWebsite = useCallback(async (website: MonitoredWebsite): Promise<WebsiteStatus> => {
    const startTime = performance.now();
    try {
      // Use no-cache to get a real response time
      const response = await fetch(`${CORS_PROXY}${encodeURIComponent(website.url)}`, {
        cache: 'no-store'
      });
      const endTime = performance.now();
      const responseTime = Math.round(endTime - startTime);

      if (response.ok) {
        return {
          isOk: true,
          responseTime,
          lastChecked: Date.now()
        };
      } else {
        return {
          isOk: false,
          responseTime,
          error: `HTTP ${response.status}`,
          lastChecked: Date.now()
        };
      }
    } catch (error) {
      const endTime = performance.now();
      return {
        isOk: false,
        responseTime: Math.round(endTime - startTime),
        error: error instanceof Error ? error.message : 'Network Error',
        lastChecked: Date.now()
      };
    }
  }, []);

  const refreshAll = useCallback(async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    
    const results: Record<string, WebsiteStatus> = {};
    const promises = localConfig.websites.map(async (site) => {
      results[site.id] = await checkWebsite(site);
    });
    
    await Promise.all(promises);
    setStatuses(results);
    setIsRefreshing(false);
  }, [localConfig.websites, checkWebsite, isRefreshing]);

  // Initial refresh and fixed interval (5 minutes)
  useEffect(() => {
    refreshAll();
    
    const intervalId = setInterval(refreshAll, 300000);
    return () => clearInterval(intervalId);
  }, [localConfig.websites, refreshAll]);

  const addWebsite = () => {
    if (!newSiteName || !newSiteUrl) return;
    
    let url = newSiteUrl;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }

    const newSite: MonitoredWebsite = {
      id: Math.random().toString(36).substr(2, 9),
      name: newSiteName,
      url
    };

    setLocalConfig(prev => ({
      ...prev,
      websites: [...prev.websites, newSite]
    }));
    
    setNewSiteName('');
    setNewSiteUrl('');
  };

  const removeWebsite = (id: string) => {
    setLocalConfig(prev => ({
      ...prev,
      websites: prev.websites.filter(s => s.id !== id)
    }));
  };

  const saveSettings = () => {
    if (config?.onUpdate) {
      config.onUpdate(localConfig);
    }
    setShowSettings(false);
  };

  const renderContent = () => {
    if (localConfig.websites.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
          <Globe className="h-8 w-8 mb-2 opacity-20" />
          <p className="text-xs">No websites monitored</p>
          <Button 
            variant="link" 
            size="sm" 
            onClick={() => setShowSettings(true)}
            className="text-xs mt-1"
          >
            Add one in settings
          </Button>
        </div>
      );
    }

    return (
      <ScrollArea className="h-full pr-3">
        <div className="space-y-3">
          {localConfig.websites.map((site) => {
            const status = statuses[site.id];
            const domain = new URL(site.url).hostname;
            
            return (
              <div 
                key={site.id} 
                className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50 group"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <img 
                    src={`${FAVICON_SERVICE}${domain}`} 
                    alt="" 
                    className="w-4 h-4 rounded-sm flex-shrink-0"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"%3E%3Ccircle cx="12" cy="12" r="10"/%3E%3Cline x1="2" y1="12" x2="22" y2="12"/%3E%3Cpath d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/%3E%3C/svg%3E';
                    }}
                  />
                  <div className="flex flex-col overflow-hidden">
                    <a 
                      href={site.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm font-medium hover:underline flex items-center gap-1 truncate"
                    >
                      {site.name}
                      <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-50 transition-opacity" />
                    </a>
                    {status?.error && (
                      <span className="text-[10px] text-red-500 truncate font-medium">
                        {status.error}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  {status ? (
                    <>
                      <div className="flex flex-col items-end">
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Clock className="h-2 w-2" />
                          {status.responseTime}ms
                        </span>
                      </div>
                      {status.isOk ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                    </>
                  ) : (
                    <RefreshCw className="h-3 w-3 animate-spin text-muted-foreground opacity-50" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    );
  };

  const renderSettings = () => {
    return (
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Monitor Settings</DialogTitle>
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
              <Label>Websites</Label>
              <div className="flex gap-2">
                <div className="flex-1 space-y-2">
                  <Input 
                    placeholder="Name (e.g. Google)" 
                    value={newSiteName}
                    onChange={(e) => setNewSiteName(e.target.value)}
                    className="h-8 text-xs"
                  />
                  <Input 
                    placeholder="URL (e.g. https://google.com)" 
                    value={newSiteUrl}
                    onChange={(e) => setNewSiteUrl(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
                <Button 
                  size="sm" 
                  onClick={addWebsite}
                  className="self-end h-18"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <div className="mt-3 border rounded-md overflow-hidden bg-muted/20">
                {localConfig.websites.map((site) => (
                  <div key={site.id} className="flex items-center justify-between p-2 text-xs border-b last:border-0">
                    <div className="flex flex-col">
                      <span className="font-medium">{site.name}</span>
                      <span className="text-[10px] text-muted-foreground truncate max-w-[180px]">{site.url}</span>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => removeWebsite(site.id)}
                      className="h-6 w-6 text-red-500 hover:text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
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
        title={localConfig.title || 'Website Monitor'} 
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

export default WebsiteMonitorWidget;
