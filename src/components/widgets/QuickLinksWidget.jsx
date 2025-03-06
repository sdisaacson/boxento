import { useState, useEffect, useRef } from 'react'
import { Link, ExternalLink, Plus, X, Trash, Edit, CircleDot } from 'lucide-react'
import { createPortal } from 'react-dom'
import WidgetHeader from '../ui/WidgetHeader'

const QuickLinksWidget = ({ width, height, config }) => {
  const [links, setLinks] = useState(config?.links || [
    { id: 1, title: 'Google', url: 'https://google.com', color: '#EA4335' },
    { id: 2, title: 'GitHub', url: 'https://github.com', color: '#171515' },
    { id: 3, title: 'YouTube', url: 'https://youtube.com', color: '#FF0000' }
  ])
  const [showSettings, setShowSettings] = useState(false)
  const [editingLink, setEditingLink] = useState(null)
  const settingsRef = useRef(null)
  const settingsButtonRef = useRef(null)
  const widgetRef = useRef(null)
  
  // No need for click outside handler as the modal backdrop handles this
  
  const addLink = () => {
    if (editingLink && editingLink.title && editingLink.url) {
      if (editingLink.id) {
        // Update existing link
        setLinks(links.map(link => 
          link.id === editingLink.id ? editingLink : link
        ))
      } else {
        // Add new link
        const newId = Math.max(0, ...links.map(link => link.id)) + 1
        setLinks([...links, { ...editingLink, id: newId }])
      }
      setEditingLink(null)
    }
  }
  
  const removeLink = (id) => {
    setLinks(links.filter(link => link.id !== id))
  }
  
  const startEdit = (link = null) => {
    setEditingLink(link || { title: '', url: '', color: '#3B82F6' })
  }
  
  useEffect(() => {
    // Save links to localStorage whenever they change
    if (links.length) {
      localStorage.setItem(`quicklinks-${config.id}`, JSON.stringify(links));
    }
  }, [links, config.id]);
  
  const renderLinks = (maxLinks) => {
    const displayLinks = links.slice(0, maxLinks);
    
    return displayLinks.map(link => (
      <a
        key={link.id}
        href={link.url}
        target="_blank"
        rel="noopener noreferrer" 
        className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        style={{
          borderLeft: `3px solid ${link.color || '#3B82F6'}`,
          marginBottom: '2px'
        }}
      >
        {link.icon && (
          <img src={link.icon} alt="" className="w-5 h-5" />
        )}
        <span className="truncate font-medium">{link.title}</span>
      </a>
    ));
  };

  // Render different views based on widget size
  const renderContent = () => {
    // Check for different size combinations
    if (width === 2 && height === 2) {
      return renderDefaultView(); // 2x2 default view
    } else if (width > 2 && height === 2) {
      return renderWideView(); // Wide view (e.g., 4x2)
    } else if (width === 2 && height > 2) {
      return renderTallView(); // Tall view (e.g., 2x4)
    } else {
      return renderFullView(); // Large view (e.g., 4x4, 6x6)
    }
  };

  // Default view for 2x2 layout
  const renderDefaultView = () => {
    return (
      <div className="h-full overflow-auto py-1">
        <div className="flex flex-col">
          {renderLinks(4)}
        </div>
        {links.length < 1 && (
          <div className="h-full flex items-center justify-center text-gray-400 text-sm">
            No links added yet
          </div>
        )}
        {links.length > 0 && links.length < 4 && (
          <button 
            onClick={() => startEdit()} 
            className="mt-2 w-full p-2 text-sm text-center text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
          >
            Add Link
          </button>
        )}
      </div>
    );
  };

  // Wide view for layouts like 4x2, 6x2
  const renderWideView = () => {
    // Determine number of columns based on width
    const columns = width <= 4 ? 4 : 6;
    const maxLinks = columns * 2;
    
    return (
      <div className="h-full overflow-auto">
        <div className={`grid grid-cols-${columns} gap-2`}>
          {renderLinks(maxLinks)}
        </div>
        {links.length < 1 && (
          <div className="h-full flex items-center justify-center text-gray-400 text-sm">
            No links added yet
          </div>
        )}
        {links.length > 0 && links.length < maxLinks && (
          <button 
            onClick={() => startEdit()} 
            className="mt-2 w-full p-2 text-sm text-center text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
          >
            Add Link
          </button>
        )}
      </div>
    );
  };

  // Tall view for layouts like 2x4, 2x6
  const renderTallView = () => {
    // Calculate how many links we can show based on height
    const maxLinks = height * 4;
    
    return (
      <div className="h-full overflow-auto">
        <div className="grid grid-cols-2 gap-2">
          {renderLinks(maxLinks)}
        </div>
        {links.length < 1 && (
          <div className="h-full flex items-center justify-center text-gray-400 text-sm">
            No links added yet
          </div>
        )}
        {links.length > 0 && links.length < maxLinks && (
          <button 
            onClick={() => startEdit()} 
            className="mt-2 w-full p-2 text-sm text-center text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
          >
            Add Link
          </button>
        )}
      </div>
    );
  };

  // Full view for larger layouts
  const renderFullView = () => {
    // For full view, we'll show a grid layout with larger icons and more details
    // Calculate columns based on width - at least 3 for width >= 4
    const columns = width >= 4 ? Math.min(width, 5) : 3;
    
    return (
      <div className="h-full overflow-auto">
        <div className={`grid grid-cols-${columns} gap-3 p-1`}>
          {links.map(link => (
            <a
              key={link.id}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer" 
              className="flex flex-col items-center p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              style={{
                borderTop: `3px solid ${link.color || '#3B82F6'}`
              }}
            >
              {link.icon ? (
                <img src={link.icon} alt="" className="w-10 h-10 mb-2" />
              ) : (
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center mb-2"
                  style={{ backgroundColor: link.color || '#3B82F6' }}
                >
                  <span className="text-white font-bold">{link.title.charAt(0).toUpperCase()}</span>
                </div>
              )}
              <span className="text-center font-medium truncate w-full">{link.title}</span>
            </a>
          ))}
          
          <button 
            onClick={() => startEdit()} 
            className="flex flex-col items-center justify-center p-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors h-full min-h-[100px]"
          >
            <span className="text-3xl text-gray-400 mb-1">+</span>
            <span className="text-sm text-gray-500">Add Link</span>
          </button>
        </div>
      </div>
    );
  };
  
  const renderSettings = () => {
    if (!showSettings) return null;
    
    return createPortal(
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]"
        onClick={() => setShowSettings(false)}
      >
        <div 
          ref={settingsRef}
          className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96 shadow-lg max-w-[90vw] max-h-[90vh] overflow-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Quick Links Settings</h3>
            <button 
              onClick={() => setShowSettings(false)}
              className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              <X size={20} />
            </button>
          </div>
          
          {editingLink ? (
            <div className="mb-4 p-2 bg-gray-100 dark:bg-gray-700 rounded">
              <div className="mb-2">
                <label className="block text-sm mb-1">Title</label>
                <input
                  type="text"
                  className="w-full p-2 text-sm bg-white dark:bg-gray-600 rounded border border-gray-300 dark:border-gray-600"
                  value={editingLink.title}
                  onChange={(e) => setEditingLink({...editingLink, title: e.target.value})}
                  placeholder="e.g. Google"
                />
              </div>
              <div className="mb-2">
                <label className="block text-sm mb-1">URL</label>
                <input
                  type="text"
                  className="w-full p-2 text-sm bg-white dark:bg-gray-600 rounded border border-gray-300 dark:border-gray-600"
                  value={editingLink.url}
                  onChange={(e) => setEditingLink({...editingLink, url: e.target.value})}
                  placeholder="e.g. https://google.com"
                />
              </div>
              <div className="mb-2">
                <label className="block text-sm mb-1">Color</label>
                <input
                  type="color"
                  className="w-full p-0 h-8 rounded border border-gray-300 dark:border-gray-600"
                  value={editingLink.color}
                  onChange={(e) => setEditingLink({...editingLink, color: e.target.value})}
                />
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  onClick={addLink}
                  className="px-4 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  {editingLink.id ? 'Update' : 'Add'}
                </button>
                <button
                  onClick={() => setEditingLink(null)}
                  className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-4 max-h-60 overflow-y-auto">
                {links.map(link => (
                  <div key={link.id} className="flex justify-between items-center py-2 border-b dark:border-gray-700 last:border-b-0">
                    <div className="flex items-center">
                      <div 
                        className="w-4 h-4 rounded-full mr-2"
                        style={{ backgroundColor: link.color }}
                      ></div>
                      <div className="text-sm">{link.title}</div>
                    </div>
                    <div className="flex">
                      <button
                        onClick={() => startEdit(link)}
                        className="text-gray-500 hover:text-gray-700 p-1"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => removeLink(link.id)}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <Trash size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              
              <button
                onClick={() => startEdit()}
                className="flex items-center gap-1 text-sm text-blue-500 hover:text-blue-700 mb-4"
              >
                <Plus size={16} /> Add Link
              </button>
            </>
          )}
          
          <div className="flex justify-end mt-4">
            <button 
              onClick={() => setShowSettings(false)}
              className="px-4 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Close
            </button>
          </div>
        </div>
      </div>,
      document.body
    );
  }
  
  return (
    <div ref={widgetRef} className="widget-container h-full flex flex-col">
      <WidgetHeader 
        title="Quick Links" 
        onSettingsClick={() => setShowSettings(!showSettings)}
      />
      
      <div className="flex-1 overflow-hidden">
        {renderContent()}
      </div>
      
      {/* Settings modal */}
      {renderSettings()}
    </div>
  )
}

// Widget configuration for registration
export const quickLinksWidgetConfig = {
  type: 'quicklinks',
  name: 'Quick Links',
  description: 'Editable grid of clickable bookmarks for your favorite sites',
  defaultSize: { w: 2, h: 2 },
  minSize: { w: 2, h: 2 },
  maxSize: { w: 6, h: 6 }
}

export default QuickLinksWidget