import React, { useState, useEffect, useRef } from 'react'
import { Plus, Trash, X } from 'lucide-react'
import { createPortal } from 'react-dom'
import WidgetHeader from '../../ui/WidgetHeader'
import { WorldClocksWidgetProps, TimezoneItem, NewTimezoneItem } from './types'

/**
 * World Clocks Widget Component
 * 
 * Displays the current time in multiple timezones.
 * Allows adding, editing, and removing timezones.
 * Supports different layouts based on widget dimensions (minimum size 2x2).
 * 
 * @component
 * @param {WorldClocksWidgetProps} props - Component props
 * @returns {JSX.Element} World Clocks widget component
 */
const WorldClocksWidget: React.FC<WorldClocksWidgetProps> = ({ width, height, config }) => {
  const [currentTime, setCurrentTime] = useState<Date>(new Date())
  const [timezones, setTimezones] = useState<TimezoneItem[]>(config?.timezones || [
    { id: 1, name: 'New York', timezone: 'America/New_York' },
    { id: 2, name: 'London', timezone: 'Europe/London' },
    { id: 3, name: 'Tokyo', timezone: 'Asia/Tokyo' },
    { id: 4, name: 'Sydney', timezone: 'Australia/Sydney' }
  ])
  const [showSettings, setShowSettings] = useState<boolean>(false)
  const [showAddForm, setShowAddForm] = useState<boolean>(false)
  const [newTimezone, setNewTimezone] = useState<NewTimezoneItem>({ name: '', timezone: '' })
  const settingsRef = useRef<HTMLDivElement | null>(null)
  const widgetRef = useRef<HTMLDivElement | null>(null)
  
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    
    return () => clearInterval(timer)
  }, [])

  // Handle escape key to close settings modal
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && showSettings) {
        setShowSettings(false);
        setShowAddForm(false);
      }
    };

    if (showSettings) {
      document.addEventListener('keydown', handleEscapeKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [showSettings]);

  /**
   * Formats a date for a specific timezone
   * 
   * @param {Date} date - Date to format
   * @param {string} timezone - IANA timezone identifier
   * @returns {string} Formatted time string
   */
  const formatTime = (date: Date, timezone: string): string => {
    try {
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
        timeZone: timezone
      });
    } catch (error) {
      console.error('Error formatting time:', error);
      return 'Invalid timezone';
    }
  }

  /**
   * Gets the relative date for a timezone (e.g., "Today", "Tomorrow")
   * 
   * @param {Date} date - Date to check
   * @param {string} timezone - IANA timezone identifier
   * @returns {string} Relative date string
   */
  const getRelativeDate = (date: Date, timezone: string): string => {
    try {
      // Get the date in the target timezone
      const options: Intl.DateTimeFormatOptions = {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
        timeZone: timezone
      };
      
      const dateInTimezone = new Date(date.toLocaleString('en-US', { timeZone: timezone }));
      const localDate = new Date();
      
      // Compare the date in the target timezone with the local date
      const targetDay = dateInTimezone.getDate();
      const localDay = localDate.getDate();
      
      if (targetDay === localDay) {
        return 'Today';
      } else if (targetDay === localDay + 1) {
        return 'Tomorrow';
      } else if (targetDay === localDay - 1) {
        return 'Yesterday';
      } else {
        return date.toLocaleDateString('en-US', options);
      }
    } catch (error) {
      console.error('Error getting relative date:', error);
      return 'Unknown';
    }
  }

  /**
   * Gets the time difference between local time and a timezone
   * 
   * @param {string} timezone - IANA timezone identifier
   * @returns {string} Time difference string (e.g., "+3h")
   */
  const getTimeDiff = (timezone: string): string => {
    try {
      const localDate = new Date();
      
      // Get the target timezone's current time
      const targetDate = new Date(localDate.toLocaleString('en-US', { timeZone: timezone }));
      
      // Calculate the time difference in hours
      let hoursDiff = (targetDate.getHours() - localDate.getHours());
      
      // Adjust for day boundary crossings
      if (hoursDiff > 12) {
        hoursDiff -= 24;
      } else if (hoursDiff < -12) {
        hoursDiff += 24;
      }
      
      // Format the difference
      if (hoursDiff === 0) {
        return 'Same time';
      } else {
        const sign = hoursDiff > 0 ? '+' : '';
        return `${sign}${hoursDiff}h`;
      }
    } catch (error) {
      console.error('Error calculating time difference:', error);
      return '';
    }
  }

  /**
   * Adds a new timezone to the list
   */
  const addTimezone = (): void => {
    if (newTimezone.name && newTimezone.timezone) {
      const newId = Math.max(0, ...timezones.map(tz => tz.id || 0)) + 1
      setTimezones([...timezones, { ...newTimezone, id: newId }])
      setNewTimezone({ name: '', timezone: '' })
      setShowAddForm(false)
    }
  }

  /**
   * Removes a timezone from the list
   * 
   * @param {number} id - The id of the timezone to remove
   */
  const removeTimezone = (id: number): void => {
    setTimezones(timezones.filter(tz => tz.id !== id))
  }

  /**
   * Renders an analog clock for a timezone
   * 
   * @param {string} timezone - IANA timezone identifier
   * @param {number} [size=80] - Size of the clock in pixels
   * @param {boolean} [isDarkMode=false] - Whether to use dark mode colors
   * @returns {JSX.Element} Analog clock SVG
   */
  const renderClock = (timezone: string, size: number = 80, isDarkMode: boolean = false) => {
    try {
      // Get the current time in the specified timezone
      const date = new Date(currentTime.toLocaleString('en-US', { timeZone: timezone }));
      
      // Calculate the angles for the clock hands
      const seconds = date.getSeconds();
      const minutes = date.getMinutes();
      const hours = date.getHours() % 12;
      
      const secondAngle = (seconds / 60) * 360;
      const minuteAngle = ((minutes + seconds / 60) / 60) * 360;
      const hourAngle = ((hours + minutes / 60) / 12) * 360;
      
      // Calculate dimensions
      const center = size / 2;
      const radius = size / 2 - 4; // Slightly smaller to fit within SVG
      
      // Calculate hand lengths
      const secondHandLength = radius * 0.8;
      const minuteHandLength = radius * 0.7;
      const hourHandLength = radius * 0.5;
      
      // Determine colors based on theme
      const isDarkTheme = isDarkMode;
      const clockFaceColor = isDarkTheme ? '#1e293b' : '#f8fafc'; // slate-800 for dark mode
      const clockBorderColor = isDarkTheme ? '#475569' : '#cbd5e1'; // slate-600 for dark mode
      const hourHandColor = isDarkTheme ? '#e2e8f0' : '#334155'; // slate-200 for dark mode
      const minuteHandColor = isDarkTheme ? '#e2e8f0' : '#334155'; // slate-200 for dark mode
      const secondHandColor = isDarkTheme ? '#38bdf8' : '#3b82f6'; // Sky-500 for dark mode
      
      return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="clock">
          {/* Clock face */}
          <circle 
            cx={center} 
            cy={center} 
            r={radius} 
            fill={clockFaceColor} 
            stroke={clockBorderColor} 
            strokeWidth="1"
          />
          
          {/* Hour markers */}
          {[...Array(12)].map((_, i) => {
            const angle = (i * 30) * (Math.PI / 180);
            const x1 = center + (radius - 8) * Math.sin(angle);
            const y1 = center - (radius - 8) * Math.cos(angle);
            const x2 = center + radius * Math.sin(angle);
            const y2 = center - radius * Math.cos(angle);
            
            return (
              <line 
                key={i} 
                x1={x1} 
                y1={y1} 
                x2={x2} 
                y2={y2} 
                stroke={isDarkTheme ? '#94a3b8' : '#64748b'} 
                strokeWidth={i % 3 === 0 ? 2 : 1} 
              />
            );
          })}
          
          {/* Hour hand */}
          <line 
            x1={center} 
            y1={center} 
            x2={center + hourHandLength * Math.sin(hourAngle * (Math.PI / 180))} 
            y2={center - hourHandLength * Math.cos(hourAngle * (Math.PI / 180))} 
            stroke={hourHandColor} 
            strokeWidth="2.5" 
            strokeLinecap="round" 
          />
          
          {/* Minute hand */}
          <line 
            x1={center} 
            y1={center} 
            x2={center + minuteHandLength * Math.sin(minuteAngle * (Math.PI / 180))} 
            y2={center - minuteHandLength * Math.cos(minuteAngle * (Math.PI / 180))} 
            stroke={minuteHandColor} 
            strokeWidth="2" 
            strokeLinecap="round" 
          />
          
          {/* Second hand */}
          <line 
            x1={center} 
            y1={center} 
            x2={center + secondHandLength * Math.sin(secondAngle * (Math.PI / 180))} 
            y2={center - secondHandLength * Math.cos(secondAngle * (Math.PI / 180))} 
            stroke={secondHandColor} 
            strokeWidth="1" 
            strokeLinecap="round" 
          />
          
          {/* Center dot */}
          <circle 
            cx={center} 
            cy={center} 
            r="3" 
            fill={secondHandColor} 
          />
        </svg>
      );
    } catch (error) {
      console.error('Error rendering clock:', error);
      return <div className="text-red-500">Invalid timezone</div>;
    }
  }

  /**
   * Renders a compact view for the standard widget size (2x2)
   * 
   * @returns {JSX.Element} Compact view
   */
  const renderCompactView = () => {
    const mainTimezone = timezones[0] || { id: 0, name: 'Local', timezone: Intl.DateTimeFormat().resolvedOptions().timeZone };
    
    return (
      <div className="flex flex-col items-center justify-center h-full p-2">
        <div className="text-xl font-bold">
          {formatTime(currentTime, mainTimezone.timezone).split(':').slice(0, 2).join(':')}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {mainTimezone.name}
        </div>
      </div>
    );
  };

  /**
   * Renders the default view for standard widget size (2x2)
   * 
   * @returns {JSX.Element} Default view
   */
  const renderDefaultView = () => {
    return (
      <div className="flex flex-col space-y-2 overflow-y-auto p-1">
        {timezones.slice(0, 3).map(tz => (
          <div key={tz.id} className="flex justify-between items-center p-2 bg-gray-50 dark:bg-slate-700/50 rounded">
            <div>
              <div className="font-medium text-sm">{tz.name}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{getTimeDiff(tz.timezone)}</div>
            </div>
            <div className="text-lg font-bold">
              {formatTime(currentTime, tz.timezone).split(':').slice(0, 2).join(':')}
            </div>
          </div>
        ))}
      </div>
    );
  };

  /**
   * Renders a medium-sized view with more timezones
   * 
   * @returns {JSX.Element} Medium view
   */
  const renderMediumView = () => {
    return (
      <div className="grid grid-cols-2 gap-2 p-1">
        {timezones.slice(0, 4).map(tz => (
          <div key={tz.id} className="flex flex-col items-center justify-center p-2 bg-gray-50 dark:bg-slate-700/50 rounded">
            <div className="text-lg font-bold">
              {formatTime(currentTime, tz.timezone).split(':').slice(0, 2).join(':')}
            </div>
            <div className="text-xs font-medium">{tz.name}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">{getTimeDiff(tz.timezone)}</div>
          </div>
        ))}
      </div>
    );
  };

  /**
   * Renders a wider view with analog clocks
   * 
   * @returns {JSX.Element} Wide view
   */
  const renderWideView = () => {
    const isDarkMode = document.documentElement.classList.contains('dark');
    
    return (
      <div className="grid grid-cols-3 gap-2 p-1">
        {timezones.slice(0, 3).map(tz => (
          <div key={tz.id} className="flex flex-col items-center p-2 bg-gray-50 dark:bg-slate-700/50 rounded">
            <div className="mb-1">
              {renderClock(tz.timezone, 60, isDarkMode)}
            </div>
            <div className="text-sm font-medium">{tz.name}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {formatTime(currentTime, tz.timezone).split(':').slice(0, 2).join(':')}
            </div>
          </div>
        ))}
      </div>
    );
  };

  /**
   * Renders a taller view with more timezones and details
   * 
   * @returns {JSX.Element} Tall view
   */
  const renderTallView = () => {
    const isDarkMode = document.documentElement.classList.contains('dark');
    
    return (
      <div className="grid grid-cols-2 gap-3 p-2">
        {timezones.slice(0, 6).map(tz => (
          <div key={tz.id} className="flex flex-col items-center p-2 bg-gray-50 dark:bg-slate-700/50 rounded">
            <div className="text-sm font-medium mb-1">{tz.name}</div>
            <div className="mb-1">
              {renderClock(tz.timezone, 50, isDarkMode)}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {formatTime(currentTime, tz.timezone)}
            </div>
            <div className="text-xs text-gray-400 dark:text-gray-500">
              {getRelativeDate(currentTime, tz.timezone)}
            </div>
          </div>
        ))}
      </div>
    );
  };

  /**
   * Renders the full-size view with all timezones and details
   * 
   * @returns {JSX.Element} Full view
   */
  const renderFullView = () => {
    const isDarkMode = document.documentElement.classList.contains('dark');
    
    return (
      <div className="grid grid-cols-3 gap-3 p-2">
        {timezones.map(tz => (
          <div key={tz.id} className="flex flex-col items-center p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
            <div className="text-sm font-medium mb-1">{tz.name}</div>
            <div className="mb-2">
              {renderClock(tz.timezone, 70, isDarkMode)}
            </div>
            <div className="text-lg font-bold">
              {formatTime(currentTime, tz.timezone).split(':').slice(0, 2).join(':')}
              <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-1">
                {formatTime(currentTime, tz.timezone).split(' ')[1]}
              </span>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {getRelativeDate(currentTime, tz.timezone)}
            </div>
            <div className="text-xs text-gray-400 dark:text-gray-500">
              {getTimeDiff(tz.timezone)}
            </div>
          </div>
        ))}
      </div>
    );
  };

  /**
   * Determines which view to render based on widget dimensions
   * 
   * @returns {JSX.Element} The appropriate view for the current dimensions
   */
  const renderContent = () => {
    if (timezones.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-4 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">No timezones added</p>
          <button
            onClick={() => setShowSettings(true)}
            className="px-3 py-1 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600"
          >
            Add Timezone
          </button>
        </div>
      );
    }
    
    if (width >= 4 && height >= 4) {
      return renderFullView();
    } else if (width >= 3 && height >= 3) {
      return renderTallView();
    } else if (width >= 3) {
      return renderWideView();
    } else if (width >= 2 && height >= 2) {
      return renderMediumView();
    } else if (width >= 2 || height >= 2) {
      return renderDefaultView();
    } else {
      return renderCompactView();
    }
  };

  /**
   * Renders the settings panel for managing timezones
   * 
   * @returns {JSX.Element | null} Settings panel or null if not shown
   */
  const renderSettings = () => {
    if (!showSettings) return null;
    
    // Common timezones for easy selection
    const commonTimezones = [
      { name: 'New York', timezone: 'America/New_York' },
      { name: 'Los Angeles', timezone: 'America/Los_Angeles' },
      { name: 'London', timezone: 'Europe/London' },
      { name: 'Paris', timezone: 'Europe/Paris' },
      { name: 'Tokyo', timezone: 'Asia/Tokyo' },
      { name: 'Sydney', timezone: 'Australia/Sydney' },
      { name: 'Shanghai', timezone: 'Asia/Shanghai' },
      { name: 'Dubai', timezone: 'Asia/Dubai' },
      { name: 'Moscow', timezone: 'Europe/Moscow' },
      { name: 'São Paulo', timezone: 'America/Sao_Paulo' }
    ];
    
    return createPortal(
      <div className="fixed inset-0 bg-black/50 dark:bg-black/70 z-50 flex items-center justify-center p-4">
        <div 
          ref={settingsRef}
          className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-auto"
        >
          <div className="flex items-center justify-between p-4 border-b dark:border-slate-700">
            <h3 className="font-semibold text-gray-800 dark:text-slate-100">World Clocks Settings</h3>
            <button 
              onClick={() => setShowSettings(false)}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X size={20} />
            </button>
          </div>
          
          <div className="p-4">
            <div className="space-y-4">
              {showAddForm ? (
                <div className="space-y-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <h4 className="font-medium text-sm">Add Timezone</h4>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                      Location Name
                    </label>
                    <input 
                      type="text" 
                      value={newTimezone.name} 
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTimezone({...newTimezone, name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700"
                      placeholder="San Francisco"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                      Timezone
                    </label>
                    <select
                      value={newTimezone.timezone}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setNewTimezone({...newTimezone, timezone: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700"
                    >
                      <option value="">Select a timezone</option>
                      {commonTimezones.map((tz, index) => (
                        <option key={index} value={tz.timezone}>
                          {tz.name} ({tz.timezone})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex justify-end space-x-2 pt-2">
                    <button 
                      onClick={() => setShowAddForm(false)}
                      className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={addTimezone}
                      className="px-3 py-1 bg-blue-500 text-white rounded text-sm"
                      disabled={!newTimezone.name || !newTimezone.timezone}
                    >
                      Add
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowAddForm(true)}
                  className="w-full py-2 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <Plus size={16} className="mr-1" />
                  <span>Add Timezone</span>
                </button>
              )}
              
              {timezones.length > 0 && (
                <div>
                  <h4 className="font-medium text-sm mb-2">Current Timezones</h4>
                  <div className="space-y-2">
                    {timezones.map(tz => (
                      <div 
                        key={tz.id} 
                        className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700 rounded"
                      >
                        <div>
                          <div className="font-medium">{tz.name}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{tz.timezone}</div>
                        </div>
                        <button 
                          onClick={() => removeTimezone(tz.id)}
                          className="p-1 text-gray-500 hover:text-red-500"
                        >
                          <Trash size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>,
      document.body
    );
  };

  return (
    <div ref={widgetRef} className="widget-container h-full flex flex-col">
      <WidgetHeader 
        title="World Clocks" 
        onSettingsClick={() => setShowSettings(true)}
      />
      
      <div className="flex-1 overflow-hidden">
        {renderContent()}
      </div>
      
      {renderSettings()}
    </div>
  );
};

export default WorldClocksWidget;

// Export types for use in other files
export * from './types'; 