import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import WidgetHeader from '../common/WidgetHeader';
import { 
  WebsiteMonitorWidgetProps, 
  WebsiteMonitorWidgetConfig, 
  MonitoredWebsite, 
  WebsiteStatus 
} from './types';

// Use local proxy server (run: node proxy-server.js)
// This avoids CORS issues by routing requests through our own server
const LOCAL_PROXY = 'http://localhost:3001/proxy/';
const FAVICON_SERVICE = 'https://www.google.com/s2/favicons?sz=32&domain=';

const WebsiteMonitorWidget: React.FC<WebsiteMonitorWidgetProps> = ({ width, height: _height, config }) => {
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
  const hasChecked = useRef(false);
  
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
      // Use local proxy server - don't encode the URL, just pass it directly
      const proxyUrl = `${LOCAL_PROXY}${website.url}`;
      
      const response = await fetch(proxyUrl, {
        cache: 'no-store',
        signal: AbortSignal.timeout(15000)
      });
      
      const endTime = performance.now();
      const responseTime = Math.round(endTime - startTime);

      // If we got any response, the website is up
      if (response.status >= 200 && response.status < 500) {
        return {
          isOk: true,
          responseTime,
          lastChecked: Date.now()
        };
      }

      // 5xx errors mean the site is down
      return {
        isOk: false,
        responseTime,
        error: `HTTP ${response.status}`,
        lastChecked: Date.now()
      };
    } catch (error) {
      const endTime = performance.now();
      const errorMessage = error instanceof Error ? error.message : 'Network Error';
      
      if (errorMessage.includes('Failed to fetch') || errorMessage.includes('ECONNREFUSED')) {
        return {
          isOk: false,
          responseTime: Math.round(endTime - startTime),
          error: 'Proxy not running',
          lastChecked: Date.now()
        };
      }

      return {
        isOk: false,
        responseTime: Math.round(endTime - startTime),
        error: errorMessage,
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

  // Check each website only ONCE on initial load (no auto-refresh)
  useEffect(() => {
    // Use ref to ensure we only check once even if component re-renders
    if (!hasChecked.current && localConfig.websites.length > 0) {
      hasChecked.current = true;
      refreshAll();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array = run only once on mount

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

  const renderWebsiteItem = (site: MonitoredWebsite, isHorizontal: boolean) => {
    const status = statuses[site.id];
    const domain = new URL(site.url).hostname;
    
    if (isHorizontal) {
      // Horizontal layout for wide widgets
      return (
        <div 
          key={site.id} 
          className="flex flex-col items-center p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 group"
          style={{ width: '100px', flex: '0 0 auto' }}
        >
          <img 
            src={`${FAVICON_SERVICE}${domain}`} 
            alt="" 
            className="w-6 h-6 rounded-sm mb-2"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"%3E%3Ccircle cx="12" cy="12" r="10"/%3E%3Cline x1="2" y1="12" x2="22" y2="12"/%3E%3Cpath d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/%3E%3C/svg%3E';
            }}
          />
          <a 
            href={site.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-xs font-medium hover:underline text-center truncate w-full mb-1"
          >
            {site.name}
          </a>
          <div className="flex items-center gap-1">
            {status ? (
              <>
                <span className="text-[10px] text-muted-foreground">
                  {status.responseTime}ms
                </span>
                {status.isOk ? (
                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                ) : (
                  <XCircle className="h-3 w-3 text-red-500" />
                )}
              </>
            ) : (
              <RefreshCw className="h-3 w-3 animate-spin text-muted-foreground opacity-50" />
            )}
          </div>
          {status?.error && (
            <span className="text-[9px] text-red-500 truncate w-full text-center mt-1">
              {status.error}
            </span>
          )}
        </div>
      );
    }

    // Vertical layout (default)
    return (
      <div 
        key={site.id} 
        className="flex items-center justify-between p-1.5 rounded bg-gray-50 dark:bg-gray-800/50 group"
      >
        <div className="flex items-center gap-2 overflow-hidden">
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

        <div className="flex items-center gap-2 flex-shrink-0">
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

    const isWide = width >= 4;

    if (isWide) {
      // Horizontal layout for wide widgets - wrap to multiple rows if needed
      return (
        <div className="h-full overflow-y-auto">
          <div className="flex flex-wrap gap-2 content-start">
            {localConfig.websites.map((site) => renderWebsiteItem(site, true))}
          </div>
        </div>
      );
    }

    // Vertical layout for narrow widgets
    return (
      <div className="h-full overflow-y-auto pr-1">
        <div className="space-y-1">
          {localConfig.websites.map((site) => renderWebsiteItem(site, false))}
        </div>
      </div>
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
            <Button onClick={saveSettings}>Save</Button>
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
      
      <div className="flex-grow p-2 overflow-hidden relative">
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
