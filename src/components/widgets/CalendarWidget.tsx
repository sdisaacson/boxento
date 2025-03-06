import React, { useState, useEffect, useRef } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import Modal from '../ui/Modal'
import WidgetHeader from '../ui/WidgetHeader'
import { WidgetProps, WidgetConfig } from '../../types'
import { CalendarWidgetConfig, CalendarEvent } from './CalendarWidget/types'

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
 */
const CalendarWidget = ({ width, height, config }: WidgetProps<CalendarWidgetConfig>) => {
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
   * Get the number of days in a month
   */
  const getDaysInMonth = (year: number, month: number): number => {
    return new Date(year, month + 1, 0).getDate()
  }
  
  /**
   * Get the day of the week for the first day of a month
   */
  const getFirstDayOfMonth = (year: number, month: number): number => {
    return new Date(year, month, 1).getDay()
  }
  
  const renderFullCalendar = () => {
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    
    // Make sure events is defined and is an array
    const safeEvents = Array.isArray(events) ? events : [];
    
    // For the full view, let's create a more robust calendar with events
    return (
      <div className="h-full flex flex-col bg-white dark:bg-slate-800 rounded-lg p-3 text-gray-800 dark:text-gray-100">
        <div className="flex justify-between items-center mb-3">
          <button className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 transition-colors">
            <ChevronLeft size={16} />
          </button>
          <div className="text-base font-medium px-3 py-1 bg-gray-50 dark:bg-slate-700 rounded-lg shadow-sm">
            {date.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </div>
          <button className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 transition-colors">
            <ChevronRight size={16} />
          </button>
        </div>
        
        {/* Days of week header */}
        <div className="grid grid-cols-7 gap-1 mb-2 bg-gray-50 dark:bg-slate-700/50 rounded-lg p-1">
          {daysOfWeek.map(day => (
            <div key={day} className="text-sm font-medium text-center text-gray-600 dark:text-gray-300 py-1.5">
              {width >= 4 ? day : day.substring(0, 3)}
            </div>
          ))}
        </div>
        
        {/* Calendar grid with event indicators */}
        <div className="grid grid-cols-7 gap-1.5 flex-1">
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`empty-${i}`} className="rounded border border-transparent bg-transparent"></div>
          ))}
          
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const isToday = day === date.getDate();
            // Simulate having events on some days
            const hasEvent = [1, 5, 10, 15, 20, 25].includes(day);
            
            return (
              <div 
                key={`day-${day}`} 
                className={`p-1.5 border ${isToday ? 'border-blue-300 dark:border-blue-500' : 'border-gray-200 dark:border-gray-700'} 
                  rounded-lg min-h-[40px] transition-all hover:border-blue-300 dark:hover:border-blue-500/70 
                  ${isToday ? 'bg-blue-50 dark:bg-blue-900/30 shadow-sm dark:shadow-inner dark:shadow-blue-950/30' : 'hover:shadow-sm bg-white/80 dark:bg-slate-750/80'}`}
              >
                <div className={`text-sm font-medium ${
                  isToday ? 'text-blue-600 dark:text-blue-400' : 'text-gray-800 dark:text-gray-100'
                }`}>
                  {day}
                </div>
                {hasEvent && (
                  <div className="mt-1 w-full h-1.5 bg-blue-400 dark:bg-blue-500 rounded-full opacity-80 shadow-sm"></div>
                )}
              </div>
            );
          })}
        </div>
        
        {/* Events for today - only show in larger layouts */}
        {width >= 4 && (
          <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-100 dark:border-blue-800/30 shadow-sm">
            <div className="text-sm font-semibold mb-2 text-blue-800 dark:text-blue-300">Today's Events</div>
            {safeEvents.length > 0 ? (
              <div className="space-y-2">
                {safeEvents.map((event, index) => (
                  <div key={index} className="text-xs p-2.5 bg-white dark:bg-slate-750 rounded-lg flex justify-between items-center shadow-sm border border-gray-100 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-800/50 transition-colors">
                    <div className="font-medium text-gray-800 dark:text-gray-100 flex items-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500 dark:bg-blue-400 mr-1.5"></div>
                      {event.title}
                    </div>
                    <div className="text-gray-600 dark:text-gray-300 font-medium bg-gray-100 dark:bg-slate-700 px-1.5 py-0.5 rounded">{event.time}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-gray-600 dark:text-gray-300 bg-white dark:bg-slate-750 rounded-lg p-3 border border-gray-200 dark:border-gray-700">No events today</div>
            )}
          </div>
        )}
      </div>
    );
  };

  // Modal content for settings
  const renderSettingsContent = () => {
    return (
      <>
        <div className="mb-6">
          <label className="block text-sm mb-2 font-medium text-gray-800 dark:text-gray-100">First Day of Week</label>
          <select 
            className="w-full p-2 bg-gray-100 dark:bg-slate-700 rounded-lg border border-gray-300 dark:border-slate-600 text-gray-800 dark:text-gray-100 shadow-sm focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 focus:border-transparent outline-none"
            value={localConfig.startDay || 'sunday'}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setLocalConfig({...localConfig, startDay: e.target.value as 'sunday' | 'monday'})}
          >
            <option value="sunday">Sunday</option>
            <option value="monday">Monday</option>
          </select>
        </div>
        
        <div className="mb-6">
          <label className="block text-sm mb-2 font-medium text-gray-800 dark:text-gray-100">Show Week Numbers</label>
          <div className="flex items-center p-3 bg-gray-50 dark:bg-slate-700 rounded-lg border border-gray-200 dark:border-slate-600">
            <input 
              type="checkbox"
              checked={localConfig.showWeekNumbers || false}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLocalConfig({...localConfig, showWeekNumbers: e.target.checked})}
              className="mr-3 h-4 w-4 accent-blue-500 dark:accent-blue-400"
              id="weekNumbers"
            />
            <label htmlFor="weekNumbers" className="text-sm text-gray-800 dark:text-gray-100">Display week numbers</label>
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
        <div className="text-center text-xs text-gray-500 dark:text-gray-400 mb-2">
          {date.toLocaleString('default', { month: 'long', year: 'numeric' })}
        </div>
        <div className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <div className="text-7xl font-bold mb-1">{date.getDate()}</div>
            <div className="text-sm font-medium">
              {date.toLocaleString('default', { weekday: 'long' })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Wide view for layouts like 4x2, 6x2
  const renderWideView = () => {
    // Make sure events is defined and is an array
    const safeEvents = Array.isArray(events) ? events : [];
    
    return (
      <div className="h-full flex">
        <div className="w-2/5 flex flex-col justify-center items-center border-r border-gray-200 dark:border-gray-700 pr-4">
          <div className="text-center">
            <div className="text-7xl font-bold mb-1">{date.getDate()}</div>
            <div className="text-sm font-medium">
              {date.toLocaleString('default', { weekday: 'long' })}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {date.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </div>
          </div>
        </div>
        <div className="w-3/5 pl-4 flex flex-col">
          <div className="text-sm font-medium mb-2">Today's Events</div>
          {safeEvents.length > 0 ? (
            <div className="space-y-2 overflow-y-auto pr-1" style={{ maxHeight: 'calc(100% - 24px)' }}>
              {safeEvents.map((event, index) => (
                <div 
                  key={index} 
                  className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded hover:bg-blue-100 dark:hover:bg-blue-800/30 transition-colors"
                >
                  <div className="font-medium text-sm">{event.title}</div>
                  <div className="text-gray-500 dark:text-gray-400 text-xs">{event.time}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex-grow flex items-center justify-center text-sm text-gray-500 dark:text-gray-400">
              No events today
            </div>
          )}
        </div>
      </div>
    );
  };

  // Tall view for layouts like 2x4, 2x6
  const renderTallView = () => {
    // In tall view, we'll show a mini calendar at the top, and events below
    const daysOfWeek = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    
    // Make sure events is defined and is an array
    const safeEvents = Array.isArray(events) ? events : [];
    
    return (
      <div className="h-full flex flex-col">
        <div className="text-center text-xs text-gray-500 dark:text-gray-400 mb-2">
          {date.toLocaleString('default', { month: 'long', year: 'numeric' })}
        </div>
        
        {/* Days of week header */}
        <div className="grid grid-cols-7 gap-1 text-center mb-1">
          {daysOfWeek.map(day => (
            <div key={day} className="text-xs font-medium text-gray-500">
              {day}
            </div>
          ))}
        </div>
        
        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1 text-center mb-4">
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`empty-${i}`} className="text-xs p-1"></div>
          ))}
          
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const isToday = day === date.getDate();
            
            return (
              <div 
                key={`day-${day}`} 
                className={`text-xs p-1 rounded-full w-6 h-6 flex items-center justify-center mx-auto
                  ${isToday ? 'bg-blue-500 text-white font-medium' : ''}
                `}
              >
                {day}
              </div>
            );
          })}
        </div>
        
        {/* Events section */}
        <div className="flex-1">
          <div className="text-sm font-medium mb-1">Today's Events</div>
          {safeEvents.length > 0 ? (
            <div className="space-y-2 overflow-y-auto max-h-[calc(100%-2rem)]">
              {safeEvents.map((event, index) => (
                <div key={index} className="text-xs p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                  <div className="font-medium">{event.title}</div>
                  <div className="text-gray-500 dark:text-gray-400">{event.time}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-gray-500 dark:text-gray-400">No events today</div>
          )}
        </div>
      </div>
    );
  };

  // Add the modal-open class when the settings modal is open to prevent widget background changes
  return (
    <div 
      ref={widgetRef} 
      className={`widget-container h-full flex flex-col ${isSettingsOpen ? 'modal-open' : ''}`}
      // This data attribute helps CSS target widgets with open modals if needed
      data-modal-open={isSettingsOpen ? 'true' : 'false'}
    >
      <WidgetHeader 
        title="Calendar" 
        onSettingsClick={() => setIsSettingsOpen(true)}
      />
      
      <div className="flex-1 overflow-hidden">
        {renderContent()}
      </div>
      
      {/* Settings modal using our reusable Modal component */}
      {/* Render the modal outside of widget event flow */}
      {isSettingsOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsSettingsOpen(false)}
          title="Calendar Settings"
          footer={renderSettingsFooter()}
          children={renderSettingsContent()}
        />
      )}
    </div>
  )
}

// Widget configuration for registration
export const calendarWidgetConfig: WidgetConfig = {
  type: 'calendar',
  name: 'Calendar',
  icon: 'Calendar',
  description: 'Shows today\'s date and upcoming events',
  minWidth: 2,
  minHeight: 2,
  defaultWidth: 3,
  defaultHeight: 3,
  defaultSize: { w: 2, h: 2 },
  minSize: { w: 2, h: 2 },
  maxSize: { w: 6, h: 6 }
}

export default CalendarWidget