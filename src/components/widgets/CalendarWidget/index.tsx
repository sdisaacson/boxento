import React, { useState, useEffect, useRef } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import Modal from '../../ui/Modal'
import WidgetHeader from '../../ui/WidgetHeader'
import { CalendarWidgetProps, CalendarWidgetConfig, CalendarEvent } from './types'

/**
 * Calendar Widget Component
 * 
 * Displays a calendar with different views based on the widget size:
 * - 2x2 (minimum): Shows current date with day of week and minimal event count
 * - 2x3: Shows current week view with events for each day
 * - 3x2: Shows a compact month calendar with minimal event details
 * - 3x3 or larger: Shows a full calendar with week numbers and detailed daily events
 * - 4x4 or larger: Shows an expanded view with month calendar and weekly agenda
 * 
 * The widget supports configuration through a settings modal:
 * - First day of week (Sunday/Monday)
 * - Show/hide week numbers
 * 
 * @component
 * @param {CalendarWidgetProps} props - Component props
 * @returns {JSX.Element} Calendar widget component
 */
const CalendarWidget: React.FC<CalendarWidgetProps> = ({ width = 2, height = 2, config }) => {
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
   * Renders a compact date view for the smallest widget size (2x2)
   * 
   * @returns {JSX.Element} Compact date view
   */
  const renderCompactCalendar = () => {
    const today = new Date()
    const dayOfWeek = today.toLocaleDateString('default', { weekday: 'long' })
    const dayOfMonth = today.getDate()
    const month = today.toLocaleDateString('default', { month: 'long' })
    
    return (
      <div ref={widgetRef} className="h-full flex flex-col justify-center items-center text-center">
        <div className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">
          {dayOfWeek}
        </div>
        
        <div className="flex flex-col items-center">
          <span className="text-3xl font-bold text-blue-500">{dayOfMonth}</span>
          <span className="text-sm">{month}</span>
        </div>
        
        {events.length > 0 && (
          <div className="mt-2 text-xs text-gray-600 dark:text-gray-300">
            {events.length} event{events.length !== 1 ? 's' : ''} today
          </div>
        )}
      </div>
    )
  }

  /**
   * Renders a weekly view for tall narrow widgets (2x3)
   * 
   * @returns {JSX.Element} Weekly view
   */
  const renderWeeklyView = () => {
    const today = new Date()
    const currentDay = today.getDay()
    const weekStart = new Date(today)
    
    // Start from either Sunday or Monday based on settings
    const startDay = localConfig.startDay === 'monday' ? 1 : 0
    const daysToSubtract = (currentDay - startDay + 7) % 7
    weekStart.setDate(today.getDate() - daysToSubtract)
    
    // Get full day names instead of abbreviated
    const dayNames = startDay === 1 
      ? ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
      : ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    
    return (
      <div className="h-full flex flex-col">
        <div className="text-center mb-3">
          <h3 className="text-sm font-medium">
            {weekStart.toLocaleDateString('default', { month: 'long' })} {weekStart.getFullYear()}
          </h3>
        </div>
        
        <div className="flex-1 flex flex-col justify-between">
          {/* Weekday slots - simplified */}
          {Array.from({ length: 7 }).map((_, index) => {
            const dayOffset = (index + startDay) % 7
            const currentDayOfWeek = (today.getDay() + 7 - daysToSubtract) % 7
            const isToday = dayOffset === currentDayOfWeek
            const dayDate = new Date(weekStart)
            dayDate.setDate(weekStart.getDate() + index)
            
            // Count events for this day (simplified)
            const hasEvents = isToday && events.length > 0
            
            return (
              <div 
                key={`day-${index}`}
                className={`flex items-center py-1.5 px-2 rounded-lg ${
                  isToday ? 'bg-blue-100 dark:bg-blue-900/30' : ''
                }`}
              >
                <div className={`w-7 h-7 rounded-full flex items-center justify-center mr-2.5 ${
                  isToday ? 'bg-blue-500 text-white' : 'text-gray-700 dark:text-gray-300'
                }`}>
                  <span className="text-sm font-medium">{dayDate.getDate()}</span>
                </div>
                
                <div className="flex-1">
                  <div className={`text-xs ${isToday ? 'font-medium' : ''}`}>
                    {dayNames[dayOffset].substring(0, 3)}
                  </div>
                </div>
                
                {hasEvents && (
                  <div className="text-xs text-blue-500 font-medium">
                    {events.length}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  /**
   * Renders a monthly view for wide widgets (3x2)
   * 
   * @returns {JSX.Element} Monthly view for wide layouts
   */
  const renderStandardCalendar = () => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const currentDay = date.getDate()
    
    const daysInMonth = getDaysInMonth(year, month)
    const firstDay = getFirstDayOfMonth(year, month)
    
    // Adjust first day of week based on settings
    const startDay = localConfig.startDay === 'monday' ? 1 : 0
    const adjustedFirstDay = (firstDay - startDay + 7) % 7
    
    // Day names based on start day setting - use shorter abbreviations
    const dayNames = startDay === 1 
      ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
      : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    
    return (
      <div ref={widgetRef} className="h-full flex flex-col">
        <div className="flex justify-between items-center mb-3">
          <button 
            onClick={() => setDate(new Date(year, month - 1, 1))}
            className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700"
            aria-label="Previous month"
          >
            <ChevronLeft size={16} />
          </button>
          
          <h3 className="text-base font-medium">
            {date.toLocaleDateString('default', { month: 'long', year: 'numeric' })}
          </h3>
          
          <button 
            onClick={() => setDate(new Date(year, month + 1, 1))}
            className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700"
            aria-label="Next month"
          >
            <ChevronRight size={16} />
          </button>
        </div>
        
        <div className="grid grid-cols-7 gap-x-2 gap-y-1.5 flex-1">
          {/* Day name headers - simplified */}
          {dayNames.map((day) => (
            <div 
              key={day} 
              className="text-xs text-center text-gray-500 dark:text-gray-400 font-medium"
            >
              {day.substring(0, 3)}
            </div>
          ))}
          
          {/* Empty cells for days before the first day of month */}
          {Array.from({ length: adjustedFirstDay }).map((_, index) => (
            <div key={`empty-${index}`}></div>
          ))}
          
          {/* Calendar days - simplified */}
          {Array.from({ length: daysInMonth }).map((_, index) => {
            const day = index + 1
            const isToday = day === currentDay && new Date().getMonth() === month && new Date().getFullYear() === year
            
            return (
              <div 
                key={`day-${day}`} 
                className={`flex items-center justify-center ${
                  isToday 
                    ? 'font-medium' 
                    : ''
                }`}
              >
                <div className={`w-8 h-8 flex items-center justify-center rounded-full ${
                  isToday ? 'bg-blue-500 text-white' : ''
                }`}>
                  {day}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  /**
   * Renders a full calendar view for large widget sizes (3x3 or larger)
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
      <div className="h-full flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <button 
            onClick={() => setDate(new Date(year, month - 1, 1))}
            className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700"
            aria-label="Previous month"
          >
            <ChevronLeft size={18} />
          </button>
          
          <h3 className="text-lg font-medium">
            {date.toLocaleDateString('default', { month: 'long' })} {date.getFullYear()}
          </h3>
          
          <button 
            onClick={() => setDate(new Date(year, month + 1, 1))}
            className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700"
            aria-label="Next month"
          >
            <ChevronRight size={18} />
          </button>
        </div>
        
        <div className={`grid ${showWeekNumbers ? 'grid-cols-8' : 'grid-cols-7'} gap-1`}>
          {/* Week number header if enabled */}
          {showWeekNumbers && (
            <div className="text-sm text-center text-gray-500 dark:text-gray-400 font-medium py-2">
              Wk
            </div>
          )}
          
          {/* Day name headers */}
          {dayNames.map((day) => (
            <div 
              key={day} 
              className="text-sm text-center text-gray-500 dark:text-gray-400 font-medium py-2"
            >
              {day.substring(0, 3)}
            </div>
          ))}
          
          {/* Week numbers if enabled */}
          {showWeekNumbers && Array.from({ length: Math.ceil((daysInMonth + adjustedFirstDay) / 7) }).map((_, weekIndex) => (
            <div 
              key={`week-${weekIndex}`} 
              className="text-sm text-center text-gray-500 dark:text-gray-400 font-medium flex items-center justify-center"
            >
              {Math.ceil((adjustedFirstDay + 1) / 7) + weekIndex}
            </div>
          ))}
          
          {/* Empty cells for days before the first day of month */}
          {Array.from({ length: adjustedFirstDay }).map((_, index) => (
            <div key={`empty-${index}`} className="h-10"></div>
          ))}
          
          {/* Calendar days */}
          {Array.from({ length: daysInMonth }).map((_, index) => {
            const day = index + 1
            const isToday = day === currentDay && new Date().getMonth() === month && new Date().getFullYear() === year
            
            // Check if this day has events (in a real app, we'd filter based on actual date)
            const hasEvents = isToday
            const isHighlighted = day === 3 // For demo purposes, this could be a selected day
            
            return (
              <div 
                key={`day-${day}`} 
                className="h-10 flex items-center justify-center"
              >
                <div 
                  className={`w-10 h-10 flex items-center justify-center rounded-lg text-base ${
                    isHighlighted
                      ? 'bg-blue-500 text-white'
                      : isToday
                        ? 'font-medium'
                        : ''
                  }`}
                >
                  {day}
                </div>
              </div>
            )
          })}
        </div>
        
        {/* Selected day events - only shown if there's enough space */}
        {height > 3 && (
          <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
            <h4 className="text-sm font-medium mb-2">
              Today's Events
            </h4>
            <div className="space-y-2 overflow-y-auto">
              {events.length > 0 ? events.map((event, index) => (
                <div 
                  key={index}
                  className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 flex items-center"
                >
                  <div className="mr-3 text-blue-500 font-medium text-sm">
                    {event.time}
                  </div>
                  <div className="flex-1 text-sm font-medium truncate">
                    {event.title}
                  </div>
                </div>
              )) : (
                <div className="text-sm text-gray-500 dark:text-gray-400 italic">
                  No events for today
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    )
  }

  /**
   * Renders an expanded calendar view for extra large widget sizes (4x4 or larger)
   * 
   * @returns {JSX.Element} Expanded calendar view with weekly agenda
   */
  const renderExpandedCalendar = () => {
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
    
    // For larger layouts, show more event details
    const today = new Date()
    const weekStart = new Date(today)
    const currentDayOfWeek = today.getDay()
    const daysToSubtract = (currentDayOfWeek - startDay + 7) % 7
    weekStart.setDate(today.getDate() - daysToSubtract)
    
    return (
      <div className="h-full flex flex-col">
        {/* Calendar header with controls */}
        <div className="flex justify-between items-center mb-4">
          <button 
            onClick={() => setDate(new Date(year, month - 1, 1))}
            className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center"
            aria-label="Previous month"
          >
            <ChevronLeft size={16} />
            <span className="ml-1 text-sm hidden sm:inline">{new Date(year, month - 1, 1).toLocaleDateString('default', { month: 'short' })}</span>
          </button>
          
          <h3 className="text-base font-medium">
            {date.toLocaleDateString('default', { month: 'long', year: 'numeric' })}
          </h3>
          
          <button 
            onClick={() => setDate(new Date(year, month + 1, 1))}
            className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center"
            aria-label="Next month"
          >
            <span className="mr-1 text-sm hidden sm:inline">{new Date(year, month + 1, 1).toLocaleDateString('default', { month: 'short' })}</span>
            <ChevronRight size={16} />
          </button>
        </div>
      
        <div className="grid grid-cols-2 gap-4 h-full flex-1">
          {/* Left side - Month calendar */}
          <div className="flex flex-col">
            <div className={`grid ${showWeekNumbers ? 'grid-cols-8' : 'grid-cols-7'} gap-1.5`}>
              {/* Week number header if enabled */}
              {showWeekNumbers && (
                <div className="text-xs text-center text-gray-500 dark:text-gray-400 font-medium py-1.5">
                  Wk
                </div>
              )}
              
              {/* Day name headers */}
              {dayNames.map((day) => (
                <div 
                  key={day} 
                  className="text-xs text-center text-gray-500 dark:text-gray-400 font-medium py-1.5"
                >
                  {day}
                </div>
              ))}
              
              {/* Week numbers if enabled */}
              {showWeekNumbers && Array.from({ length: Math.ceil((daysInMonth + adjustedFirstDay) / 7) }).map((_, weekIndex) => (
                <div 
                  key={`week-${weekIndex}`} 
                  className="text-xs text-center text-gray-500 dark:text-gray-400 font-medium aspect-square flex items-center justify-center"
                >
                  {Math.ceil((adjustedFirstDay + 1) / 7) + weekIndex}
                </div>
              ))}
              
              {/* Empty cells for days before the first day of month */}
              {Array.from({ length: adjustedFirstDay }).map((_, index) => (
                <div key={`empty-${index}`} className="aspect-square"></div>
              ))}
              
              {/* Calendar days */}
              {Array.from({ length: daysInMonth }).map((_, index) => {
                const day = index + 1
                const isToday = day === currentDay && new Date().getMonth() === month && new Date().getFullYear() === year
                
                // Check if this day has events (in a real app, we'd filter based on actual date)
                const hasEvents = isToday
                
                return (
                  <div 
                    key={`day-${day}`} 
                    className={`aspect-square flex flex-col items-center justify-center ${
                      isToday 
                        ? 'bg-blue-500 text-white rounded-full' 
                        : 'hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full'
                    }`}
                  >
                    <div className="text-sm font-medium">{day}</div>
                    {hasEvents && (
                      <div className={`text-2xs mt-0.5 ${isToday ? 'bg-white text-blue-500' : 'bg-blue-100 dark:bg-blue-700'} rounded-full px-1`}>
                        {events.length}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
            
            {/* Mini Month Navigation (visible for really large widgets) */}
            {width >= 5 && height >= 5 && (
              <div className="mt-4 grid grid-cols-3 gap-2">
                {[-1, 0, 1].map((offset) => {
                  const monthDate = new Date(year, month + offset, 1)
                  const isCurrentMonth = offset === 0
                  
                  return (
                    <div 
                      key={`mini-month-${offset}`}
                      className={`text-center p-1.5 rounded ${
                        isCurrentMonth 
                          ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800' 
                          : 'cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-700'
                      }`}
                      onClick={() => !isCurrentMonth && setDate(monthDate)}
                    >
                      <div className="text-xs font-medium">
                        {monthDate.toLocaleDateString('default', { month: 'short' })}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
          
          {/* Right side - Weekly agenda with more details */}
          <div className="flex flex-col border-l border-gray-200 dark:border-slate-700 pl-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-medium">
                This Week
              </h3>
              
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {weekStart.toLocaleDateString('default', { month: 'short', day: 'numeric' })} - 
                {new Date(weekStart.getTime() + 6 * 86400000).toLocaleDateString('default', { month: 'short', day: 'numeric' })}
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              {/* Weekday slots */}
              {Array.from({ length: 7 }).map((_, index) => {
                const dayOffset = index
                const dayDate = new Date(weekStart)
                dayDate.setDate(weekStart.getDate() + dayOffset)
                const isToday = dayDate.getDate() === today.getDate() && 
                                dayDate.getMonth() === today.getMonth() && 
                                dayDate.getFullYear() === today.getFullYear()
                
                return (
                  <div 
                    key={`weekday-${index}`}
                    className={`mb-3 pb-2 ${index < 6 ? 'border-b border-gray-100 dark:border-slate-800' : ''}`}
                  >
                    <div className={`flex items-center mb-1.5 ${isToday ? 'text-blue-500' : ''}`}>
                      <div className={`w-8 h-8 rounded-full mr-2 flex items-center justify-center ${
                        isToday ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-slate-700'
                      }`}>
                        <span className="text-sm font-medium">{dayDate.getDate()}</span>
                      </div>
                      <div>
                        <div className="text-xs font-medium">
                          {dayDate.toLocaleDateString('default', { weekday: 'long' })}
                          {isToday && ' (Today)'}
                        </div>
                        <div className="text-2xs text-gray-500 dark:text-gray-400">
                          {dayDate.toLocaleDateString('default', { month: 'long', day: 'numeric' })}
                        </div>
                      </div>
                    </div>
                    
                    {/* Sample events - would be filtered by actual date in real implementation */}
                    {isToday ? (
                      events.map((event, eventIndex) => (
                        <div 
                          key={eventIndex}
                          className="text-xs p-2 mb-1.5 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-100 dark:border-blue-800 flex items-start"
                        >
                          <div className="min-w-8 text-blue-500 font-medium mr-1.5">
                            {event.time}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium">{event.title}</div>
                            {event.location && (
                              <div className="text-gray-500 dark:text-gray-400 text-2xs mt-0.5">
                                {event.location}
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-xs text-gray-400 dark:text-gray-500 italic pl-2">
                        No events
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
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
   * Renders the appropriate content based on widget dimensions
   * 
   * @returns {JSX.Element} The appropriate view for the current dimensions
   */
  const renderContent = () => {
    // Choose the appropriate view based on widget dimensions
    if (width >= 4 && height >= 4) {
      return renderExpandedCalendar()
    } else if (width >= 3 && height >= 3) {
      return renderFullCalendar()
    } else if (width >= 3) {
      return renderStandardCalendar()
    } else if (height >= 3) {
      return renderWeeklyView()
    } else {
      return renderCompactCalendar()
    }
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