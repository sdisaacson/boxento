import { useState, useEffect, Component } from 'react'
import GridLayout from 'react-grid-layout'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'
import { widgetConfigs, getWidgetConfigByType, getWidgetComponent } from './components/widgets'
import { Sun, Moon, Plus, AlertTriangle } from 'lucide-react'

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

  // Add this function to render widget buttons
  const renderWidgetButtons = () => {
    return widgetConfigs.map(config => (
      <button 
        key={config.type}
        onClick={() => addWidget(config.type)}
        className="flex items-center gap-1 px-3 py-2 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-all"
      >
        <Plus size={16} /> {config.name}
      </button>
    ));
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white overflow-x-hidden">
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Boxento</h1>
        <div className="flex gap-2">
          <button 
            onClick={toggleTheme}
            className="p-2 rounded-full bg-white dark:bg-gray-800 shadow hover:shadow-md transition-all"
          >
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>
        </div>
      </header>
      
      {widgets.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[80vh]">
          <p className="text-xl mb-4">You can add widgets</p>
          <div className="flex gap-2 flex-wrap justify-center">
            {renderWidgetButtons()}
          </div>
        </div>
      ) : (
        <div>
          <div className="mb-4 flex justify-end">
            <div className="flex gap-2">
              {renderWidgetButtons()}
            </div>
          </div>
          
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