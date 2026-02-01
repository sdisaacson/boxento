import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../ui/dialog';
import WidgetHeader from '../common/WidgetHeader';
import type { YouTubeFavoritesWidgetProps } from './types';
import {
  type YouTubeFavoriteVideo,
  type YouTubeFavoritesWidgetConfig,
  type YouTubeFavoritesOrientation,
} from './types';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Switch } from '../../ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { AlertCircle, Plus, Trash2, Youtube } from 'lucide-react';
import { STORAGE_KEYS } from '@/lib/constants';

const ITEM_HEIGHT_PX = 84;

/**
 * AutoScrollContainer
 *
 * Uses a float accumulator (`virtualScrollTop`) so fractional deltas aren't lost
 * when browsers treat `scrollTop` as an integer.
 */
const AutoScrollContainer: React.FC<{
  children: React.ReactNode;
  enabled: boolean;
  className?: string;
  style?: React.CSSProperties;
}> = ({ children, enabled, className = '', style }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!enabled || !containerRef.current) return;

    const container = containerRef.current;
    container.scrollTop = 0;

    let animationFrameId = 0;
    let lastTime = 0;
    const speed = 20; // px/s
    let virtualScrollTop = container.scrollTop;

    const scroll = (time: number) => {
      const isHovered = container.matches(':hover');
      const isFocusedWithin = container.contains(document.activeElement);

      if (isHovered || isFocusedWithin) {
        lastTime = time;
        virtualScrollTop = container.scrollTop;
        animationFrameId = requestAnimationFrame(scroll);
        return;
      }

      if (!lastTime) lastTime = time;
      const deltaTime = time - lastTime;
      lastTime = time;

      const firstChild = container.firstElementChild as HTMLElement | null;
      const loopHeight = firstChild?.scrollHeight ?? 0;
      const canScroll = loopHeight > container.clientHeight + 1;

      if (!canScroll) {
        virtualScrollTop = 0;
        container.scrollTop = 0;
        animationFrameId = requestAnimationFrame(scroll);
        return;
      }

      const moveAmount = (speed * deltaTime) / 1000;
      virtualScrollTop += moveAmount;
      container.scrollTop = virtualScrollTop;

      if (virtualScrollTop >= loopHeight) {
        virtualScrollTop -= loopHeight;
        container.scrollTop = virtualScrollTop;
      }

      animationFrameId = requestAnimationFrame(scroll);
    };

    animationFrameId = requestAnimationFrame(scroll);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [enabled, children]);

  if (!enabled) {
    return (
      <div className={`overflow-y-auto ${className}`} style={style}>
        {children}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`overflow-y-auto overflow-x-hidden ${className}`}
      style={style}
    >
      <div>{children}</div>
      <div>{children}</div>
    </div>
  );
};

const normalizeChannelId = (value: string): string => value.trim();

const extractVideoIdFromUrl = (url: string): string | null => {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes('youtube.com')) {
      const v = parsed.searchParams.get('v');
      if (v) return v;
    }

    // RSS feeds often include youtu.be or other formats
    const match = url.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{6,})/);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
};

const parseYouTubeUploadsFeed = (xml: string, channelId: string): YouTubeFavoriteVideo[] => {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xml, 'text/xml');

  const feedTitle = xmlDoc.querySelector('feed > title')?.textContent?.trim() || undefined;

  const entries = Array.from(xmlDoc.querySelectorAll('entry'));
  return entries
    .map((entry): YouTubeFavoriteVideo | null => {
      const title = entry.querySelector('title')?.textContent?.trim() || 'Untitled';

      const linkEl = entry.querySelector('link[rel="alternate"]') as Element | null;
      const url = linkEl?.getAttribute('href') || entry.querySelector('link')?.getAttribute('href') || '';

      const ytVideoId = entry.querySelector('yt\\:videoId, videoId')?.textContent?.trim();
      const videoId = ytVideoId || (url ? extractVideoIdFromUrl(url) : null);
      if (!videoId || !url) return null;

      const publishedAt = entry.querySelector('published')?.textContent?.trim() || undefined;
      const channelTitle =
        entry.querySelector('author > name')?.textContent?.trim() || feedTitle;

      const thumbEl = entry.querySelector('media\\:thumbnail, thumbnail') as Element | null;
      const thumbnailUrl = thumbEl?.getAttribute('url') || undefined;

      return {
        videoId,
        title,
        url,
        publishedAt,
        channelId,
        channelTitle,
        thumbnailUrl,
      };
    })
    .filter((v): v is YouTubeFavoriteVideo => Boolean(v));
};

const formatDate = (dateString?: string): string => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateString;
  }
};

