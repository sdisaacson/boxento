import React, { useState, useRef } from 'react'
import { ExternalLink, Plus, X, Trash, Edit } from 'lucide-react'
import { createPortal } from 'react-dom'
import WidgetHeader from '../../ui/WidgetHeader'
import { QuickLinksWidgetProps, LinkItem } from './types'

/**
 * QuickLinks Widget Component
 * 
 * A widget that displays a collection of customizable links for quick access.
 * Supports different layouts based on widget dimensions and provides a settings
 * interface for adding, editing, and removing links.
 * 
 * @component
 * @param {QuickLinksWidgetProps} props - Component props
 * @returns {JSX.Element} QuickLinks widget component
 */
const QuickLinksWidget: React.FC<QuickLinksWidgetProps> = ({ width, height, config }) => {
  // Base container styles for consistent dark mode with slate colors
  const containerClasses = 'h-full flex flex-col bg-white dark:bg-slate-800 rounded-lg shadow-sm dark:shadow-lg dark:shadow-slate-900/30 transition-colors duration-200 p-3';
  const [links, setLinks] = useState<LinkItem[]>(config?.links || [
    { id: 1, title: 'Google', url: 'https://google.com', color: '#EA4335' },
    { id: 2, title: 'GitHub', url: 'https://github.com', color: '#171515' },
    { id: 3, title: 'YouTube', url: 'https://youtube.com', color: '#FF0000' }
  ])
  const [showSettings, setShowSettings] = useState<boolean>(false)
  const [editingLink, setEditingLink] = useState<LinkItem | null>(null)
  const settingsRef = useRef<HTMLDivElement | null>(null)
  const widgetRef = useRef<HTMLDivElement | null>(null)
  
  /**
   * Adds or updates a link in the links collection
   * 
   * If the editingLink has an id, it updates the existing link.
   * Otherwise, it creates a new link with a unique id.
   */
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

  /**
   * Removes a link from the links collection
   * 
   * @param {number} id - The id of the link to remove
   */
  const removeLink = (id: number) => {
    setLinks(links.filter(link => link.id !== id))
  }

  /**
   * Starts editing a link or creates a new one
   * 
   * @param {LinkItem | null} link - The link to edit, or null to create a new one
   */
  const startEdit = (link: LinkItem | null = null) => {
    setEditingLink(link || { id: 0, title: '', url: '', color: '#3B82F6' }) // Use a blue color that works in both light/dark modes
  }

  /**
   * Renders a subset of links based on available space
   * 
   * @param {number} maxLinks - Maximum number of links to render
   * @returns {JSX.Element[]} Array of link elements
   */
  const renderLinks = (maxLinks: number) => {
    return links.slice(0, maxLinks).map(link => (
      <a 
        key={link.id}
        href={link.url} 
        target="_blank" 
        rel="noopener noreferrer"
        className="flex items-center p-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-all relative text-gray-800 dark:text-gray-100 group"
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
        aria-label={`Visit ${link.title} at ${link.url}`}
      >
        <div 
          className="w-2.5 h-2.5 rounded-full mr-2.5 ring-1 ring-gray-200 dark:ring-gray-600 transition-colors" 
          style={{ backgroundColor: link.color }}
        />
        <span className="font-medium">{link.title}</span>
        <ExternalLink size={14} className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-gray-400" />
      </a>
    ))
  }

  /**
   * Determines which view to render based on widget dimensions
   * 
   * @returns {JSX.Element} The appropriate view for the current dimensions
   */
  const renderContent = () => {
    if (width >= 4 && height >= 4) {
      return renderFullView()
    } else if (width >= 3 && height >= 3) {
      return renderTallView()
    } else if (width >= 3) {
      return renderWideView()
    } else {
      return renderDefaultView()
    }
  }

  /**
   * Renders the default view for small widget sizes
   * 
   * @returns {JSX.Element} Default compact view
   */
  const renderDefaultView = () => {
    return (
      <div className="flex flex-col space-y-1 overflow-y-auto">
        {renderLinks(4)}
      </div>
    )
  }

  /**
   * Renders a wider view with more links and details
   * 
   * @returns {JSX.Element} Wide layout view
   */
  const renderWideView = () => {
    return (
      <div className="grid grid-cols-2 gap-2">
        {links.slice(0, 6).map(link => (
          <a 
            key={link.id}
            href={link.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700/50 border border-gray-200 dark:border-gray-700 shadow-sm dark:shadow-md dark:shadow-slate-900/30 transition-all relative bg-white dark:bg-slate-800/50 text-gray-800 dark:text-gray-100 group"
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
            aria-label={`Visit ${link.title} at ${link.url}`}
          >
            <div 
              className="w-3 h-3 rounded-full mr-2 ring-1 ring-gray-200 dark:ring-gray-600" 
              style={{ backgroundColor: link.color }}
            />
            <span className="font-medium truncate">{link.title}</span>
            <ExternalLink size={14} className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-gray-400" />
          </a>
        ))}
        {links.length < 6 && (
          <button
            onClick={() => {
              setShowSettings(true)
              startEdit()
            }}
            className="flex items-center justify-center p-3 rounded-lg border border-dashed border-gray-300 dark:border-gray-500 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-all bg-gray-50/50 dark:bg-slate-700/30 shadow-sm dark:shadow-md dark:shadow-slate-900/30 group"
            aria-label="Add new link"
          >
            <Plus size={16} className="text-gray-500 dark:text-gray-300" />
            <span className="ml-1 text-sm font-medium text-gray-500 dark:text-gray-300">Add link</span>
          </button>
        )}
      </div>
    )
  }

  /**
   * Renders a taller view with vertical link layout
   * 
   * @returns {JSX.Element} Tall layout view
   */
  const renderTallView = () => {
    return (
      <div className="grid grid-cols-2 gap-2">
        {links.slice(0, 8).map(link => (
          <a 
            key={link.id}
            href={link.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700/50 border border-gray-200 dark:border-gray-700 shadow-sm dark:shadow-md dark:shadow-slate-900/30 transition-all relative bg-white dark:bg-slate-800/50 text-gray-800 dark:text-gray-100 group"
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
            aria-label={`Visit ${link.title} at ${link.url}`}
          >
            <div 
              className="w-3 h-3 rounded-full mr-2 ring-1 ring-gray-200 dark:ring-gray-600" 
              style={{ backgroundColor: link.color }}
            />
            <span className="font-medium truncate">{link.title}</span>
            <ExternalLink size={14} className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-gray-400" />
          </a>
        ))}
        {links.length < 8 && (
          <button
            onClick={() => {
              setShowSettings(true)
              startEdit()
            }}
            className="flex items-center justify-center p-3 rounded-lg border border-dashed border-gray-300 dark:border-gray-500 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-all bg-gray-50/50 dark:bg-slate-700/30 shadow-sm dark:shadow-md dark:shadow-slate-900/30 group"
            aria-label="Add new link"
          >
            <Plus size={16} className="text-gray-500 dark:text-gray-300" />
            <span className="ml-1 text-sm font-medium text-gray-500 dark:text-gray-300">Add link</span>
          </button>
        )}
      </div>
    )
  }

  /**
   * Renders the full-size view with maximum links and details
   * 
   * @returns {JSX.Element} Full-size layout view
   */
  const renderFullView = () => {
    return (
      <div className="grid grid-cols-3 gap-3">
        {links.slice(0, 11).map(link => (
          <a 
            key={link.id}
            href={link.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex flex-col items-center justify-center p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700/50 border border-gray-200 dark:border-gray-700 shadow-sm dark:shadow-lg dark:shadow-slate-900/30 transition-all relative bg-white dark:bg-slate-800/50 text-gray-800 dark:text-gray-100 group"
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
            aria-label={`Visit ${link.title} at ${link.url}`}
          >
            <div 
              className="w-10 h-10 rounded-full mb-2 flex items-center justify-center"
              style={{ backgroundColor: link.color }}
            >
              <ExternalLink size={20} className="text-white" />
            </div>
            <span className="font-medium text-center">{link.title}</span>
          </a>
        ))}
        {links.length < 11 && (
          <button
            onClick={() => {
              setShowSettings(true)
              startEdit()
            }}
            className="flex flex-col items-center justify-center p-3 rounded border border-dashed border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Add new link"
          >
            <div className="w-10 h-10 rounded-full mb-2 flex items-center justify-center bg-gray-200 dark:bg-gray-700">
              <Plus size={20} className="text-gray-500 dark:text-gray-400" />
            </div>
            <span className="text-sm font-medium text-gray-500 dark:text-slate-400">Add link</span>
          </button>
        )}
      </div>
    )
  }

  /**
   * Renders the settings panel for managing links
   * 
   * @returns {JSX.Element} Settings panel with form controls
   */
  const renderSettings = () => {
    if (!showSettings) return null
    
    return createPortal(
      <div className="fixed inset-0 bg-black/50 dark:bg-black/70 z-50 flex items-center justify-center p-4">
        <div 
          ref={settingsRef}
          className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-auto"
        >
          <div className="flex items-center justify-between p-4 border-b dark:border-slate-700">
            <h3 id="settings-title" className="font-semibold text-gray-800 dark:text-slate-100">Quick Links Settings</h3>
            <button 
              onClick={() => {
                setShowSettings(false)
                setEditingLink(null)
              }}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X size={20} />
            </button>
          </div>
          
          <div className="p-4">
            {editingLink ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                    Link Title
                  </label>
                  <input 
                    type="text" 
                    value={editingLink.title} 
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditingLink({...editingLink, title: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md dark:bg-slate-700 text-gray-900 dark:text-slate-100"
                    placeholder="Google"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                    URL
                  </label>
                  <input 
                    type="url" 
                    value={editingLink.url} 
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditingLink({...editingLink, url: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md dark:bg-slate-700 text-gray-900 dark:text-slate-100"
                    placeholder="https://google.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                    Color
                  </label>
                  <div className="flex items-center">
                    <input 
                      type="color" 
                      value={editingLink.color} 
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditingLink({...editingLink, color: e.target.value})}
                      className="w-10 h-10 p-1 rounded border border-gray-300 dark:border-slate-600"
                    />
                    <input 
                      type="text" 
                      value={editingLink.color} 
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditingLink({...editingLink, color: e.target.value})}
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
                    onClick={() => {
                      addLink()
                    }}
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
                        />
                        <span className="font-medium">{link.title}</span>
                      </div>
                      <div className="flex space-x-1">
                        <button 
                          onClick={() => startEdit(link)}
                          className="p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                          aria-label={`Edit ${link.title} link`}
                        >
                          <Edit size={16} />
                        </button>
                        <button 
                          onClick={() => removeLink(link.id)}
                          className="p-1 text-gray-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400"
                          aria-label={`Remove ${link.title} link`}
                        >
                          <Trash size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => startEdit()}
                  className="w-full py-2 border border-dashed border-gray-300 dark:border-slate-600 rounded-md flex items-center justify-center hover:bg-gray-100 dark:hover:bg-slate-700 mt-4"
                  aria-label="Add new link"
                >
                  <Plus size={16} className="text-gray-500 mr-1" />
                  <span className="text-sm text-gray-500">Add new link</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>,
      document.body
    )
  }

  return (
    <div ref={widgetRef} className={containerClasses}>
      <WidgetHeader 
        title="Quick Links" 
        onSettingsClick={() => setShowSettings(true)}
      />
      <div className="flex-1 overflow-auto p-1">
        {renderContent()}
      </div>
      {renderSettings()}
    </div>
  )
}

export default QuickLinksWidget

// Export types for use in other files
export * from './types' 