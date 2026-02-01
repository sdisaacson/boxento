import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../ui/dialog';
import WidgetHeader from '../common/WidgetHeader';
import type { YouTubeAutoPlayWidgetProps, YouTubeAutoPlayWidgetConfig } from './types';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Switch } from '../../ui/switch';
import { AlertCircle, Youtube } from 'lucide-react';
import { STORAGE_KEYS } from '@/lib/constants';

type YouTubePlayerState = {
  PLAYING: number;
  BUFFERING: number;
};

type YouTubePlayer = {
  destroy: () => void;
  loadVideoById: (args: { videoId: string }) => void;
  playVideo: () => void;
  mute: () => void;
  unMute: () => void;
  getPlayerState?: () => number;
};

type YouTubePlayerConstructor = new (
  element: HTMLElement,
  options: {
    width?: string | number;
    height?: string | number;
    host?: string;
    playerVars?: Record<string, string | number>;
    events?: {
      onReady?: () => void;
      onError?: (e: { data: number }) => void;
    };
  },
) => YouTubePlayer;

type YouTubeIframeApi = {
  Player: YouTubePlayerConstructor;
  PlayerState: YouTubePlayerState;
};

type SharedFavoritesSnapshot = {
  channelIds: string[];
  videosToList?: number;
  updatedAt?: number;
};

type ChannelLatest = {
  channelId: string;
  title?: string;
  publishedAt?: string;
  videoId: string;
  url: string;
};

const readSharedFavorites = (): SharedFavoritesSnapshot | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.YOUTUBE_FAVORITES_SHARED);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SharedFavoritesSnapshot;
    const ids = (parsed.channelIds ?? []).map((v) => String(v).trim()).filter(Boolean);
    if (ids.length === 0) return null;
    return { ...parsed, channelIds: ids };
  } catch {
    return null;
  }
};

const extractVideoIdFromUrl = (url: string): string | null => {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes('youtube.com')) {
      const v = parsed.searchParams.get('v');
      if (v) return v;
    }
    const match = url.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{6,})/);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
};

const isLikelyYouTubeVideoId = (value: string): boolean => /^[a-zA-Z0-9_-]{11}$/.test(value);

const parseYouTubeUploadsFeedCandidates = (xml: string, channelId: string, maxCandidates: number): ChannelLatest[] => {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xml, 'text/xml');
  const entries = Array.from(xmlDoc.querySelectorAll('entry')).slice(0, Math.max(1, maxCandidates));

  return entries
    .map((entry): ChannelLatest | null => {
      const title = entry.querySelector('title')?.textContent?.trim() || undefined;
      const publishedAt = entry.querySelector('published')?.textContent?.trim() || undefined;

      const linkEl = entry.querySelector('link[rel="alternate"]') as Element | null;
      const url = linkEl?.getAttribute('href') || entry.querySelector('link')?.getAttribute('href') || '';
      if (!url) return null;

      const ytVideoId = entry.querySelector('yt\\:videoId, videoId')?.textContent?.trim();
      const extracted = ytVideoId || extractVideoIdFromUrl(url);
      if (!extracted || !isLikelyYouTubeVideoId(extracted)) return null;

      return { channelId, title, publishedAt, videoId: extracted, url };
    })
    .filter((v): v is ChannelLatest => Boolean(v));
};

const fetchLatestForChannel = async (channelId: string): Promise<ChannelLatest | null> => {
  const feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${encodeURIComponent(channelId)}`;
  const corsProxy = 'https://api.allorigins.win/raw?url=';

  const response = await fetch(`${corsProxy}${encodeURIComponent(feedUrl)}`);
  if (!response.ok) throw new Error(`Failed to fetch channel feed: ${response.statusText}`);

  const xml = await response.text();
  // Take a few candidates so we can fall back if the newest upload is private/deleted.
  const candidates = parseYouTubeUploadsFeedCandidates(xml, channelId, 5);
  return candidates[0] ?? null;
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

const buildYouTubeEmbedUrl = (videoId: string, opts: { mute: boolean; showControls: boolean }) => {
  const params = new URLSearchParams();
  params.set('autoplay', '1');
  params.set('mute', opts.mute ? '1' : '0');
  params.set('controls', opts.showControls ? '1' : '0');
  params.set('playsinline', '1');
  params.set('rel', '0');
  params.set('modestbranding', '1');

  // Keep this URL minimal. Some environments/videos can show "player configuration"
  // errors when extra parameters (e.g. enablejsapi/origin/widget_referrer) are present.
  return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}?${params.toString()}`;
};