const YouTubeFavoritesWidget: React.FC<YouTubeFavoritesWidgetProps> = ({ config }) => {
  const defaultConfig = useMemo<YouTubeFavoritesWidgetConfig>(
    () => ({
      title: 'YouTube Favorites',
      channelIds: [],
      videosToDisplay: 4,
      videosToList: 12,
      orientation: 'horizontal',
      autoScroll: false,
      openInNewTab: true,
      refreshInterval: 30,
    }),
    [],
  );

  const [showSettings, setShowSettings] = useState(false);
  const [localConfig, setLocalConfig] = useState<YouTubeFavoritesWidgetConfig>({
    ...defaultConfig,
    ...config,
    channelIds: config?.channelIds ?? defaultConfig.channelIds,
  });

  const [activeTab, setActiveTab] = useState<string>('content');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [videosByChannel, setVideosByChannel] = useState<Record<string, YouTubeFavoriteVideo[]>>({});

  const widgetRef = useRef<HTMLDivElement | null>(null);
  const contentAreaRef = useRef<HTMLDivElement | null>(null);
  const [measuredContentHeight, setMeasuredContentHeight] = useState<number | null>(null);

  // Keep local config synced
  useEffect(() => {
    setLocalConfig(prev => ({
      ...prev,
      ...config,
      channelIds: (config?.channelIds ?? prev.channelIds ?? defaultConfig.channelIds) as string[],
    }));
  }, [config, defaultConfig.channelIds]);

  // Measure content area height so we can approximate a "videos to display" viewport.
  useLayoutEffect(() => {
    if (!contentAreaRef.current) return;

    const el = contentAreaRef.current;
    const update = () => setMeasuredContentHeight(el.clientHeight);
    update();

    const ro = new ResizeObserver(() => update());
    ro.observe(el);

    return () => ro.disconnect();
  }, []);

  const fetchChannelVideos = React.useCallback(
    async (channelId: string, limit: number): Promise<YouTubeFavoriteVideo[]> => {
      const feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${encodeURIComponent(channelId)}`;
      const corsProxy = 'https://api.allorigins.win/raw?url=';

      const response = await fetch(`${corsProxy}${encodeURIComponent(feedUrl)}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch channel feed: ${response.statusText}`);
      }

      const xml = await response.text();
      const items = parseYouTubeUploadsFeed(xml, channelId);
      return items.slice(0, Math.max(1, limit));
    },
    [],
  );

  const fetchAllChannels = React.useCallback(
    async (configToUse?: YouTubeFavoritesWidgetConfig) => {
      const currentConfig = configToUse ?? localConfig;

      const channelIds = (currentConfig.channelIds ?? []).map(normalizeChannelId).filter(Boolean);
      if (channelIds.length === 0) {
        setVideosByChannel({});
        setError(null);
        return;
      }

      setIsLoading(true);
      setError(null);

      const videosToList = Math.max(1, Number(currentConfig.videosToList ?? 12));

      try {
        const results: Record<string, YouTubeFavoriteVideo[]> = {};

        await Promise.all(
          channelIds.map(async (id) => {
            try {
              results[id] = await fetchChannelVideos(id, videosToList);
            } catch (e) {
              console.error(`Error fetching YouTube channel ${id}:`, e);
              results[id] = [];
            }
          }),
        );

        setVideosByChannel(results);
        setIsLoading(false);
      } catch (e) {
        console.error('Error fetching YouTube channel feeds:', e);
        setError('Failed to fetch YouTube channel feeds');
        setIsLoading(false);
      }
    },
    [localConfig, fetchChannelVideos],
  );

  // Fetch when channel list changes
  useEffect(() => {
    fetchAllChannels();
  }, [localConfig.channelIds, localConfig.videosToList, fetchAllChannels]);

  // Auto-refresh
  useEffect(() => {
    const intervalMinutes = localConfig.refreshInterval ?? 30;
    if (intervalMinutes <= 0) return;

    const id = window.setInterval(() => {
      fetchAllChannels();
    }, intervalMinutes * 60 * 1000);

    return () => window.clearInterval(id);
  }, [localConfig.refreshInterval, fetchAllChannels]);

  const mergedVideos = useMemo(() => {
    const all = Object.values(videosByChannel).flat();
    return all.sort((a, b) => {
      const ta = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
      const tb = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
      return tb - ta;
    });
  }, [videosByChannel]);

  const viewportHeightPx = useMemo(() => {
    const desiredCount = Math.max(1, Number(localConfig.videosToDisplay ?? 4));
    const desired = desiredCount * ITEM_HEIGHT_PX;
    if (!measuredContentHeight) return desired;
    return Math.min(measuredContentHeight, desired);
  }, [localConfig.videosToDisplay, measuredContentHeight]);

  const renderVideoRow = (video: YouTubeFavoriteVideo) => {
    const target = localConfig.openInNewTab ? '_blank' : '_self';

    return (
      <a
        key={`${video.channelId}-${video.videoId}`}
        href={video.url}
        target={target}
        rel="noopener noreferrer"
        className="flex gap-3 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950/50 p-2 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
        style={{ height: ITEM_HEIGHT_PX }}
      >
        <div className="w-30 h-full shrink-0 overflow-hidden rounded-md bg-gray-100 dark:bg-gray-900">
          {video.thumbnailUrl ? (
            <img
              src={video.thumbnailUrl}
              alt={video.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <Youtube size={18} />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1 flex flex-col justify-between">
          <div className="min-w-0">
            <div className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-2">
              {video.title}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
              {video.channelTitle ?? video.channelId}
            </div>
          </div>
          {video.publishedAt && (
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {formatDate(video.publishedAt)}
            </div>
          )}
        </div>
      </a>
    );
  };

  const renderLoading = () => (
    <div className="h-full flex items-center justify-center text-center p-4">
      <div className="w-10 h-10 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const renderError = () => (
    <div className="h-full flex flex-col items-center justify-center text-center p-4">
      <AlertCircle size={24} className="text-red-500 mb-2" strokeWidth={1.5} />
      <div className="text-sm text-red-500 dark:text-red-400 mb-3">{error}</div>
      <Button size="sm" onClick={() => fetchAllChannels()}>
        Try Again
      </Button>
    </div>
  );

  const renderEmpty = () => (
    <div className="h-full flex flex-col items-center justify-center text-center p-4">
      <Youtube size={24} className="text-gray-400 mb-3" strokeWidth={1.5} />
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">No channels configured.</p>
      <Button size="sm" variant="outline" onClick={() => setShowSettings(true)}>
        Configure Widget
      </Button>
    </div>
  );

  const renderContent = () => {
    if (isLoading) return renderLoading();
    if (error) return renderError();

    const channelIds = (localConfig.channelIds ?? []).map(normalizeChannelId).filter(Boolean);
    if (channelIds.length === 0) return renderEmpty();

    const orientation: YouTubeFavoritesOrientation = localConfig.orientation ?? 'horizontal';

    if (orientation === 'horizontal') {
      const columns = Math.min(4, Math.max(1, channelIds.length));

      return (
        <div className="h-full overflow-y-auto overflow-x-hidden">
          <div
            className="grid gap-4"
            style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
          >
            {channelIds.map((id) => {
              const items = videosByChannel[id] ?? [];
              if (items.length === 0) return null;

              const title = items[0]?.channelTitle ?? id;

              return (
                <div
                  key={id}
                  className="flex flex-col border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-gray-950/50 shadow-sm overflow-hidden"
                >
                  <div className="p-3 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 font-medium text-sm truncate shrink-0">
                    {title}
                  </div>

                  <div className="p-3">
                    <AutoScrollContainer
                      enabled={!!localConfig.autoScroll}
                      className="w-full"
                      style={{ height: viewportHeightPx }}
                    >
                      <div className="space-y-2">
                        {items.map(renderVideoRow)}
                      </div>
                    </AutoScrollContainer>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    // Vertical: merged list
    const list = mergedVideos;

    return (
      <div className="h-full">
        <AutoScrollContainer enabled={!!localConfig.autoScroll} style={{ height: viewportHeightPx }}>
          <div className="space-y-2 pr-1">{list.map(renderVideoRow)}</div>
        </AutoScrollContainer>
      </div>
    );
  };

  const saveSettings = () => {
    if (config?.onUpdate && typeof config.onUpdate === 'function') {
      config.onUpdate(localConfig);
    }

    // Persist a small shared snapshot so companion widgets (e.g. YouTube AutoPlay)
    // can reference the same channel list without needing direct widget-instance wiring.
    try {
      const shared = {
        channelIds: (localConfig.channelIds ?? []).map((v) => v.trim()).filter(Boolean),
        videosToList: Number(localConfig.videosToList ?? 12),
        updatedAt: Date.now(),
      };
      localStorage.setItem(STORAGE_KEYS.YOUTUBE_FAVORITES_SHARED, JSON.stringify(shared));
    } catch (e) {
      console.warn('Failed to persist YouTube Favorites shared config', e);
    }

    setShowSettings(false);
    fetchAllChannels(localConfig);
  };

  const addChannelId = () => {
    setLocalConfig(prev => ({
      ...prev,
      channelIds: [...(prev.channelIds ?? []), ''],
    }));
  };

  const updateChannelId = (index: number, value: string) => {
    setLocalConfig(prev => {
      const next = [...(prev.channelIds ?? [])];
      next[index] = value;
      return { ...prev, channelIds: next };
    });
  };

  const removeChannelId = (index: number) => {
    setLocalConfig(prev => {
      const next = [...(prev.channelIds ?? [])];
      next.splice(index, 1);
      return { ...prev, channelIds: next };
    });
  };

  const renderSettings = () => (
    <Dialog open={showSettings} onOpenChange={setShowSettings}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>YouTube Favorites Settings</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="display">Display</TabsTrigger>
          </TabsList>

          <TabsContent value="content" className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="ytfav-title">Widget Title</Label>
              <Input
                id="ytfav-title"
                value={localConfig.title ?? ''}
                onChange={(e) => setLocalConfig({ ...localConfig, title: e.target.value })}
                placeholder="YouTube Favorites"
              />
            </div>

            <div className="space-y-2">
              <Label>Channel IDs</Label>
              <div className="space-y-2">
                {(localConfig.channelIds ?? []).length === 0 ? (
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Add one or more YouTube channel IDs (example: UC_x5XG1OV2P6uZZ5FSM9Ttw).
                  </div>
                ) : null}

                {(localConfig.channelIds ?? []).map((id, idx) => (
                  <div key={idx} className="flex gap-2">
                    <Input
                      value={id}
                      onChange={(e) => updateChannelId(idx, e.target.value)}
                      placeholder="Channel ID"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => removeChannelId(idx)}
                      aria-label="Remove channel"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                ))}

                <Button type="button" variant="outline" onClick={addChannelId} className="w-full">
                  <Plus size={16} className="mr-2" />
                  Add Channel
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="ytfav-display">Videos to display</Label>
                <Input
                  id="ytfav-display"
                  type="number"
                  min={1}
                  value={String(localConfig.videosToDisplay ?? 4)}
                  onChange={(e) =>
                    setLocalConfig({
                      ...localConfig,
                      videosToDisplay: Number(e.target.value || 1),
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ytfav-list">Videos to list</Label>
                <Input
                  id="ytfav-list"
                  type="number"
                  min={1}
                  value={String(localConfig.videosToList ?? 12)}
                  onChange={(e) =>
                    setLocalConfig({
                      ...localConfig,
                      videosToList: Number(e.target.value || 1),
                    })
                  }
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="display" className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Orientation</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={(localConfig.orientation ?? 'horizontal') === 'horizontal' ? 'default' : 'outline'}
                  onClick={() => setLocalConfig({ ...localConfig, orientation: 'horizontal' })}
                >
                  Horizontal
                </Button>
                <Button
                  type="button"
                  variant={(localConfig.orientation ?? 'horizontal') === 'vertical' ? 'default' : 'outline'}
                  onClick={() => setLocalConfig({ ...localConfig, orientation: 'vertical' })}
                >
                  Vertical
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">Auto scroll</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Pauses on hover</div>
              </div>
              <Switch
                checked={!!localConfig.autoScroll}
                onCheckedChange={(checked) => setLocalConfig({ ...localConfig, autoScroll: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">Open in new tab</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Open video links externally</div>
              </div>
              <Switch
                checked={localConfig.openInNewTab !== false}
                onCheckedChange={(checked) => setLocalConfig({ ...localConfig, openInNewTab: checked })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ytfav-refresh">Refresh interval (minutes)</Label>
              <Input
                id="ytfav-refresh"
                type="number"
                min={0}
                value={String(localConfig.refreshInterval ?? 30)}
                onChange={(e) =>
                  setLocalConfig({
                    ...localConfig,
                    refreshInterval: Number(e.target.value || 0),
                  })
                }
              />
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Set to 0 to disable auto-refresh.
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <div className="flex justify-between w-full">
            {config?.onDelete ? (
              <Button
                variant="destructive"
                onClick={() => {
                  if (config.onDelete) config.onDelete();
                }}
              >
                Delete Widget
              </Button>
            ) : (
              <div />
            )}

            <Button onClick={saveSettings}>Save</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  return (
    <div ref={widgetRef} className="widget-container h-full flex flex-col relative">
      <WidgetHeader title={localConfig.title || defaultConfig.title || 'YouTube Favorites'} onSettingsClick={() => setShowSettings(true)} />

      <div ref={contentAreaRef} className="flex-1 overflow-hidden">
        {renderContent()}
      </div>

      {renderSettings()}
    </div>
  );
};

export default YouTubeFavoritesWidget;
