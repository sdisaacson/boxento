import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Sun, AlertCircle, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../../ui/dialog';
import { Input } from '../../ui/input';
import { Button } from '../../ui/button';
import { Label } from '../../ui/label';
import WidgetHeader from '../common/WidgetHeader';
import { MorningBriefWidgetProps, MorningBriefWidgetConfig } from './types';

/**
 * Morning Brief Widget Component
 *
 * Fetches and displays HTML content from a remote URL, typically used for
 * displaying a daily morning brief or summary.
 *
 * @param {MorningBriefWidgetProps} props - Component props
 * @returns {JSX.Element} Widget component
 */
const MorningBriefWidget: React.FC<MorningBriefWidgetProps> = ({ config }) => {
  // Default configuration
  const defaultConfig: MorningBriefWidgetConfig = {
    title: 'Morning Brief',
    url: 'https://storage.sisaacson.io/morning-briefs/morning-brief.html',
  };

  // Component state
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [localConfig, setLocalConfig] = useState<MorningBriefWidgetConfig>({
    ...defaultConfig,
    ...config,
  });
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Refs
  const widgetRef = useRef<HTMLDivElement | null>(null);

  // Get the effective URL
  const url = localConfig.url || defaultConfig.url!;

  /**
   * Fetch HTML content from the configured URL
   */
  const fetchContent = useCallback(async () => {
    if (!url) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
      }
      const html = await response.text();
      setHtmlContent(html);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching morning brief:', err);
      setError(err instanceof Error ? err.message : 'Failed to load content');
    } finally {
      setIsLoading(false);
    }
  }, [url]);

  // Fetch content on mount and when URL changes
  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  // Update local config when props change
  useEffect(() => {
    setLocalConfig((prevConfig) => ({
      ...prevConfig,
      ...config,
    }));
  }, [config]);

  // Save settings
  const saveSettings = () => {
    if (config?.onUpdate) {
      config.onUpdate(localConfig);
    }
    setShowSettings(false);
  };

  // Render loading state
  const renderLoading = () => (
    <div className="h-full flex flex-col items-center justify-center text-center p-4">
      <Loader2 size={32} className="text-blue-500 animate-spin mb-3" strokeWidth={1.5} />
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Loading morning brief...
      </p>
    </div>
  );

  // Render error state
  const renderError = () => (
    <div className="h-full flex flex-col items-center justify-center text-center p-4">
      <AlertCircle size={32} className="text-red-500 mb-3" strokeWidth={1.5} />
      <p className="text-sm text-red-500 dark:text-red-400 mb-2">
        {error}
      </p>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
        Could not load the morning brief from the configured URL.
      </p>
      <div className="flex gap-2">
        <Button size="sm" onClick={fetchContent}>
          Retry
        </Button>
        <Button size="sm" variant="outline" onClick={() => setShowSettings(true)}>
          Settings
        </Button>
      </div>
    </div>
  );

  // Render empty/setup state
  const renderSetup = () => (
    <div className="h-full flex flex-col items-center justify-center text-center p-4">
      <Sun size={32} className="text-amber-500 mb-3" strokeWidth={1.5} />
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
        Configure the Morning Brief widget to display daily updates.
      </p>
      <Button size="sm" variant="outline" onClick={() => setShowSettings(true)}>
        Configure
      </Button>
    </div>
  );

  // Render HTML content in iframe
  const renderContent = () => {
    if (isLoading && !htmlContent) {
      return renderLoading();
    }

    if (error && !htmlContent) {
      return renderError();
    }

    if (!url) {
      return renderSetup();
    }

    return (
      <div className="h-full w-full relative">
        {isLoading && htmlContent && (
          <div className="absolute top-2 right-2 z-10">
            <Loader2 size={16} className="text-blue-500 animate-spin" />
          </div>
        )}
        <iframe
          src={url}
          className="w-full h-full border-0"
          sandbox="allow-scripts allow-same-origin"
          loading="lazy"
          title={localConfig.title || 'Morning Brief'}
        />
      </div>
    );
  };

  // Settings dialog
  const renderSettings = () => (
    <Dialog open={showSettings} onOpenChange={setShowSettings}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sun className="h-5 w-5 text-amber-500" />
            Morning Brief Settings
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Widget Title */}
          <div className="space-y-2">
            <Label htmlFor="title-input">Widget Title</Label>
            <Input
              id="title-input"
              type="text"
              value={localConfig.title || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setLocalConfig({ ...localConfig, title: e.target.value })
              }
              placeholder="Morning Brief"
            />
          </div>

          {/* URL Input */}
          <div className="space-y-2">
            <Label htmlFor="url-input">Content URL</Label>
            <Input
              id="url-input"
              type="url"
              value={localConfig.url || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setLocalConfig({ ...localConfig, url: e.target.value })
              }
              placeholder="https://example.com/morning-brief.html"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              URL to fetch the morning brief HTML content from
            </p>
          </div>

          {lastUpdated && (
            <div className="text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-200 dark:border-gray-700">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </div>
          )}
        </div>

        <DialogFooter>
          <div className="flex justify-between w-full">
            {config?.onDelete && (
              <Button
                variant="destructive"
                onClick={() => {
                  if (config.onDelete) {
                    config.onDelete();
                  }
                }}
                aria-label="Delete this widget"
              >
                Delete
              </Button>
            )}
            <Button variant="default" onClick={saveSettings}>
              Save
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  return (
    <div ref={widgetRef} className="widget-container h-full flex flex-col">
      <WidgetHeader
        title={localConfig.title || defaultConfig.title}
        onSettingsClick={() => setShowSettings(true)}
      />

      <div className="flex-grow overflow-hidden">{renderContent()}</div>

      {renderSettings()}
    </div>
  );
};

export default MorningBriefWidget;
