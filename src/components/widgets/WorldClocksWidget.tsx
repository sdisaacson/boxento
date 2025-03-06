import { useState, useEffect, useRef } from 'react'
import { Clock, Plus, Trash, X, CircleDot } from 'lucide-react'
import { createPortal } from 'react-dom'
import WidgetHeader from '../ui/WidgetHeader'

interface TimezoneItem {
  id: number
  name: string
  timezone: string
}

interface WorldClocksWidgetProps {
  width: number
  height: number
  config?: {
    timezones?: TimezoneItem[]
  }
}

const WorldClocksWidget = ({ width, height, config }: WorldClocksWidgetProps) => {
  const [currentTime, setCurrentTime] = useState<Date>(new Date())
  const [timezones, setTimezones] = useState<TimezoneItem[]>(config?.timezones || [
    { id: 1, name: 'New York', timezone: 'America/New_York' },
    { id: 2, name: 'London', timezone: 'Europe/London' },
    { id: 3, name: 'Tokyo', timezone: 'Asia/Tokyo' }
  ])
  const [showSettings, setShowSettings] = useState<boolean>(false)
  const [showAddForm, setShowAddForm] = useState<boolean>(false)
  const [newTimezone, setNewTimezone] = useState<Omit<TimezoneItem, 'id'>>({ name: '', timezone: '' })
  const settingsRef = useRef<HTMLDivElement>(null)
  const settingsButtonRef = useRef<HTMLButtonElement>(null)
  const widgetRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    
    return () => clearInterval(timer)
  }, [])
  
  // No need for click outside handler as the modal backdrop handles this
  
  const formatTime = (date: Date, timezone: string): string => {
    try {
      return date.toLocaleTimeString('en-US', { 
        timeZone: timezone,
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true
      })
    } catch (error) {
      console.error(`Error formatting time for timezone ${timezone}:`, error)
      return '--:--'
    }
  }
  
  const addTimezone = (): void => {
    if (newTimezone.name && newTimezone.timezone) {
      const newId = Math.max(0, ...timezones.map(tz => tz.id)) + 1
      setTimezones([...timezones, { ...newTimezone, id: newId }])
      setNewTimezone({ name: '', timezone: '' })
      setShowAddForm(false)
    }
  }
  
  const removeTimezone = (id: number): void => {
    setTimezones(timezones.filter(tz => tz.id !== id))
  }
  
  const renderCompactView = () => {
    const tz = timezones[0] || { timezone: 'UTC' }
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="text-xl font-semibold">
            {formatTime(currentTime, tz.timezone)}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {formatTimezoneName(tz.timezone)}
          </div>
        </div>
      </div>
    )
  }
  
  const renderMediumView = () => {
    return (
      <div className="flex-1 overflow-y-auto p-2">
        {timezones.slice(0, 3).map(tz => (
          <div key={tz.id} className="mb-2 last:mb-0">
            <div className="text-sm font-medium">{tz.name}</div>
            <div className="text-xl">{formatTime(currentTime, tz.timezone)}</div>
          </div>
        ))}
      </div>
    )
  }
  
  const renderSettings = () => {
    if (!showSettings) return null
    
    return createPortal(
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div 
          className="bg-white dark:bg-gray-800 rounded-lg shadow-lg w-[96%] max-w-md max-h-[90vh] overflow-auto"
          ref={settingsRef}
        >
          <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
            <h3 className="font-semibold">World Clocks Settings</h3>
            <button 
              onClick={() => {
                setShowSettings(false)
                setShowAddForm(false)
              }}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X size={18} />
            </button>
          </div>
          
          <div className="p-4">
            <div className="space-y-4">
              {showAddForm ? (
                <div className="space-y-3 border p-3 rounded-lg dark:border-gray-700">
                  <div>
                    <label className="block text-sm font-medium mb-1">Location Name</label>
                    <input 
                      type="text" 
                      value={newTimezone.name} 
                      onChange={e => setNewTimezone({...newTimezone, name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700"
                      placeholder="San Francisco"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Timezone</label>
                    <select
                      value={newTimezone.timezone}
                      onChange={e => setNewTimezone({...newTimezone, timezone: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700"
                    >
                      <option value="">Select a timezone</option>
                      <option value="America/Los_Angeles">Pacific Time (US & Canada)</option>
                      <option value="America/Denver">Mountain Time (US & Canada)</option>
                      <option value="America/Chicago">Central Time (US & Canada)</option>
                      <option value="America/New_York">Eastern Time (US & Canada)</option>
                      <option value="America/Sao_Paulo">São Paulo</option>
                      <option value="Europe/London">London</option>
                      <option value="Europe/Berlin">Berlin, Paris, Rome</option>
                      <option value="Europe/Moscow">Moscow</option>
                      <option value="Asia/Dubai">Dubai</option>
                      <option value="Asia/Kolkata">Mumbai, New Delhi</option>
                      <option value="Asia/Shanghai">Beijing, Hong Kong</option>
                      <option value="Asia/Tokyo">Tokyo</option>
                      <option value="Australia/Sydney">Sydney</option>
                      <option value="Pacific/Auckland">Auckland</option>
                    </select>
                  </div>
                  <div className="flex justify-end space-x-2 pt-2">
                    <button 
                      onClick={() => setShowAddForm(false)}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={addTimezone}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
                      disabled={!newTimezone.name || !newTimezone.timezone}
                    >
                      Add
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="space-y-1">
                    {timezones.map(tz => (
                      <div 
                        key={tz.id} 
                        className="flex items-center justify-between p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md group"
                      >
                        <div>
                          <div className="font-medium text-sm">{tz.name}</div>
                          <div className="text-xs text-gray-500">{formatTimezoneName(tz.timezone)}</div>
                        </div>
                        <div className="flex items-center">
                          <div className="text-sm mr-2">
                            {formatTime(currentTime, tz.timezone)}
                          </div>
                          <button 
                            onClick={() => removeTimezone(tz.id)}
                            className="p-1 text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => setShowAddForm(true)}
                    className="w-full py-2 border border-dashed border-gray-300 dark:border-gray-600 rounded-md flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <Plus size={16} className="text-gray-500 mr-1" />
                    <span className="text-sm text-gray-500">Add New Location</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>,
      document.body
    )
  }
  
  const renderContent = () => {
    if (width === 1 && height === 1) {
      return renderCompactView()
    } else if (width >= 4 && height >= 4) {
      return renderFullView()
    } else if (width >= 3) {
      return renderWideView()
    } else if (height >= 3) {
      return renderTallView()
    } else {
      return renderDefaultView()
    }
  }
  
  const renderDefaultView = () => {
    return (
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {timezones.slice(0, 2).map(tz => (
          <div key={tz.id} className="flex justify-between items-center">
            <div className="text-sm">{tz.name}</div>
            <div className="text-sm font-medium">{formatTime(currentTime, tz.timezone)}</div>
          </div>
        ))}
      </div>
    )
  }
  
  const renderWideView = () => {
    return (
      <div className="grid grid-cols-3 gap-4 p-4 flex-1">
        {timezones.map(tz => (
          <div 
            key={tz.id} 
            className="flex flex-col items-center justify-center p-3 rounded-lg border border-gray-200 dark:border-gray-700"
          >
            <div className="relative mb-1">
              <svg width="64" height="64" viewBox="0 0 64 64" className="transform -rotate-90">
                <circle 
                  cx="32" 
                  cy="32" 
                  r="28" 
                  fill="none" 
                  stroke="#e5e7eb" 
                  strokeWidth="2" 
                  className="dark:stroke-gray-700"
                />
                <circle 
                  cx="32" 
                  cy="32" 
                  r="28" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="4" 
                  strokeDasharray="175.93"
                  strokeDashoffset={175.93 - (175.93 * getTimeProgress(tz.timezone))}
                  className="text-blue-500"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center flex-col">
                <div className="text-xl font-bold">
                  {formatTime(currentTime, tz.timezone)}
                </div>
              </div>
            </div>
            <div className="text-sm font-medium mt-2">{tz.name}</div>
            <div className="text-xs text-gray-500 mt-1">{formatTimezoneName(tz.timezone)}</div>
          </div>
        ))}
      </div>
    )
  }
  
  // Helper function to get the time progress as a fraction for the circle animation
  const getTimeProgress = (timezone: string): number => {
    try {
      const date = new Date(currentTime)
      const options: Intl.DateTimeFormatOptions = { timeZone: timezone }
      const formatter = new Intl.DateTimeFormat('en-US', options)
      const parts = formatter.formatToParts(date)
      
      const hour = parseInt(parts.find(part => part.type === 'hour')?.value || '0')
      const minute = parseInt(parts.find(part => part.type === 'minute')?.value || '0')
      const second = parseInt(parts.find(part => part.type === 'second')?.value || '0')
      
      // Calculate progress through the day (0-1)
      return (hour * 3600 + minute * 60 + second) / 86400
    } catch (error) {
      console.error(`Error calculating time progress for ${timezone}:`, error)
      return 0
    }
  }
  
  const formatTimezoneName = (timezone: string): string => {
    return timezone
      .replace(/_/g, ' ')
      .replace(/\//g, ' / ')
      .replace(/^(America|Europe|Asia|Africa|Australia|Pacific) \/ /, '')
  }
  
  const renderTallView = () => {
    return (
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {timezones.map(tz => (
          <div 
            key={tz.id} 
            className="flex justify-between items-center p-2 rounded-lg border border-gray-200 dark:border-gray-700"
          >
            <div>
              <div className="font-medium">{tz.name}</div>
              <div className="text-xs text-gray-500">{formatTimezoneName(tz.timezone)}</div>
            </div>
            <div className="text-xl font-bold">
              {formatTime(currentTime, tz.timezone)}
            </div>
          </div>
        ))}
      </div>
    )
  }
  
  const renderFullView = () => {
    return (
      <div className="grid grid-cols-3 gap-4 p-4 flex-1">
        {timezones.map(tz => (
          <div 
            key={tz.id} 
            className="flex flex-col items-center justify-center p-4 rounded-lg border border-gray-200 dark:border-gray-700"
          >
            <div className="relative mb-2">
              <svg width="100" height="100" viewBox="0 0 100 100" className="transform -rotate-90">
                <circle 
                  cx="50" 
                  cy="50" 
                  r="45" 
                  fill="none" 
                  stroke="#e5e7eb" 
                  strokeWidth="4" 
                  className="dark:stroke-gray-700"
                />
                <circle 
                  cx="50" 
                  cy="50" 
                  r="45" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="6" 
                  strokeDasharray="282.74"
                  strokeDashoffset={282.74 - (282.74 * getTimeProgress(tz.timezone))}
                  className="text-blue-500"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center flex-col">
                <div className="text-3xl font-bold">
                  {formatTime(currentTime, tz.timezone)}
                </div>
              </div>
            </div>
            <div className="text-lg font-medium mt-3">{tz.name}</div>
            <div className="text-sm text-gray-500 mt-1">{formatTimezoneName(tz.timezone)}</div>
          </div>
        ))}
      </div>
    )
  }
  
  return (
    <div className="widget-container h-full flex flex-col" ref={widgetRef}>
      <WidgetHeader 
        title="World Clocks" 
        onSettingsClick={() => setShowSettings(true)}
      />
      <div className="flex-1 overflow-hidden">
        {renderContent()}
      </div>
      {renderSettings()}
    </div>
  )
}

export default WorldClocksWidget 