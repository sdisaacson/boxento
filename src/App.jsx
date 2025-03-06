import { useState, useEffect, Component } from 'react'
import GridLayout from 'react-grid-layout'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'
import { widgetConfigs, getWidgetConfigByType, getWidgetComponent } from './components/widgets'
import { Sun, Moon, Plus, AlertTriangle, ChevronDown, Search, X, Grid, Menu } from 'lucide-react'

/**
 * Error Boundary component to catch errors in widget rendering
 */
class WidgetErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Widget error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={20} />
            <h3 className="font-medium">Widget Error</h3>
          </div>
          <p className="text-sm opacity-80">
            {this.state.error?.message || "An error occurred while rendering this widget"}
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}

function App() {
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') || 'light'
    }
    return 'light'
  })
  
  const [layout, setLayout] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedLayout = localStorage.getItem('boxento-layout')
      if (savedLayout) {
        // Enforce 2x2 minimum size on any existing layout items
        const parsedLayout = JSON.parse(savedLayout);
        return parsedLayout.map(item => ({
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
  
  const [widgets, setWidgets] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedWidgets = localStorage.getItem('boxento-widgets')
      return savedWidgets ? JSON.parse(savedWidgets) : []
    }
    return []
  })

  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth - 40 : 1200)
  const [windowHeight, setWindowHeight] = useState(typeof window !== 'undefined' ? window.innerHeight : 800)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [widgetSelectorOpen, setWidgetSelectorOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [widgetCategories, setWidgetCategories] = useState(() => {
    // Group widgets by category
    const categories = {};
    widgetConfigs.forEach(widget => {
      const category = widget.category || 'General';
      if (!categories[category]) {
        categories[category] = [];
      }
      categories[category].push(widget);
    });
    return categories;
  });
  
  // Calculate the rowHeight to match column width for square cells
  const calculateRowHeight = () => {
    const totalMarginWidth = 11 * 10; // 11 margins between 12 columns
    const availableWidth = windowWidth - 40 - totalMarginWidth; // Subtract container padding and margins
    const columnWidth = availableWidth / 12;
    return columnWidth; // This makes each cell square
  }
  
  const rowHeight = calculateRowHeight();

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
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

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light')
  }

  const addWidget = (type) => {
    const id = `${type}-${Date.now()}`;
    const widgetConfig = getWidgetConfigByType(type);
    
    if (!widgetConfig) {
      console.error(`Widget type "${type}" not found in registry`);
      return;
    }
    
    // Add default config
    setWidgets([
      ...widgets,
      {
        id,
        type,
        config: { id }
      }
    ])
    
    // Use the defaultSize from the widget config
    const widgetWidth = widgetConfig.defaultSize.w;
    const widgetHeight = widgetConfig.defaultSize.h;
    
    // Add layout position - let react-grid-layout handle exact positioning
    setLayout([
      ...layout,
      {
        i: id,
        x: 0, // Let library determine placement
        y: 0, // Let library determine placement
        w: widgetWidth,
        h: widgetHeight,
        minW: widgetConfig.minSize?.w || 2, // Minimum width
        minH: widgetConfig.minSize?.h || 2, // Minimum height
        maxW: widgetConfig.maxSize?.w || 6,
        maxH: widgetConfig.maxSize?.h || 6
      }
    ])
  }

  const handleLayoutChange = (newLayout) => {
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

  const renderWidget = (widget) => {
    const layoutItem = layout.find(item => item.i === widget.id)
    if (!layoutItem) return null
    
    const { w, h } = layoutItem
    
    // Get the widget component from the registry
    const WidgetComponent = getWidgetComponent(widget.type);
    
    if (!WidgetComponent) {
      return <div className="p-4 text-red-500">Unknown widget type: {widget.type}</div>
    }
    
    return (
      <WidgetErrorBoundary>
        <WidgetComponent width={w} height={h} config={widget.config} />
      </WidgetErrorBoundary>
    )
  }

  // Handle drag and resize start/stop for text selection prevention
  const handleDragStart = () => {
    document.body.classList.add('dragging-active');
  }
  
  const handleDragStop = () => {
    document.body.classList.remove('dragging-active');
  }
  
  const handleResizeStart = () => {
    document.body.classList.add('dragging-active');
  }
  
  const handleResizeStop = () => {
    document.body.classList.remove('dragging-active');
  }

  const toggleWidgetSelector = () => {
    setWidgetSelectorOpen(!widgetSelectorOpen);
    setSearchTerm('');
  }

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  }

  const filteredWidgets = searchTerm 
    ? widgetConfigs.filter(widget => 
        widget.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (widget.description && widget.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (widget.category && widget.category.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : [];

  const renderWidgetSelector = () => {
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
              value={searchTerm}
              onChange={handleSearchChange}
              className="widget-search-input"
            />
          </div>
          
          {searchTerm ? (
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
                  <p className="no-results">No widgets found matching "{searchTerm}"</p>
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
            height={windowHeight}
            onLayoutChange={handleLayoutChange}
            onDragStart={handleDragStart}
            onDragStop={handleDragStop}
            onResizeStart={handleResizeStart}
            onResizeStop={handleResizeStop}
            margin={[10, 10]}
            containerPadding={[20, 20]}
          >
            {widgets.map(widget => {
              const layoutItem = layout.find(item => item.i === widget.id);
              
              return (
                <div 
                  key={widget.id} 
                  className="grid-item-container"
                >
                  {renderWidget(widget)}
                </div>
              );
            })}
          </GridLayout>
        </div>
      )}
    </div>
  )
}

export default App