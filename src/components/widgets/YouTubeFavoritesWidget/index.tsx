import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '../../ui/dialog';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import WidgetHeader from '../common/WidgetHeader';
import type { YouTubeFavoritesWidgetConfig, YouTubeFavoritesWidgetProps, YouTubeFavoritesOrientation } from './types';

type VideoItem = {
  id: string;
  title: string;
  link: string;
  thumbnail: string;
  published: string;
  channelTitle: string;
  channelId: string;
};

type ChannelVideos = {
  channelId: string;
  channelTitle: string;
  videos: VideoItem[];
};

const YouTubeFavoritesWidget: React.FC<YouTubeFavoritesWidgetProps> = ({ width: _width, height, config }) => {
  const defaultConfig: YouTubeFavoritesWidgetConfig = useMemo(() => ({
    title: 'YouTube Favorites',
    channelIds: [],
    videoCount: 6,
    orientation: 'vertical'
  }), []);

  const [showSettings, setShowSettings] = useState(false);
  const [localConfig, setLocalConfig] = useState<YouTubeFavoritesWidgetConfig>({ ...defaultConfig, ...config });
  const [channelVideos, setChannelVideos] = useState<ChannelVideos[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const widgetRef = useRef<HTMLDivElement | null>(null);

  // keep config in sync
  useEffect(() => {
    setLocalConfig(prev => ({ ...prev, ...config }));
  }, [config]);

  const parseFeed = (xmlString: string, channelId: string): ChannelVideos => {
    const parser = new DOMParser();
    const xml = parser.parseFromString(xmlString, 'text/xml');
    const entries = Array.from(xml.querySelectorAll('entry'));
    const channelTitle = xml.querySelector('title')?.textContent || channelId;

    const videos = entries.map(entry => {
      const idText = entry.querySelector('yt\\:videoId, videoId')?.textContent || '';
      const title = entry.querySelector('title')?.textContent || 'Untitled';
      const link = `https://www.youtube.com/watch?v=${idText || ''}`;
      const thumb = entry.querySelector('media\\:thumbnail, thumbnail')?.getAttribute('url') || '';
      const published = entry.querySelector('published')?.textContent || '';
      const author = entry.querySelector('author > name')?.textContent || channelId;

      return {
        id: idText || link,
        title,
        link,
        thumbnail: thumb,
        published,
        channelTitle: author || channelTitle,
        channelId
      };
    });

    return { channelId, channelTitle, videos };
  };

  const fetchChannelFeed = useCallback(async (channelId: string) => {
    const feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
    try {
      const response = await fetch(feedUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch channel ${channelId}`);
      }
      const text = await response.text();
      return parseFeed(text, channelId);
    } catch (err) {
      // Fallback to CORS-friendly proxy
      const proxied = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(feedUrl)}`);
      if (!proxied.ok) {
        throw err;
      }
      const proxiedText = await proxied.text();
      return parseFeed(proxiedText, channelId);
    }
  }, []);

  const loadVideos = useCallback(async () => {
    const channelIds = (localConfig.channelIds || []).map(id => id.trim()).filter(Boolean);
    if (!channelIds.length) {
      setChannelVideos([]);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const limit = localConfig.videoCount && localConfig.videoCount > 0 ? localConfig.videoCount : 6;
      const perChannel = await Promise.all(channelIds.map(fetchChannelFeed));
      const limited = perChannel.map(group => ({
        ...group,
        videos: [...group.videos].sort((a, b) => {
          const aTime = a.published ? new Date(a.published).getTime() : 0;
          const bTime = b.published ? new Date(b.published).getTime() : 0;
          return bTime - aTime;
        }).slice(0, limit)
      }));
      setChannelVideos(limited);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load videos.');
    } finally {
      setIsLoading(false);
    }
  }, [fetchChannelFeed, localConfig.channelIds, localConfig.videoCount]);

  useEffect(() => {
    loadVideos();
  }, [loadVideos]);

  const saveSettings = () => {
    const nextConfig = { ...localConfig };
    if (config?.onUpdate) {
      config.onUpdate(nextConfig);
    }
    setShowSettings(false);
    loadVideos();
  };

  const renderCards = () => {
    const showDate = height >= 2;
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-6 text-sm text-gray-500">
          Loading videos...
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex items-center justify-between gap-2 p-3 rounded-md bg-red-50 border border-red-200 text-sm text-red-700">
          <span>{error}</span>
          <Button size="sm" variant="ghost" onClick={loadVideos}>Retry</Button>
        </div>
      );
    }

    if (!channelVideos.length) {
      return (
        <div className="flex flex-col items-center justify-center py-8 text-center text-sm text-gray-500">
          <p className="font-medium">No videos found</p>
          <p className="text-xs text-gray-400 mt-1">Add channel IDs in settings to see recent uploads.</p>
        </div>
      );
    }

    const renderVideoCard = (video: VideoItem) => (
      <a
        key={video.id}
        href={video.link}
        target="_blank"
        rel="noopener noreferrer"
        className="group block rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 overflow-hidden shadow-sm hover:shadow-md transition-shadow min-w-[220px]"
      >
        {video.thumbnail && (
          <div className="aspect-video overflow-hidden bg-gray-100 dark:bg-gray-900">
            <img
              src={video.thumbnail}
              alt={video.title}
              className="h-full w-full object-cover group-hover:scale-105 transition-transform"
              loading="lazy"
            />
          </div>
        )}
        <div className="p-3 space-y-1">
          <div className="text-xs text-gray-500 truncate">{video.channelTitle}</div>
          <div className="font-medium text-sm line-clamp-2">{video.title}</div>
          {video.published && showDate && (
            <div className="text-xs text-gray-400">
              {new Date(video.published).toLocaleDateString()}
            </div>
          )}
        </div>
      </a>
    );

    if (localConfig.orientation === 'horizontal') {
      return (
        <div className="flex flex-col gap-4">
          {channelVideos.map(group => (
            <div key={group.channelId} className="space-y-2">
              <div className="text-sm font-medium text-gray-700 dark:text-gray-200">{group.channelTitle}</div>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {group.videos.map(renderVideoCard)}
              </div>
            </div>
          ))}
        </div>
      );
    }

    // vertical: each channel as a column
    const columnCount = Math.max(channelVideos.length, 1);
    return (
      <div
        className="grid gap-4"
        style={{ gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))` }}
      >
        {channelVideos.map(group => (
          <div key={group.channelId} className="space-y-2">
            <div className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">{group.channelTitle}</div>
            <div className="grid gap-3">
              {group.videos.map(renderVideoCard)}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderSettings = () => {
    return (
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>YouTube Favorites Settings</DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="content" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="display">Display</TabsTrigger>
            </TabsList>
            <TabsContent value="content" className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title-input">Widget Title</Label>
                <Input
                  id="title-input"
                  value={localConfig.title || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setLocalConfig({ ...localConfig, title: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Channel IDs</Label>
                <div className="space-y-2">
                  {(localConfig.channelIds || []).map((id, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <Input
                        value={id}
                        placeholder="UC_x5XG1OV2P6uZZ5FSM9Ttw"
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          const ids = [...(localConfig.channelIds || [])];
                          ids[idx] = e.target.value;
                          setLocalConfig({ ...localConfig, channelIds: ids });
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          const ids = [...(localConfig.channelIds || [])];
                          ids.splice(idx, 1);
                          setLocalConfig({ ...localConfig, channelIds: ids });
                        }}
                        aria-label="Remove channel"
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      const ids = [...(localConfig.channelIds || [])];
                      ids.push('');
                      setLocalConfig({ ...localConfig, channelIds: ids });
                    }}
                  >
                    Add Channel
                  </Button>
                  <p className="text-xs text-gray-500">Add one or more YouTube channel IDs.</p>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="count-input">Number of Videos</Label>
                <Input
                  id="count-input"
                  type="number"
                  min={1}
                  max={20}
                  value={localConfig.videoCount ?? 6}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setLocalConfig({ ...localConfig, videoCount: parseInt(e.target.value, 10) || 1 })
                  }
                />
              </div>
            </TabsContent>
            <TabsContent value="display" className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Orientation</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant={!localConfig.orientation || localConfig.orientation === 'vertical' ? 'default' : 'outline'}
                    onClick={() => setLocalConfig({ ...localConfig, orientation: 'vertical' as YouTubeFavoritesOrientation })}
                  >
                    Vertical
                  </Button>
                  <Button
                    type="button"
                    variant={localConfig.orientation === 'horizontal' ? 'default' : 'outline'}
                    onClick={() => setLocalConfig({ ...localConfig, orientation: 'horizontal' as YouTubeFavoritesOrientation })}
                  >
                    Horizontal
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
          <DialogFooter>
            <div className="flex justify-between w-full">
              {config?.onDelete && (
                <Button variant="destructive" onClick={() => config.onDelete?.()}>
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
    <div ref={widgetRef} className="widget-container h-full flex flex-col">
      <WidgetHeader
        title={localConfig.title || defaultConfig.title}
        onSettingsClick={() => setShowSettings(true)}
      />
      <div className="flex-1 overflow-hidden p-3">
        {renderCards()}
      </div>
      {renderSettings()}
    </div>
  );
};

export default YouTubeFavoritesWidget;
