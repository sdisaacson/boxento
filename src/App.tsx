import React, { useState, useEffect } from 'react'
import { Settings, Plus, Search, Sun, Moon, X, Grid, Menu, AlertTriangle, ChevronDown } from 'lucide-react'
import GridLayout, { Layout } from 'react-grid-layout'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'
import { getWidgetComponent, getWidgetConfigByType, WIDGET_REGISTRY, EnhancedWidgetConfig } from '@/components/widgets'
import { 
  WidgetProps, 
  WidgetConfig, 
  Widget,
  LayoutItem,
  WidgetSize
} from '@/types'

interface WidgetErrorBoundaryProps {
  children: React.ReactNode;
}

interface WidgetErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary component to catch errors in widget rendering
 */
class WidgetErrorBoundary extends React.Component<WidgetErrorBoundaryProps, WidgetErrorBoundaryState> {
  constructor(props: WidgetErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): WidgetErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('Widget error:', error, errorInfo);
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 rounded-lg">
          <AlertTriangle className="mb-2" size={24} />
          <h3 className="text-sm font-medium mb-1">Widget Error</h3>
          <p className="text-xs text-center">
            {this.state.error?.message || "An error occurred while rendering this widget"}
          </p>
        </div>
      );
    }
    
    return this.props.children;
  }
}

interface WidgetCategory {
  [category: string]: WidgetConfig[];
}

