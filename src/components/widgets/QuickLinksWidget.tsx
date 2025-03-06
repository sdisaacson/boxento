import { useState, useEffect, useRef } from 'react'
import { Link, ExternalLink, Plus, X, Trash, Edit, CircleDot } from 'lucide-react'
import { createPortal } from 'react-dom'
import WidgetHeader from '../ui/WidgetHeader'

interface LinkItem {
  id: number
  title: string
  url: string
  color: string
}

interface QuickLinksWidgetProps {
  width: number
  height: number
  config?: {
    links?: LinkItem[]
  }
}

const QuickLinksWidget = ({ width, height, config }: QuickLinksWidgetProps) => {
  // Base container styles for consistent dark mode with slate colors
  const containerClasses = 'h-full flex flex-col bg-white dark:bg-slate-800 rounded-lg shadow-sm dark:shadow-lg dark:shadow-slate-900/30 transition-colors duration-200 p-3';
  const [links, setLinks] = useState<LinkItem[]>(config?.links || [
    { id: 1, title: 'Google', url: 'https://google.com', color: '#EA4335' },
    { id: 2, title: 'GitHub', url: 'https://github.com', color: '#171515' },
    { id: 3, title: 'YouTube', url: 'https://youtube.com', color: '#FF0000' }
  ])
  const [showSettings, setShowSettings] = useState<boolean>(false)
  const [editingLink, setEditingLink] = useState<LinkItem | null>(null)
  const settingsRef = useRef<HTMLDivElement>(null)
  const settingsButtonRef = useRef<HTMLButtonElement>(null)
  const widgetRef = useRef<HTMLDivElement>(null)
  
  // Handle link navigation with an imperative approach
  const navigateToUrl = (url: string) => {
    // Open the URL in a new tab
    window.open(url, '_blank', 'noopener,noreferrer');
  };
  
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

  const removeLink = (id: number) => {
    setLinks(links.filter(link => link.id !== id))
  }

  const startEdit = (link: LinkItem | null = null) => {
    setEditingLink(link || { id: 0, title: '', url: '', color: '#3B82F6' }) // Use a blue color that works in both light/dark modes
  }

  const renderLinks = (maxLinks: number) => {
    return links.slice(0, maxLinks).map(link => (
      <a 
        key={link.id}
        href={link.url} 
        target="_blank" 
        rel="noopener noreferrer"
        className="flex items-center p-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-all relative text-gray-800 dark:text-gray-100 group"
        onClick={(e) => e.stopPropagation()}
      >
        <div 
          className="w-2.5 h-2.5 rounded-full mr-2.5 ring-1 ring-gray-200 dark:ring-gray-600 transition-colors" 
          style={{ backgroundColor: link.color }}
        ></div>
        <span className="text-sm truncate flex-1 font-medium group-hover:text-gray-900 dark:group-hover:text-white transition-colors">{link.title}</span>
        <ExternalLink size={14} className="text-gray-400 dark:text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-300 transition-colors ml-1.5" />
      </a>
    ))
  }

  const renderContent = () => {
    if (width >= 4 && height >= 4) {
      return renderFullView()
    } else if (width >= 4) {
      return renderWideView()
    } else if (height >= 3) {
      return renderTallView()
    } else {
      return renderDefaultView()
    }
  }

  const renderDefaultView = () => {
    return (
      <div className="flex-1 overflow-y-auto space-y-2">
        {renderLinks(3)}
      </div>
    )
  }

  const renderWideView = () => {
    return (
      <div className="grid grid-cols-2 gap-2 flex-1 overflow-y-auto">
        {links.map(link => (
          <a 
            key={link.id}
            href={link.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700/50 border border-gray-200 dark:border-gray-700 shadow-sm dark:shadow-md dark:shadow-slate-900/30 transition-all relative bg-white dark:bg-slate-800/50 text-gray-800 dark:text-gray-100 group"
            onClick={(e) => e.stopPropagation()}
          >
            <div 
              className="w-3 h-3 rounded-full mr-2 ring-1 ring-gray-200 dark:ring-gray-600" 
              style={{ backgroundColor: link.color }}
            ></div>
            <span className="text-sm truncate flex-1 font-medium">{link.title}</span>
            <ExternalLink size={14} className="text-gray-400 dark:text-gray-300 ml-2" />
          </a>
        ))}
        <button
          onClick={(e) => {
            e.stopPropagation();
            startEdit();
          }}
          className="flex items-center justify-center p-3 rounded-lg border border-dashed border-gray-300 dark:border-gray-500 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-all bg-gray-50/50 dark:bg-slate-700/30 shadow-sm dark:shadow-md dark:shadow-slate-900/30 group"
        >
          <Plus size={16} className="text-gray-500 dark:text-gray-300" />
          <span className="ml-1 text-sm font-medium text-gray-600 dark:text-gray-300">Add link</span>
        </button>
      </div>
    )
  }

  const renderTallView = () => {
    return (
      <div className="flex-1 overflow-y-auto space-y-2">
        {links.map(link => (
          <a 
            key={link.id}
            href={link.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700/50 border border-gray-200 dark:border-gray-700 shadow-sm dark:shadow-md dark:shadow-slate-900/30 transition-all relative bg-white dark:bg-slate-800/50 text-gray-800 dark:text-gray-100 group"
            onClick={(e) => e.stopPropagation()}
          >
            <div 
              className="w-3 h-3 rounded-full mr-2 ring-1 ring-gray-200 dark:ring-gray-600" 
              style={{ backgroundColor: link.color }}
            ></div>
            <span className="text-sm truncate flex-1 font-medium">{link.title}</span>
            <ExternalLink size={14} className="text-gray-400 dark:text-gray-300 ml-2" />
          </a>
        ))}
        <button
          onClick={(e) => {
            e.stopPropagation();
            startEdit();
          }}
          className="flex items-center justify-center p-3 rounded-lg border border-dashed border-gray-300 dark:border-gray-500 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-all bg-gray-50/50 dark:bg-slate-700/30 shadow-sm dark:shadow-md dark:shadow-slate-900/30 group"
        >
          <Plus size={16} className="text-gray-500 dark:text-gray-300" />
          <span className="ml-1 text-sm font-medium text-gray-600 dark:text-gray-300">Add link</span>
        </button>
      </div>
    )
  }

  const renderFullView = () => {
    return (
      <div className="grid grid-cols-3 gap-3 flex-1 overflow-y-auto">
        {links.map(link => (
          <a 
            key={link.id}
            href={link.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex flex-col items-center justify-center p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700/50 border border-gray-200 dark:border-gray-700 shadow-sm dark:shadow-lg dark:shadow-slate-900/30 transition-all relative bg-white dark:bg-slate-800/50 text-gray-800 dark:text-gray-100 group"
            onClick={(e) => e.stopPropagation()}
          >
            <div 
              className="w-12 h-12 rounded-full mb-3 flex items-center justify-center ring-2 ring-white dark:ring-slate-600 shadow-md transition-shadow group-hover:shadow-lg"
              style={{ backgroundColor: link.color }}
            >
              <span className="text-white font-bold text-lg">
                {link.title.charAt(0).toUpperCase()}
              </span>
            </div>
            <span className="text-sm font-medium text-gray-800 dark:text-gray-100 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">{link.title}</span>
            <div className="flex items-center mt-1.5">
              <span className="text-xs text-gray-600 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors truncate max-w-[100px]">
                {link.url.replace(/^https?:\/\//, '').replace(/^www\./, '')}
              </span>
              <ExternalLink size={12} className="text-gray-400 dark:text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-300 transition-colors ml-1" />
            </div>
          </a>
        ))}
        <button
          onClick={(e) => {
            e.stopPropagation();
            startEdit();
          }}
          className="flex flex-col items-center justify-center p-3 rounded border border-dashed border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <div className="w-10 h-10 rounded-full mb-2 flex items-center justify-center bg-gray-200 dark:bg-gray-700">
            <Plus size={20} className="text-gray-500 dark:text-gray-400" />
          </div>
          <span className="text-sm font-medium text-gray-500">Add link</span>
        </button>
      </div>
    )
  }

  const renderSettings = () => {
    if (!showSettings) return null

    return createPortal(
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div 
          className="bg-white dark:bg-slate-800 rounded-lg shadow-lg dark:shadow-slate-900/30 w-[96%] max-w-md max-h-[90vh] overflow-auto"
          ref={settingsRef}
        >
          <div className="flex items-center justify-between p-4 border-b dark:border-slate-700">
            <h3 className="font-semibold text-gray-800 dark:text-slate-100">Quick Links Settings</h3>
            <button 
              onClick={() => {
                setShowSettings(false)
                setEditingLink(null)
              }}
              className="text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200"
            >
              <X size={18} />
            </button>
          </div>
          
          <div className="p-4">
            <div className="space-y-4">
              {editingLink ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-slate-200">Link Name</label>
                    <input 
                      type="text" 
                      value={editingLink.title} 
                      onChange={e => setEditingLink({...editingLink, title: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md dark:bg-slate-700 text-gray-900 dark:text-slate-100"
                      placeholder="Google"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-slate-200">URL</label>
                    <input 
                      type="url" 
                      value={editingLink.url} 
                      onChange={e => setEditingLink({...editingLink, url: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md dark:bg-slate-700 text-gray-900 dark:text-slate-100"
                      placeholder="https://google.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-slate-200">Color</label>
                    <div className="flex items-center">
                      <input 
                        type="color" 
                        value={editingLink.color} 
                        onChange={e => setEditingLink({...editingLink, color: e.target.value})}
                        className="w-10 h-10 p-1 rounded border border-gray-300 dark:border-slate-600"
                      />
                      <input 
                        type="text" 
                        value={editingLink.color} 
                        onChange={e => setEditingLink({...editingLink, color: e.target.value})}
                        className="flex-1 ml-2 px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md dark:bg-slate-700 text-gray-900 dark:text-slate-100"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2 pt-2">
                    <button 
                      onClick={() => setEditingLink(null)}
                      className="px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-md text-sm text-gray-700 dark:text-slate-200"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={addLink}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
                      disabled={!editingLink.title || !editingLink.url}
                    >
                      {editingLink.id ? 'Update' : 'Add'}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="space-y-1">
                    {links.map(link => (
                      <div 
                        key={link.id} 
                        className="flex items-center justify-between p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                      >
                        <div className="flex items-center">
                          <div 
                            className="w-3 h-3 rounded-full mr-2" 
                            style={{ backgroundColor: link.color }}
                          ></div>
                          <span className="font-medium text-sm">{link.title}</span>
                          <span className="ml-2 text-xs text-gray-500 truncate max-w-[150px]">
                            {link.url.replace(/^https?:\/\//, '').replace(/^www\./, '')}
                          </span>
                        </div>
                        <div className="flex space-x-1">
                          <button 
                            onClick={() => startEdit(link)}
                            className="p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                          >
                            <Edit size={16} />
                          </button>
                          <button 
                            onClick={() => removeLink(link.id)}
                            className="p-1 text-gray-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400"
                          >
                            <Trash size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => startEdit()}
                    className="w-full py-2 border border-dashed border-gray-300 dark:border-slate-600 rounded-md flex items-center justify-center hover:bg-gray-100 dark:hover:bg-slate-700"
                  >
                    <Plus size={16} className="text-gray-500 mr-1" />
                    <span className="text-sm text-gray-500 dark:text-slate-400">Add New Link</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>,
      document.body
    )
  }

  return (
    <div className={`widget-container h-full flex flex-col pointer-events-auto ${containerClasses}`} ref={widgetRef}>
      <WidgetHeader 
        title="Quick Links" 
        onSettingsClick={() => setShowSettings(true)}
      />
      <div className="flex-1 overflow-hidden pointer-events-auto">
        {renderContent()}
      </div>
      {renderSettings()}
    </div>
  )
}

export default QuickLinksWidget 