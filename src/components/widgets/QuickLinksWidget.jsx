import { useState, useEffect, useRef } from 'react'
import { Link, ExternalLink, Plus, Settings, X, Pencil } from 'lucide-react'

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
  
  // Handle click outside with a simple global handler
  useEffect(() => {
    // If settings are not shown, don't add the listener
    if (!showSettings) return;
    
    // Create a handler function that checks if the click is outside
    const handleDocumentClick = (e) => {
      // Don't close if clicking on the settings panel or the settings button
      if (
        (settingsRef.current && settingsRef.current.contains(e.target)) ||
        (settingsButtonRef.current && settingsButtonRef.current.contains(e.target))
      ) {
        return;
      }
      
      // If we get here, the click was outside, so close settings
      setShowSettings(false);
    };
    
    // Add a small delay before adding the listener to avoid the initial click
    // that opened the settings from immediately closing it
    const timeoutId = setTimeout(() => {
      document.addEventListener('click', handleDocumentClick);
    }, 100);
    
    // Return cleanup function
    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('click', handleDocumentClick);
    };
  }, [showSettings]);
  
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
  
  const renderCompactView = () => {
    return (
      <div className="flex flex-wrap gap-2 justify-center items-center h-full">
        {links.slice(0, 4).map(link => (
          <a 
            key={link.id}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center flex-col bg-gray-50 dark:bg-gray-700 rounded p-2 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
            style={{ width: '40%', height: '40%' }}
          >
            <div 
              className="w-6 h-6 rounded-full mb-1"
              style={{ backgroundColor: link.color }}
            ></div>
            <div className="text-xs truncate w-full text-center">{link.title}</div>
          </a>
        ))}
      </div>
    )
  }
  
  const renderFullView = () => {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 h-full overflow-y-auto">
        {links.map(link => (
          <div key={link.id} className="relative group/link">
            <a 
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center flex-col bg-gray-50 dark:bg-gray-700 rounded p-3 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors h-full"
            >
              <div 
                className="w-8 h-8 rounded-full mb-1 flex items-center justify-center"
                style={{ backgroundColor: link.color }}
              >
                <ExternalLink size={14} className="text-white" />
              </div>
              <div className="text-sm mt-1 truncate w-full text-center">{link.title}</div>
            </a>
            <div className="absolute top-1 right-1 flex opacity-0 group-hover/link:opacity-100 transition-opacity">
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  startEdit(link);
                }}
                className="text-gray-400 hover:text-blue-500 p-1"
              >
                <Pencil size={12} />
              </button>
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  removeLink(link.id);
                }}
                className="text-gray-400 hover:text-red-500 p-1"
              >
                <X size={12} />
              </button>
            </div>
          </div>
        ))}
      </div>
    )
  }
  
  const renderSettings = () => {
    if (!showSettings) return null;
    
    return (
      <div 
        ref={settingsRef}
        className="absolute right-0 top-8 bg-white dark:bg-gray-800 rounded-lg p-4 w-64 shadow-lg z-50"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <h3 className="text-sm font-medium mb-2">Quick Links Settings</h3>
        
        {editingLink ? (
          <div className="mb-4 p-2 bg-gray-100 dark:bg-gray-700 rounded">
            <div className="mb-2">
              <label className="block text-xs mb-1">Title</label>
              <input
                type="text"
                className="w-full p-1 text-sm bg-white dark:bg-gray-600 rounded border border-gray-300 dark:border-gray-600"
                value={editingLink.title}
                onChange={(e) => setEditingLink({...editingLink, title: e.target.value})}
                placeholder="e.g. Google"
              />
            </div>
            <div className="mb-2">
              <label className="block text-xs mb-1">URL</label>
              <input
                type="text"
                className="w-full p-1 text-sm bg-white dark:bg-gray-600 rounded border border-gray-300 dark:border-gray-600"
                value={editingLink.url}
                onChange={(e) => setEditingLink({...editingLink, url: e.target.value})}
                placeholder="e.g. https://google.com"
              />
            </div>
            <div className="mb-2">
              <label className="block text-xs mb-1">Color</label>
              <input
                type="color"
                className="w-full p-0 h-8 rounded border border-gray-300 dark:border-gray-600"
                value={editingLink.color}
                onChange={(e) => setEditingLink({...editingLink, color: e.target.value})}
              />
            </div>
            <div className="flex gap-2 mt-2">
              <button
                onClick={addLink}
                className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
              >
                {editingLink.id ? 'Update' : 'Add'}
              </button>
              <button
                onClick={() => setEditingLink(null)}
                className="text-xs bg-gray-300 dark:bg-gray-600 px-2 py-1 rounded"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-4 max-h-40 overflow-y-auto">
              {links.map(link => (
                <div key={link.id} className="flex justify-between items-center mb-2">
                  <div className="flex items-center">
                    <div 
                      className="w-3 h-3 rounded-full mr-2"
                      style={{ backgroundColor: link.color }}
                    ></div>
                    <div className="text-sm">{link.title}</div>
                  </div>
                  <div className="flex">
                    <button
                      onClick={() => startEdit(link)}
                      className="text-gray-500 hover:text-gray-700 mr-1"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => removeLink(link.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            <button
              onClick={() => startEdit()}
              className="flex items-center gap-1 text-sm text-blue-500 hover:text-blue-700 mb-4"
            >
              <Plus size={14} /> Add Link
            </button>
          </>
        )}
        
        <div className="flex justify-end">
          <button 
            onClick={() => setShowSettings(false)}
            className="text-sm bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
          >
            Close
          </button>
        </div>
      </div>
    )
  }
  
  return (
    <div className="h-full flex flex-col relative">
      <div className="widget-drag-handle flex justify-between items-center mb-2">
        <div className="flex items-center gap-1">
          <Link size={16} />
          <h3 className="text-sm font-medium">Quick Links</h3>
        </div>
        <div 
          ref={settingsButtonRef}
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            setShowSettings(!showSettings);
          }}
          onMouseDown={(e) => {
            e.stopPropagation();
          }}
          className="cursor-pointer p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full text-gray-600 dark:text-gray-300 z-20"
        >
          <Settings size={14} />
        </div>
      </div>
      
      {/* Render different views based on widget size */}
      {width <= 2 ? renderCompactView() : renderFullView()}
      
      {/* Settings dropdown */}
      {renderSettings()}
    </div>
  )
}

export default QuickLinksWidget