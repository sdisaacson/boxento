import { useState, useEffect, useRef } from 'react'
import { Clock, Plus, Trash, X, CircleDot } from 'lucide-react'
import { createPortal } from 'react-dom'
import WidgetHeader from '../ui/WidgetHeader'

const WorldClocksWidget = ({ width, height, config }) => {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [timezones, setTimezones] = useState(config?.timezones || [
    { id: 1, name: 'New York', timezone: 'America/New_York' },
    { id: 2, name: 'London', timezone: 'Europe/London' },
    { id: 3, name: 'Tokyo', timezone: 'Asia/Tokyo' }
  ])
  const [showSettings, setShowSettings] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newTimezone, setNewTimezone] = useState({ name: '', timezone: '' })
  const settingsRef = useRef(null)
  const settingsButtonRef = useRef(null)
  const widgetRef = useRef(null)
  
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    
    return () => clearInterval(timer)
  }, [])
  
  // No need for click outside handler as the modal backdrop handles this
  
  const formatTime = (date, timezone) => {
    return date.toLocaleTimeString('en-US', { 
      timeZone: timezone,
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true
    })
  }
  
  const addTimezone = () => {
    if (newTimezone.name && newTimezone.timezone) {
      const newId = Math.max(0, ...timezones.map(tz => tz.id)) + 1
      setTimezones([...timezones, { ...newTimezone, id: newId }])
      setNewTimezone({ name: '', timezone: '' })
      setShowAddForm(false)
    }
  }
  
  const removeTimezone = (id) => {
    setTimezones(timezones.filter(tz => tz.id !== id))
  }
  
  const renderCompactView = () => {
    return (
      <div className="flex flex-col justify-center h-full">
        <div className="text-center">
          <div className="text-xl font-medium">
            {formatTime(currentTime, timezones[0]?.timezone || 'UTC')}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {timezones[0]?.name || 'Local'}
          </div>
        </div>
      </div>
    )
  }
  
  const renderMediumView = () => {
    return (
      <div className="flex flex-col h-full">
        {timezones.slice(0, 3).map((tz) => (
          <div key={tz.id} className="flex justify-between items-center mb-2 last:mb-0">
            <div className="text-sm">{tz.name}</div>
            <div className="text-sm font-medium">{formatTime(currentTime, tz.timezone)}</div>
          </div>
        ))}
      </div>
    )
  }
  
  const renderSettings = () => {
    if (!showSettings) return null;
    
    return createPortal(
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]"
        onClick={() => setShowSettings(false)}
      >
        <div 
          ref={settingsRef}
          className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96 shadow-lg max-w-[90vw] max-h-[90vh] overflow-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">World Clocks Settings</h3>
            <button 
              onClick={() => setShowSettings(false)}
              className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              <X size={20} />
            </button>
          </div>
          
          <div className="mb-4 max-h-60 overflow-y-auto">
            {timezones.map(tz => (
              <div key={tz.id} className="flex justify-between items-center py-2 border-b dark:border-gray-700 last:border-b-0">
                <div>
                  <div className="text-sm font-medium">{tz.name}</div>
                  <div className="text-xs text-gray-500">{tz.timezone}</div>
                </div>
                <button
                  onClick={() => removeTimezone(tz.id)}
                  className="text-red-500 hover:text-red-700 p-1"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
          
          {showAddForm ? (
            <div className="mb-6 p-3 bg-gray-100 dark:bg-gray-700 rounded">
              <div className="mb-3">
                <label className="block text-sm mb-1">City Name</label>
                <input
                  type="text"
                  className="w-full p-2 text-sm bg-white dark:bg-gray-600 rounded border border-gray-300 dark:border-gray-600"
                  value={newTimezone.name}
                  onChange={(e) => setNewTimezone({...newTimezone, name: e.target.value})}
                  placeholder="e.g. Paris"
                />
              </div>
              <div className="mb-3">
                <label className="block text-sm mb-1">Timezone</label>
                <input
                  type="text"
                  className="w-full p-2 text-sm bg-white dark:bg-gray-600 rounded border border-gray-300 dark:border-gray-600"
                  value={newTimezone.timezone}
                  onChange={(e) => setNewTimezone({...newTimezone, timezone: e.target.value})}
                  placeholder="e.g. Europe/Paris"
                />
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  onClick={addTimezone}
                  className="px-4 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Add
                </button>
                <button
                  onClick={() => {
                    setShowAddForm(false)
                    setNewTimezone({ name: '', timezone: '' })
                  }}
                  className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-1 text-sm text-blue-500 hover:text-blue-700 mb-4"
            >
              <Plus size={16} /> Add Timezone
            </button>
          )}
          
          <div className="flex justify-end mt-4">
            <button 
              onClick={() => setShowSettings(false)}
              className="px-4 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Close
            </button>
          </div>
        </div>
      </div>,
      document.body
    );
  }
  
  // Render different views based on widget size
  const renderContent = () => {
    // Check for different size combinations
    if (width === 2 && height === 2) {
      return renderDefaultView(); // 2x2 default view
    } else if (width > 2 && height === 2) {
      return renderWideView(); // Wide view (e.g., 4x2)
    } else if (width === 2 && height > 2) {
      return renderTallView(); // Tall view (e.g., 2x4)
    } else {
      return renderFullView(); // Large view (e.g., 4x4, 6x6)
    }
  };

  // Default view for 2x2 layout
  const renderDefaultView = () => {
    return (
      <div className="h-full pt-1">
        <div className="flex flex-col gap-3">
          {timezones.slice(0, 3).map(tz => (
            <div key={tz.id} className="flex justify-between items-center p-1.5 hover:bg-gray-50 dark:hover:bg-gray-800 rounded">
              <div className="text-sm font-medium truncate mr-2">{tz.name}</div>
              <div className="text-sm font-medium whitespace-nowrap">
                {formatTime(currentTime, tz.timezone)}
              </div>
            </div>
          ))}
        </div>
        {timezones.length === 0 && (
          <div className="flex items-center justify-center h-full text-gray-400 text-sm">
            No timezones added
          </div>
        )}
      </div>
    )
  }
  
  // Wide view for layouts like 3x2, 4x2, 6x2
  const renderWideView = () => {
    // Determine grid layout based on width
    let columns;
    if (width === 3) {
      columns = 1; // Single column for 3x2
    } else if (width <= 4) {
      columns = 2;
    } else {
      columns = 3;
    }
    
    // Calculate how many timezones to show
    const maxTimezones = width === 3 ? 3 : columns * 2;
    
    return (
      <div className="h-full p-1">
        <div className={`grid grid-cols-${columns} gap-1 h-full`}>
          {timezones.slice(0, maxTimezones).map(tz => (
            <div 
              key={tz.id} 
              className={`flex ${width === 3 ? 'justify-between' : 'flex-col justify-center'} 
                items-center p-2 m-0.5 hover:bg-gray-50 dark:hover:bg-gray-800 rounded 
                border border-gray-100 dark:border-gray-700`}
            >
              {width === 3 ? (
                // 3x2 layout: horizontal layout with time on right
                <>
                  <div className="flex flex-col">
                    <div className="text-sm font-medium truncate mr-2">{tz.name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {formatTimezoneName(tz.timezone)}
                    </div>
                  </div>
                  <div className="text-base font-medium whitespace-nowrap">
                    {formatTime(currentTime, tz.timezone)}
                  </div>
                </>
              ) : (
                // Wider layouts: vertical layout with time below
                <>
                  <div className="flex flex-col text-center">
                    <div className="text-base font-medium truncate">{tz.name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                      {formatTimezoneName(tz.timezone)}
                    </div>
                    <div className="text-lg font-medium whitespace-nowrap">
                      {formatTime(currentTime, tz.timezone)}
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
        {timezones.length === 0 && (
          <div className="flex items-center justify-center h-full text-gray-400 text-sm">
            No timezones added
          </div>
        )}
      </div>
    )
  }
  
  // Formats timezone string like "America/New_York" to "America, New York"
  const formatTimezoneName = (timezone) => {
    if (!timezone) return '';
    return timezone
      .replace('_', ' ')
      .replace('/', ', ');
  }
  
  // Tall view for layouts like 2x3
  const renderTallView = () => {
    return (
      <div className="h-full p-2">
        <div className="flex flex-col divide-y divide-gray-100 dark:divide-gray-800">
          {timezones.slice(0, 3).map(tz => (
            <div key={tz.id} className="py-3 px-2">
              <div className="flex justify-between">
                <div className="text-base font-medium">{tz.name}</div>
                <div className="text-lg font-medium">
                  {formatTime(currentTime, tz.timezone)}
                </div>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {formatTimezoneName(tz.timezone)}
              </div>
            </div>
          ))}
        </div>
        {timezones.length === 0 && (
          <div className="flex items-center justify-center h-full text-gray-400 text-sm">
            No timezones added
          </div>
        )}
      </div>
    )
  }

  // Full view for large layouts
  const renderFullView = () => {
    // For full view, we'll create a more detailed layout with timezones grouped by region
    
    // Group timezones by continent/region
    const groupedTimezones = timezones.reduce((acc, tz) => {
      // Extract continent from timezone (e.g., "America/New_York" -> "America")
      const parts = tz.timezone.split('/');
      const continent = parts[0];
      
      if (!acc[continent]) {
        acc[continent] = [];
      }
      
      acc[continent].push(tz);
      return acc;
    }, {});
    
    // Get all continents
    const continents = Object.keys(groupedTimezones);
    
    return (
      <div className="h-full overflow-auto">
        {continents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {continents.map(continent => (
              <div key={continent} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                <h3 className="text-sm font-medium mb-2">{continent}</h3>
                <div className="flex flex-col gap-2">
                  {groupedTimezones[continent].map(tz => (
                    <div key={tz.id} className="flex justify-between items-center p-2 hover:bg-white dark:hover:bg-gray-700 rounded">
                      <div className="text-sm truncate mr-2">{tz.name}</div>
                      <div className="text-sm font-medium whitespace-nowrap">
                        {formatTime(currentTime, tz.timezone)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            No timezones added
          </div>
        )}
      </div>
    );
  }

  return (
    <div ref={widgetRef} className="widget-container h-full flex flex-col">
      <WidgetHeader 
        title="World Clocks" 
        onSettingsClick={() => setShowSettings(!showSettings)}
      />
      
      <div className="flex-1 overflow-hidden">
        {renderContent()}
      </div>
      
      {/* Settings modal */}
      {renderSettings()}
    </div>
  )
}

// Widget configuration for registration
export const worldClocksWidgetConfig = {
  type: 'worldclocks',
  name: 'World Clocks',
  description: 'Shows times in multiple timezones around the world',
  defaultSize: { w: 2, h: 2 },
  minSize: { w: 2, h: 2 },
  maxSize: { w: 6, h: 6 }
}

export default WorldClocksWidget