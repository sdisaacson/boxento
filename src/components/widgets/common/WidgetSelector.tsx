import React, { useState, useEffect } from 'react';
import { X, Plus, Calendar, Cloud, Clock, Link, StickyNote, CheckSquare, Timer, DollarSign, BookOpen, Video, Rss, Github, Plane, Globe } from 'lucide-react';
import { WidgetConfig } from '@/types';

interface WidgetSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onAddWidget: (type: string) => void;
  widgetRegistry: WidgetConfig[];
  widgetCategories: { [category: string]: WidgetConfig[] };
}

/**
 * Widget Selector Component
 * 
 * Provides a modal interface for searching and adding widgets to the dashboard
 * 
 * @component
 * @param {WidgetSelectorProps} props - Component props
 * @returns {React.ReactElement | null} Widget selector modal or null if closed
 */
const WidgetSelector = ({ 
  isOpen, 
  onClose, 
  onAddWidget, 
  widgetRegistry,
  widgetCategories
}: WidgetSelectorProps): React.ReactElement | null => {
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Handle escape key press
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (isOpen && event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscapeKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isOpen, onClose]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setSearchQuery(e.target.value);
  };

  const filteredWidgets = searchQuery 
    ? widgetRegistry.filter(widget => 
        widget.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (widget.description && widget.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (widget.category && widget.category.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : [];

  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-2 sm:p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl dark:border dark:border-gray-700 w-full max-w-4xl max-h-[90vh] sm:max-h-[85vh] overflow-hidden flex flex-col" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
        <div className="flex justify-between items-center p-4 sm:p-5 md:p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white">Add Widget</h3>
          <button 
            onClick={onClose} 
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
            aria-label="Close widget selector"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="relative p-4 sm:p-5 md:p-6 border-b border-gray-200 dark:border-gray-700">
          <input
            type="text"
            placeholder="Search widgets..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            aria-label="Search widgets"
            autoFocus
          />
        </div>
        
        {searchQuery ? (
          <div className="p-4 sm:p-5 md:p-6 overflow-y-auto flex-1">
            <h4 className="text-base font-semibold text-gray-700 dark:text-gray-200 mb-2">Search Results</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
              {filteredWidgets.length > 0 ? (
                filteredWidgets.map(widget => (
                  <button
                    key={widget.type}
                    className="flex items-center gap-3 p-4 border border-gray-100 dark:border-gray-800 rounded-lg bg-white dark:bg-gray-900 transition-all duration-200 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-200 dark:hover:border-blue-700 hover:shadow-md hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                    onClick={() => onAddWidget(widget.type)}
                    aria-label={`Add ${widget.name} widget`}
                  >
                    <div className="flex items-center justify-center w-11 h-11 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                      {(() => {
                        switch (widget.icon) {
                          case 'Calendar': return <Calendar size={16} />;
                          case 'Cloud': return <Cloud size={16} />;
                          case 'Clock': return <Clock size={16} />;
                          case 'Link': return <Link size={16} />;
                          case 'StickyNote': return <StickyNote size={16} />;
                          case 'CheckSquare': return <CheckSquare size={16} />;
                          case 'Timer': return <Timer size={16} />;
                          case 'DollarSign': return <DollarSign size={16} />;
                          case 'BookOpen': return <BookOpen size={16} />;
                          case 'Video': return <Video size={16} />;
                          case 'Rss': return <Rss size={16} />;
                          case 'Github': return <Github size={16} />;
                          case 'Plane': return <Plane size={16} />;
                          case 'Globe': return <Globe size={16} />;
                          default: return <Plus size={16} />;
                        }
                      })()}
                    </div>
                    <div className="flex flex-col flex-1 pt-1">
                      <div className="text-sm text-gray-900 dark:text-gray-100">{widget.name}</div>
                      {widget.description && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{widget.description}</div>
                      )}
                    </div>
                  </button>
                ))
              ) : (
                <div className="col-span-full text-center py-8 text-gray-500 dark:text-gray-400 text-sm">No widgets found matching "{searchQuery}"</div>
              )}
            </div>
          </div>
        ) : (
          <div className="p-4 sm:p-5 md:p-6 overflow-y-auto flex-1">
            {Object.entries(widgetCategories).map(([category, widgets]) => (
              <div key={category} className="mb-8">
                <h4 className="text-base font-semibold text-gray-700 dark:text-gray-200 mb-2">{category}</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                  {widgets.map(widget => (
                    <button
                      key={widget.type}
                      className="flex items-center gap-3 p-4 border border-gray-100 dark:border-gray-800 rounded-lg bg-white dark:bg-gray-900 transition-all duration-200 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-200 dark:hover:border-blue-700 hover:shadow-md hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                      onClick={() => onAddWidget(widget.type)}
                      aria-label={`Add ${widget.name} widget`}
                    >
                      <div className="flex items-center justify-center w-11 h-11 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                        {(() => {
                          switch (widget.icon) {
                            case 'Calendar': return <Calendar size={16} />;
                            case 'Cloud': return <Cloud size={16} />;
                            case 'Clock': return <Clock size={16} />;
                            case 'Link': return <Link size={16} />;
                            case 'StickyNote': return <StickyNote size={16} />;
                            case 'CheckSquare': return <CheckSquare size={16} />;
                            case 'Timer': return <Timer size={16} />;
                            case 'DollarSign': return <DollarSign size={16} />;
                            case 'BookOpen': return <BookOpen size={16} />;
                            case 'Video': return <Video size={16} />;
                            case 'Rss': return <Rss size={16} />;
                            case 'Github': return <Github size={16} />;
                            case 'Plane': return <Plane size={16} />;
                            case 'Globe': return <Globe size={16} />;
                            default: return <Plus size={16} />;
                          }
                        })()}
                      </div>
                      <div className="flex flex-col flex-1 pt-1 text-left">
                        <div className="text-sm text-gray-900 dark:text-gray-100">{widget.name}</div>
                        {widget.description && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{widget.description}</div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default WidgetSelector; 