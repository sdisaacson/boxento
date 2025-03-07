import React, { useState, useEffect, useRef } from 'react'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '../../ui/dialog'
import WidgetHeader from '../../widgets/common/WidgetHeader'
import { CalendarWidgetProps, CalendarWidgetConfig, CalendarEvent, CalendarSource } from './types'

/**
 * Calendar Widget Component
 * 
 * Displays a calendar with different views based on the widget size:
 * - 2x2 (minimum): Shows current date with day of week and minimal event count
 * - 2x3: Shows day, date, and today's events in a list view
 * - 3x2: Shows a compact month calendar with minimal event details
 * - 3x3 or larger: Shows a full calendar with week numbers and detailed daily events
 * - 4x4 or larger: Shows an expanded view with month calendar and weekly agenda
 * 
 * The widget supports configuration through a settings modal:
 * - First day of week (Sunday/Monday)
 * - Show/hide week numbers
 * - Connect to Google Calendar
 * 
 * @component
 * @param {CalendarWidgetProps} props - Component props
 * @returns Calendar widget component
 */
const CalendarWidget: React.FC<CalendarWidgetProps> = ({ width = 2, height = 2, config }) => {
  const [date, setDate] = useState<Date>(new Date())
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  
  // Update the initialization to load from localStorage first
  const [localConfig, setLocalConfig] = useState<CalendarWidgetConfig>(() => {
    // Try to load saved config from localStorage
    const savedConfig = localStorage.getItem(`calendar-widget-config-${config?.id || 'default'}`);
    if (savedConfig) {
      try {
        return JSON.parse(savedConfig);
      } catch (e) {
        console.error('Failed to parse saved calendar config', e);
      }
    }
    // Fall back to props or default
    return config || { id: '' };
  });
  
  const widgetRef = useRef<HTMLDivElement | null>(null)
  
  // Simplified settings state
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false)
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(false)
  // Using error state for displaying error messages to users
  const [_error, setError] = useState<string | null>(null) // Prefixed with _ to indicate intentional non-usage
  const [isGoogleConnected, setIsGoogleConnected] = useState<boolean>(false)
  
  // Google OAuth configuration
  const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'YOUR_CLIENT_ID';
  // Use current URL as redirect URI (without query parameters)
  const GOOGLE_REDIRECT_URI = typeof window !== 'undefined' ? window.location.href.split('?')[0] : '';
  const GOOGLE_SCOPES = [
    'https://www.googleapis.com/auth/calendar.readonly',
    'https://www.googleapis.com/auth/calendar.events.readonly'
  ];
  
  /**
   * Generates a random state string for OAuth security
   */
  const generateStateParam = () => {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  };
  
  // Add an effect to save localConfig when it changes
  useEffect(() => {
    if (localConfig && localConfig.id) {
      localStorage.setItem(`calendar-widget-config-${localConfig.id}`, JSON.stringify(localConfig));
    }
  }, [localConfig]);
  
  /**
   * Disconnects from Google Calendar
   */
  const disconnectGoogleCalendar = React.useCallback(() => {
    // Revoke access token if available
    const accessToken = localStorage.getItem('googleAccessToken');
    if (accessToken) {
      // Revoke the token
      fetch(`https://oauth2.googleapis.com/revoke?token=${accessToken}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }).catch(err => console.error('Error revoking token', err));
    }
    
    // Clear stored tokens
    localStorage.removeItem('googleAccessToken');
    localStorage.removeItem('googleRefreshToken');
    localStorage.removeItem('googleTokenExpiry');
    localStorage.removeItem('googleOAuthState');
    
    // Update state
    setIsGoogleConnected(false);
    setLocalConfig({
      ...localConfig,
      googleCalendarConnected: false,
      calendars: []
    });
    setEvents([]);
    
    // Clear the saved widget config for this connection
    localStorage.removeItem(`calendar-widget-config-${localConfig.id || 'default'}`);
  }, [localConfig])
  
  /**
   * Refreshes the access token when it expires
   */
  const refreshAccessToken = async () => {
    try {
      const refreshToken = localStorage.getItem('googleRefreshToken');
      
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }
      
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: GOOGLE_CLIENT_ID,
          client_secret: import.meta.env.VITE_GOOGLE_CLIENT_SECRET || 'YOUR_CLIENT_SECRET',
          refresh_token: refreshToken,
          grant_type: 'refresh_token',
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Token refresh failed: ${response.statusText}`);
      }
      
      const tokenData = await response.json();
      
      localStorage.setItem('googleAccessToken', tokenData.access_token);
      localStorage.setItem('googleTokenExpiry', (Date.now() + tokenData.expires_in * 1000).toString());
      
      return tokenData.access_token;
    } catch (err) {
      console.error('Failed to refresh token', err);
      // If refresh fails, disconnect from Google Calendar
      disconnectGoogleCalendar();
      throw err;
    }
  };
  
  /**
   * Gets a valid access token, refreshing if necessary
   */
  const getValidAccessToken = React.useCallback(async () => {
    const accessToken = localStorage.getItem('googleAccessToken');
    const tokenExpiry = localStorage.getItem('googleTokenExpiry');
    
    if (!accessToken || !tokenExpiry) {
      return null;
    }
    
    // Check if token is expired or about to expire (within 5 minutes)
    if (Date.now() > parseInt(tokenExpiry) - 300000) {
      return refreshAccessToken();
    }
    
    return accessToken;
  }, []);
  
  /**
   * Fetches events from Google Calendar
   */
  const fetchEvents = React.useCallback(async () => {
    if (!isGoogleConnected) {
      console.log('Google Calendar not connected, skipping fetchEvents');
      return;
    }
    console.log('Fetching Google Calendar events...');
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Get a valid access token
      const accessToken = await getValidAccessToken();
      
      if (!accessToken) {
        throw new Error('No valid access token available');
      }
      
      // Get selected calendars
      const selectedCalendars = localConfig.calendars?.filter(cal => cal.selected) || [];
      console.log('Selected calendars:', selectedCalendars);
      
      if (selectedCalendars.length === 0) {
        console.log('No calendars selected, clearing events');
        setEvents([]);
        setIsLoading(false);
        return;
      }
      
      // Calculate time range (30 days in the past to 30 days in the future)
      const now = new Date();
      const timeMin = new Date(now);
      timeMin.setDate(timeMin.getDate() - 30); // Go back 30 days
      timeMin.setHours(0, 0, 0, 0);
      
      const timeMax = new Date(now);
      timeMax.setDate(timeMax.getDate() + 30); // Go forward 30 days
      timeMax.setHours(23, 59, 59, 999);
      
      // Fetch events from all selected calendars
      const allEvents: CalendarEvent[] = [];
      
      for (const calendar of selectedCalendars) {
        const response = await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendar.id)}/events?` +
          new URLSearchParams({
            timeMin: timeMin.toISOString(),
            timeMax: timeMax.toISOString(),
            singleEvents: 'true',
            orderBy: 'startTime',
            maxResults: '100'
          }),
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
            },
          }
        );
        
        if (!response.ok) {
          console.error(`Failed to fetch events for calendar ${calendar.id}: ${response.statusText}`);
          continue;
        }
        
        const data = await response.json();
        console.log(`Calendar ${calendar.name} events:`, data.items);
        
        // Convert Google Calendar events to our format
        const calendarEvents = data.items.map((event: any) => {
          const startDateTime = event.start.dateTime ? new Date(event.start.dateTime) : new Date(event.start.date);
          const endDateTime = event.end.dateTime ? new Date(event.end.dateTime) : new Date(event.end.date);
          const isAllDay = !event.start.dateTime;
          
          // Format time string
          let timeString = '';
          if (isAllDay) {
            timeString = 'All day';
          } else {
            timeString = startDateTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
            
            // Add end time if on same day
            if (startDateTime.toDateString() === endDateTime.toDateString()) {
              timeString += ' - ' + endDateTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
            }
          }
          
          return {
            id: event.id,
            title: event.summary || 'Untitled Event',
            start: startDateTime,
            end: endDateTime,
            allDay: isAllDay,
            location: event.location || '',
            description: event.description || '',
            color: calendar.color,
            time: timeString
          };
        });
        
        allEvents.push(...calendarEvents);
      }
      
      // Sort events by start time
      allEvents.sort((a, b) => {
        if (a.start && b.start) {
          return new Date(a.start).getTime() - new Date(b.start).getTime();
        }
        return 0;
      });
      
      console.log('Fetched events:', allEvents);
      setEvents(allEvents);
      setIsLoading(false);
    } catch (err) {
      console.error('Failed to fetch events', err);
      setIsLoading(false);
      setError('Failed to fetch events');
    }
  }, [isGoogleConnected, localConfig.calendars, getValidAccessToken])
  
  /**
   * Fetches the user's calendars from Google Calendar API
   */
  const fetchCalendars = async (accessToken: string) => {
    const response = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch calendars: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Make sure at least one calendar is selected by default
    const calendars = data.items.map((calendar: any) => ({
      id: calendar.id,
      name: calendar.summary,
      color: calendar.backgroundColor || '#4285F4',
      selected: calendar.primary || false,
    }));
    
    // If no calendars are selected, select the first one
    if (calendars.length > 0 && !calendars.some((cal: CalendarSource) => cal.selected)) {
      calendars[0].selected = true;
    }
    
    return calendars;
  };
  
  /**
   * Handles Google Calendar OAuth authentication
   */
  const connectGoogleCalendar = React.useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Generate and store state parameter to prevent CSRF attacks
      const state = generateStateParam();
      localStorage.setItem('googleOAuthState', state);
      
      // Build the authorization URL
      const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
      authUrl.searchParams.append('client_id', GOOGLE_CLIENT_ID);
      authUrl.searchParams.append('redirect_uri', GOOGLE_REDIRECT_URI);
      authUrl.searchParams.append('response_type', 'code');
      authUrl.searchParams.append('state', state);
      authUrl.searchParams.append('scope', GOOGLE_SCOPES.join(' '));
      authUrl.searchParams.append('access_type', 'offline');
      authUrl.searchParams.append('prompt', 'consent');
      
      // Redirect to Google's authorization page
      window.location.href = authUrl.toString();
      
    } catch (err) {
      console.error('Failed to connect to Google Calendar', err);
      setIsLoading(false);
      setError('Failed to connect to Google Calendar');
    }
  }, []);
  
  /**
   * Handles the OAuth callback and exchanges the code for tokens
   * Note: In a production environment, this should be done server-side for security
   */
  const handleOAuthCallback = React.useCallback(async (code: string, state: string) => {
    try {
      // Verify state parameter to prevent CSRF attacks
      const storedState = localStorage.getItem('googleOAuthState');
      if (state !== storedState) {
        throw new Error('Invalid state parameter');
      }
      
      // Clear the stored state
      localStorage.removeItem('googleOAuthState');
      
      // Exchange the code for tokens
      // Note: In a production app, this should be done server-side for security
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          code,
          client_id: GOOGLE_CLIENT_ID,
          client_secret: import.meta.env.VITE_GOOGLE_CLIENT_SECRET || 'YOUR_CLIENT_SECRET', // Not secure in client-side code
          redirect_uri: GOOGLE_REDIRECT_URI,
          grant_type: 'authorization_code',
        }),
      });
      
      if (!tokenResponse.ok) {
        throw new Error(`Token exchange failed: ${tokenResponse.statusText}`);
      }
      
      const tokenData = await tokenResponse.json();
      
      // Store the tokens securely
      // Note: In a production app, tokens should be stored server-side or in HttpOnly cookies
      localStorage.setItem('googleAccessToken', tokenData.access_token);
      localStorage.setItem('googleRefreshToken', tokenData.refresh_token);
      localStorage.setItem('googleTokenExpiry', (Date.now() + tokenData.expires_in * 1000).toString());
      
      // Fetch user's calendars
      const calendars = await fetchCalendars(tokenData.access_token);
      
      setIsGoogleConnected(true);
      // Ensure we have at least one calendar selected
      if (calendars.length > 0 && !calendars.some((cal: CalendarSource) => cal.selected)) {
        calendars[0].selected = true;
      }
      
      console.log('Setting calendars with selection state:', calendars);
      
      const updatedConfig = {
        ...localConfig,
        googleCalendarConnected: true,
        calendars: calendars,
      };
      
      setLocalConfig(updatedConfig);
      
      // Make sure to save the updated config right away
      localStorage.setItem(`calendar-widget-config-${localConfig.id || 'default'}`, JSON.stringify(updatedConfig));
      
      // Fetch initial events
      fetchEvents();
      
      setIsLoading(false);
    } catch (err) {
      console.error('Failed to handle OAuth callback', err);
      setIsLoading(false);
      setError('Failed to complete Google Calendar authentication');
    }
  }, [localConfig, fetchEvents]);
  
  // Check for OAuth callback in URL
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Check for OAuth callback parameters in URL
    const url = new URL(window.location.href);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    
    if (code && state) {
      console.log('OAuth callback detected, processing...');
      
      // Remove the query parameters from the URL for cleaner UX
      window.history.replaceState({}, document.title, window.location.pathname);
      
      // Handle the OAuth callback
      setIsLoading(true);
      handleOAuthCallback(code, state);
    }
  }, [handleOAuthCallback]);
  
  // Update the initialization code to check both localStorage and configuration
  useEffect(() => {
    const checkTokens = async () => {
      console.log('Checking Google Calendar tokens...');
      const accessToken = localStorage.getItem('googleAccessToken');
      const refreshToken = localStorage.getItem('googleRefreshToken');
      console.log('Tokens exist:', !!accessToken && !!refreshToken);
      
      // Check stored config for Google Calendar connection status
      const isConnectedInConfig = localConfig.googleCalendarConnected === true;
      
      if (accessToken && refreshToken) {
        try {
          // Validate the token
          console.log('Validating access token...');
          await getValidAccessToken();
          console.log('Token validated, setting Google as connected');
          setIsGoogleConnected(true);
          
          // If we have tokens but the config doesn't reflect it, make sure to update the config
          if (!isConnectedInConfig && localConfig.calendars?.length === 0) {
            // We need to fetch calendars since we have valid tokens but no calendars in config
            const validToken = await getValidAccessToken();
            if (validToken) {
              try {
                const calendars = await fetchCalendars(validToken);
                setLocalConfig(prevConfig => {
                  const updatedConfig = {
                    ...prevConfig,
                    googleCalendarConnected: true,
                    calendars: calendars
                  };
                  
                  // Save the updated config
                  localStorage.setItem(`calendar-widget-config-${prevConfig.id || 'default'}`, JSON.stringify(updatedConfig));
                  
                  return updatedConfig;
                });
              } catch (e) {
                console.error('Failed to fetch calendars during initialization', e);
              }
            }
          }
          
          fetchEvents();
        } catch (err) {
          console.error('Failed to validate tokens', err);
          disconnectGoogleCalendar();
        }
      } else if (isConnectedInConfig) {
        // Config says connected but no tokens found
        setIsGoogleConnected(false);
        setLocalConfig(prevConfig => {
          const updatedConfig = {
            ...prevConfig,
            googleCalendarConnected: false
          };
          
          // Save the updated config
          localStorage.setItem(`calendar-widget-config-${prevConfig.id || 'default'}`, JSON.stringify(updatedConfig));
          
          return updatedConfig;
        });
      }
    };
    
    checkTokens();
  }, [localConfig.googleCalendarConnected, fetchEvents, disconnectGoogleCalendar, getValidAccessToken]);
  
  // Update date every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setDate(new Date())
    }, 60000)
    
    return () => clearInterval(timer)
  }, [])
  
  // Refresh events periodically
  useEffect(() => {
    if (!isGoogleConnected) return
    
    const refreshTimer = setInterval(() => {
      fetchEvents()
    }, 300000) // Refresh every 5 minutes
    
    return () => clearInterval(refreshTimer)
  }, [isGoogleConnected, fetchEvents])

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
   * Toggles a calendar's selected state
   * 
   * @param {number} index - Index of the calendar to toggle
   */
  const toggleCalendar = (index: number) => {
    if (!localConfig.calendars) return;
    
    const updatedCalendars = [...localConfig.calendars];
    updatedCalendars[index].selected = !updatedCalendars[index].selected;
    
    setLocalConfig({
      ...localConfig,
      calendars: updatedCalendars
    });
  }

  /**
   * Renders a compact date view for the smallest widget size (2x2)
   * 
   * @returns Compact date view
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
          <span className="text-6xl font-bold text-rose-500">{dayOfMonth}</span>
          <span className="text-sm">{month}</span>
        </div>
        
        {(() => {
          // Filter events for today
          const today = new Date();
          const todayEvents = events.filter(event => {
            if (!event.start) return false;
            const eventDate = new Date(event.start);
            return eventDate.getDate() === today.getDate() &&
                   eventDate.getMonth() === today.getMonth() &&
                   eventDate.getFullYear() === today.getFullYear();
          });
          
          return todayEvents.length > 0 && (
            <div className="mt-2 text-xs text-gray-600 dark:text-gray-300">
              {todayEvents.length} event{todayEvents.length !== 1 ? 's' : ''} today
            </div>
          );
        })()}
      </div>
    )
  }

  /**
   * Renders a daily view for tall narrow widgets (2x3)
   * Shows today's day, date, and events
   * 
   * @returns Daily view with today's events
   */
  const renderDailyView = () => {
    const today = new Date()
    const dayOfWeek = today.toLocaleDateString('default', { weekday: 'long' })
    const dayOfMonth = today.getDate()
    const month = today.toLocaleDateString('default', { month: 'long' })
    const year = today.getFullYear()
    
    // Filter events for today
    const todayEvents = events.filter(event => {
      if (!event.start) return false;
      const eventDate = new Date(event.start);
      return eventDate.getDate() === today.getDate() &&
             eventDate.getMonth() === today.getMonth() &&
             eventDate.getFullYear() === today.getFullYear();
    });
    
    // Sort events by time
    const sortedEvents = [...todayEvents].sort((a, b) => {
      if (!a.start || !b.start) return 0;
      return new Date(a.start).getTime() - new Date(b.start).getTime();
    });
    
    return (
      <div className="h-full flex flex-col">
        {/* Today's header */}
        <div className="flex flex-col items-center mb-3">
          <div className="text-base font-medium text-gray-700 dark:text-gray-300">
            {dayOfWeek}
          </div>
          
          <div className="flex flex-col items-center mt-1">
            <span className="text-4xl font-bold text-blue-500">{dayOfMonth}</span>
            <span className="text-sm text-gray-600 dark:text-gray-400">{month} {year}</span>
          </div>
        </div>
        
        {/* Today's events list */}
        <div className="flex-1 overflow-y-auto mt-2">
          <h3 className="text-sm font-medium mb-2 text-gray-600 dark:text-gray-400">
            Today's Events
          </h3>
          
          <div className="space-y-2">
            {sortedEvents.length > 0 ? (
              sortedEvents.map((event, index) => (
                <div 
                  key={`event-${index}`}
                  className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 flex items-start"
                >
                  <div className="min-w-12 text-blue-500 font-medium mr-1.5 text-xs">
                    {event.time}
                  </div>
                  <div className="flex-1 text-xs">
                    <div className="font-medium">{event.title}</div>
                    {event.location && (
                      <div className="text-gray-500 dark:text-gray-400 text-2xs mt-0.5 truncate">
                        {event.location}
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-sm text-center text-gray-400 dark:text-gray-500 italic py-4">
                No events scheduled for today
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  /**
   * Renders a monthly view for wide widgets (3x2)
   * 
   * @returns Monthly view for wide layouts
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
          <div className="flex space-x-1">
            <button 
              onClick={() => setDate(new Date(year, month - 1, 1))}
              className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700"
              aria-label="Previous month"
            >
              <ChevronLeft size={16} />
            </button>
            
            <button
              onClick={() => {
                const today = new Date();
                setDate(today);
                setSelectedDate(today);
              }}
              className="px-1.5 py-0.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
              aria-label="Today"
            >
              Today
            </button>
          </div>
          
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
                className={`flex items-center justify-center cursor-pointer ${
                  isToday 
                    ? 'font-medium' 
                    : ''
                }`}
                onClick={() => {
                  const clickedDate = new Date(year, month, day);
                  setSelectedDate(clickedDate);
                }}
              >
                <div className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${
                  isToday 
                    ? 'bg-blue-500 text-white hover:bg-blue-600' 
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
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
   * @returns Full calendar view
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
          <div className="flex space-x-1">
            <button 
              onClick={() => setDate(new Date(year, month - 1, 1))}
              className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700"
              aria-label="Previous month"
            >
              <ChevronLeft size={18} />
            </button>
            
            <button
              onClick={() => {
                const today = new Date();
                setDate(today);
                setSelectedDate(today);
              }}
              className="px-2 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
              aria-label="Today"
            >
              Today
            </button>
          </div>
          
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
            
            // No need to create a date object here
            
            // Check if this day is the selected day
            const isSelected = selectedDate.getDate() === day && 
                              selectedDate.getMonth() === month && 
                              selectedDate.getFullYear() === year
            
            return (
              <div 
                key={`day-${day}`} 
                className="h-10 flex items-center justify-center cursor-pointer"
                onClick={() => {
                  const clickedDate = new Date(year, month, day);
                  setSelectedDate(clickedDate);
                  console.log('Selected date:', clickedDate.toDateString());
                }}
              >
                <div 
                  className={`w-10 h-10 flex items-center justify-center rounded-lg text-base transition-colors ${
                    isToday
                      ? 'bg-blue-500 text-white hover:bg-blue-600'
                      : isSelected
                        ? 'bg-blue-200 dark:bg-blue-800 hover:bg-blue-300 dark:hover:bg-blue-700'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700'
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
          <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700 flex flex-col min-h-0">
            <h4 className="text-sm font-medium mb-2">
              {selectedDate.toDateString() === new Date().toDateString() 
                ? "Today's Events" 
                : `Events for ${selectedDate.toLocaleDateString('default', { month: 'short', day: 'numeric' })}`}
            </h4>
            <div className="space-y-2 overflow-y-auto flex-1 max-h-full">
              {(() => {
                // Filter events for selected date
                const selectedDateEvents = events.filter(event => {
                  if (!event.start) return false;
                  const eventDate = new Date(event.start);
                  return eventDate.getDate() === selectedDate.getDate() &&
                         eventDate.getMonth() === selectedDate.getMonth() &&
                         eventDate.getFullYear() === selectedDate.getFullYear();
                });
                
                return selectedDateEvents.length > 0 ? selectedDateEvents.map((event, index) => (
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
                  No events for {selectedDate.toDateString() === new Date().toDateString() ? "today" : "this date"}
                </div>
              );
              })()}
            </div>
          </div>
        )}
      </div>
    )
  }

  /**
   * Renders an expanded calendar view for extra large widget sizes (4x4 or larger)
   * 
   * @returns Expanded calendar view with weekly agenda
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
    // Use selectedDate instead of today to determine the week to display
    const weekStart = new Date(selectedDate)
    const selectedDayOfWeek = selectedDate.getDay()
    const daysToSubtract = (selectedDayOfWeek - startDay + 7) % 7
    weekStart.setDate(selectedDate.getDate() - daysToSubtract)
    
    return (
      <div className="h-full flex flex-col">
        {/* Calendar header with controls */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex space-x-1">
            <button 
              onClick={() => setDate(new Date(year, month - 1, 1))}
              className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center"
              aria-label="Previous month"
            >
              <ChevronLeft size={16} />
              <span className="ml-1 text-sm hidden sm:inline">{new Date(year, month - 1, 1).toLocaleDateString('default', { month: 'short' })}</span>
            </button>
            
            <button
              onClick={() => {
                const today = new Date();
                setDate(today);
                setSelectedDate(today);
              }}
              className="px-2 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
              aria-label="Today"
            >
              Today
            </button>
          </div>
          
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
                
                // Check if this day has events by filtering the events array
                const dayDate = new Date(year, month, day);
                const dayEvents = events.filter(event => {
                  if (!event.start) return false;
                  const eventDate = new Date(event.start);
                  return eventDate.getDate() === dayDate.getDate() &&
                         eventDate.getMonth() === dayDate.getMonth() &&
                         eventDate.getFullYear() === dayDate.getFullYear();
                });
                
                const hasEvents = dayEvents.length > 0
                
                return (
                  <div 
                    key={`day-${day}`} 
                    className={`aspect-square flex flex-col items-center justify-center cursor-pointer ${
                      isToday 
                        ? 'bg-blue-500 text-white rounded-full' 
                        : selectedDate.getDate() === day && 
                          selectedDate.getMonth() === month && 
                          selectedDate.getFullYear() === year
                          ? 'bg-blue-200 dark:bg-blue-800 rounded-full'
                          : 'hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full'
                    }`}
                    onClick={() => {
                      const clickedDate = new Date(year, month, day);
                      setSelectedDate(clickedDate);
                      console.log('Selected date:', clickedDate.toDateString());
                    }}
                  >
                    <div className="text-sm font-medium">{day}</div>
                    {hasEvents && (
                      <div className="flex space-x-1 mt-0.5">
                        {[...Array(Math.min(dayEvents.length, 3))].map((_, i) => (
                          <div 
                            key={i} 
                            className={`h-1.5 w-1.5 rounded-full ${isToday ? 'bg-white' : 'bg-blue-500 dark:bg-blue-400'}`}
                          ></div>
                        ))}
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
          <div className="flex flex-col border-l border-gray-200 dark:border-slate-700 pl-4 min-h-0">
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
              <div className="space-y-1 pr-1">
                {/* Weekday slots */}
                {Array.from({ length: 7 }).map((_, index) => {
                  const dayOffset = index
                  const dayDate = new Date(weekStart)
                  dayDate.setDate(weekStart.getDate() + dayOffset)
                  const isToday = dayDate.getDate() === today.getDate() && 
                                  dayDate.getMonth() === today.getMonth() && 
                                  dayDate.getFullYear() === today.getFullYear()
                  
                  // Filter events for this day
                  const dayEvents = events.filter(event => {
                    if (!event.start) return false;
                    const eventDate = new Date(event.start);
                    return eventDate.getDate() === dayDate.getDate() &&
                          eventDate.getMonth() === dayDate.getMonth() &&
                          eventDate.getFullYear() === dayDate.getFullYear();
                  });
                  
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
                      
                      {/* Events for this day */}
                      <div className="space-y-1.5">
                        {dayEvents.length > 0 ? (
                          dayEvents.map((event, eventIndex) => (
                            <div 
                              key={eventIndex}
                              className="text-xs p-2 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-100 dark:border-blue-800 flex items-start"
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
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  /**
   * Renders the settings content for the modal
   * 
   * @returns Settings content
   */
  const renderSettingsContent = () => {
    return (
      <div className="space-y-5">
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
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium">
              Show Week Numbers
            </label>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={localConfig.showWeekNumbers || false}
                onChange={() => setLocalConfig({
                  ...localConfig,
                  showWeekNumbers: !localConfig.showWeekNumbers
                })}
              />
              <div className="w-9 h-5 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 dark:peer-focus:ring-blue-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
        
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <h3 className="text-sm font-medium mb-3">Google Calendar</h3>
          
          {isGoogleConnected ? (
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mr-2">
                    <CalendarIcon size={16} className="text-blue-500" />
                  </div>
                  <div>
                    <div className="text-sm font-medium">Google Calendar</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Connected</div>
                  </div>
                </div>
                <button
                  className="text-xs text-red-500 hover:text-red-700 dark:hover:text-red-400 font-medium"
                  onClick={disconnectGoogleCalendar}
                  disabled={isLoading}
                >
                  Disconnect
                </button>
              </div>
              
              {localConfig.calendars && localConfig.calendars.length > 0 && (
                <div className="mt-2">
                  <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                    Your Calendars
                  </h4>
                  <div className="space-y-2">
                    {localConfig.calendars.map((calendar: CalendarSource, index: number) => (
                      <div key={index} className="flex items-center">
                        <input
                          type="checkbox"
                          id={`calendar-${index}`}
                          checked={calendar.selected}
                          onChange={() => toggleCalendar(index)}
                          className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 dark:focus:ring-blue-600"
                        />
                        <label htmlFor={`calendar-${index}`} className="ml-2 text-sm flex items-center">
                          <span 
                            className="w-3 h-3 rounded-full mr-2" 
                            style={{ backgroundColor: calendar.color }}
                          />
                          {calendar.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                Connect to Google Calendar to see your events in this widget.
              </p>
              <button
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium flex items-center justify-center w-full"
                onClick={connectGoogleCalendar}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 size={16} className="mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  'Connect Google Calendar'
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

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
              // Clear the saved configuration
              localStorage.removeItem(`calendar-widget-config-${localConfig.id || 'default'}`);
            }}
            aria-label="Delete this widget"
          >
            Delete Widget
          </button>
        )}
        
        <div className="flex space-x-2">
          <button
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-lg text-sm font-medium"
            onClick={() => setIsSettingsOpen(false)}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium"
            onClick={() => {
              // Save the configuration
              if (config && config.onUpdate) {
                config.onUpdate(localConfig)
              }
              
              // Make sure we save to localStorage as well
              localStorage.setItem(`calendar-widget-config-${localConfig.id || 'default'}`, JSON.stringify(localConfig));
              
              setIsSettingsOpen(false)
            }}
          >
            Save
          </button>
        </div>
      </>
    )
  }

  /**
   * Renders the appropriate content based on widget dimensions
   * 
   * @returns The appropriate view for the current dimensions
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
      return renderDailyView()
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
        <Dialog
          open={isSettingsOpen}
          onOpenChange={(open: boolean) => {
            if (!open) {
              setIsSettingsOpen(false);
            }
          }}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Calendar Settings</DialogTitle>
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
  )
}

export default CalendarWidget

// Export types for use in other files
export * from './types'