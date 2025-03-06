import { useState, useEffect, useRef } from 'react'
import { Calendar, X, CircleDot } from 'lucide-react'
import Modal from '../ui/Modal'
import { useWidgetSettings } from '../../utils/widgetHelpers'

/**
 * Calendar Widget Component
 * 
 * Displays a calendar with different views based on the widget size:
 * - 1x1: Shows just the current date
 * - 1x2: Shows date in a vertical layout
 * - 2x1: Shows date in a horizontal layout
 * - 2x2 and larger: Shows a full month calendar
 * 
 * The widget supports configuration through a settings modal:
 * - First day of week (Sunday/Monday)
 * - Show/hide week numbers
 * 
 * @param {Object} props - Component props
 * @param {number} props.width - Width of the widget in grid units
 * @param {number} props.height - Height of the widget in grid units
 * @param {Object} props.config - Widget configuration
 * @param {string} [props.config.startDay='sunday'] - First day of the week
 * @param {boolean} [props.config.showWeekNumbers=false] - Whether to show week numbers
 * @returns {JSX.Element} Calendar widget component
 */
const CalendarWidget = ({ width, height, config }) => {
  const [date, setDate] = useState(new Date())
  const [localConfig, setLocalConfig] = useState(config || {})
  const widgetRef = useRef(null)
  
  // Simplified settings state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  /**
   * Update the date every minute
   */
  useEffect(() => {
    const timer = setInterval(() => {
      setDate(new Date())
    }, 60000)
    
    return () => clearInterval(timer)
  }, [])
  
  /**
   * Format a date using Intl.DateTimeFormat
   * @param {Date} date - The date to format
   * @returns {string} Formatted date string
   */
  const formatDate = (date) => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    }).format(date)
  }
  
  /**
   * Get the number of days in a month
   * @param {number} year - The year
   * @param {number} month - The month (0-11)
   * @returns {number} Number of days in the month
   */
  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate()
  }
  
  /**
   * Get the day of the week for the first day of a month
   * @param {number} year - The year
   * @param {number} month - The month (0-11)
   * @returns {number} Day of the week (0-6, where 0 is Sunday)
   */
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

  // Modal content for settings
  const renderSettingsContent = () => {
    return (
      <>
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
      </>
    )
  }

  // Modal footer with buttons
  const renderSettingsFooter = () => {
    return (
      <>
        <button 
          onClick={() => setIsSettingsOpen(false)}
          className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          Cancel
        </button>
        <button 
          onClick={() => setIsSettingsOpen(false)}
          className="px-4 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Save
        </button>
      </>
    )
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
      return renderFullCalendar(); // Large view (e.g., 4x4, 6x6)
    }
  };

  // Default view for 2x2 layout
  const renderDefaultView = () => {
    return (
      <div className="h-full flex flex-col">
        <div className="text-center mb-2 font-medium">
          {date.toLocaleString('default', { month: 'long', year: 'numeric' })}
        </div>
        <div className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <div className="text-4xl font-bold">{date.getDate()}</div>
            <div className="text-sm opacity-80">
              {date.toLocaleString('default', { weekday: 'long' })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Wide view for layouts like 4x2, 6x2
  const renderWideView = () => {
    return renderFullCalendar(); // For calendar, wide view can show the full calendar
  };

  // Tall view for layouts like 2x4, 2x6
  const renderTallView = () => {
    return renderFullCalendar(); // For calendar, tall view can show the full calendar
  };

  return (
    <div ref={widgetRef} className="widget-container">
      <div className="flex justify-end items-center mb-2">
        <button 
          className="settings-button p-1 hover:bg-gray-100 dark:hover:bg-gray-700"
          onClick={(e) => {
            e.stopPropagation();
            setIsSettingsOpen(true);
          }}
        >
          <CircleDot size={16} />
        </button>
      </div>
      
      {/* Use the renderContent function to determine which view to show based on dimensions */}
      {renderContent()}
      
      {/* Settings modal using our reusable Modal component */}
      <Modal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        title="Calendar Settings"
        footer={renderSettingsFooter()}
      >
        {renderSettingsContent()}
      </Modal>
    </div>
  )
}

// Widget configuration for registration
export const calendarWidgetConfig = {
  type: 'calendar',
  name: 'Calendar',
  description: 'Shows today\'s date and upcoming events',
  defaultSize: { w: 2, h: 2 },
  minSize: { w: 2, h: 2 },
  maxSize: { w: 6, h: 6 }
}

export default CalendarWidget