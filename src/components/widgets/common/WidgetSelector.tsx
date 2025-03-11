import React, { useState, useEffect } from 'react';
import { Search, X, Plus, ChevronDown } from 'lucide-react';
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
  const [expandedCategories, setExpandedCategories] = useState<{ [key: string]: boolean }>({});

  // Initialize with all categories expanded
  useEffect(() => {
    if (isOpen) {
      const allCategories = Object.keys(widgetCategories).reduce((acc, category) => {
        acc[category] = true;
        return acc;
      }, {} as { [key: string]: boolean });
      
      setExpandedCategories(allCategories);
    }
  }, [isOpen, widgetCategories]);

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

  const toggleCategory = (category: string): void => {
    setExpandedCategories({
      ...expandedCategories,
      [category]: !expandedCategories[category]
    });
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
          <Search size={18} className="search-icon" aria-hidden="true" />
          <input
            type="text"
            placeholder="Search widgets..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="widget-search-input"
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
                      <Plus size={16} />
                    </div>
                    <div className="widget-info">
                      <div className="widget-name">{widget.name}</div>
                      {widget.description && (
                        <div className="widget-description">{widget.description}</div>
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
                <button 
                  className="widget-category-header"
                  onClick={() => toggleCategory(category)}
                  aria-expanded={expandedCategories[category]}
                  aria-controls={`category-${category}`}
                >
                  <h4 className="widget-category-title">{category}</h4>
                  <ChevronDown 
                    size={18} 
                    className={`transform transition-transform ${expandedCategories[category] ? 'rotate-180' : ''}`}
                  />
                </button>
                
                {expandedCategories[category] && (
                  <div id={`category-${category}`} className="widget-grid">
                    {widgets.map(widget => (
                      <button
                        key={widget.type}
                        className="widget-item group"
                        onClick={() => onAddWidget(widget.type)}
                        aria-label={`Add ${widget.name} widget`}
                      >
                        <div className="widget-icon">
                          <Plus size={16} />
                        </div>
                        <div className="widget-info">
                          <div className="widget-name">{widget.name}</div>
                          {widget.description && (
                            <div className="widget-description">{widget.description}</div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default WidgetSelector; 