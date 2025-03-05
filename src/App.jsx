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
      return savedLayout ? JSON.parse(savedLayout) : []
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
  const [rowHeight, setRowHeight] = useState(100)
  const [sidebarOpen, setSidebarOpen] = useState(false)

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
      setWindowWidth(window.innerWidth - (sidebarOpen ? 250 : 0));
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
    const newWidget = {
      id: `widget-${Date.now()}`,
      type,
      config: {}
    }
    
    let defaultSize = { w: 2, h: 2 }
    let x = 0
    let y = 0
    
    // Find available position
    if (layout.length > 0) {
      const maxY = Math.max(...layout.map(item => item.y + item.h))
      y = maxY
    }
    
    // Make sure calendar widgets are square by setting equal height and width
    if (type === 'calendar') {
      defaultSize = { w: 2, h: 2 } // Enforce 2x2 for calendars
    }
    
    setWidgets([...widgets, newWidget])
    setLayout([
      ...layout, 
      { 
        i: newWidget.id, 
        x, 
        y, 
        w: defaultSize.w, 
        h: defaultSize.h,
        minW: 1,
        minH: 1,
        maxW: 6,
        maxH: 6,
        isBounded: type === 'calendar' && defaultSize.w === 2 && defaultSize.h === 2,
      }
    ])
  }

  const handleLayoutChange = (newLayout) => {
    setLayout(newLayout)
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-50 transition-colors p-4">
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
            draggableHandle=".widget-drag-handle"
            margin={[10, 10]}
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