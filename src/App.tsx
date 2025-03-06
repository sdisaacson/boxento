import React, { useState, useEffect } from 'react'
import { Plus, Moon, Sun } from 'lucide-react'
import GridLayout from 'react-grid-layout'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'
import { getWidgetComponent, getWidgetConfigByType, WIDGET_REGISTRY } from '@/components/widgets'
import { 
  WidgetConfig, 
  Widget,
  LayoutItem
} from '@/types'
import WidgetErrorBoundary from '@/components/ui/WidgetErrorBoundary'
import WidgetSelector from '@/components/ui/WidgetSelector'

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
  const [sidebarOpen, _setSidebarOpen] = useState<boolean>(false)
  const [widgetSelectorOpen, setWidgetSelectorOpen] = useState<boolean>(false)
  const [widgetCategories, _setWidgetCategories] = useState<WidgetCategory>(() => {
    // Group widgets by category
    const categories: WidgetCategory = {};
    
    WIDGET_REGISTRY.forEach(widget => {
      const category = widget.category || 'Other';
      if (!categories[category]) {
        categories[category] = [];
      }
      categories[category].push(widget);
    });
    
    return categories;
  });
  
  // Save widgets and layout to localStorage when they change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('boxento-widgets', JSON.stringify(widgets))
      localStorage.setItem('boxento-layout', JSON.stringify(layout))
    }
  }, [widgets, layout])
  
  // Apply theme to document
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [theme])
  
  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const bodyPadding = 40; // Account for any potential body margin/padding
      setWindowWidth(window.innerWidth - (sidebarOpen ? 250 : 0) - bodyPadding);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [sidebarOpen]);
  
  // Calculate row height based on window width to ensure square widgets
  const calculateRowHeight = (): number => {
    // Calculate the column width based on available width
    // Total usable width = windowWidth - (containerPadding * 2) - (margin * (cols - 1))
    const totalPadding = 40; // containerPadding (20px * 2)
    const totalMargins = 10 * (12 - 1); // margin (10px) * (cols - 1)
    const usableWidth = windowWidth - totalPadding - totalMargins;
    
    // Calculate column width (each column should be square)
    const columnWidth = usableWidth / 12;
    
    // Return the column width as row height to ensure squares
    // Apply responsiveness scaling similar to before
    if (windowWidth < 600) {
      return columnWidth * 0.8; // Smaller on mobile
    } else if (windowWidth < 1200) {
      return columnWidth * 0.9; // Slightly smaller on tablets
    } else {
      return columnWidth; // Default for desktop
    }
  };
  
  const rowHeight = calculateRowHeight();
  
  const toggleTheme = (): void => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    
    // Apply theme to document
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };
  
  const addWidget = (type: string): void => {
    const widgetConfig = getWidgetConfigByType(type);
    
    if (!widgetConfig) return;
    
    const newWidget: Widget = {
      id: `widget-${Date.now()}`,
      type,
      config: { id: `widget-${Date.now()}` }
    };
    
    // Add widget to state
    setWidgets([...widgets, newWidget]);
    
    // Create layout item for the new widget
    const newLayoutItem: LayoutItem = {
      i: newWidget.id,
      x: 0,
      y: 0, // Will be placed at the bottom
      w: widgetConfig.defaultWidth || 2,
      h: widgetConfig.defaultHeight || 2,
      minW: widgetConfig.minWidth || 2,
      minH: widgetConfig.minHeight || 2
    };
    
    // Add layout item to state
    setLayout([...layout, newLayoutItem]);
    
    // Close widget selector
    setWidgetSelectorOpen(false);
  };
  
  const handleLayoutChange = (newLayout: LayoutItem[]): void => {
    // Enforce minimum size constraints
    const validatedLayout = newLayout.map(item => ({
      ...item,
      w: Math.max(item.w, 2), // Minimum width of 2
      h: Math.max(item.h, 2)  // Minimum height of 2
    }));
    
    setLayout(validatedLayout);
  };
  
  const renderWidget = (widget: Widget): React.ReactNode => {
    const WidgetComponent = getWidgetComponent(widget.type);
    
    if (!WidgetComponent) {
      return (
        <div className="widget-error">
          <p>Widget type "{widget.type}" not found</p>
        </div>
      );
    }
    
    // Find layout item for this widget
    const layoutItem = layout.find(item => item.i === widget.id);
    
    return (
      <WidgetErrorBoundary children={
        <WidgetComponent
          width={layoutItem?.w || 2}
          height={layoutItem?.h || 2}
          config={widget.config}
        />
      } />
    );
  };
  
  // Drag and resize event handlers
  const handleDragStart = (): void => {
    document.body.classList.add('widget-dragging');
  };
  
  const handleDragStop = (): void => {
    // Use setTimeout to prevent flickering when dragging stops
    setTimeout(() => {
      // Add a class to indicate drag is complete (for animations)
      document.body.classList.add('drag-complete');
      
      // Remove the dragging class
      document.body.classList.remove('widget-dragging');
      
      // Remove the complete class after animation
      setTimeout(() => {
        document.body.classList.remove('drag-complete');
      }, 300);
    }, 50);
  };
  
  const handleResizeStart = (): void => {
    document.body.classList.add('widget-resizing');
  };
  
  const handleResizeStop = (): void => {
    // Use setTimeout to prevent flickering when resizing stops
    setTimeout(() => {
      // Add a class to indicate resize is complete (for animations)
      document.body.classList.add('resize-complete');
      
      // Remove the resizing class
      document.body.classList.remove('widget-resizing');
      
      // Remove the complete class after animation
      setTimeout(() => {
        document.body.classList.remove('resize-complete');
      }, 300);
    }, 50);
  };
  
  const toggleWidgetSelector = (): void => {
    setWidgetSelectorOpen(!widgetSelectorOpen);
  }

  return (
    <div className={`app ${theme}`}>
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white overflow-x-hidden">
        <header className="app-header">
          <div className="header-container">
            <div className="header-left">
              <h1 className="app-title">Boxento</h1>
            </div>
            
            <div className="header-right">
              <button 
                onClick={toggleWidgetSelector}
                className="group flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-500 dark:bg-blue-600 text-white 
                         text-sm font-medium transition-all duration-200 shadow-sm hover:shadow-md hover:bg-blue-600 dark:hover:bg-blue-700
                         focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
                title="Add Widget"
                aria-label="Add Widget"
              >
                <Plus size={16} className="transition-transform group-hover:rotate-90" />
                <span>Add Widget</span>
              </button>
              
              <button 
                onClick={toggleTheme}
                className="p-1.5 rounded-full bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-all duration-200
                         text-gray-700 dark:text-yellow-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:ring-offset-2"
                aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
              >
                {theme === 'light' ? (
                  <Moon size={16} className="text-slate-700" />
                ) : (
                  <Sun size={16} className="text-yellow-400" />
                )}
              </button>
            </div>
          </div>
        </header>
        
        <main className="pt-16 md:pt-20">
          <WidgetSelector 
            isOpen={widgetSelectorOpen}
            onClose={toggleWidgetSelector}
            onAddWidget={addWidget}
            widgetRegistry={WIDGET_REGISTRY}
            widgetCategories={widgetCategories}
          />
          
          {widgets.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[80vh] px-4 text-center">
              <div className="w-64 h-64 mb-8 opacity-80">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                  <path d="M21 7.5V6.75C21 5.50736 19.9926 4.5 18.75 4.5H16.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M16.5 19.5H18.75C19.9926 19.5 21 18.4926 21 17.25V16.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M3 16.5V17.25C3 18.4926 4.00736 19.5 5.25 19.5H7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M7.5 4.5H5.25C4.00736 4.5 3 5.50736 3 6.75V7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M10.5 9H13.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M12 7.5V10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M13.5 15H10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <p className="text-2xl font-medium text-gray-600 dark:text-gray-300 mb-8">Your dashboard is ready to be customized</p>
              <button 
                onClick={toggleWidgetSelector}
                className="group flex items-center gap-2 py-3.5 px-6 bg-blue-500 text-white font-medium rounded-xl
                         shadow-md hover:shadow-lg hover:bg-blue-600 hover:-translate-y-0.5 text-base
                         transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:ring-offset-2"
                aria-label="Add your first widget"
              >
                <Plus size={22} className="transition-transform group-hover:rotate-90" /> Add Your First Widget
              </button>
            </div>
          ) : (
            <div className="px-6 max-w-[1600px] mx-auto">
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
        </main>
      </div>
    </div>
  )
}

export default App