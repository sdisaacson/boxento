import { useState, useEffect, useRef } from 'react'
import { Calendar, Settings, X } from 'lucide-react'
import { createPortal } from 'react-dom'

const CalendarWidget = ({ width, height, config }) => {
  const [date, setDate] = useState(new Date())
  const [showSettings, setShowSettings] = useState(false)
  const [localConfig, setLocalConfig] = useState(config || {})
  const settingsRef = useRef(null)
  const settingsButtonRef = useRef(null)
  const widgetRef = useRef(null)
  
  useEffect(() => {
    const timer = setInterval(() => {
      setDate(new Date())
    }, 60000)
    
    return () => clearInterval(timer)
  }, [])
  
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
    
    // Use createPortal to render the modal at the document body level
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
            <h3 className="text-lg font-medium">Calendar Settings</h3>
            <button 
              onClick={() => setShowSettings(false)}
              className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              <X size={20} />
            </button>
          </div>
          
          <div className="mb-6">
            <label className="block text-sm mb-2 font-medium">First Day of Week</label>
            <select 
              className="w-full p-2 bg-gray-100 dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600"
              value={localConfig.startDay || 'sunday'}
              onChange={(e) => setLocalConfig({...localConfig, startDay: e.target.value})}
            >
              <option value="sunday">Sunday</option>
              <option value="monday">Monday</option>
            </select>
          </div>
          
          <div className="mb-6">
            <label className="block text-sm mb-2 font-medium">Show Week Numbers</label>
            <div className="flex items-center">
              <input 
                type="checkbox"
                checked={localConfig.showWeekNumbers || false}
                onChange={(e) => setLocalConfig({...localConfig, showWeekNumbers: e.target.checked})}
                className="mr-2 h-4 w-4"
                id="weekNumbers"
              />
              <label htmlFor="weekNumbers" className="text-sm">Display week numbers</label>
            </div>
          </div>
          
          <div className="flex justify-end gap-2">
            <button 
              onClick={() => setShowSettings(false)}
              className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button 
              onClick={() => setShowSettings(false)}
              className="px-4 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Save
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
    if (width === 1 && height === 1) {
      return renderCompactView(); // 1x1 smallest view
    } else if (width === 1 && height === 2) {
      return renderVerticalView(); // 1x2 vertical view
    } else if (width === 2 && height === 1) {
      return renderHorizontalView(); // 2x1 horizontal view
    } else if ((width === 2 && height >= 2) || (width >= 2 && height === 2)) {
      return renderFullCalendar(); // 2x2 and larger square/rectangle view
    } else {
      // 3x2, 2x3, or other larger sizes
      return renderFullCalendar(); 
    }
  };

  // Vertical view for 1x2 layout
  const renderVerticalView = () => {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2">
        <div className="text-4xl font-bold">{date.getDate()}</div>
        <div className="text-xl">
          {date.toLocaleString('default', { month: 'short' })}
        </div>
        <div className="text-sm opacity-80">
          {date.toLocaleString('default', { weekday: 'short' })}
        </div>
      </div>
    );
  };

  // Horizontal view for 2x1 layout
  const renderHorizontalView = () => {
    return (
      <div className="flex items-center justify-between h-full px-2">
        <div className="text-3xl font-bold">{date.getDate()}</div>
        <div className="flex flex-col text-right">
          <div className="text-lg">{date.toLocaleString('default', { month: 'short' })}</div>
          <div className="text-sm opacity-80">{date.toLocaleString('default', { weekday: 'short' })}</div>
        </div>
      </div>
    );
  };

  return (
    <div ref={widgetRef} className="widget-container">
      <div className="flex justify-between items-center mb-2">
        <div className="widget-drag-handle p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 14C13.1046 14 14 13.1046 14 12C14 10.8954 13.1046 10 12 10C10.8954 10 10 10.8954 10 12C10 13.1046 10.8954 14 12 14Z" fill="currentColor" />
            <path d="M19 14C20.1046 14 21 13.1046 21 12C21 10.8954 20.1046 10 19 10C17.8954 10 17 10.8954 17 12C17 13.1046 17.8954 14 19 14Z" fill="currentColor" />
            <path d="M5 14C6.10457 14 7 13.1046 7 12C7 10.8954 6.10457 10 5 10C3.89543 10 3 10.8954 3 12C3 13.1046 3.89543 14 5 14Z" fill="currentColor" />
          </svg>
        </div>
        <button 
          className="settings-button p-1 hover:bg-gray-100 dark:hover:bg-gray-700"
          onClick={() => setShowSettings(!showSettings)}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3"></circle>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
          </svg>
        </button>
      </div>
      
      {/* Use the renderContent function to determine which view to show based on dimensions */}
      {renderContent()}
      
      {/* Settings modal (now rendered at the end of body via portal) */}
      {renderSettings()}
    </div>
  )
}

export default CalendarWidget