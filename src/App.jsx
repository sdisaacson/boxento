import { useState, useEffect } from 'react'
import GridLayout from 'react-grid-layout'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'
import CalendarWidget from './components/widgets/CalendarWidget'
import WeatherWidget from './components/widgets/WeatherWidget'
import WorldClocksWidget from './components/widgets/WorldClocksWidget'
import QuickLinksWidget from './components/widgets/QuickLinksWidget'
import { Sun, Moon, Plus } from 'lucide-react'

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
    const defaultSize = {
      'calendar': { w: 2, h: 2 },
      'weather': { w: 2, h: 2 },
      'worldclocks': { w: 2, h: 2 },
      'quicklinks': { w: 2, h: 2 }
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
    
    // Calculate best position for new widget (fill horizontally first)
    const widgetWidth = defaultSize[type].w;
    const widgetHeight = defaultSize[type].h;
    
    // Add layout position - let react-grid-layout handle exact positioning
    setLayout([
      ...layout,
      {
        i: id,
        x: 0, // Let library determine placement
        y: 0, // Let library determine placement
        w: widgetWidth,
        h: widgetHeight,
        minW: 2, // Minimum width of 2
        minH: 2, // Minimum height of 2
        maxW: 6,
        maxH: 6
      }
    ])
  }

  const handleLayoutChange = (newLayout) => {
    // Only enforce minimum size of 2x2 for widgets that are explicitly being resized
    // Let the library handle everything else naturally
    const updatedLayout = newLayout.map(item => {
      // Only modify items that were explicitly resized below our minimum
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
    
    switch(widget.type) {
      case 'calendar':
        return <CalendarWidget width={w} height={h} config={widget.config} />
      case 'weather':
        return <WeatherWidget width={w} height={h} config={widget.config} />
      case 'worldclocks':
        return <WorldClocksWidget width={w} height={h} config={widget.config} />
      case 'quicklinks':
        return <QuickLinksWidget width={w} height={h} config={widget.config} />
      default:
        return <div>Unknown widget type</div>
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white overflow-x-hidden">
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Boxento</h1>
        <div className="flex gap-2">
          <button 
            onClick={toggleTheme}
            className="p-2 rounded-lg bg-white dark:bg-gray-800 shadow hover:shadow-md transition-all"
          >
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>
        </div>
      </header>
      
      {widgets.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[80vh]">
          <p className="text-xl mb-4">You can add widgets</p>
          <div className="flex gap-2 flex-wrap justify-center">
            <button 
              onClick={() => addWidget('calendar')}
              className="flex items-center gap-1 px-3 py-2 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-all"
            >
              <Plus size={16} /> Calendar
            </button>
            <button 
              onClick={() => addWidget('weather')}
              className="flex items-center gap-1 px-3 py-2 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-all"
            >
              <Plus size={16} /> Weather
            </button>
            <button 
              onClick={() => addWidget('worldclocks')}
              className="flex items-center gap-1 px-3 py-2 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-all"
            >
              <Plus size={16} /> World Clocks
            </button>
            <button 
              onClick={() => addWidget('quicklinks')}
              className="flex items-center gap-1 px-3 py-2 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-all"
            >
              <Plus size={16} /> Quick Links
            </button>
          </div>
        </div>
      ) : (
        <div>
          <div className="mb-4 flex justify-end">
            <div className="flex gap-2">
              <button 
                onClick={() => addWidget('calendar')}
                className="flex items-center gap-1 px-3 py-2 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-all"
              >
                <Plus size={16} /> Calendar
              </button>
              <button 
                onClick={() => addWidget('weather')}
                className="flex items-center gap-1 px-3 py-2 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-all"
              >
                <Plus size={16} /> Weather
              </button>
              <button 
                onClick={() => addWidget('worldclocks')}
                className="flex items-center gap-1 px-3 py-2 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-all"
              >
                <Plus size={16} /> World Clocks
              </button>
              <button 
                onClick={() => addWidget('quicklinks')}
                className="flex items-center gap-1 px-3 py-2 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-all"
              >
                <Plus size={16} /> Quick Links
              </button>
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