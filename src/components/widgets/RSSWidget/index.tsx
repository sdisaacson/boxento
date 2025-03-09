import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '../../ui/dialog';
import WidgetHeader from '../common/WidgetHeader';
import { RSSWidgetProps, RSSWidgetConfig, RSSFeedItem, RSSDisplayMode } from './types';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Switch } from '../../ui/switch';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../../ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../ui/tabs';

/**
 * Size categories for widget content rendering
 */
enum WidgetSizeCategory {
  SMALL = 'small',         // 2x2
  WIDE_SMALL = 'wideSmall', // 3x2 
  TALL_SMALL = 'tallSmall', // 2x3
  MEDIUM = 'medium',       // 3x3
  WIDE_MEDIUM = 'wideMedium', // 4x3
  TALL_MEDIUM = 'tallMedium', // 3x4
  LARGE = 'large'          // 4x4
}

/**
 * RSS Widget Component
 * 
 * This widget allows users to view RSS feeds directly on their dashboard.
 * 
 * @param {RSSWidgetProps} props - Component props
 * @returns {JSX.Element} Widget component
 */
const RSSWidget: React.FC<RSSWidgetProps> = ({ width, height, config }) => {
  // Default configuration
  const defaultConfig: RSSWidgetConfig = {
    title: 'RSS Feed',
    feedUrl: '',
    maxItems: 5,
    showImages: true,
    showDate: true,
    showAuthor: true,
    showDescription: true,
    displayMode: RSSDisplayMode.LIST,
    openInNewTab: true
  };

  // Component state
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [localConfig, setLocalConfig] = useState<RSSWidgetConfig>({
    ...defaultConfig,
    ...config
  });
  const [feedItems, setFeedItems] = useState<RSSFeedItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [feedTitle, setFeedTitle] = useState<string>('');
  
  // Refs for the widget container
  const widgetRef = useRef<HTMLDivElement | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Update local config when props config changes
  useEffect(() => {
    setLocalConfig((prevConfig: RSSWidgetConfig) => ({
      ...prevConfig,
      ...config
    }));
  }, [config]);
  
  // Fetch RSS feed when feedUrl changes
  useEffect(() => {
    if (!localConfig.feedUrl) {
      setFeedItems([]);
      setFeedTitle('');
      return;
    }
    
    fetchRSSFeed();
    
    // Cleanup function to abort fetch if component unmounts
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [localConfig.feedUrl]);
  
  /**
   * Fetch and parse RSS feed
   */
  const fetchRSSFeed = async () => {
    const { feedUrl } = localConfig;
    
    if (!feedUrl) return;
    
    // Create abort controller for fetch
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    
    setIsLoading(true);
    setError(null);
    
    try {
      // We need to use a CORS proxy for most RSS feeds
      const corsProxy = 'https://api.allorigins.win/raw?url=';
      const response = await fetch(`${corsProxy}${encodeURIComponent(feedUrl)}`, {
        signal: abortControllerRef.current.signal
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch RSS feed: ${response.statusText}`);
      }
      
      const data = await response.text();
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(data, 'text/xml');
      
      // Extract feed title
      const channelTitle = xmlDoc.querySelector('channel > title')?.textContent || '';
      setFeedTitle(channelTitle);
      
      // Parse items
      const items = Array.from(xmlDoc.querySelectorAll('item')).map(item => {
        // Extract image from media:content, enclosure, or content tags
        let imageUrl = '';
        const mediaContent = item.querySelector('media\\:content, content');
        const enclosure = item.querySelector('enclosure[type^="image"]');
        const content = item.querySelector('content\\:encoded, encoded')?.textContent || '';
        
        if (mediaContent && mediaContent.getAttribute('url')) {
          imageUrl = mediaContent.getAttribute('url') || '';
        } else if (enclosure && enclosure.getAttribute('url')) {
          imageUrl = enclosure.getAttribute('url') || '';
        } else {
          // Try to extract first image from content
          const imgMatch = content.match(/<img[^>]+src="([^">]+)"/i);
          if (imgMatch && imgMatch[1]) {
            imageUrl = imgMatch[1];
          }
        }
        
        return {
          title: item.querySelector('title')?.textContent || 'No Title',
          link: item.querySelector('link')?.textContent || '#',
          description: item.querySelector('description')?.textContent || '',
          content: content,
          pubDate: item.querySelector('pubDate')?.textContent || '',
          author: item.querySelector('author, dc\\:creator')?.textContent || '',
          image: imageUrl
        };
      });
      
      setFeedItems(items.slice(0, localConfig.maxItems || 5));
      setIsLoading(false);
    } catch (error: unknown) {
      // Type guard to check if error is an Error object or AbortError
      if (error instanceof Error) {
        if (error.name !== 'AbortError') {
          console.error('Error fetching RSS feed:', error);
          setError(`Failed to fetch RSS feed: ${error.message}`);
          setIsLoading(false);
        }
      } else {
        // If it's not an Error object, fallback to a generic message
        console.error('Unknown error fetching RSS feed');
        setError('Failed to fetch RSS feed: Unknown error');
        setIsLoading(false);
      }
    }
  };
  
  /**
   * Format publication date
   */
  const formatDate = (dateString: string): string => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString(undefined, { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch (e) {
      return dateString;
    }
  };
  
  /**
   * Truncate text to a certain length
   */
  const truncateText = (text: string, maxLength: number): string => {
    if (!text) return '';
    
    // Remove HTML tags
    const strippedText = text.replace(/<[^>]*>?/gm, '');
    
    if (strippedText.length <= maxLength) return strippedText;
    
    return strippedText.substring(0, maxLength) + '...';
  };
  
  /**
   * Determines the appropriate size category based on width and height
   */
  const getWidgetSizeCategory = (width: number, height: number): WidgetSizeCategory => {
    if (width >= 4 && height >= 4) {
      return WidgetSizeCategory.LARGE;
    } else if (width >= 4 && height >= 3) {
      return WidgetSizeCategory.WIDE_MEDIUM;
    } else if (width >= 3 && height >= 4) {
      return WidgetSizeCategory.TALL_MEDIUM;
    } else if (width >= 3 && height >= 3) {
      return WidgetSizeCategory.MEDIUM;
    } else if (width >= 3 && height >= 2) {
      return WidgetSizeCategory.WIDE_SMALL;
    } else if (width >= 2 && height >= 3) {
      return WidgetSizeCategory.TALL_SMALL;
    } else {
      return WidgetSizeCategory.SMALL;
    }
  };
  
  /**
   * Render feed item as a card
   */
  const renderCard = (item: RSSFeedItem, index: number) => {
    const { showImages, showDate, showAuthor, showDescription, openInNewTab } = localConfig;
    
    return (
      <div key={`${item.link}-${index}`} className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden h-full flex flex-col">
        {showImages && item.image && (
          <div className="h-32 overflow-hidden">
            <img 
              src={item.image} 
              alt={item.title} 
              className="w-full h-full object-cover"
              onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
        )}
        <div className="p-4 flex-grow flex flex-col">
          <a 
            href={item.link} 
            target={openInNewTab ? "_blank" : "_self"} 
            rel="noopener noreferrer"
            className="text-blue-600 dark:text-blue-400 hover:underline font-medium text-sm"
          >
            {truncateText(item.title, 60)}
          </a>
          
          {(showDate || showAuthor) && (
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {showDate && item.pubDate && <span>{formatDate(item.pubDate)}</span>}
              {showDate && showAuthor && item.pubDate && item.author && <span> · </span>}
              {showAuthor && item.author && <span>{item.author}</span>}
            </div>
          )}
          
          {showDescription && item.description && (
            <p className="text-xs text-gray-700 dark:text-gray-300 mt-2 line-clamp-3">
              {truncateText(item.description, 100)}
            </p>
          )}
        </div>
      </div>
    );
  };
  
  /**
   * Render feed item as a list item
   */
  const renderListItem = (item: RSSFeedItem, index: number) => {
    const { showImages, showDate, showAuthor, showDescription, openInNewTab } = localConfig;
    
    return (
      <div key={`${item.link}-${index}`} className="py-3 flex border-b border-gray-200 dark:border-gray-700 last:border-0">
        {showImages && item.image && (
          <div className="w-16 h-16 mr-3 flex-shrink-0 overflow-hidden rounded">
            <img 
              src={item.image} 
              alt={item.title} 
              className="w-full h-full object-cover"
              onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
        )}
        <div className="flex-grow min-w-0">
          <a 
            href={item.link} 
            target={openInNewTab ? "_blank" : "_self"} 
            rel="noopener noreferrer"
            className="text-blue-600 dark:text-blue-400 hover:underline font-medium text-sm"
          >
            {truncateText(item.title, 80)}
          </a>
          
          {(showDate || showAuthor) && (
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {showDate && item.pubDate && <span>{formatDate(item.pubDate)}</span>}
              {showDate && showAuthor && item.pubDate && item.author && <span> · </span>}
              {showAuthor && item.author && <span>{item.author}</span>}
            </div>
          )}
          
          {showDescription && item.description && (
            <p className="text-xs text-gray-700 dark:text-gray-300 mt-1 line-clamp-2">
              {truncateText(item.description, 120)}
            </p>
          )}
        </div>
      </div>
    );
  };
  
  /**
   * Render feed item in compact mode
   */
  const renderCompactItem = (item: RSSFeedItem, index: number) => {
    const { showDate, openInNewTab } = localConfig;
    
    return (
      <div key={`${item.link}-${index}`} className="py-2 flex">
        <div className="mr-2 text-gray-400 dark:text-gray-500">•</div>
        <div className="flex-grow min-w-0">
          <a 
            href={item.link} 
            target={openInNewTab ? "_blank" : "_self"} 
            rel="noopener noreferrer"
            className="text-blue-600 dark:text-blue-400 hover:underline text-xs font-medium truncate block"
          >
            {item.title}
          </a>
          {showDate && item.pubDate && (
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {formatDate(item.pubDate)}
            </div>
          )}
        </div>
      </div>
    );
  };
  
  /**
   * Render empty state when no feed URL is provided
   */
  const renderEmptyState = () => {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-4">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 mb-4">
          <path d="M4 11a9 9 0 0 1 9 9"></path>
          <path d="M4 4a16 16 0 0 1 16 16"></path>
          <circle cx="5" cy="19" r="1"></circle>
        </svg>
        <h3 className="text-lg font-medium">No RSS Feed Configured</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Click the settings icon to add an RSS feed URL
        </p>
        <button 
          onClick={() => setShowSettings(true)} 
          className="mt-4 px-4 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Configure Widget
        </button>
      </div>
    );
  };
  
  /**
   * Render error state
   */
  const renderErrorState = () => {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-4">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500 mb-4">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <h3 className="text-lg font-medium">Error Loading Feed</h3>
        <p className="text-sm text-red-500 dark:text-red-400 mt-1">
          {error}
        </p>
        <div className="flex flex-col space-y-2 mt-4">
          <button 
            onClick={fetchRSSFeed} 
            className="px-4 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Try Again
          </button>
          <button 
            onClick={() => setShowSettings(true)} 
            className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            Change Feed URL
          </button>
        </div>
      </div>
    );
  };
  
  /**
   * Render loading state
   */
  const renderLoadingState = () => {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-4">
        <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Loading RSS feed...
        </p>
      </div>
    );
  };
  
  /**
   * Render feed content
   */
  const renderFeedContent = () => {
    const { displayMode } = localConfig;
    
    if (isLoading) {
      return renderLoadingState();
    }
    
    if (error) {
      return renderErrorState();
    }
    
    if (!localConfig.feedUrl || feedItems.length === 0) {
      return renderEmptyState();
    }
    
    // Determine appropriate display mode based on size and configured preference
    const sizeCategory = getWidgetSizeCategory(width, height);
    let effectiveDisplayMode = displayMode;
    
    // Override display mode for small widgets
    if (sizeCategory === WidgetSizeCategory.SMALL) {
      effectiveDisplayMode = RSSDisplayMode.COMPACT;
    }
    
    // Render based on display mode
    switch (effectiveDisplayMode) {
      case RSSDisplayMode.CARDS:
        return (
          <div className="h-full overflow-auto">
            <div className="grid grid-cols-1 gap-4 p-4">
              {feedItems.map((item, index) => renderCard(item, index))}
            </div>
          </div>
        );
        
      case RSSDisplayMode.COMPACT:
        return (
          <div className="h-full overflow-auto">
            <div className="px-4 py-2">
              {feedItems.map((item, index) => renderCompactItem(item, index))}
            </div>
          </div>
        );
        
      case RSSDisplayMode.LIST:
      default:
        return (
          <div className="h-full overflow-auto">
            <div className="px-4">
              {feedItems.map((item, index) => renderListItem(item, index))}
            </div>
          </div>
        );
    }
  };
  
  /**
   * Render content based on widget size
   */
  const renderContent = () => {
    return renderFeedContent();
  };
  
  /**
   * Save settings
   */
  const saveSettings = () => {
    if (config?.onUpdate) {
      config.onUpdate(localConfig);
    }
    setShowSettings(false);
    
    // If the feed URL changed, fetch the feed
    if (localConfig.feedUrl !== config?.feedUrl) {
      fetchRSSFeed();
    }
  };
  
  /**
   * Validate feed URL
   */
  const validateFeedUrl = (url: string): boolean => {
    if (!url) return true; // Empty URL is allowed
    
    try {
      new URL(url);
      return true;
    } catch (e) {
      return false;
    }
  };
  
  /**
   * Settings dialog
   */
  const renderSettings = () => {
    const [isValidUrl, setIsValidUrl] = useState<boolean>(true);
    const [activeTab, setActiveTab] = useState<string>('content');
    
    return (
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>RSS Feed Settings</DialogTitle>
          </DialogHeader>
          
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="display">Display</TabsTrigger>
              <TabsTrigger value="examples">Examples</TabsTrigger>
            </TabsList>
            
            <TabsContent value="content" className="space-y-4 py-2">
              {/* Widget Title */}
              <div className="space-y-2">
                <Label htmlFor="title-input">Widget Title</Label>
                <Input
                  id="title-input"
                  type="text"
                  value={localConfig.title || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLocalConfig({...localConfig, title: e.target.value})}
                  placeholder="RSS Feed"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Leave empty to use the feed's title
                </p>
              </div>
              
              {/* Feed URL */}
              <div className="space-y-2">
                <Label htmlFor="feed-url-input">RSS Feed URL</Label>
                <Input
                  id="feed-url-input"
                  type="url"
                  value={localConfig.feedUrl || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    const url = e.target.value;
                    setLocalConfig({...localConfig, feedUrl: url});
                    setIsValidUrl(validateFeedUrl(url));
                  }}
                  className={!isValidUrl ? 'border-red-500' : ''}
                  placeholder="https://example.com/rss"
                />
                {!isValidUrl && (
                  <p className="text-xs text-red-500 dark:text-red-400">
                    Please enter a valid URL
                  </p>
                )}
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Enter the URL of the RSS feed you want to display
                </p>
              </div>
              
              {/* Max Items */}
              <div className="space-y-2">
                <Label htmlFor="max-items-input">Maximum Items</Label>
                <Input
                  id="max-items-input"
                  type="number"
                  min="1"
                  max="20"
                  value={localConfig.maxItems || 5}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLocalConfig({...localConfig, maxItems: parseInt(e.target.value) || 5})}
                />
              </div>
            </TabsContent>
            
            <TabsContent value="display" className="space-y-4 py-2">
              {/* Display Mode */}
              <div className="space-y-2">
                <Label>Display Mode</Label>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    type="button"
                    onClick={() => setLocalConfig({...localConfig, displayMode: RSSDisplayMode.LIST})}
                    variant={localConfig.displayMode === RSSDisplayMode.LIST ? "default" : "outline"}
                    size="sm"
                  >
                    List
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setLocalConfig({...localConfig, displayMode: RSSDisplayMode.CARDS})}
                    variant={localConfig.displayMode === RSSDisplayMode.CARDS ? "default" : "outline"}
                    size="sm"
                  >
                    Cards
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setLocalConfig({...localConfig, displayMode: RSSDisplayMode.COMPACT})}
                    variant={localConfig.displayMode === RSSDisplayMode.COMPACT ? "default" : "outline"}
                    size="sm"
                  >
                    Compact
                  </Button>
                </div>
              </div>
              
              <div className="space-y-3">
                <Label>Display Options</Label>
                
                {/* Show Images */}
                <div className="flex items-center justify-between">
                  <Label htmlFor="show-images-toggle" className="flex-1">Show Images</Label>
                  <Switch
                    id="show-images-toggle"
                    checked={localConfig.showImages}
                    onCheckedChange={(checked: boolean) => setLocalConfig({...localConfig, showImages: checked})}
                  />
                </div>
                
                {/* Show Dates */}
                <div className="flex items-center justify-between">
                  <Label htmlFor="show-date-toggle" className="flex-1">Show Publication Dates</Label>
                  <Switch
                    id="show-date-toggle"
                    checked={localConfig.showDate}
                    onCheckedChange={(checked: boolean) => setLocalConfig({...localConfig, showDate: checked})}
                  />
                </div>
                
                {/* Show Authors */}
                <div className="flex items-center justify-between">
                  <Label htmlFor="show-author-toggle" className="flex-1">Show Authors</Label>
                  <Switch
                    id="show-author-toggle"
                    checked={localConfig.showAuthor}
                    onCheckedChange={(checked: boolean) => setLocalConfig({...localConfig, showAuthor: checked})}
                  />
                </div>
                
                {/* Show Descriptions */}
                <div className="flex items-center justify-between">
                  <Label htmlFor="show-description-toggle" className="flex-1">Show Descriptions</Label>
                  <Switch
                    id="show-description-toggle"
                    checked={localConfig.showDescription}
                    onCheckedChange={(checked: boolean) => setLocalConfig({...localConfig, showDescription: checked})}
                  />
                </div>
                
                {/* Open Links in New Tab */}
                <div className="flex items-center justify-between">
                  <Label htmlFor="open-new-tab-toggle" className="flex-1">Open Links in New Tab</Label>
                  <Switch
                    id="open-new-tab-toggle"
                    checked={localConfig.openInNewTab}
                    onCheckedChange={(checked: boolean) => setLocalConfig({...localConfig, openInNewTab: checked})}
                  />
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="examples" className="space-y-4 py-2">
              <p className="text-sm">Click on any example to use it:</p>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                  onClick={() => {
                    setLocalConfig({...localConfig, feedUrl: 'https://news.ycombinator.com/rss'});
                    setIsValidUrl(true);
                    setActiveTab('content');
                  }}
                >
                  <div>
                    <div className="font-medium">Hacker News</div>
                    <div className="text-xs text-muted-foreground truncate">https://news.ycombinator.com/rss</div>
                  </div>
                </Button>
                
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                  onClick={() => {
                    setLocalConfig({...localConfig, feedUrl: 'https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml'});
                    setIsValidUrl(true);
                    setActiveTab('content');
                  }}
                >
                  <div>
                    <div className="font-medium">New York Times</div>
                    <div className="text-xs text-muted-foreground truncate">https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml</div>
                  </div>
                </Button>
                
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                  onClick={() => {
                    setLocalConfig({...localConfig, feedUrl: 'https://www.wired.com/feed/rss'});
                    setIsValidUrl(true);
                    setActiveTab('content');
                  }}
                >
                  <div>
                    <div className="font-medium">Wired</div>
                    <div className="text-xs text-muted-foreground truncate">https://www.wired.com/feed/rss</div>
                  </div>
                </Button>
              </div>
            </TabsContent>
          </Tabs>
          
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
                >
                  Delete Widget
                </Button>
              )}
              
              <Button
                variant="default"
                onClick={() => {
                  saveSettings();
                  setShowSettings(false);
                }}
                disabled={!isValidUrl}
              >
                Save Changes
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  // Main render
  return (
    <div ref={widgetRef} className="widget-container h-full flex flex-col relative">
      <WidgetHeader 
        title={localConfig.title || feedTitle || defaultConfig.title} 
        onSettingsClick={() => setShowSettings(true)}
      />
      
      <div className="flex-grow overflow-hidden">
        {renderContent()}
      </div>
      
      {/* Settings dialog */}
      {renderSettings()}
    </div>
  );
};

export default RSSWidget; 