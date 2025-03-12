import React, { useState, useRef } from 'react'
import { ExternalLink, Plus, Trash, Edit } from 'lucide-react'
import WidgetHeader from '../../widgets/common/WidgetHeader'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '../../ui/dialog'
import { Input } from '@/components/ui/input'
import { QuickLinksWidgetProps, LinkItem } from './types'
import './styles.css'
import { Button } from '../../ui/button'
import { Label } from '../../ui/label'
import { Switch } from '@/components/ui/switch'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'

/**
 * Fetches metadata from a URL including title and favicon
 * @param url The URL to fetch metadata from
 * @returns Promise with title and favicon extracted from favicon
 */
const fetchUrlMetadata = async (url: string): Promise<{ title: string; favicon: string }> => {
  try {
    // Validate and normalize the URL
    const normalizedUrl = url.startsWith('http') ? url : `https://${url}`;
    const urlObj = new URL(normalizedUrl);

    // Get favicon using Google's favicon service (this is CORS allowed)
    const favicon = `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=32`;

    // Extract a reasonable title from the URL if metadata fetching fails
    let extractedTitle = "";
    
    // Try to get a reasonable title from the URL path
    if (urlObj.pathname && urlObj.pathname !== "/") {
      // Remove trailing slash if present
      const path = urlObj.pathname.endsWith('/') 
        ? urlObj.pathname.slice(0, -1) 
        : urlObj.pathname;
      
      // Get last segment of path
      const segments = path.split('/').filter(Boolean);
      if (segments.length > 0) {
        // Get last segment and replace dashes and underscores with spaces
        extractedTitle = segments[segments.length - 1]
          .replace(/[-_]/g, ' ')
          .replace(/\.\w+$/, '') // Remove file extension if present
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
      }
    }

    // If path doesn't provide a good title, use the hostname without TLD
    if (!extractedTitle) {
      // Clean up the hostname to create a reasonable title
      const hostnameWithoutWWW = urlObj.hostname.replace(/^www\./, '');
      const mainDomain = hostnameWithoutWWW.split('.')[0];
      
      // Capitalize first letter and clean up common domain name patterns
      extractedTitle = mainDomain
        .charAt(0).toUpperCase() + mainDomain.slice(1)
        .replace(/-/g, ' '); // Replace hyphens with spaces
    }

    // Try to fetch metadata with multiple fallbacks in parallel with a short timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500); // 2.5 second timeout
    
    try {
      // Try a safe proxy approach - Can be replaced with your own proxy service
      // We'll continue immediately if we get any CORS errors
      
      // Try JSONLink API with the timeout controller
      const jsonLinkPromise = fetch(
        `https://jsonlink.io/api/extract?url=${encodeURIComponent(normalizedUrl)}`, 
        { signal: controller.signal }
      ).then(async response => {
        if (response.ok) {
          const data = await response.json();
          if (data.title) {
            return { 
              title: data.title.trim(),
              favicon 
            };
          }
        }
        throw new Error('JSONLink API failed or returned no title');
      }).catch(error => {
        // Log but don't re-throw, we'll use the fallback
        console.log("JSONLink API failed:", error.message);
        return null;
      });
      
      // Race against a short timeout to avoid hanging
      const result = await Promise.race([
        jsonLinkPromise,
        new Promise<null>(resolve => 
          setTimeout(() => {
            console.log("Metadata fetch timed out");
            resolve(null);
          }, 2000)
        )
      ]);
      
      // If we got metadata successfully, use it
      if (result) {
        clearTimeout(timeoutId);
        return result;
      }
    } catch (error) {
      // Silent catch - we'll use the fallback
      console.log("Metadata fetch failed:", error);
    } finally {
      clearTimeout(timeoutId);
    }
    
    // Return our fallback data - this is guaranteed to work without CORS issues
    return { 
      title: extractedTitle || urlObj.hostname,
      favicon
    };
  } catch (error) {
    console.error('Error in fetchUrlMetadata:', error);
    // Return a basic fallback using the URL's hostname
    try {
      const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
      return {
        title: urlObj.hostname,
        favicon: `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=32`
      };
    } catch {
      // Final fallback if URL parsing also fails
      return {
        title: url,
        favicon: `https://www.google.com/s2/favicons?domain=example.com&sz=32`
      };
    }
  }
};

