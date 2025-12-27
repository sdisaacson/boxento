import React, { useState } from 'react';
import { Globe, AlertCircle } from 'lucide-react';
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
import type { IframeWidgetProps } from './types';

const IframeWidget: React.FC<IframeWidgetProps> = ({ config }) => {
  const [showSettings, setShowSettings] = useState(false);
  const [url, setUrl] = useState(config?.url || '');
  const [title, setTitle] = useState(config?.title || '');
  const [inputUrl, setInputUrl] = useState(config?.url || '');
  const [inputTitle, setInputTitle] = useState(config?.title || '');
  const [error, setError] = useState<string | null>(null);

  // Validate URL
  const isValidUrl = (urlString: string): boolean => {
    try {
      const urlObj = new URL(urlString);
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
      return false;
    }
  };

  // Check if URL points to an image
  const isImageUrl = (urlString: string): boolean => {
    const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.bmp', '.ico'];
    try {
      const urlObj = new URL(urlString);
      const pathname = urlObj.pathname.toLowerCase();
      return imageExtensions.some(ext => pathname.endsWith(ext));
    } catch {
      return false;
    }
  };

  // Save settings
  const handleSave = () => {
    const trimmedUrl = inputUrl.trim();

    if (!trimmedUrl) {
      setError('Please enter a URL');
      return;
    }

    if (!isValidUrl(trimmedUrl)) {
      setError('Please enter a valid URL (starting with http:// or https://)');
      return;
    }

    setUrl(trimmedUrl);
    setTitle(inputTitle.trim());
    setError(null);

    if (config?.onUpdate) {
      config.onUpdate({
        ...config,
        url: trimmedUrl,
        title: inputTitle.trim()
      });
    }
    setShowSettings(false);
  };

  // Render setup view when no URL configured
  const renderSetup = () => (
    <div className="h-full flex flex-col items-center justify-center text-center p-4">
      <Globe size={32} className="text-gray-400 mb-3" strokeWidth={1.5} />
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
        Embed external content
      </p>
      <Button size="sm" variant="outline" onClick={() => setShowSettings(true)}>
        Add URL
      </Button>
    </div>
  );

  // Render image (for image URLs)
  const renderImage = () => (
    <div className="h-full w-full flex items-center justify-center">
      <img
        src={url}
        alt={title || 'Embedded image'}
        className="max-w-full max-h-full object-contain"
        loading="lazy"
      />
    </div>
  );

  // Render iframe
  const renderIframe = () => (
    <div className="h-full w-full">
      <iframe
        src={url}
        className="w-full h-full border-0"
        sandbox="allow-scripts allow-same-origin allow-popups"
        loading="lazy"
        title={title || 'Embedded content'}
      />
    </div>
  );

  // Render error state
  const renderError = () => (
    <div className="h-full flex flex-col items-center justify-center text-center p-4">
      <AlertCircle size={32} className="text-red-500 mb-3" strokeWidth={1.5} />
      <p className="text-sm text-red-500 mb-3">Failed to load content</p>
      <Button size="sm" variant="outline" onClick={() => setShowSettings(true)}>
        Settings
      </Button>
    </div>
  );

  // Settings dialog
  const renderSettings = () => (
    <Dialog open={showSettings} onOpenChange={setShowSettings}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Embed URL
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="url">URL</Label>
            <Input
              id="url"
              placeholder="https://example.com/widget"
              value={inputUrl}
              onChange={(e) => {
                setInputUrl(e.target.value);
                setError(null);
              }}
            />
            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Enter the URL from an iframe src attribute
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Title (optional)</Label>
            <Input
              id="title"
              placeholder="Widget title"
              value={inputTitle}
              onChange={(e) => setInputTitle(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <div className="flex justify-between w-full">
            {config?.onDelete && (
              <Button variant="destructive" onClick={config.onDelete}>
                Delete
              </Button>
            )}
            {!config?.onDelete && <div />}
            <Button onClick={handleSave}>
              Save
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  // Main render
  const renderContent = () => {
    if (!url) return renderSetup();
    if (!isValidUrl(url)) return renderError();
    if (isImageUrl(url)) return renderImage();
    return renderIframe();
  };

  return (
    <div className="widget-container h-full flex flex-col">
      <WidgetHeader
        title={title || 'Embed'}
        onSettingsClick={() => setShowSettings(true)}
      />

      <div className="flex-grow overflow-hidden">
        {renderContent()}
      </div>

      {renderSettings()}
    </div>
  );
};

export default IframeWidget;
