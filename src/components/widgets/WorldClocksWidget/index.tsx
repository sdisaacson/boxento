import React, { useState, useEffect, useRef } from 'react'
import { Plus, Trash } from 'lucide-react'
import WidgetHeader from '../../widgets/common/WidgetHeader'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '../../ui/dialog'
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
   * Renders an elegant analog clock for a timezone
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
      const radius = size / 2 - 2; // Slightly smaller to fit within SVG
      
      // Calculate hand lengths
      const secondHandLength = radius * 0.85;
      const minuteHandLength = radius * 0.75;
      const hourHandLength = radius * 0.5;
      
      // Determine colors based on theme
      const isDarkTheme = isDarkMode;
      const clockFaceColor = 'transparent'; // Transparent background
      const clockBorderColor = isDarkTheme ? '#475569' : '#cbd5e1'; // More subtle border
      const hourMarkerColor = isDarkTheme ? '#94a3b8' : '#94a3b8'; // Consistent subtle markers
      const hourHandColor = isDarkTheme ? '#f1f5f9' : '#334155'; // More contrast for hour hand
      const minuteHandColor = isDarkTheme ? '#e2e8f0' : '#475569'; // Slightly lighter minute hand
      const secondHandColor = isDarkTheme ? '#38bdf8' : '#3b82f6'; // Accent color for second hand
      
      return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="clock transition-all duration-300">
          {/* Clock face - subtle border, no fill */}
          <circle 
            cx={center} 
            cy={center} 
            r={radius} 
            fill={clockFaceColor} 
            stroke={clockBorderColor} 
            strokeWidth="0.5"
            className="transition-all duration-300"
          />
          
          {/* Hour markers - only at 12, 3, 6, 9 */}
          {[0, 3, 6, 9].map((hour) => {
            const angle = (hour * 30) * (Math.PI / 180);
            const x1 = center + (radius - 6) * Math.sin(angle);
            const y1 = center - (radius - 6) * Math.cos(angle);
            const x2 = center + radius * Math.sin(angle);
            const y2 = center - radius * Math.cos(angle);
            
            return (
              <line 
                key={hour} 
                x1={x1} 
                y1={y1} 
                x2={x2} 
                y2={y2} 
                stroke={hourMarkerColor} 
                strokeWidth={1} 
                className="transition-all duration-300"
              />
            );
          })}
          
          {/* Subtle dots for other hour markers */}
          {[1, 2, 4, 5, 7, 8, 10, 11].map((hour) => {
            const angle = (hour * 30) * (Math.PI / 180);
            const x = center + (radius - 2) * Math.sin(angle);
            const y = center - (radius - 2) * Math.cos(angle);
            
            return (
              <circle
                key={hour}
                cx={x}
                cy={y}
                r="0.5"
                fill={hourMarkerColor}
                className="transition-all duration-300"
              />
            );
          })}
          
          {/* Hour hand - thinner, more elegant */}
          <line 
            x1={center} 
            y1={center} 
            x2={center + hourHandLength * Math.sin(hourAngle * (Math.PI / 180))} 
            y2={center - hourHandLength * Math.cos(hourAngle * (Math.PI / 180))} 
            stroke={hourHandColor} 
            strokeWidth="1.5" 
            strokeLinecap="round" 
            className="transition-all duration-300"
          />
          
          {/* Minute hand - thinner, more elegant */}
          <line 
            x1={center} 
            y1={center} 
            x2={center + minuteHandLength * Math.sin(minuteAngle * (Math.PI / 180))} 
            y2={center - minuteHandLength * Math.cos(minuteAngle * (Math.PI / 180))} 
            stroke={minuteHandColor} 
            strokeWidth="1" 
            strokeLinecap="round" 
            className="transition-all duration-300"
          />
          
          {/* Second hand - accent color, very thin */}
          <line 
            x1={center} 
            y1={center} 
            x2={center + secondHandLength * Math.sin(secondAngle * (Math.PI / 180))} 
            y2={center - secondHandLength * Math.cos(secondAngle * (Math.PI / 180))} 
            stroke={secondHandColor} 
            strokeWidth="0.5" 
            strokeLinecap="round" 
            className="transition-all duration-300"
          />
          
          {/* Center dot - smaller, more subtle */}
          <circle 
            cx={center} 
            cy={center} 
            r="1.5" 
            fill={secondHandColor} 
            className="transition-all duration-300"
          />
        </svg>
      );
    } catch (error) {
      console.error('Error rendering clock:', error);
      return <div className="text-red-500 text-xs">Invalid timezone</div>;
    }
  }

  /**
   * Renders a compact view for the smallest widget size (1x1)
   * 
   * This view displays:
   * - Single timezone's time (the first timezone in the list)
   * - City name
   * - AM/PM indicator
   * 
   * Optimized for minimal space while maintaining readability.
   * 
   * @returns {JSX.Element} Compact view optimized for 1x1 grid size
   */
  const renderCompactView = () => {
    const mainTimezone = timezones[0] || { id: 0, name: 'Local', timezone: Intl.DateTimeFormat().resolvedOptions().timeZone };
    const timeString = formatTime(currentTime, mainTimezone.timezone).split(':').slice(0, 2).join(':');
    const period = formatTime(currentTime, mainTimezone.timezone).split(' ')[1];
    
    return (
      <div className="flex flex-col items-center justify-center h-full p-2">
        <div className="text-2xl font-bold leading-none">
          {timeString}
        </div>
        <div className="text-xs leading-tight mt-0.5 font-medium text-center">
          {mainTimezone.name}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400 leading-none">
          {period}
        </div>
      </div>
    );
  };

  /**
   * Renders the default view for standard widget size (2x2)
   * 
   * This view adapts based on the number of timezones:
   * - For 1-2 timezones: Displays a clean layout with larger time display
   * - For 3+ timezones: Uses a compact scrollable list to show all timezones
   * 
   * Each timezone display includes:
   * - City name
   * - Time difference from local time
   * - Current time in hours and minutes
   * 
   * @returns {JSX.Element} Default view optimized for 2x2 grid size
   */
  const renderDefaultView = () => {
    // For small number of timezones, use a cleaner layout
    if (timezones.length <= 2) {
      return (
        <div className="grid grid-cols-1 gap-3 p-3 h-full transition-all duration-300">
          {timezones.map(tz => (
            <div key={tz.id} className="flex justify-between items-center h-full transition-all duration-300">
              <div className="flex flex-col">
                <div className="font-medium text-sm tracking-tight text-gray-800 dark:text-gray-200">{tz.name}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 tracking-wide">{getTimeDiff(tz.timezone)}</div>
              </div>
              <div className="flex flex-col items-end">
                <div className="text-2xl font-light tracking-tighter leading-tight">
                  {formatTime(currentTime, tz.timezone).split(':').slice(0, 2).join(':')}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 leading-none tracking-wide">
                  {formatTime(currentTime, tz.timezone).split(' ')[1]}
                </div>
              </div>
            </div>
          ))}
        </div>
      );
    }
    
    // For 3+ timezones, use a more compact list view with scrolling
    return (
      <div className="flex flex-col space-y-2 overflow-y-auto h-full py-2 px-3 transition-all duration-300">
        {timezones.map(tz => (
          <div key={tz.id} className="flex justify-between items-center py-1 transition-all duration-300">
            <div className="flex flex-col min-w-0">
              <div className="font-medium text-xs tracking-tight text-gray-800 dark:text-gray-200 truncate">{tz.name}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 tracking-wide">{getTimeDiff(tz.timezone)}</div>
            </div>
            <div className="text-base font-light tracking-tighter whitespace-nowrap ml-1">
              {formatTime(currentTime, tz.timezone).split(':').slice(0, 2).join(':')}
              <span className="text-xs ml-0.5 text-gray-500 dark:text-gray-400 font-normal tracking-normal">
                {formatTime(currentTime, tz.timezone).split(' ')[1]}
              </span>
            </div>
          </div>
        ))}
      </div>
    );
  };

  /**
   * Renders a medium-sized view with multiple timezones
   * 
   * This view intelligently adapts based on number of timezones:
   * - For 3 timezones: Shows one primary timezone at the top and two below
   * - For 4 timezones: Uses a perfect 2x2 grid with equal sizing
   * - For 5+ timezones: Implements a scrollable grid with compact display
   * 
   * Each timezone display includes:
   * - Time in hours and minutes
   * - City name
   * - Time difference from local time
   * 
   * @returns {JSX.Element} Medium view optimized for 2x2 grid size with multiple timezones
   */
  const renderMediumView = () => {
    return (
      <div className="grid grid-cols-2 gap-1 p-1 h-full overflow-y-auto">
        {timezones.map(tz => (
          <div key={tz.id} className="flex flex-col items-center justify-center p-1.5 bg-gray-50 dark:bg-slate-700/50 rounded">
            <div className="text-base font-bold">
              {formatTime(currentTime, tz.timezone).split(':').slice(0, 2).join(':')}
            </div>
            <div className="text-xs font-medium truncate w-full text-center">{tz.name}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">{getTimeDiff(tz.timezone)}</div>
          </div>
        ))}
      </div>
    );
  };

  /**
   * Renders a wider view with analog or digital clocks based on number of timezones
   * 
   * This view adapts based on the number of timezones:
   * - For 1-3 timezones: Displays analog clocks for visual appeal
   * - For 4-6 timezones: Shows digital clocks in a 3x2 grid
   * - For 7+ timezones: Implements a compact scrollable grid
   * 
   * @returns {JSX.Element} Wide view optimized for 3x2 grid size
   */
  const renderWideView = () => {
    const isDarkMode = document.documentElement.classList.contains('dark');
    
    // For 1-3 timezones, show analog clocks
    if (timezones.length <= 3) {
      return (
        <div className="grid grid-cols-3 gap-3 h-full transition-all duration-300">
          {timezones.map(tz => (
            <div key={tz.id} className="flex flex-col items-center justify-center h-full transition-all duration-300">
              <div className="text-xs font-medium tracking-tight text-gray-800 dark:text-gray-200 mb-1 truncate w-full text-center">
                {tz.name}
              </div>
              <div className="mb-0.5">
                {renderClock(tz.timezone, 50, isDarkMode)}
              </div>
              <div className="text-base font-light tracking-tighter">
                {formatTime(currentTime, tz.timezone).split(':').slice(0, 2).join(':')}
              </div>
            </div>
          ))}
        </div>
      );
    }
    
    // For 4-6 timezones, show digital clocks in a 3x2 grid
    if (timezones.length <= 6) {
      return (
        <div className="grid grid-cols-3 grid-rows-2 gap-x-3 gap-y-2 h-full transition-all duration-300">
          {timezones.slice(0, 6).map(tz => (
            <div key={tz.id} className="flex flex-col items-center justify-center h-full transition-all duration-300">
              <div className="text-lg font-light tracking-tighter leading-none">
                {formatTime(currentTime, tz.timezone).split(':').slice(0, 2).join(':')}
              </div>
              <div className="text-xs font-medium tracking-tight text-gray-700 dark:text-gray-300 truncate w-full text-center mt-0.5">
                {tz.name}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 tracking-wide">
                {getTimeDiff(tz.timezone)}
              </div>
            </div>
          ))}
        </div>
      );
    }
    
    // For 7+ timezones, use a more compact grid with scrolling
    return (
      <div className="grid grid-cols-3 auto-rows-min gap-x-3 gap-y-2 h-full overflow-y-auto transition-all duration-300">
        {timezones.map(tz => (
          <div key={tz.id} className="flex flex-col items-center justify-center py-1 transition-all duration-300">
            <div className="text-base font-light tracking-tighter leading-none">
              {formatTime(currentTime, tz.timezone).split(':').slice(0, 2).join(':')}
            </div>
            <div className="text-xs font-medium tracking-tight text-gray-700 dark:text-gray-300 truncate w-full text-center mt-0.5">
              {tz.name}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 tracking-wide">
              {getTimeDiff(tz.timezone)}
            </div>
          </div>
        ))}
      </div>
    );
  };

  /**
   * Renders a taller view with more timezones and details
   * 
   * This view adapts based on the number of timezones:
   * - For 1-4 timezones: Displays vertical layout with analog clocks
   * - For 5+ timezones: Uses horizontal layout with smaller clocks and more information
   * 
   * @returns {JSX.Element} Tall view optimized for 2x3+ grid sizes
   */
  const renderTallView = () => {
    const isDarkMode = document.documentElement.classList.contains('dark');
    
    // For 1-4 timezones, show larger clocks with more details
    if (timezones.length <= 4) {
      return (
        <div className="grid grid-cols-2 gap-2 h-full transition-all duration-300">
          {timezones.map(tz => (
            <div key={tz.id} className="flex flex-col items-center justify-center h-full transition-all duration-300">
              <div className="text-xs font-medium mb-0.5 truncate w-full text-center text-gray-800 dark:text-gray-200">
                {tz.name}
              </div>
              <div className="mb-0.5">
                {renderClock(tz.timezone, 50, isDarkMode)}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {formatTime(currentTime, tz.timezone).split(':').slice(0, 2).join(':')}
              </div>
              <div className="text-xs text-gray-400 dark:text-gray-500">
                {getTimeDiff(tz.timezone)}
              </div>
            </div>
          ))}
        </div>
      );
    }
    
    // For 5+ timezones, use a compact layout with smaller clocks
    return (
      <div className="grid grid-cols-2 auto-rows-min gap-1 h-full overflow-y-auto transition-all duration-300">
        {timezones.map(tz => (
          <div key={tz.id} className="flex items-center p-1 transition-all duration-300">
            <div className="mr-1.5">
              {renderClock(tz.timezone, 30, isDarkMode)}
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <div className="text-xs font-medium truncate text-gray-800 dark:text-gray-200">{tz.name}</div>
              <div className="text-xs font-bold">
                {formatTime(currentTime, tz.timezone).split(':').slice(0, 2).join(':')}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{getTimeDiff(tz.timezone)}</div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  /**
   * Renders the full-size view with all timezones and maximum details
   * 
   * This view provides the most comprehensive display:
   * - Larger analog clocks
   * - Digital time with AM/PM
   * - City name
   * - Time difference
   * - Relative date information (Today, Tomorrow, etc.)
   * 
   * @returns {JSX.Element} Full view optimized for 4x4+ grid sizes
   */
  const renderFullView = () => {
    const isDarkMode = document.documentElement.classList.contains('dark');
    
    return (
      <div className="grid grid-cols-3 gap-3 h-full overflow-y-auto transition-all duration-300">
        {timezones.map(tz => (
          <div key={tz.id} className="flex flex-col items-center justify-center h-full transition-all duration-300">
            <div className="text-sm font-medium mb-1 text-gray-800 dark:text-gray-200 truncate w-full text-center">{tz.name}</div>
            <div className="mb-2">
              {renderClock(tz.timezone, 70, isDarkMode)}
            </div>
            <div className="text-lg font-light tracking-tighter">
              {formatTime(currentTime, tz.timezone).split(':').slice(0, 2).join(':')}
              <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-1">
                {formatTime(currentTime, tz.timezone).split(' ')[1]}
              </span>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 tracking-wide">
              {getRelativeDate(currentTime, tz.timezone)}
            </div>
            <div className="text-xs text-gray-400 dark:text-gray-500 tracking-wide">
              {getTimeDiff(tz.timezone)}
            </div>
          </div>
        ))}
      </div>
    );
  };

  /**
   * Renders an extra-wide view optimized for layouts with 6+ columns width
   * 
   * This view maximizes horizontal space usage with elegant minimalism:
   * - For 1-6 timezones: Displays in a single row with refined analog clocks
   * - For 7-12 timezones: Shows a 6×2 grid of clocks with elegant typography
   * - For 13+ timezones: Provides a scrollable grid with consistent design
   * 
   * @returns {JSX.Element} Extra-wide view optimized for 6×2 or wider layouts
   */
  const renderExtraWideView = () => {
    const isDarkMode = document.documentElement.classList.contains('dark');
    
    // For 1-6 timezones, show in a single row with larger analog clocks
    if (timezones.length <= 6) {
      return (
        <div className="grid grid-cols-6 gap-3 h-full transition-all duration-300">
          {timezones.map(tz => (
            <div key={tz.id} className="flex flex-col items-center justify-center h-full transition-all duration-300">
              <div className="text-sm font-medium tracking-tight text-gray-800 dark:text-gray-200 mb-1 truncate w-full text-center">
                {tz.name}
              </div>
              <div className="relative mb-1">
                {renderClock(tz.timezone, 46, isDarkMode)}
              </div>
              <div className="font-light text-xl tracking-tighter leading-none">
                {formatTime(currentTime, tz.timezone).split(':').slice(0, 2).join(':')}
                <span className="text-xs ml-1 text-gray-500 dark:text-gray-400 font-normal tracking-normal">
                  {formatTime(currentTime, tz.timezone).split(' ')[1]}
                </span>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 tracking-wide mt-0.5">
                {getTimeDiff(tz.timezone)}
              </div>
            </div>
          ))}
        </div>
      );
    }
    
    // For 7-12 timezones, use a 6×2 grid layout
    if (timezones.length <= 12) {
      return (
        <div className="grid grid-cols-6 grid-rows-2 gap-x-3 gap-y-1 h-full transition-all duration-300">
          {timezones.slice(0, 12).map(tz => (
            <div key={tz.id} className="flex flex-col items-center justify-center h-full transition-all duration-300">
              <div className="font-light text-lg tracking-tighter leading-none">
                {formatTime(currentTime, tz.timezone).split(':').slice(0, 2).join(':')}
              </div>
              <div className="text-xs font-medium tracking-tight text-gray-700 dark:text-gray-300 truncate w-full text-center mt-0.5">
                {tz.name}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 tracking-wide">
                {getTimeDiff(tz.timezone)}
              </div>
            </div>
          ))}
        </div>
      );
    }
    
    // For 13+ timezones, use a scrollable 6-column grid
    return (
      <div className="grid grid-cols-6 auto-rows-min gap-x-3 gap-y-2 h-full overflow-y-auto transition-all duration-300">
        {timezones.map(tz => (
          <div key={tz.id} className="flex flex-col items-center justify-center min-h-full py-2 transition-all duration-300">
            <div className="font-light text-lg tracking-tighter leading-none">
              {formatTime(currentTime, tz.timezone).split(':').slice(0, 2).join(':')}
            </div>
            <div className="text-xs font-medium tracking-tight text-gray-700 dark:text-gray-300 truncate w-full text-center mt-0.5">
              {tz.name}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 tracking-wide">
              {getTimeDiff(tz.timezone)}
            </div>
          </div>
        ))}
      </div>
    );
  };

  /**
   * Renders a specialized view for widgets that are both tall and wide (3-4 rows × 2 columns)
   * 
   * This view provides an elegant layout for the 2-wide by 3-4-tall dimensions:
   * - Displays all timezones in a 2-column layout
   * - Shows larger analog clocks with digital time below
   * - Provides additional details while maintaining visual elegance
   * 
   * @returns {JSX.Element} Tall-wide view optimized for 2×3 or 2×4 grid sizes
   */
  const renderTallWideView = () => {
    const isDarkMode = document.documentElement.classList.contains('dark');
    
    return (
      <div className="grid grid-cols-2 gap-4 h-full transition-all duration-300">
        {timezones.map(tz => (
          <div key={tz.id} className="flex flex-col items-center justify-center h-full transition-all duration-300">
            <div className="text-sm font-medium tracking-tight text-gray-800 dark:text-gray-200 mb-1 truncate w-full text-center">
              {tz.name}
            </div>
            <div className="relative mb-1">
              {renderClock(tz.timezone, 70, isDarkMode)}
            </div>
            <div className="font-light text-2xl tracking-tighter leading-none mt-1">
              {formatTime(currentTime, tz.timezone).split(':').slice(0, 2).join(':')}
            </div>
            <div className="flex items-center justify-center space-x-2 mt-1">
              <div className="text-xs text-gray-500 dark:text-gray-400 tracking-wide">
                {getTimeDiff(tz.timezone)}
              </div>
              <div className="w-1 h-1 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
              <div className="text-xs text-gray-500 dark:text-gray-400 leading-none tracking-wide">
                {formatTime(currentTime, tz.timezone).split(' ')[1]}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  /**
   * Determines which view to render based on widget dimensions and number of timezones
   * 
   * Selection logic:
   * - 1x1: Compact view with single timezone
   * - 2x2 with ≤2 timezones: Clean default view
   * - 2x2 with 3-4 timezones: Grid medium view
   * - 2x2 with 5+ timezones: Scrollable default view
   * - 2x3-2x4: Tall-wide view with optimized layout for these proportions
   * - 2x5+: Tall view with analog clocks or compact list
   * - 3x2-5x2: Wide view with analog or digital clocks
   * - 6x2+: Extra-wide view with optimized layout
   * - 3x3+: Tall view with detailed information
   * - 4x4+: Full view with maximum details
   * 
   * For irregular sizes, selects based on aspect ratio.
   * 
   * @returns {JSX.Element} The appropriate view for the current dimensions and timezone count
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
    
    // Single timezone for very small widgets
    if (width === 1 && height === 1) {
      return renderCompactView();
    }
    
    // Determine the best view based on dimensions and timezone count
    
    // Full size widgets - use the most detailed view
    if (width >= 4 && height >= 4) {
      return renderFullView();
    }
    
    // Extra-wide layout (6+ columns, 2 rows)
    if (width >= 6 && height === 2) {
      return renderExtraWideView();
    }
    
    // Tall-wide layout (2 columns, 3-4 rows)
    if (width === 2 && (height === 3 || height === 4)) {
      return renderTallWideView();
    }
    
    // Tall layout - 2x5+
    if (width === 2 && height >= 5) {
      // For many timezones in this layout, the tall view with compact list is best
      return renderTallView();
    }
    
    // Wide layout - 3x2 to 5x2
    if (width >= 3 && height === 2) {
      return renderWideView();
    }
    
    // Square 2x2 layout
    if (width === 2 && height === 2) {
      // Choose based on number of timezones
      if (timezones.length <= 2) {
        return renderDefaultView(); // Cleaner look for fewer timezones
      } else if (timezones.length <= 4) {
        return renderMediumView(); // Grid for 3-4 timezones
      } else {
        return renderDefaultView(); // Scrollable list for many timezones
      }
    }
    
    // 3x3 and similar sizes
    if (width >= 3 && height >= 3) {
      return renderTallView();
    }
    
    // For all other irregular sizes, choose based on aspect ratio
    if (width > height) {
      return renderWideView(); // Wider than tall
    } else if (height > width) {
      return renderTallView(); // Taller than wide
    }
    
    // Default fallback for other dimensions
    return renderDefaultView();
  };

  /**
   * Renders the settings content for the modal
   * 
   * @returns Settings content
   */
  const renderSettingsContent = () => {
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
    
    return (
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
    );
  };

  /**
   * Renders the settings footer for the modal
   * 
   * @returns Settings footer
   */
  const renderSettingsFooter = () => {
    return (
      <>
        {config?.onDelete && (
          <button
            className="px-4 py-2 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 border border-transparent hover:border-red-200 dark:hover:border-red-800 rounded-lg text-sm font-medium transition-colors"
            onClick={() => {
              if (config.onDelete) {
                config.onDelete();
              }
            }}
            aria-label="Delete this widget"
          >
            Delete Widget
          </button>
        )}
        
        <div className="flex space-x-2">
          <button 
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-lg text-sm font-medium"
            onClick={() => {
              setShowSettings(false);
              setShowAddForm(false);
            }}
          >
            Cancel
          </button>
          <button 
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium"
            onClick={() => {
              // Save the updated timezones
              if (newTimezone.name && newTimezone.timezone) {
                addTimezone();
              }
              setShowSettings(false);
              setShowAddForm(false);
            }}
          >
            Save
          </button>
        </div>
      </>
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
      
      {showSettings && (
        <Dialog
          open={showSettings}
          onOpenChange={(open: boolean) => {
            if (!open) {
              setShowSettings(false);
              setShowAddForm(false);
            }
          }}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>World Clocks Settings</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {renderSettingsContent()}
            </div>
            <DialogFooter>
              {renderSettingsFooter()}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default WorldClocksWidget;

// Export types for use in other files
export * from './types'; 