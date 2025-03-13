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
    <div className="widget-selector-overlay" onClick={onClose}>
      <div className="widget-selector-modal" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
        <div className="widget-selector-header">
          <h3>Add Widget</h3>
          <button 
            onClick={onClose} 
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            aria-label="Close widget selector"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="widget-selector-search">
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
          <div className="widget-selector-results">
            <h4 className="widget-category-title">Search Results</h4>
            <div className="widget-grid">
              {filteredWidgets.length > 0 ? (
                filteredWidgets.map(widget => (
                  <button
                    key={widget.type}
                    className="widget-item group"
                    onClick={() => onAddWidget(widget.type)}
                    aria-label={`Add ${widget.name} widget`}
                  >
                    <div className="widget-icon">
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
                    <div className="widget-info">
                      <div className="text-sm text-gray-900 dark:text-gray-100">{widget.name}</div>
                      {widget.description && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{widget.description}</div>
                      )}
                    </div>
                  </button>
                ))
              ) : (
                <div className="no-results">No widgets found matching "{searchQuery}"</div>
              )}
            </div>
          </div>
        ) : (
          <div className="widget-selector-categories">
            {Object.entries(widgetCategories).map(([category, widgets]) => (
              <div key={category} className="widget-category">
                <h4 className="widget-category-title">{category}</h4>
                <div className="widget-grid">
                  {widgets.map(widget => (
                    <button
                      key={widget.type}
                      className="widget-item group"
                      onClick={() => onAddWidget(widget.type)}
                      aria-label={`Add ${widget.name} widget`}
                    >
                      <div className="widget-icon">
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
                      <div className="widget-info">
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