import React, { useState, useEffect, useRef } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import Modal from '../../ui/Modal'
import WidgetHeader from '../../ui/WidgetHeader'
import { CalendarWidgetProps, CalendarWidgetConfig, CalendarEvent } from './types'

/**
 * Calendar Widget Component
 * 
 * Displays a calendar with different views based on the widget size:
 * - 2x2 (minimum): Shows a full month calendar
 * - Larger sizes: Shows more detailed calendar views
 * 
 * The widget supports configuration through a settings modal:
 * - First day of week (Sunday/Monday)
 * - Show/hide week numbers
 * 
 * @component
 * @param {CalendarWidgetProps} props - Component props
 * @returns {JSX.Element} Calendar widget component
 */
const CalendarWidget: React.FC<CalendarWidgetProps> = ({ config }) => {
  const [date, setDate] = useState<Date>(new Date())
  const [localConfig, setLocalConfig] = useState<CalendarWidgetConfig>(config || { id: '' })
  const widgetRef = useRef<HTMLDivElement | null>(null)
  
  // Simplified settings state
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false)
  const [events, _setEvents] = useState<CalendarEvent[]>([
    { title: 'Team Meeting', time: '10:00 AM' },
    { title: 'Lunch with Alex', time: '12:30 PM' },
    { title: 'Product Demo', time: '3:00 PM' }
  ])

  // Update date every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setDate(new Date())
    }, 60000)
    
    return () => clearInterval(timer)
  }, [])
  
  /**
   * Get the number of days in a month
   * 
   * @param {number} year - Year
   * @param {number} month - Month (0-11)
   * @returns {number} Number of days in the month
   */
  const getDaysInMonth = (year: number, month: number): number => {
    return new Date(year, month + 1, 0).getDate()
  }
  
  /**
   * Get the first day of the month
   * 
   * @param {number} year - Year
   * @param {number} month - Month (0-11)
   * @returns {number} Day of the week (0-6)
   */
  const getFirstDayOfMonth = (year: number, month: number): number => {
    return new Date(year, month, 1).getDay()
  }

  /**
   * Renders the full calendar view
   * 
   * @returns {JSX.Element} Full calendar view
   */
  const renderFullCalendar = () => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const currentDay = date.getDate()
    
    const daysInMonth = getDaysInMonth(year, month)
    const firstDay = getFirstDayOfMonth(year, month)
    
    // Adjust first day of week based on settings
    const startDay = localConfig.startDay === 'monday' ? 1 : 0
    const adjustedFirstDay = (firstDay - startDay + 7) % 7
    
    // Day names based on start day setting
    const dayNames = startDay === 1 
      ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
      : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    
    // Calculate week numbers if enabled
    const showWeekNumbers = localConfig.showWeekNumbers || false
    
    return (
      <div ref={widgetRef} className="h-full flex flex-col">
        <div className="flex justify-between items-center mb-2 px-2">
          <button 
            onClick={() => setDate(new Date(year, month - 1, 1))}
            className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700"
            aria-label="Previous month"
          >
            <ChevronLeft size={16} />
          </button>
          
          <h3 className="text-sm font-medium">
            {date.toLocaleDateString('default', { month: 'long', year: 'numeric' })}
          </h3>
          
          <button 
            onClick={() => setDate(new Date(year, month + 1, 1))}
            className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700"
            aria-label="Next month"
          >
            <ChevronRight size={16} />
          </button>
        </div>
        
        <div className={`grid ${showWeekNumbers ? 'grid-cols-8' : 'grid-cols-7'} gap-1`}>
          {/* Week number header if enabled */}
          {showWeekNumbers && (
            <div className="text-xs text-center text-gray-500 dark:text-gray-400 font-medium py-1">
              Wk
            </div>
          )}
          
          {/* Day name headers */}
          {dayNames.map((day) => (
            <div 
              key={day} 
              className="text-xs text-center text-gray-500 dark:text-gray-400 font-medium py-1"
            >
              {day}
            </div>
          ))}
          
          {/* Week numbers if enabled */}
          {showWeekNumbers && (
            <div className="text-xs text-center text-gray-500 dark:text-gray-400 font-medium py-1">
              {Math.ceil((adjustedFirstDay + 1) / 7) + 1}
            </div>
          )}
          
          {/* Empty cells for days before the first day of month */}
          {Array.from({ length: adjustedFirstDay }).map((_, index) => (
            <div key={`empty-${index}`} className="aspect-square"></div>
          ))}
          
          {/* Calendar days */}
          {Array.from({ length: daysInMonth }).map((_, index) => {
            const day = index + 1
            const isToday = day === currentDay && new Date().getMonth() === month && new Date().getFullYear() === year
            
            return (
              <div 
                key={`day-${day}`} 
                className={`aspect-square flex items-center justify-center text-xs rounded-full ${
                  isToday 
                    ? 'bg-blue-500 text-white font-medium' 
                    : 'hover:bg-gray-100 dark:hover:bg-slate-700'
                }`}
              >
                {day}
              </div>
            )
          })}
        </div>
        
        {/* Events section */}
        <div className="mt-2 overflow-y-auto flex-1">
          <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 px-2">
            Today's Events
          </h4>
          <div className="space-y-1 px-1">
            {events.map((event, index) => (
              <div 
                key={index}
                className="text-xs p-1.5 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-100 dark:border-blue-800"
              >
                <div className="font-medium">{event.title}</div>
                {event.time && <div className="text-gray-500 dark:text-gray-400">{event.time}</div>}
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  /**
   * Renders the settings content for the modal
   * 
   * @returns {JSX.Element} Settings content
   */
  const renderSettingsContent = () => {
    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            First Day of Week
          </label>
          <select
            className="w-full p-2 bg-gray-100 dark:bg-slate-700 rounded-lg border border-gray-300 dark:border-slate-600 text-gray-800 dark:text-gray-100 shadow-sm focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 focus:border-transparent outline-none"
            value={localConfig.startDay || 'sunday'}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setLocalConfig({...localConfig, startDay: e.target.value as 'sunday' | 'monday'})}
          >
            <option value="sunday">Sunday</option>
            <option value="monday">Monday</option>
          </select>
        </div>
        
        <div>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={localConfig.showWeekNumbers || false}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLocalConfig({...localConfig, showWeekNumbers: e.target.checked})}
              className="mr-3 h-4 w-4 accent-blue-500 dark:accent-blue-400"
              id="weekNumbers"
            />
            <span className="text-sm">Show Week Numbers</span>
          </label>
        </div>
      </div>
    )
  }

  /**
   * Renders the settings footer for the modal
   * 
   * @returns {JSX.Element} Settings footer
   */
  const renderSettingsFooter = () => {
    return (
      <div className="flex justify-end space-x-2">
        <button 
          onClick={() => setIsSettingsOpen(false)}
          className="px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-md text-sm text-gray-700 dark:text-slate-200"
        >
          Cancel
        </button>
        <button 
          onClick={() => setIsSettingsOpen(false)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
        >
          Save
        </button>
      </div>
    )
  }

  /**
   * Determines which view to render based on widget dimensions
   * 
   * @returns {JSX.Element} The appropriate view for the current dimensions
   */
  const renderContent = () => {
    // For now, we only have the full calendar view
    return renderFullCalendar()
  }

  return (
    <div 
      ref={widgetRef} 
      className="widget-container h-full flex flex-col"
    >
      <WidgetHeader 
        title="Calendar" 
        onSettingsClick={() => setIsSettingsOpen(true)}
      />
      
      <div className="flex-1 overflow-hidden p-2">
        {renderContent()}
      </div>
      
      {isSettingsOpen && (
        <Modal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          title="Calendar Settings"
          size="md"
          footer={renderSettingsFooter()}
          children={renderSettingsContent()}
        />
      )}
    </div>
  )
}

export default CalendarWidget

// Export types for use in other files
export * from './types' 