function App() {
  // Add a class to the body for dark mode background
  useEffect(() => {
    document.body.className = 'bg-gray-100 dark:bg-slate-900 min-h-screen';
    return () => {
      document.body.className = '';
    };
  }, []);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      // Check system preference if no theme is set
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme) return savedTheme as 'light' | 'dark';
      
      // Use system preference as default if available
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      return prefersDark ? 'dark' : 'light';
    }
    return 'light'
  })
  
  const [layout, setLayout] = useState<LayoutItem[]>(() => {
    if (typeof window !== 'undefined') {
      const savedLayout = localStorage.getItem('boxento-layout')
      if (savedLayout) {
        // Enforce 2x2 minimum size on any existing layout items
        const parsedLayout = JSON.parse(savedLayout);
        return parsedLayout.map((item: LayoutItem) => ({
          ...item,
          w: Math.max(item.w, 2),
          h: Math.max(item.h, 2),
          minW: 2,
          minH: 2
        }));
      }
      return []
    }
    return []
  })
  
  const [widgets, setWidgets] = useState<Widget[]>(() => {
    if (typeof window !== 'undefined') {
      const savedWidgets = localStorage.getItem('boxento-widgets')
      return savedWidgets ? JSON.parse(savedWidgets) : []
    }
    return []
  })

  const [windowWidth, setWindowWidth] = useState<number>(typeof window !== 'undefined' ? window.innerWidth - 40 : 1200)
  const [windowHeight, setWindowHeight] = useState<number>(typeof window !== 'undefined' ? window.innerHeight : 800)
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false)
  const [widgetSelectorOpen, setWidgetSelectorOpen] = useState<boolean>(false)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [widgetCategories, setWidgetCategories] = useState<WidgetCategory>(() => {
    // Group widgets by category
    const categories: WidgetCategory = {};
    WIDGET_REGISTRY.forEach(widget => {
      const category = widget.category || 'General';
      if (!categories[category]) {
        categories[category] = [];
      }
      categories[category].push(widget);
    });
    return categories;
  });
  
  // Calculate the rowHeight to match column width for square cells
  const calculateRowHeight = (): number => {
    const totalMarginWidth = 11 * 10; // 11 margins between 12 columns
    const availableWidth = windowWidth - 40 - totalMarginWidth; // Subtract container padding and margins
    const columnWidth = availableWidth / 12;
    return columnWidth; // This makes each cell square
  }
  
  const rowHeight: number = calculateRowHeight();

  useEffect(() => {
    // Apply dark mode class to both html and body
    document.documentElement.classList.toggle('dark', theme === 'dark')
    document.body.className = theme === 'dark' ? 'bg-slate-900' : 'bg-gray-100'
    
    // Set CSS variables with refined color palette for dark mode using slate colors
    document.documentElement.style.setProperty('--app-background', theme === 'dark' ? '#0f172a' : '#ffffff') // slate-900
    document.documentElement.style.setProperty('--widget-background', theme === 'dark' ? '#1e293b' : '#ffffff') // slate-800
    document.documentElement.style.setProperty('--text-primary', theme === 'dark' ? '#f1f5f9' : '#334155') // slate-100 : slate-700
    document.documentElement.style.setProperty('--text-secondary', theme === 'dark' ? '#94a3b8' : '#64748b') // slate-400 : slate-500
    
    // Add transition classes for smooth theme switching
    document.documentElement.classList.add('transition-colors', 'duration-200')
    setTimeout(() => document.documentElement.classList.remove('transition-colors', 'duration-200'), 200)
    
    // Save to localStorage
    localStorage.setItem('theme', theme)
  }, [theme])

  useEffect(() => {
    localStorage.setItem('boxento-layout', JSON.stringify(layout))
  }, [layout])

  useEffect(() => {
    localStorage.setItem('boxento-widgets', JSON.stringify(widgets))
  }, [widgets])

  useEffect(() => {
    // Set window dimensions on resize
    const handleResize = () => {
      // Account for any body margin/padding plus a small safety margin
      const bodyPadding = 40; // Account for any potential body margin/padding
      setWindowWidth(window.innerWidth - (sidebarOpen ? 250 : 0) - bodyPadding);
      setWindowHeight(window.innerHeight);
    };

    // Call once initially
    handleResize();

    // Add event listener
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [sidebarOpen]);

  const toggleTheme = (): void => {
    setTheme(theme === 'light' ? 'dark' : 'light')
    // Apply smooth transition when toggling theme
    document.documentElement.classList.add('transition-colors', 'duration-300')
    setTimeout(() => {
      document.documentElement.classList.remove('transition-colors', 'duration-300')
    }, 300)
  }

  const addWidget = (type: string): void => {
    const id = `widget-${Date.now()}`
    const widgetConfig = getWidgetConfigByType(type)
    
    if (!widgetConfig) return
    
    // Add widget to state
    setWidgets([
      ...widgets,
      {
        id,
        type,
        config: { id }
      }
    ])
    
    // Use the widget config for dimensions
    const widgetWidth = widgetConfig.defaultWidth;
    const widgetHeight = widgetConfig.defaultHeight;
    
    // Add layout position - let react-grid-layout handle exact positioning
    setLayout([
      ...layout,
      {
        i: id,
        x: 0, // Let library determine placement
        y: 0, // Let library determine placement
        w: widgetWidth,
        h: widgetHeight,
        minW: widgetConfig.minWidth || 1, // Minimum width
        minH: widgetConfig.minHeight || 1, // Minimum height
        maxW: 6, // Maximum width
        maxH: 6  // Maximum height
      }
    ])
  }

  const handleLayoutChange = (newLayout: LayoutItem[]): void => {
    // Enforce minimum size of 2x2 for all widgets
    const updatedLayout = newLayout.map(item => {
      // Ensure all widgets are at least 2x2
      if (item.w < 2 || item.h < 2) {
        return {
          ...item,
          w: Math.max(item.w, 2),
          h: Math.max(item.h, 2)
        };
      }
      // Otherwise, leave the item exactly as the library calculated it
      return item;
    });
    
    setLayout(updatedLayout);
  }

  const renderWidget = (widget: Widget): React.ReactNode => {
    const layoutItem = layout.find(item => item.i === widget.id)
    if (!layoutItem) return null
    
    const { w, h } = layoutItem
    
    // Get the widget component from the registry
    const WidgetComponent = getWidgetComponent(widget.type);
    
    if (!WidgetComponent) {
      return <div className="p-4 text-red-500">Unknown widget type: {widget.type}</div>
    }
    
    return (
      <WidgetErrorBoundary children={
        <WidgetComponent width={w} height={h} config={widget.config} />
      }>
      </WidgetErrorBoundary>
    )
  }

  // Handle drag and resize start/stop for text selection prevention
  const handleDragStart = (): void => {
    document.body.classList.add('dragging-active');
  }
  
  const handleDragStop = (): void => {
    document.body.classList.remove('dragging-active');
    
    // Add a small delay before allowing clicks to work again
    // This helps prevent accidental clicks when dragging ends
    setTimeout(() => {
      document.body.classList.add('drag-complete');
      
      // Remove the class after a short period
      setTimeout(() => {
        document.body.classList.remove('drag-complete');
      }, 300);
    }, 50);
  }
  
  const handleResizeStart = (): void => {
    document.body.classList.add('dragging-active');
  }
  
  const handleResizeStop = (): void => {
    document.body.classList.remove('dragging-active');
    
    // Add a small delay before allowing clicks to work again
    // This helps prevent accidental clicks when resizing ends
    setTimeout(() => {
      document.body.classList.add('drag-complete');
      
      // Remove the class after a short period
      setTimeout(() => {
        document.body.classList.remove('drag-complete');
      }, 300);
    }, 50);
  }

  const toggleWidgetSelector = (): void => {
    setWidgetSelectorOpen(!widgetSelectorOpen);
    setSearchQuery('');
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setSearchQuery(e.target.value);
  };

  const filteredWidgets = searchQuery 
    ? WIDGET_REGISTRY.filter(widget => 
        widget.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (widget.description && widget.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (widget.category && widget.category.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : [];

  const renderWidgetSelector = (): React.ReactNode => {
    if (!widgetSelectorOpen) return null;
    
    return (
      <div className="widget-selector-overlay" onClick={toggleWidgetSelector}>
        <div className="widget-selector-modal" onClick={e => e.stopPropagation()}>
          <div className="widget-selector-header">
            <h3 className="text-lg font-semibold">Add Widget</h3>
            <button onClick={toggleWidgetSelector} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
              <X size={20} />
            </button>
          </div>
          
          <div className="widget-selector-search">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Search widgets..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="widget-search-input"
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
                      onClick={() => {
                        addWidget(widget.type);
                        toggleWidgetSelector();
                      }}
                      className="widget-item"
                    >
                      <div className="widget-icon">
                        {widget.icon || <Grid size={24} />}
                      </div>
                      <div className="widget-info">
                        <span className="widget-name">{widget.name}</span>
                        {widget.description && (
                          <span className="widget-description">{widget.description}</span>
                        )}
                      </div>
                    </button>
                  ))
                ) : (
                  <p className="no-results">No widgets found matching "{searchQuery}"</p>
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
                        onClick={() => {
                          addWidget(widget.type);
                          toggleWidgetSelector();
                        }}
                        className="widget-item"
                      >
                        <div className="widget-icon">
                          {widget.icon || <Grid size={24} />}
                        </div>
                        <div className="widget-info">
                          <span className="widget-name">{widget.name}</span>
                          {widget.description && (
                            <span className="widget-description">{widget.description}</span>
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

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white overflow-x-hidden">
      <header className="app-header">
        <div className="header-container">
          <div className="header-left">
            <h1 className="app-title">Boxento</h1>
          </div>
          
          <div className="header-right">
            <button 
              onClick={toggleWidgetSelector}
              className="header-button"
              title="Add Widget"
            >
              <Plus size={20} />
              <span>Add Widget</span>
              <ChevronDown size={16} />
            </button>
            
            <button 
              onClick={toggleTheme}
              className="header-button"
              title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            >
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>
          </div>
        </div>
      </header>
      
      {renderWidgetSelector()}
      
      {widgets.length === 0 ? (
        <div className="empty-dashboard-cta">
          <p className="text-xl mb-6">Your dashboard is empty</p>
          <button 
            onClick={toggleWidgetSelector}
            className="add-widget-button"
          >
            <Plus size={20} /> Add Your First Widget
          </button>
        </div>
      ) : (
        <div className="dashboard-container">
          <GridLayout
            className="layout"
            layout={layout}
            cols={12}
            rowHeight={rowHeight}
            width={windowWidth}
            onLayoutChange={handleLayoutChange}
            onDragStart={handleDragStart}
            onDragStop={handleDragStop}
            onResizeStart={handleResizeStart}
            onResizeStop={handleResizeStop}
            margin={[10, 10]}
            containerPadding={[20, 20]}
            draggableHandle=".widget-drag-handle"
            draggableCancel=".settings-button"
            children={widgets.map(widget => {
              const layoutItem = layout.find(item => item.i === widget.id);
              
              return (
                <div 
                  key={widget.id} 
                  className="grid-item-container"
                >
                  {renderWidget(widget)}
                </div>
              )
            })}
          />
        </div>
      )}
    </div>
  )
}

export default App