const ensureYouTubeIframeApi = (): Promise<void> => {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.YT?.Player) return Promise.resolve();

  return new Promise((resolve) => {
    // If another widget already started loading it, just hook into the ready callback.
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (previous) previous();
      resolve();
    };

    const existing = document.querySelector('script[data-yt-iframe-api="true"]');
    if (existing) return;

    const script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    script.async = true;
    script.defer = true;
    script.dataset.ytIframeApi = 'true';
    document.head.appendChild(script);
  });
};

const YouTubeAutoPlayWidget: React.FC<YouTubeAutoPlayWidgetProps> = ({ config }) => {
  const defaultConfig = useMemo<YouTubeAutoPlayWidgetConfig>(
    () => ({
      title: 'YouTube AutoPlay',
      secondsPerVideo: 60,
      mute: true,
      showControls: true,
      loop: true,
      refreshInterval: 10,
    }),
    [],
  );

  const [showSettings, setShowSettings] = useState(false);
  const [localConfig, setLocalConfig] = useState<YouTubeAutoPlayWidgetConfig>({
    ...defaultConfig,
    ...config,
  });

  const [sharedFavorites, setSharedFavorites] = useState<SharedFavoritesSnapshot | null>(null);
  const [playlist, setPlaylist] = useState<ChannelLatest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [currentIndex, setCurrentIndex] = useState(0);

  const playerHostRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<YouTubePlayer | null>(null);
  const [showStartOverlay, setShowStartOverlay] = useState(false);
  const [playerError, setPlayerError] = useState<string | null>(null);

  const iframeKeyRef = useRef<string>('');

  // Keep local config synced
  useEffect(() => {
    setLocalConfig((prev) => ({ ...prev, ...config }));
  }, [config]);

  // Watch for favorites snapshot changes (same tab)
  useEffect(() => {
    const snap = readSharedFavorites();
    setSharedFavorites(snap);

    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEYS.YOUTUBE_FAVORITES_SHARED) {
        setSharedFavorites(readSharedFavorites());
      }
    };

    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const loadPlaylist = React.useCallback(async () => {
    const snap = readSharedFavorites();
    setSharedFavorites(snap);

    if (!snap || !snap.channelIds || snap.channelIds.length === 0) {
      setPlaylist([]);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const results: ChannelLatest[] = [];

      await Promise.all(
        snap.channelIds.map(async (channelId) => {
          try {
            const latest = await fetchLatestForChannel(channelId);
            if (latest) results.push(latest);
          } catch (e) {
            console.error(`Failed to fetch latest video for ${channelId}`, e);
          }
        }),
      );

      // Preserve original channel order as much as possible
      const ordered = snap.channelIds
        .map((id) => results.find((r) => r.channelId === id))
        .filter((v): v is ChannelLatest => Boolean(v));

      setPlaylist(ordered);
      setCurrentIndex(0);
      setIsLoading(false);
    } catch (e) {
      console.error('Error loading playlist:', e);
      setError('Failed to load videos');
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPlaylist();
  }, [loadPlaylist, sharedFavorites?.updatedAt]);

  // Refresh playlist periodically
  useEffect(() => {
    const minutes = Number(localConfig.refreshInterval ?? 10);
    if (minutes <= 0) return;

    const id = window.setInterval(() => {
      loadPlaylist();
    }, minutes * 60 * 1000);

    return () => window.clearInterval(id);
  }, [localConfig.refreshInterval, loadPlaylist]);

  // Rotation timer
  useEffect(() => {
    if (!playlist.length) return;

    const seconds = Math.max(5, Number(localConfig.secondsPerVideo ?? 60));
    const id = window.setInterval(() => {
      setCurrentIndex((prev) => {
        const next = prev + 1;
        if (next < playlist.length) return next;
        return localConfig.loop === false ? prev : 0;
      });
    }, seconds * 1000);

    return () => window.clearInterval(id);
  }, [playlist.length, localConfig.secondsPerVideo, localConfig.loop]);

  const current = playlist[currentIndex];

  const embedUrl = current
    ? buildYouTubeEmbedUrl(current.videoId, {
        mute: localConfig.mute !== false,
        showControls: localConfig.showControls !== false,
      })
    : '';

  // Keep a stable key for diagnostics/UX even though we primarily use the IFrame API.
  const iframeKey = current ? `${current.channelId}-${current.videoId}` : 'empty';
  iframeKeyRef.current = iframeKey;

  const renderEmpty = () => (
    <div className="h-full flex flex-col items-center justify-center text-center p-4">
      <Youtube size={24} className="text-gray-400 mb-3" strokeWidth={1.5} />
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
        Configure and save a YouTube Favorites widget first.
      </p>
      <p className="text-xs text-gray-500 dark:text-gray-400">
        This widget reads channel IDs from the Favorites shared snapshot.
      </p>
    </div>
  );

  const renderError = () => (
    <div className="h-full flex flex-col items-center justify-center text-center p-4">
      <AlertCircle size={24} className="text-red-500 mb-2" strokeWidth={1.5} />
      <div className="text-sm text-red-500 dark:text-red-400 mb-3">{error}</div>
      <Button size="sm" onClick={loadPlaylist}>
        Try Again
      </Button>
    </div>
  );

  const renderLoading = () => (
    <div className="h-full flex items-center justify-center p-4">
      <div className="w-10 h-10 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const renderPlayer = () => {
    if (isLoading) return renderLoading();
    if (error) return renderError();
    if (!sharedFavorites || !sharedFavorites.channelIds?.length) return renderEmpty();
    if (!playlist.length || !current) return renderEmpty();

    return (
      <div className="h-full flex flex-col gap-3 p-2">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-2">
              {current.title ?? 'Latest video'}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Channel: {current.channelId}
              {current.publishedAt ? ` · ${formatDate(current.publishedAt)}` : ''}
            </div>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 shrink-0">
            {currentIndex + 1}/{playlist.length}
          </div>
        </div>

        <div className="flex justify-end">
          <Button size="sm" variant="outline" onClick={() => window.open(current.url, '_blank', 'noopener,noreferrer')}>
            Open on YouTube
          </Button>
        </div>

        <div className="w-full flex-1 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-800 bg-black relative">
          <div className="absolute inset-0" ref={playerHostRef} />

          {showStartOverlay && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 p-4 text-center">
              <div className="text-sm text-white mb-2">Autoplay was blocked by your browser.</div>
              <Button
                size="sm"
                onClick={() => {
                  setShowStartOverlay(false);
                  setPlayerError(null);
                  try {
                    if (localConfig.mute !== false) playerRef.current?.mute();
                    playerRef.current?.playVideo();
                  } catch {
                    // ignore
                  }
                }}
              >
                Start
              </Button>
            </div>
          )}

          {playerError && (
            <div className="absolute bottom-2 left-2 right-2 text-xs text-white bg-black/60 rounded-md px-2 py-1">
              {playerError} · Using fallback: <a className="underline" href={current.url} target="_blank" rel="noopener noreferrer">open on YouTube</a>
            </div>
          )}
        </div>

        <div className="flex justify-between">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setCurrentIndex((i) => (i - 1 + playlist.length) % playlist.length)}
            disabled={playlist.length <= 1}
          >
            Prev
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setCurrentIndex((i) => (i + 1) % playlist.length)}
            disabled={playlist.length <= 1}
          >
            Next
          </Button>
        </div>
      </div>
    );
  };

  // Create/attach the YouTube player once.
  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      if (!playerHostRef.current) return;
      await ensureYouTubeIframeApi();
      if (cancelled) return;

      if (!window.YT?.Player) {
        setPlayerError('YouTube player failed to load');
        return;
      }

      if (playerRef.current) return;

      playerRef.current = new window.YT.Player(playerHostRef.current, {
        width: '100%',
        height: '100%',
        host: 'https://www.youtube-nocookie.com',
        playerVars: {
          autoplay: 1,
          controls: localConfig.showControls !== false ? 1 : 0,
          playsinline: 1,
          rel: 0,
          modestbranding: 1,
        },
        events: {
          onReady: () => {
            try {
              if (localConfig.mute !== false) {
                playerRef.current?.mute();
              } else {
                playerRef.current?.unMute();
              }
            } catch {
              // ignore
            }
          },
          onError: (e: { data: number }) => {
            // YouTube error codes: 2, 5, 100, 101, 150 (embed not allowed)
            setPlayerError(`YouTube player error (${e.data})`);
            // Auto-advance shortly after an error.
            window.setTimeout(() => {
              setCurrentIndex((i) => (playlist.length ? (i + 1) % playlist.length : 0));
            }, 1500);
          },
        },
      });
    };

    init();

    return () => {
      cancelled = true;
      try {
        playerRef.current?.destroy();
      } catch {
        // ignore
      }
      playerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load the current video into the player.
  useEffect(() => {
    const player = playerRef.current;
    if (!player || !current) return;

    setPlayerError(null);
    setShowStartOverlay(false);

    try {
      if (localConfig.mute !== false) player.mute();
      else player.unMute();
    } catch {
      // ignore
    }

    try {
      // Use the API to avoid iframe URL param issues.
      player.loadVideoById({ videoId: current.videoId });
      player.playVideo();
    } catch {
      // Fallback: set iframe src via minimal URL for environments where API fails
      try {
        const iframe = (player as unknown as { getIframe?: () => HTMLIFrameElement }).getIframe?.();
        if (iframe) iframe.src = embedUrl;
      } catch {
        // ignore
      }
    }

    // If autoplay is blocked, the player tends to remain UNSTARTED/PAUSED.
    // After a short grace period, show a Start overlay.
    const t = window.setTimeout(() => {
      try {
        const state = player.getPlayerState?.();
        const playing = window.YT?.PlayerState?.PLAYING;
        const buffering = window.YT?.PlayerState?.BUFFERING;
        if (state !== playing && state !== buffering) {
          setShowStartOverlay(true);
        }
      } catch {
        setShowStartOverlay(true);
      }
    }, 1500);

    return () => window.clearTimeout(t);
  }, [current?.videoId, current?.channelId, embedUrl, localConfig.mute, localConfig.showControls]);

  const saveSettings = () => {
    if (config?.onUpdate && typeof config.onUpdate === 'function') {
      config.onUpdate(localConfig);
    }
    setShowSettings(false);
  };

  const renderSettings = () => (
    <Dialog open={showSettings} onOpenChange={setShowSettings}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>YouTube AutoPlay Settings</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="yta-title">Widget Title</Label>
            <Input
              id="yta-title"
              value={localConfig.title ?? ''}
              onChange={(e) => setLocalConfig({ ...localConfig, title: e.target.value })}
              placeholder="YouTube AutoPlay"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="yta-seconds">Seconds per video</Label>
            <Input
              id="yta-seconds"
              type="number"
              min={5}
              value={String(localConfig.secondsPerVideo ?? 60)}
              onChange={(e) =>
                setLocalConfig({
                  ...localConfig,
                  secondsPerVideo: Number(e.target.value || 60),
                })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">Mute</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Recommended for autoplay</div>
            </div>
            <Switch
              checked={localConfig.mute !== false}
              onCheckedChange={(checked) => setLocalConfig({ ...localConfig, mute: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">Show controls</div>
            </div>
            <Switch
              checked={localConfig.showControls !== false}
              onCheckedChange={(checked) => setLocalConfig({ ...localConfig, showControls: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">Loop</div>
            </div>
            <Switch
              checked={localConfig.loop !== false}
              onCheckedChange={(checked) => setLocalConfig({ ...localConfig, loop: checked })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="yta-refresh">Refresh interval (minutes)</Label>
            <Input
              id="yta-refresh"
              type="number"
              min={0}
              value={String(localConfig.refreshInterval ?? 10)}
              onChange={(e) =>
                setLocalConfig({
                  ...localConfig,
                  refreshInterval: Number(e.target.value || 0),
                })
              }
            />
            <div className="text-xs text-gray-500 dark:text-gray-400">Set to 0 to disable refresh.</div>
          </div>
        </div>

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
    <div className="widget-container h-full flex flex-col relative">
      <WidgetHeader
        title={localConfig.title || defaultConfig.title || 'YouTube AutoPlay'}
        onSettingsClick={() => setShowSettings(true)}
      />

      <div className="flex-1 overflow-hidden">{renderPlayer()}</div>

      {renderSettings()}
    </div>
  );
};

export default YouTubeAutoPlayWidget;

declare global {
  interface Window {
    YT?: YouTubeIframeApi;
    onYouTubeIframeAPIReady?: () => void;
  }
}
