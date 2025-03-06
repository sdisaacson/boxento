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
    { id: 3, name: 'Tokyo', timezone: 'Asia/Tokyo' },
    { id: 4, name: 'Sydney', timezone: 'Australia/Sydney' }
  ])
  const [showSettings, setShowSettings] = useState<boolean>(false)
  const [showAddForm, setShowAddForm] = useState<boolean>(false)
  const [newTimezone, setNewTimezone] = useState<Omit<TimezoneItem, 'id'>>({ name: '', timezone: '' })
  const settingsRef = useRef<HTMLDivElement>(null)
  const widgetRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    
    return () => clearInterval(timer)
  }, [])
  
  // Format time in 12-hour format (e.g., "10:30 PM")
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
  
  // Get the date (Today, Yesterday, Tomorrow, or actual date)
  const getRelativeDate = (date: Date, timezone: string): string => {
    try {
      const today = new Date()
      const tzDate = new Date(date.toLocaleString('en-US', { timeZone: timezone }))
      const tzToday = new Date(today.toLocaleString('en-US', { timeZone: timezone }))
      
      const tzDateDay = tzDate.getDate()
      const tzTodayDay = tzToday.getDate()
      
      if (tzDateDay === tzTodayDay) {
        return 'Today'
      } else if (tzDateDay === tzTodayDay + 1) {
        return 'Tomorrow'
      } else if (tzDateDay === tzTodayDay - 1) {
        return 'Yesterday'
      } else {
        return tzDate.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric'
        })
      }
    } catch (error) {
      return 'Today'
    }
  }
  
  // Get time difference text (e.g. "+8 hrs" or "-2 hrs")
  const getTimeDiff = (timezone: string): string => {
    try {
      // Create Date objects for the current time
      const now = new Date();
      
      // Get the current time in the user's local timezone
      const localTime = now.getTime();
      const localOffset = now.getTimezoneOffset() * 60000; // Convert to milliseconds
      
      // Get the current time in the target timezone
      const targetDate = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
      const targetTime = targetDate.getTime();
      
      // Calculate difference in milliseconds, adjusting for the local timezone offset
      const timeDiff = targetTime - localTime + localOffset;
      
      // Convert to hours
      const hoursDiff = timeDiff / 3600000; // 1 hour = 3600000 milliseconds
      
      // Round to nearest half hour for display
      const roundedHours = Math.round(hoursDiff * 2) / 2;
      
      if (roundedHours === 0) {
        return 'Same time';
      } else {
        const sign = roundedHours > 0 ? '+' : '';
        
        // Check if it's a whole number or has .5
        if (roundedHours % 1 === 0) {
          return `${sign}${roundedHours} hrs`;
        } else {
          // It has .5
          const wholePart = Math.floor(Math.abs(roundedHours));
          return `${sign}${roundedHours < 0 ? '-' : ''}${wholePart}.5 hrs`;
        }
      }
    } catch (error) {
      console.error('Error calculating time difference:', error);
      return '';
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
  
  // Render an analog clock
  const renderClock = (timezone: string, size: number = 80, isDarkMode: boolean = false) => {
    try {
      // Calculate time parts for analog clock
      const date = new Date(currentTime)
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        hour12: true
      })
      const parts = formatter.formatToParts(date)
      
      const hour = parseInt(parts.find(part => part.type === 'hour')?.value || '12')
      const minute = parseInt(parts.find(part => part.type === 'minute')?.value || '0')
      const second = parseInt(parts.find(part => part.type === 'second')?.value || '0')
      const dayPeriod = parts.find(part => part.type === 'dayPeriod')?.value || 'AM'
      
      // Convert to 24-hour for angle calculations
      const hour24 = (dayPeriod === 'PM' && hour !== 12) ? hour + 12 : (dayPeriod === 'AM' && hour === 12) ? 0 : hour
      
      // Calculate angles
      const hourAngle = ((hour24 % 12) * 30) + (minute * 0.5)
      const minuteAngle = minute * 6
      const secondAngle = second * 6
      
      // Calculate center and radius
      const center = size / 2
      const radius = (size / 2) * 0.85  // 85% of half size
      
      // Calculate hand lengths
      const hourHandLength = radius * 0.5
      const minuteHandLength = radius * 0.7
      const secondHandLength = radius * 0.8
      
      // Colors based on theme - support the dark-mode class
      const darkModeMediaQuery = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)');
      const isDarkTheme = isDarkMode || (document.documentElement.classList.contains('dark')) || darkModeMediaQuery.matches;
      
      // Enhanced colors for better contrast and aesthetics
      const backgroundColor = isDarkTheme ? '#0f172a' : '#f8fafc'; // slate-900 for dark, light gray for light
      const textColor = isDarkTheme ? '#f8fafc' : '#334155'; // Brighter text for dark mode
      const handColor = isDarkTheme ? '#e2e8f0' : '#334155'; // Brighter hands for dark mode
      const secondHandColor = isDarkTheme ? '#38bdf8' : '#3b82f6';  // Sky-500 for dark mode
      const borderColor = isDarkTheme ? '#475569' : '#e2e8f0'; // Brighter border for dark mode
      const hourMarkerColor = isDarkTheme ? '#94a3b8' : '#64748b'; // slate-400 for dark mode
      
      return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="mx-auto">
          {/* Clock Face with enhanced depth */}
          {/* Background circle with gradient for depth */}
          <defs>
            <radialGradient id={`clockGradient-${timezone.replace(/\//g, '-')}`} cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
              <stop offset="0%" stopColor={isDarkTheme ? '#1e293b' : '#ffffff'} />
              <stop offset="100%" stopColor={backgroundColor} />
            </radialGradient>
          </defs>
          
          {/* Main clock face */}
          <circle 
            cx={center} 
            cy={center} 
            r={radius} 
            fill={`url(#clockGradient-${timezone.replace(/\//g, '-')})`} 
            stroke={borderColor} 
            strokeWidth="1.5" 
          />
          
          {/* Outer ring for depth */}
          <circle 
            cx={center} 
            cy={center} 
            r={radius+1} 
            fill="none" 
            stroke={isDarkTheme ? 'rgba(15, 23, 42, 0.8)' : 'rgba(226, 232, 240, 0.8)'} 
            strokeWidth="1" 
          />
          
          {/* Inner shadow for depth */}
          {isDarkTheme && (
            <circle 
              cx={center} 
              cy={center} 
              r={radius-2} 
              fill="none" 
              stroke="rgba(15, 23, 42, 0.6)" 
              strokeWidth="3" 
              filter="blur(2px)" 
            />
          )}
          
          {/* Hour Markers */}
          {[...Array(12)].map((_, i) => {
            const angle = (i * 30) * (Math.PI / 180)
            const x1 = center + (radius * 0.8) * Math.sin(angle)
            const y1 = center - (radius * 0.8) * Math.cos(angle)
            const x2 = center + radius * Math.sin(angle)
            const y2 = center - radius * Math.cos(angle)
            
            return (
              <line 
                key={i} 
                x1={x1} 
                y1={y1} 
                x2={x2} 
                y2={y2} 
                stroke={textColor} 
                strokeWidth={i % 3 === 0 ? 1.5 : 0.75} 
                strokeOpacity={i % 3 === 0 ? 0.8 : 0.5} 
              />
            )
          })}
          
          {/* Hour Numbers */}
          {[...Array(12)].map((_, i) => {
            if (i % 3 === 0) { // Only show 12, 3, 6, 9 for simplicity
              const hour = i === 0 ? 12 : i
              const angle = (i * 30) * (Math.PI / 180)
              const x = center + (radius * 0.65) * Math.sin(angle)
              const y = center - (radius * 0.65) * Math.cos(angle) + 4 // +4 for text vertical centering
              
              return (
                <text 
                  key={i} 
                  x={x} 
                  y={y} 
                  textAnchor="middle" 
                  fill={textColor} 
                  fontSize={radius * 0.18}
                  fontWeight="500"
                >
                  {hour}
                </text>
              )
            }
            return null
          })}
          
          {/* Hour Hand */}
          <line
            x1={center}
            y1={center}
            x2={center + hourHandLength * Math.sin(hourAngle * Math.PI / 180)}
            y2={center - hourHandLength * Math.cos(hourAngle * Math.PI / 180)}
            stroke={handColor}
            strokeWidth={radius * 0.05}
            strokeLinecap="round"
          />
          
          {/* Minute Hand */}
          <line
            x1={center}
            y1={center}
            x2={center + minuteHandLength * Math.sin(minuteAngle * Math.PI / 180)}
            y2={center - minuteHandLength * Math.cos(minuteAngle * Math.PI / 180)}
            stroke={handColor}
            strokeWidth={radius * 0.04}
            strokeLinecap="round"
          />
          
          {/* Second Hand */}
          <line
            x1={center}
            y1={center}
            x2={center + secondHandLength * Math.sin(secondAngle * Math.PI / 180)}
            y2={center - secondHandLength * Math.cos(secondAngle * Math.PI / 180)}
            stroke={secondHandColor}
            strokeWidth={radius * 0.02}
            strokeLinecap="round"
          />
          
          {/* Center Circle */}
          <circle cx={center} cy={center} r={radius * 0.06} fill={handColor} />
        </svg>
      )
    } catch (error) {
      console.error("Error rendering clock:", error)
      return <div className="text-red-500">Clock Error</div>
    }
  }
  
  const renderCompactView = () => {
    const tz = timezones[0] || { timezone: 'UTC', name: 'UTC' }
    
    return (
      <div className="flex flex-col items-center justify-center h-full p-2">
        {renderClock(tz.timezone, 60, false)}
        <div className="text-xs font-medium mt-1 text-center">
          {tz.name}
        </div>
      </div>
    )
  }
  
  const renderDefaultView = () => {
    return (
      <div className="flex-1 h-full p-2">
        <div className="h-full grid grid-cols-2 gap-2">
          {timezones.slice(0, 2).map(tz => (
            <div key={tz.id} className="flex flex-col items-center justify-center">
              {renderClock(tz.timezone, 45, false)}
              <div className="text-xs font-medium mt-1 text-center">
                {tz.name}
              </div>
              <div className="text-xs text-gray-500">
                {getRelativeDate(currentTime, tz.timezone)}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }
  
  const renderMediumView = () => {
    return (
      <div className="flex-1 p-2">
        <div className="grid grid-cols-2 gap-3 h-full">
          {timezones.slice(0, 4).map(tz => (
            <div key={tz.id} className="flex flex-col items-center justify-center">
              {renderClock(tz.timezone, 55, false)}
              <div className="text-xs font-medium mt-1">
                {tz.name}
              </div>
              <div className="text-xs text-gray-500">
                {getRelativeDate(currentTime, tz.timezone)}
              </div>
              <div className="text-xs text-gray-500">
                {getTimeDiff(tz.timezone)}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }
  
  const renderWideView = () => {
    return (
      <div className="p-2 flex-1">
        <div className="grid grid-cols-4 gap-3 h-full">
          {timezones.slice(0, 4).map(tz => (
            <div key={tz.id} className="flex flex-col items-center justify-center bg-white/40 dark:bg-gray-950 rounded-lg p-3">
              {renderClock(tz.timezone, 65, false)}
              <div className="text-sm font-medium mt-1 truncate max-w-full">
                {tz.name}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {getRelativeDate(currentTime, tz.timezone)}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {getTimeDiff(tz.timezone)}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }
  
  const renderTallView = () => {
    return (
      <div className="flex-1 p-3 overflow-auto space-y-3">
        {timezones.slice(0, 6).map(tz => (
          <div key={tz.id} className="flex items-center p-3 bg-white/40 dark:bg-gray-950 rounded-lg">
            <div className="mr-4">
              {renderClock(tz.timezone, 50, false)}
            </div>
            <div className="flex-1">
              <div className="font-medium">
                {tz.name}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {getRelativeDate(currentTime, tz.timezone)}
              </div>
              <div className="text-sm font-bold tabular-nums">
                {formatTime(currentTime, tz.timezone)}
              </div>
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {getTimeDiff(tz.timezone)}
            </div>
          </div>
        ))}
      </div>
    )
  }
  
  const renderFullView = () => {
    return (
      <div className="p-4 flex-1">
        <div className="grid grid-cols-4 gap-4 h-full">
          {timezones.map(tz => (
            <div key={tz.id} className="flex flex-col items-center justify-center bg-white/40 dark:bg-gray-950 rounded-lg p-4">
              <div className="text-xl font-bold tabular-nums mb-2">
                {formatTime(currentTime, tz.timezone)}
              </div>
              {renderClock(tz.timezone, 80, false)}
              <div className="text-base font-medium mt-2">
                {tz.name}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {getRelativeDate(currentTime, tz.timezone)}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {getTimeDiff(tz.timezone)}
              </div>
            </div>
          ))}
        </div>
      </div>
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
    } else if (width >= 2 && height >= 2) {
      return renderMediumView()
    } else {
      return renderDefaultView()
    }
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
                          <div className="text-xs text-gray-500">{tz.timezone.replace('_', ' ')}</div>
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