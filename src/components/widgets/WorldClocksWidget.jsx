import { useState, useEffect, useRef } from 'react'
import { Clock, Plus, Settings, X } from 'lucide-react'

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
  
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    
    return () => clearInterval(timer)
  }, [])
  
  // Handle click outside with a simple global handler
  useEffect(() => {
    // If settings are not shown, don't add the listener
    if (!showSettings) return;
    
    // Create a handler function that checks if the click is outside
    const handleDocumentClick = (e) => {
      // Don't close if clicking on the settings panel or the settings button
      if (
        (settingsRef.current && settingsRef.current.contains(e.target)) ||
        (settingsButtonRef.current && settingsButtonRef.current.contains(e.target))
      ) {
        return;
      }
      
      // If we get here, the click was outside, so close settings
      setShowSettings(false);
    };
    
    // Add a small delay before adding the listener to avoid the initial click
    // that opened the settings from immediately closing it
    const timeoutId = setTimeout(() => {
      document.addEventListener('click', handleDocumentClick);
    }, 100);
    
    // Return cleanup function
    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('click', handleDocumentClick);
    };
  }, [showSettings]);
  
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
    
    return (
      <div 
        ref={settingsRef}
        className="absolute right-0 top-8 bg-white dark:bg-gray-800 rounded-lg p-4 w-64 shadow-lg z-50"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <h3 className="text-sm font-medium mb-2">World Clocks Settings</h3>
        
        <div className="mb-4 max-h-40 overflow-y-auto">
          {timezones.map(tz => (
            <div key={tz.id} className="flex justify-between items-center mb-2">
              <div>
                <div className="text-sm font-medium">{tz.name}</div>
                <div className="text-xs text-gray-500">{tz.timezone}</div>
              </div>
              <button
                onClick={() => removeTimezone(tz.id)}
                className="text-red-500 hover:text-red-700"
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
        
        {showAddForm ? (
          <div className="mb-4 p-2 bg-gray-100 dark:bg-gray-700 rounded">
            <div className="mb-2">
              <label className="block text-xs mb-1">City Name</label>
              <input
                type="text"
                className="w-full p-1 text-sm bg-white dark:bg-gray-600 rounded border border-gray-300 dark:border-gray-600"
                value={newTimezone.name}
                onChange={(e) => setNewTimezone({...newTimezone, name: e.target.value})}
                placeholder="e.g. Paris"
              />
            </div>
            <div className="mb-2">
              <label className="block text-xs mb-1">Timezone</label>
              <input
                type="text"
                className="w-full p-1 text-sm bg-white dark:bg-gray-600 rounded border border-gray-300 dark:border-gray-600"
                value={newTimezone.timezone}
                onChange={(e) => setNewTimezone({...newTimezone, timezone: e.target.value})}
                placeholder="e.g. Europe/Paris"
              />
            </div>
            <div className="flex gap-2 mt-2">
              <button
                onClick={addTimezone}
                className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
              >
                Add
              </button>
              <button
                onClick={() => {
                  setShowAddForm(false)
                  setNewTimezone({ name: '', timezone: '' })
                }}
                className="text-xs bg-gray-300 dark:bg-gray-600 px-2 py-1 rounded"
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
            <Plus size={14} /> Add Timezone
          </button>
        )}
        
        <div className="flex justify-end">
          <button 
            onClick={() => setShowSettings(false)}
            className="text-sm bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
          >
            Close
          </button>
        </div>
      </div>
    )
  }
  
  return (
    <div className="h-full flex flex-col relative">
      <div className="widget-drag-handle flex justify-between items-center mb-2">
        <div className="flex items-center gap-1">
          <Clock size={16} />
          <h3 className="text-sm font-medium">World Clocks</h3>
        </div>
        <div 
          ref={settingsButtonRef}
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            setShowSettings(!showSettings);
          }}
          onMouseDown={(e) => {
            e.stopPropagation();
          }}
          className="cursor-pointer p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full text-gray-600 dark:text-gray-300 z-20"
        >
          <Settings size={14} />
        </div>
      </div>
      
      {/* Render different views based on widget size */}
      {width <= 1 && height <= 1 
        ? renderCompactView() 
        : width <= 3 && height <= 2 
          ? renderMediumView() 
          : renderFullView()}
      
      {/* Settings dropdown */}
      {renderSettings()}
    </div>
  )
}

export default WorldClocksWidget