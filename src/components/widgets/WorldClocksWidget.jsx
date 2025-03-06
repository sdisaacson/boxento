import { useState, useEffect, useRef } from 'react'
import { Clock, Plus, Trash, X, CircleDot } from 'lucide-react'
import { createPortal } from 'react-dom'

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
  
  const renderFullView = () => {
    return (
      <div className="flex flex-col h-full">
        {timezones.map((tz) => (
          <div key={tz.id} className="flex justify-between items-center py-2 border-b dark:border-gray-700 last:border-b-0">
            <div className="flex items-center">
              <Clock size={14} className="mr-2 text-gray-500 dark:text-gray-400" />
              <span>{tz.name}</span>
            </div>
            <div className="flex items-center">
              <span className="font-medium mr-2">{formatTime(currentTime, tz.timezone)}</span>
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  removeTimezone(tz.id);
                }}
                className="text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        ))}
        
        {showAddForm ? (
          <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded">
            <div className="flex mb-2">
              <input
                type="text"
                placeholder="City name"
                className="flex-1 p-1 text-sm rounded mr-1 border dark:bg-gray-700 dark:border-gray-600"
                value={newTimezone.name}
                onChange={(e) => setNewTimezone({...newTimezone, name: e.target.value})}
              />
              <input
                type="text"
                placeholder="Timezone (e.g., Europe/Paris)"
                className="flex-1 p-1 text-sm rounded border dark:bg-gray-700 dark:border-gray-600"
                value={newTimezone.timezone}
                onChange={(e) => setNewTimezone({...newTimezone, timezone: e.target.value})}
              />
            </div>
            <div className="flex justify-end">
              <button 
                onClick={() => setShowAddForm(false)}
                className="text-xs mr-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                Cancel
              </button>
              <button 
                onClick={addTimezone}
                className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
              >
                Add
              </button>
            </div>
          </div>
        ) : (
          <button 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowAddForm(true);
            }}
            className="mt-2 flex items-center justify-center text-sm text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
          >
            <Plus size={14} className="mr-1" /> Add Timezone
          </button>
        )}
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

  // Default view for 2x2 layout (previously renderMediumView)
  const renderDefaultView = () => {
    return (
      <div className="h-full">
        <div className="flex flex-col gap-2">
          {timezones.slice(0, 3).map(tz => (
            <div key={tz.id} className="flex justify-between items-center">
              <div className="text-sm">{tz.name}</div>
              <div className="text-sm font-medium">
                {formatTime(currentTime, tz.timezone)}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }
  
  // Wide view for layouts like 4x2, 6x2
  const renderWideView = () => {
    return (
      <div className="h-full">
        <div className="grid grid-cols-2 gap-3">
          {timezones.slice(0, 6).map(tz => (
            <div key={tz.id} className="flex justify-between items-center">
              <div className="text-sm">{tz.name}</div>
              <div className="text-sm font-medium">
                {formatTime(currentTime, tz.timezone)}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }
  
  // Tall view for layouts like 2x4, 2x6
  const renderTallView = () => {
    return (
      <div className="h-full">
        <div className="flex flex-col gap-2">
          {timezones.slice(0, 6).map(tz => (
            <div key={tz.id} className="flex justify-between items-center">
              <div className="text-sm">{tz.name}</div>
              <div className="text-sm font-medium">
                {formatTime(currentTime, tz.timezone)}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div ref={widgetRef} className="widget-container">
      <div className="flex justify-end items-center mb-2">
        <button 
          className="settings-button p-1 hover:bg-gray-100 dark:hover:bg-gray-700"
          onClick={() => setShowSettings(!showSettings)}
        >
          <CircleDot size={16} className="text-gray-500" />
        </button>
      </div>
      
      {/* Use the renderContent function to determine which view to show based on dimensions */}
      {renderContent()}
      
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