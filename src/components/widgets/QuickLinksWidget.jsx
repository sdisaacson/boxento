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
      >
        {link.icon && (
          <img src={link.icon} alt="" className="w-5 h-5" />
        )}
        <span className="truncate">{link.title}</span>
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
      <div className="h-full">
        <div className="grid grid-cols-2 gap-2">
          {renderLinks(4)}
        </div>
      </div>
    );
  };

  // Wide view for layouts like 4x2, 6x2
  const renderWideView = () => {
    return (
      <div className="h-full">
        <div className="grid grid-cols-4 gap-2">
          {renderLinks(8)}
        </div>
      </div>
    );
  };

  // Tall view for layouts like 2x4, 2x6
  const renderTallView = () => {
    return (
      <div className="h-full">
        <div className="grid grid-cols-2 gap-2">
          {renderLinks(8)}
        </div>
      </div>
    );
  };

  // Full view for 2x2 or larger layout
  const renderFullView = () => {
    const columns = width >= 3 ? 3 : 2;
    const maxLinks = width * height * 2;
    
    return (
      <div className={`grid grid-cols-${columns} gap-2 overflow-y-auto max-h-full`}>
        {renderLinks(maxLinks)}
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