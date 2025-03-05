import { useState, useEffect, useRef } from 'react'
import { Calendar, Settings, X } from 'lucide-react'

const CalendarWidget = ({ width, height, config }) => {
  const [date, setDate] = useState(new Date())
  const [showSettings, setShowSettings] = useState(false)
  const [localConfig, setLocalConfig] = useState(config || {})
  const settingsRef = useRef(null)
  const settingsButtonRef = useRef(null)
  
  useEffect(() => {
    const timer = setInterval(() => {
      setDate(new Date())
    }, 60000)
    
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
  
  const formatDate = (date) => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    }).format(date)
  }
  
  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate()
  }
  
  const getFirstDayOfMonth = (year, month) => {
    return new Date(year, month, 1).getDay()
  }
  
  const renderCompactView = () => {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="text-4xl font-bold">{date.getDate()}</div>
          <div className="text-sm opacity-80">
            {date.toLocaleString('default', { month: 'short' })}
          </div>
        </div>
      </div>
    )
  }
  
  const renderFullCalendar = () => {
    const currentYear = date.getFullYear()
    const currentMonth = date.getMonth()
    const daysInMonth = getDaysInMonth(currentYear, currentMonth)
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth)
    
    const days = []
    const weekdays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
    
    // Add weekday headers
    weekdays.forEach((day) => {
      days.push(
        <div key={`header-${day}`} className="text-center text-xs font-medium py-1">
          {day}
        </div>
      )
    })
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="p-1" />)
    }
    
    // Add cells for days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const isToday = day === date.getDate() && 
                       currentMonth === date.getMonth() && 
                       currentYear === date.getFullYear()
      
      days.push(
        <div key={`day-${day}`} className="p-1">
          <div className={`${isToday ? 'bg-blue-500 text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-700'} rounded-full w-8 h-8 flex items-center justify-center text-sm cursor-pointer`}>
            {day}
          </div>
        </div>
      )
    }
    
    return (
      <div className="h-full flex flex-col">
        <div className="text-center mb-2 font-medium">
          {date.toLocaleString('default', { month: 'long', year: 'numeric' })}
        </div>
        <div className="grid grid-cols-7 gap-0 flex-grow">
          {days}
        </div>
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
        <div className="mb-4">
          <h3 className="text-sm font-medium mb-2">Calendar Settings</h3>
          
          <div className="mb-4">
            <label className="block text-sm mb-1 font-medium">First Day of Week</label>
            <select 
              className="w-full p-2 bg-gray-100 dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600"
              value={localConfig.startDay || 'sunday'}
              onChange={(e) => setLocalConfig({...localConfig, startDay: e.target.value})}
            >
              <option value="sunday">Sunday</option>
              <option value="monday">Monday</option>
            </select>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm mb-1 font-medium">Show Week Numbers</label>
            <input 
              type="checkbox"
              checked={localConfig.showWeekNumbers || false}
              onChange={(e) => setLocalConfig({...localConfig, showWeekNumbers: e.target.checked})}
              className="mr-2"
            />
            <span className="text-sm">Display week numbers</span>
          </div>
        </div>
        
        <div className="flex justify-end">
          <button 
            onClick={() => setShowSettings(false)}
            className="text-sm bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
          >
            Save
          </button>
        </div>
      </div>
    )
  }
  
  return (
    <div className="h-full flex flex-col relative">
      <div className="widget-drag-handle flex justify-between items-center mb-2">
        <div className="flex items-center gap-1">
          <Calendar size={16} />
          <h3 className="text-sm font-medium">Calendar</h3>
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
      {width <= 2 && height <= 2 ? renderCompactView() : renderFullCalendar()}
      
      {/* Settings dropdown */}
      {renderSettings()}
    </div>
  )
}

export default CalendarWidget