/**
 * QuickLinks Widget Component
 * 
 * A widget that displays a collection of customizable links for quick access.
 * Supports different layouts based on widget dimensions (minimum size 2x2) and provides a settings
 * interface for adding, editing, and removing links.
 * 
 * @component
 * @param {QuickLinksWidgetProps} props - Component props
 * @returns {JSX.Element} QuickLinks widget component
 */
const QuickLinksWidget: React.FC<QuickLinksWidgetProps> = ({ config }) => {
  const [links, setLinks] = useState<LinkItem[]>(config?.links || []);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [editingLink, setEditingLink] = useState<LinkItem | null>(null);
  const [newLinkUrl, setNewLinkUrl] = useState<string>('');
  const [isLoading] = useState<boolean>(false);
  const newLinkInputRef = useRef<HTMLInputElement | null>(null);
  const widgetRef = useRef<HTMLDivElement | null>(null);
  const [loadingLinkIds, setLoadingLinkIds] = useState<number[]>([]);

  // Widget settings state
  const [displayMode, setDisplayMode] = useState<'regular' | 'compact'>(config?.displayMode || 'regular');
  const [showFavicons, setShowFavicons] = useState<boolean>(config?.showFavicons !== false);
  const [customTitle, setCustomTitle] = useState<string>(config?.customTitle || 'Quick Links');

  // Check if there are any links in the configuration
  React.useEffect(() => {
    if (config?.links) {
      setLinks(config.links);
    }
    if (config?.displayMode) {
      setDisplayMode(config.displayMode);
    }
    if (config?.customTitle) {
      setCustomTitle(config.customTitle);
    }
    if (config?.showFavicons !== undefined) {
      setShowFavicons(config.showFavicons);
    }
  }, [config]);
  
  /**
   * Adds or updates a link in the links collection
   * 
   * If the editingLink has an id, it updates the existing link.
   * Otherwise, it creates a new link with a unique id.
   */
  const addLink = () => {
    if (editingLink && editingLink.title && editingLink.url) {
      let updatedLinks: LinkItem[];

      if (editingLink.id) {
        // Update existing link
        updatedLinks = links.map(link => 
          link.id === editingLink.id ? editingLink : link
        );
      } else {
        // Add new link
        const newId = Math.max(0, ...links.map(link => link.id)) + 1;
        updatedLinks = [...links, { ...editingLink, id: newId }];
      }

      // Update state
      setLinks(updatedLinks);
      
      // Separate the onUpdate to avoid React warnings about updates during render
      // Use setTimeout to ensure it runs after the current render cycle
      if (config && config.onUpdate) {
        const updateFunction = config.onUpdate;
        const configCopy = { ...config };
        
        setTimeout(() => {
          // Create a clean copy of the data to avoid undefined values
          const linksCopy = JSON.parse(JSON.stringify(updatedLinks));
          updateFunction({
            ...configCopy,
            links: linksCopy
          });
        }, 0);
      }
      
      setEditingLink(null);
    }
  }

  /**
   * Removes a link from the links collection
   * 
   * @param {number} id - The id of the link to remove
   */
  const removeLink = (id: number) => {
    const updatedLinks = links.filter(link => link.id !== id);
    
    // Update state
    setLinks(updatedLinks);
    
    // Save using onUpdate callback to persist
    if (config?.onUpdate) {
      config.onUpdate({
        ...config,
        links: updatedLinks
      });
    }
  }

  /**
   * Starts editing a link or creates a new one
   * 
   * @param {LinkItem | null} link - The link to edit, or null to create a new one
   */
  const startEdit = (link: LinkItem | null = null) => {
    setEditingLink(link || { id: 0, title: '', url: '', favicon: '' })
  }

  /**
   * Updates widget settings and saves them
   */
  const saveSettings = () => {
    if (config && config.onUpdate) {
      const updateFunction = config.onUpdate;
      const configCopy = { ...config };
      
      // Use setTimeout to ensure it runs after the current render cycle
      setTimeout(() => {
        // Create a clean copy of the data to avoid undefined values
        const linksCopy = JSON.parse(JSON.stringify(links));
        updateFunction({
          ...configCopy,
          links: linksCopy,
          displayMode,
          showFavicons,
          customTitle
        });
      }, 0);
    }
    setShowSettings(false);
  }

  /**
   * Adds a new link from the quick input
   */
  const handleQuickAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const rawUrl = newLinkUrl.trim();
    if (!rawUrl) return;

    // Generate new ID outside try block
    const newId = Math.max(0, ...links.map(link => link.id)) + 1;

    try {
      // Validate and normalize the URL
      let normalizedUrl = rawUrl;
      if (!rawUrl.match(/^https?:\/\//)) {
        normalizedUrl = `https://${rawUrl}`;
      }

      // Basic URL validation
      try {
        new URL(normalizedUrl);
      } catch (error) {
        console.error('Invalid URL:', error);
        return;
      }

      const urlObj = new URL(normalizedUrl);
      // Add link immediately with basic info
      const newLink: LinkItem = {
        id: newId,
        url: normalizedUrl,
        title: urlObj.hostname,
        favicon: `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=32`
      };

      // Update state and clear input
      setLinks(prev => [...prev, newLink]);
      setNewLinkUrl('');
      setLoadingLinkIds(prev => [...prev, newId]);

      // Focus the input field after adding
      if (newLinkInputRef.current) {
        newLinkInputRef.current.focus();
      }

      // Update config with basic info
      if (config && config.onUpdate) {
        const updateFunction = config.onUpdate;
        const configCopy = { ...config };
        const currentLinks = [...links, newLink];
        
        // Use setTimeout to ensure it runs after the current render cycle
        setTimeout(() => {
          // Create a clean copy of the data to avoid undefined values
          const linksCopy = JSON.parse(JSON.stringify(currentLinks));
          updateFunction({
            ...configCopy,
            links: linksCopy
          });
        }, 0);
      }

      // Fetch metadata asynchronously
      try {
        const metadata = await fetchUrlMetadata(normalizedUrl);
        
        // Only update if the title is different from the hostname
        if (metadata.title !== newLink.title) {
          // Create the enhanced link with metadata
          const finalLink = {
            ...newLink,
            title: metadata.title,
            favicon: metadata.favicon
          };
          
          // Update state with metadata-enhanced link
          setLinks(prev => {
            const updatedLinks = prev.map(link => 
              link.id === newId ? finalLink : link
            );
            return updatedLinks;
          });
          
          // Update config with enhanced metadata - using the current state
          if (config && config.onUpdate) {
            // First get the current links
            const updateFunction = config.onUpdate;
            const configCopy = { ...config };
            
            // Instead of nesting setLinks call, use the updatedLinks directly
            const updatedLinks = [...links];
            const linkIndex = updatedLinks.findIndex(link => link.id === newId);
            if (linkIndex !== -1) {
              updatedLinks[linkIndex] = finalLink;
            }
            
            // Update the config with the latest links array
            // Use setTimeout to defer this update to the next tick
            // This prevents the "Cannot update during render" error
            setTimeout(() => {
              // Create a clean copy of the data to avoid undefined values
              const linksCopy = JSON.parse(JSON.stringify(updatedLinks)); 
              updateFunction({
                ...configCopy,
                links: linksCopy
              });
            }, 0);
            
            // Update state separately
            setLinks(updatedLinks);
          }
        }
      } catch (error) {
        console.error('Error fetching metadata for link:', error);
        // Even if metadata fetching fails, we already saved the basic link info above
        // so the link will still be stored in Firebase with basic info
        
        // Log the current state to help with debugging
        console.log('Link was saved with basic info:', newLink);
        
        // Since we've already saved the basic link info earlier, Firebase should have the data
        // Let's log to help with troubleshooting
        if (config?.links) {
          console.log('Current config links:', config.links.length);
        }
      } finally {
        // Remove loading state regardless of success or failure
        setLoadingLinkIds(prev => prev.filter(id => id !== newId));
      }
    } catch (error) {
      console.error('Error adding link:', error);
    }
  };

  /**
   * Renders the main content of the widget
   */
  const renderContent = () => {
    return (
      <div className="h-full flex flex-col">
        <div className="flex-grow overflow-y-auto">
          {links.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
              <p>No links yet. Add one below!</p>
            </div>
          ) : displayMode === 'compact' ? (
            // Compact view - slim single-column layout with smaller elements
            <div className="space-y-1 pr-1">
              {links.map(link => (
                <a 
                  key={link.id}
                  href={link.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className={`flex items-center p-1 rounded-md hover:bg-gray-50 dark:hover:bg-slate-700 dark:hover:bg-opacity-50 transition-all relative text-gray-800 dark:text-gray-100 group ${
                    loadingLinkIds.includes(link.id) ? 'opacity-50' : ''
                  }`}
                  onClick={(e: React.MouseEvent) => e.stopPropagation()}
                  aria-label={`Visit ${link.title} at ${link.url}`}
                >
                  {showFavicons && (
                    <img 
                      src={link.favicon}
                      alt=""
                      className={`w-3 h-3 mr-1.5 ${
                        loadingLinkIds.includes(link.id) ? 'animate-pulse' : ''
                      }`}
                      loading="lazy"
                    />
                  )}
                  <span className="text-xs font-medium flex-grow truncate">
                    {loadingLinkIds.includes(link.id) ? 'Loading...' : link.title}
                  </span>
                  <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity ml-1">
                    <button 
                      onClick={(e: React.MouseEvent) => {
                        e.preventDefault();
                        e.stopPropagation();
                        startEdit(link);
                      }}
                      className="p-0.5 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                      aria-label={`Edit ${link.title} link`}
                      disabled={loadingLinkIds.includes(link.id)}
                    >
                      <Edit size={10} />
                    </button>
                    <button 
                      onClick={(e: React.MouseEvent) => {
                        e.preventDefault();
                        e.stopPropagation();
                        removeLink(link.id);
                      }}
                      className="p-0.5 text-gray-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400"
                      aria-label={`Remove ${link.title} link`}
                      disabled={loadingLinkIds.includes(link.id)}
                    >
                      <Trash size={10} />
                    </button>
                  </div>
                </a>
              ))}
            </div>
          ) : (
            // Regular view - standard list with normal spacing
            <div className="space-y-2 pr-1">
              {links.map(link => (
                <a 
                  key={link.id}
                  href={link.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className={`flex items-center p-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 dark:hover:bg-opacity-50 transition-all relative text-gray-800 dark:text-gray-100 group ${
                    loadingLinkIds.includes(link.id) ? 'opacity-50' : ''
                  }`}
                  onClick={(e: React.MouseEvent) => e.stopPropagation()}
                  aria-label={`Visit ${link.title} at ${link.url}`}
                >
                  {showFavicons && (
                    <img 
                      src={link.favicon}
                      alt=""
                      className={`w-4 h-4 mr-2.5 ${
                        loadingLinkIds.includes(link.id) ? 'animate-pulse' : ''
                      }`}
                      loading="lazy"
                    />
                  )}
                  <span className="font-medium flex-grow truncate">
                    {loadingLinkIds.includes(link.id) ? 'Loading...' : link.title}
                  </span>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={(e: React.MouseEvent) => {
                        e.preventDefault();
                        e.stopPropagation();
                        startEdit(link);
                      }}
                      className="p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                      aria-label={`Edit ${link.title} link`}
                      disabled={loadingLinkIds.includes(link.id)}
                    >
                      <Edit size={14} />
                    </button>
                    <button 
                      onClick={(e: React.MouseEvent) => {
                        e.preventDefault();
                        e.stopPropagation();
                        removeLink(link.id);
                      }}
                      className="p-1 text-gray-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400"
                      aria-label={`Remove ${link.title} link`}
                      disabled={loadingLinkIds.includes(link.id)}
                    >
                      <Trash size={14} />
                    </button>
                    <ExternalLink size={14} className="text-gray-400" />
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Integrated add link form */}
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <form 
            onSubmit={handleQuickAdd}
            className="flex items-center gap-2"
          >
            <Input
              ref={newLinkInputRef}
              type="url"
              value={newLinkUrl}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewLinkUrl(e.target.value)}
              placeholder="Paste a URL and press Enter..."
              className="flex-grow"
              disabled={isLoading}
            />
            <button
              type="submit"
              className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50"
              disabled={!newLinkUrl.trim() || isLoading}
              aria-label="Add link"
            >
              <Plus size={20} />
            </button>
          </form>
        </div>
      </div>
    );
  };

  return (
    <div 
      ref={widgetRef} 
      className="widget-container quicklinks-widget h-full flex flex-col rounded-lg shadow overflow-hidden"
    >
      <WidgetHeader 
        title={customTitle}
        onSettingsClick={() => setShowSettings(true)}
      />
      <div className="flex-1 overflow-hidden p-3">
        {renderContent()}
      </div>
      
      {/* Settings Dialog */}
      {showSettings && (
        <Dialog
          open={showSettings}
          onOpenChange={(open: boolean) => {
            if (!open) {
              setShowSettings(false);
            }
          }}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Widget Settings</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 mt-2">
              <div className="space-y-2">
                <Label htmlFor="widget-title">Widget Title</Label>
                <Input 
                  id="widget-title"
                  value={customTitle} 
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCustomTitle(e.target.value)}
                  placeholder="Quick Links"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Display Mode</Label>
                <RadioGroup value={displayMode} onValueChange={(val: string) => setDisplayMode(val as 'regular' | 'compact')}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="regular" id="regular-view" />
                    <Label htmlFor="regular-view" className="flex items-center">
                      Regular View
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="compact" id="compact-view" />
                    <Label htmlFor="compact-view" className="flex items-center">
                      Compact View
                    </Label>
                  </div>
                </RadioGroup>
              </div>
              
              <div className="space-y-2">
                <Label>Show Favicons</Label>
                <div className="flex items-center space-x-2">
                  <Switch 
                    checked={showFavicons}
                    onCheckedChange={setShowFavicons}
                    id="show-favicons"
                  />
                  <Label htmlFor="show-favicons">Show website icons</Label>
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <div className="flex justify-between w-full pt-6 border-t border-gray-100 dark:border-gray-800">
                <div>
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
                </div>
                <Button
                  variant="default"
                  onClick={saveSettings}
                >
                  Save Changes
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Edit Link Dialog */}
      {editingLink && (
        <Dialog
          open={true}
          onOpenChange={(open: boolean) => {
            if (!open) {
              setEditingLink(null);
            }
          }}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Link</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <img 
                  src={editingLink.favicon}
                  alt=""
                  className="w-5 h-5"
                  loading="lazy"
                />
                <span className="text-sm text-gray-500 dark:text-gray-400 truncate">
                  {editingLink.url}
                </span>
              </div>

              <div className="space-y-2">
                <Label htmlFor="url-input">URL</Label>
                <Input 
                  id="url-input"
                  type="url" 
                  value={editingLink.url} 
                  onChange={async (e: React.ChangeEvent<HTMLInputElement>) => {
                    const url = e.target.value;
                    
                    try {
                      // Basic URL validation
                      const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
                      const favicon = `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=32`;
                      
                      // Always update with basic info first
                      setEditingLink({
                        ...editingLink, 
                        url, 
                        favicon,
                        // Use hostname as fallback title if no title exists yet
                        title: editingLink.title || urlObj.hostname
                      });
                      
                      if (url && url.match(/^https?:\/\/.+/)) {
                        try {
                          // Try to get enhanced metadata
                          const metadata = await fetchUrlMetadata(url);
                          setEditingLink(prev => ({
                            ...prev!,
                            url,
                            title: metadata.title,
                            favicon
                          }));
                        } catch (error) {
                          console.error('Error fetching URL metadata:', error);
                          // Still update with the basic info
                          setEditingLink(prev => ({
                            ...prev!,
                            url,
                            favicon
                          }));
                        }
                      }
                    } catch (urlError) {
                      // If URL is invalid, just update the URL field without other changes
                      console.warn('Invalid URL format:', urlError);
                      setEditingLink({...editingLink, url});
                    }
                  }}
                  placeholder="https://google.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="title-input">Display Title</Label>
                <Input 
                  id="title-input"
                  type="text" 
                  value={editingLink.title} 
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditingLink({...editingLink, title: e.target.value})}
                  placeholder="Override auto-detected title"
                />
              </div>
            </div>
            <DialogFooter>
              <div className="flex justify-end">
                <Button
                  variant="default"
                  onClick={() => {
                    if (editingLink.url) {
                      addLink();
                      setEditingLink(null);
                    }
                  }}
                  disabled={!editingLink.url}
                >
                  {editingLink.id ? 'Update' : 'Add'}
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

export default QuickLinksWidget 