import React, { useState, useEffect, useRef } from 'react';
// Import axios if it's available in the project or add it to dependencies
// import axios from 'axios';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '../../ui/dialog';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../../ui/card';
// Adjust paths for UI components based on the project structure
import WidgetHeader from '../common/WidgetHeader';
import { 
  FlightTrackerWidgetProps, 
  FlightTrackerWidgetConfig, 
  AviationStackResponse,
  AviationStackFlight
} from './types';
import { Plane, MapPin, Clock, Calendar, AlertCircle, RefreshCw } from 'lucide-react';

/**
 * Size categories for widget content rendering
 * This enum provides clear naming for different widget dimensions
 */
enum WidgetSizeCategory {
  SMALL = 'small',         // 2x2
  WIDE_SMALL = 'wideSmall', // 3x2 
  TALL_SMALL = 'tallSmall', // 2x3
  MEDIUM = 'medium',       // 3x3
  WIDE_MEDIUM = 'wideMedium', // 4x3
  TALL_MEDIUM = 'tallMedium', // 3x4
  LARGE = 'large'          // 4x4
}

/**
 * Flight Tracker Widget Component
 * 
 * This widget allows users to track flights in real-time using the AviationStack API.
 * It displays essential flight information including departure/arrival details and status.
 * 
 * @param {FlightTrackerWidgetProps} props - Component props
 * @returns {JSX.Element} Widget component
 */
const FlightTrackerWidget: React.FC<FlightTrackerWidgetProps> = ({ width, height, config }) => {
  // Default configuration
  const defaultConfig: FlightTrackerWidgetConfig = {
    title: 'Flight Tracker',
    accessKey: '4bf75d0df1c2bfd61231d6281e15a28d', // Default to provided API key
    flightNumber: '',
    flightDate: new Date().toISOString().split('T')[0] // Today's date in YYYY-MM-DD format
  };

  // Component state
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [localConfig, setLocalConfig] = useState<FlightTrackerWidgetConfig>({
    ...defaultConfig,
    ...config
  });
  const [flightData, setFlightData] = useState<AviationStackFlight | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [sizeCategory, setSizeCategory] = useState<WidgetSizeCategory>(WidgetSizeCategory.SMALL);
  const [isManualRefresh, setIsManualRefresh] = useState<boolean>(false);
  
  const widgetRef = useRef<HTMLDivElement | null>(null);

  // Parse flight number into airline code and numeric part
  const parseFlightNumber = (combinedFlightNumber: string): { airlineCode: string, flightNumberOnly: string, isIcao: boolean } => {
    // Default values if parsing fails
    let airlineCode = '';
    let flightNumberOnly = '';
    let isIcao = false;
    
    if (combinedFlightNumber) {
      // Trim any whitespace and convert to uppercase
      const cleanedInput = combinedFlightNumber.trim().toUpperCase();
      
      // Try ICAO pattern first (3 letters + numbers)
      const icaoMatch = cleanedInput.match(/^([A-Z]{3})(\d{1,4})$/);
      
      // Then try IATA pattern (2 letters + numbers)
      const iataMatch = cleanedInput.match(/^([A-Z]{2})(\d{1,4})$/);
      
      if (icaoMatch) {
        airlineCode = icaoMatch[1].toUpperCase();
        flightNumberOnly = icaoMatch[2];
        isIcao = true;
        console.log(`Parsed ICAO flight number: code=${airlineCode}, number=${flightNumberOnly}`);
      } else if (iataMatch) {
        airlineCode = iataMatch[1].toUpperCase();
        flightNumberOnly = iataMatch[2];
        console.log(`Parsed IATA flight number: code=${airlineCode}, number=${flightNumberOnly}`);
      } else {
        // If the pattern doesn't match exactly, try a best-effort approach
        // Find where the letters end and the numbers begin
        let i = 0;
        while (i < cleanedInput.length && /[A-Za-z]/.test(cleanedInput[i])) {
          i++;
        }
        
        if (i > 0 && i < cleanedInput.length) {
          airlineCode = cleanedInput.substring(0, i).toUpperCase();
          flightNumberOnly = cleanedInput.substring(i);
          isIcao = airlineCode.length === 3; // Assume 3-letter code is ICAO
          console.log(`Used fallback parsing for flight number: code=${airlineCode}, number=${flightNumberOnly}, isIcao=${isIcao}`);
        } else {
          console.error(`Failed to parse flight number: ${cleanedInput}`);
        }
      }
    }
    
    return { airlineCode, flightNumberOnly, isIcao };
  };

  // Update widget size category based on width and height
  useEffect(() => {
    if (width <= 2 && height <= 2) {
      setSizeCategory(WidgetSizeCategory.SMALL);
    } else if (width === 3 && height === 2) {
      setSizeCategory(WidgetSizeCategory.WIDE_SMALL);
    } else if (width === 2 && height === 3) {
      setSizeCategory(WidgetSizeCategory.TALL_SMALL);
    } else if (width === 3 && height === 3) {
      setSizeCategory(WidgetSizeCategory.MEDIUM);
    } else if (width === 4 && height === 3) {
      setSizeCategory(WidgetSizeCategory.WIDE_MEDIUM);
    } else if (width === 3 && height === 4) {
      setSizeCategory(WidgetSizeCategory.TALL_MEDIUM);
    } else {
      setSizeCategory(WidgetSizeCategory.LARGE);
    }
  }, [width, height]);

  // Set initial configuration on mount
  useEffect(() => {
    setLocalConfig(prevConfig => ({
      ...defaultConfig,
      ...config
    }));
  }, [config]);

  // Update internal flight number parts when the combined flight number changes
  useEffect(() => {
    if (localConfig.flightNumber) {
      const { airlineCode, flightNumberOnly, isIcao } = parseFlightNumber(localConfig.flightNumber);
      
      // Only update if we successfully parsed the flight number
      if (airlineCode && flightNumberOnly) {
        setLocalConfig(prev => ({
          ...prev,
          _airlineCode: airlineCode,
          _flightNumberOnly: flightNumberOnly,
          _isIcao: isIcao
        }));
      }
    }
  }, [localConfig.flightNumber]);

  // Fetch flight data when flight details change or manual refresh is triggered
  useEffect(() => {
    const fetchFlightData = async () => {
      // Don't attempt to fetch without required parameters
      if (!localConfig.accessKey) {
        setError("API access key is required");
        return;
      }

      if (!localConfig.flightNumber || !localConfig._airlineCode || !localConfig._flightNumberOnly) {
        setError("Valid flight number is required");
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Build query parameters for the flight search
        const params = new URLSearchParams({
          access_key: localConfig.accessKey
        });

        // Add flight number parameter based on type (IATA or ICAO)
        if (localConfig._isIcao) {
          // Use ICAO flight number
          params.append('flight_icao', localConfig.flightNumber);
        } else {
          // Use IATA flight number
          params.append('flight_iata', localConfig.flightNumber);
        }

        // Add date filter if provided
        if (localConfig.flightDate) {
          params.append('flight_date', localConfig.flightDate);
        }

        // Add airline filter if provided, use the appropriate airline code type
        if (localConfig.airline) {
          if (localConfig.airline.length === 3) {
            params.append('airline_icao', localConfig.airline);
          } else {
            params.append('airline_iata', localConfig.airline);
          }
        }

        console.log('Fetching flight data with params:', params.toString());

        // Make API call with retry logic
        const fetchWithRetry = async (retries = 2, backoff = 300) => {
          try {
            // Use a fallback URL for testing if you're having connection issues
            // Remove the "||" part in production for actual API use
            const apiUrl = `https://api.aviationstack.com/v1/flights?${params.toString()}`;
            const useFallback = true; // Set to false to use actual API

            // Array of demo flight codes that will use fallback data
            const demoFlights = ['ASH6040', 'UAL123', 'AAL456', 'DAL789'];
            
            // Check if the current flight number is a demo flight
            if (useFallback && localConfig.flightNumber && demoFlights.includes(localConfig.flightNumber)) {
              // Create mock data for demo flights
              console.log(`Using fallback data for ${localConfig.flightNumber}`);
              
              // Wait a bit to simulate API call
              await new Promise(resolve => setTimeout(resolve, 1000));
              
              // Get the airline info based on flight code
              let airlineName = 'Unknown Airline';
              let airlineIata = 'XX';
              let airlineIcao = 'XXX';
              let depAirport = 'New York JFK International Airport';
              let depIata = 'JFK';
              let depIcao = 'KJFK';
              let arrAirport = 'Chicago O\'Hare International Airport';
              let arrIata = 'ORD';
              let arrIcao = 'KORD';
              let flightIata = '';
              let flightNumber = '';
              
              // Set airline-specific details based on flight code
              switch(localConfig.flightNumber) {
                case 'ASH6040':
                  airlineName = 'Air Shuttle (Mesa Airlines)';
                  airlineIata = 'ZV';
                  airlineIcao = 'ASH';
                  flightNumber = '6040';
                  flightIata = 'ZV6040';
                  break;
                case 'UAL123':
                  airlineName = 'United Airlines';
                  airlineIata = 'UA';
                  airlineIcao = 'UAL';
                  depAirport = 'San Francisco International Airport';
                  depIata = 'SFO';
                  depIcao = 'KSFO';
                  arrAirport = 'Denver International Airport';
                  arrIata = 'DEN';
                  arrIcao = 'KDEN';
                  flightNumber = '123';
                  flightIata = 'UA123';
                  break;
                case 'AAL456':
                  airlineName = 'American Airlines';
                  airlineIata = 'AA';
                  airlineIcao = 'AAL';
                  depAirport = 'Dallas/Fort Worth International Airport';
                  depIata = 'DFW';
                  depIcao = 'KDFW';
                  arrAirport = 'Miami International Airport';
                  arrIata = 'MIA';
                  arrIcao = 'KMIA';
                  flightNumber = '456';
                  flightIata = 'AA456';
                  break;
                case 'DAL789':
                  airlineName = 'Delta Air Lines';
                  airlineIata = 'DL';
                  airlineIcao = 'DAL';
                  depAirport = 'Atlanta Hartsfield-Jackson International Airport';
                  depIata = 'ATL';
                  depIcao = 'KATL';
                  arrAirport = 'Los Angeles International Airport';
                  arrIata = 'LAX';
                  arrIcao = 'KLAX';
                  flightNumber = '789';
                  flightIata = 'DL789';
                  break;
              }
              
              // Sample flight data structure matching AviationStack format
              const mockData: AviationStackResponse = {
                pagination: {
                  limit: 100,
                  offset: 0,
                  count: 1,
                  total: 1
                },
                data: [{
                  flight_date: new Date().toISOString().split('T')[0],
                  flight_status: 'active',
                  departure: {
                    airport: depAirport,
                    timezone: 'America/New_York',
                    iata: depIata,
                    icao: depIcao,
                    terminal: 'B',
                    gate: '22',
                    delay: 0,
                    scheduled: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
                    estimated: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
                    actual: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
                    estimated_runway: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
                    actual_runway: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString()
                  },
                  arrival: {
                    airport: arrAirport,
                    timezone: 'America/Chicago',
                    iata: arrIata,
                    icao: arrIcao,
                    terminal: '3',
                    gate: 'G8',
                    delay: 0,
                    scheduled: new Date(Date.now() + 1000 * 60 * 30).toISOString(), // 30 minutes from now
                    estimated: new Date(Date.now() + 1000 * 60 * 30).toISOString(),
                    actual: null,
                    estimated_runway: new Date(Date.now() + 1000 * 60 * 30).toISOString(),
                    actual_runway: null
                  },
                  airline: {
                    name: airlineName,
                    iata: airlineIata,
                    icao: airlineIcao
                  },
                  flight: {
                    number: flightNumber,
                    iata: flightIata,
                    icao: localConfig.flightNumber
                  },
                  aircraft: {
                    registration: 'N915FJ',
                    iata: 'E75L',
                    icao: 'E75L',
                    icao24: 'A1B2C3'
                  },
                  live: {
                    updated: new Date().toISOString(),
                    latitude: 41.2619,
                    longitude: -84.3436,
                    altitude: 31000,
                    direction: 270,
                    speed_horizontal: 450,
                    speed_vertical: 0,
                    is_ground: false
                  }
                }]
              };
              
              // Make sure data exists before accessing it
              if (mockData.data && mockData.data.length > 0) {
                setFlightData(mockData.data[0]);
                setError(null);
              }
              return;
            }
            
            const response = await fetch(apiUrl, {
              headers: {
                'Content-Type': 'application/json'
              },
              // Add cache control to avoid stale responses
              cache: 'no-cache'
            });
            
            if (!response.ok) {
              if (response.status === 429) {
                // Rate limit exceeded
                throw new Error("API rate limit exceeded. Please try again later.");
              }
              
              if (response.status === 401) {
                // Unauthorized - bad API key
                throw new Error("Invalid API key. Please check your API access key.");
              }
              
              // Get more detailed error information
              let errorInfo = '';
              try {
                const errorData = await response.json();
                errorInfo = JSON.stringify(errorData);
                console.error('API error details:', errorData);
              } catch (e) {
                errorInfo = response.statusText;
              }
              throw new Error(`API error: ${response.status} - ${errorInfo}`);
            }
            
            const data: AviationStackResponse = await response.json();
            console.log('Received flight data:', data);
            
            // Check for API error messages in the response
            if (data.error) {
              throw new Error(`API error: ${data.error.type} - ${data.error.info}`);
            }

            if (data.data && data.data.length > 0) {
              setFlightData(data.data[0]);
              setError(null);
            } else {
              // No data found - log this and provide a more helpful error message
              console.log('No flight data found in response:', data);
              setError("No flight data found. Try a different flight number or date.");
              setFlightData(null);
            }
          } catch (err) {
            // Handle retry logic
            console.error('Fetch attempt failed:', err);
            
            if (retries <= 0) {
              // No more retries, propagate the error
              throw err;
            }
            
            // Wait with exponential backoff before retry
            await new Promise(resolve => setTimeout(resolve, backoff));
            
            // Retry with one fewer retry and increased backoff
            return fetchWithRetry(retries - 1, backoff * 2);
          }
        };
        
        // Start the fetch with retry process
        await fetchWithRetry();
        
      } catch (err) {
        console.error('Error fetching flight data:', err);
        
        // Format user-friendly error message
        let errorMessage = "Failed to fetch flight data";
        
        if (err instanceof Error) {
          const errorText = err.message;
          
          if (errorText.includes('Failed to fetch') || errorText.includes('NetworkError')) {
            errorMessage = "Network request failed. Please check your internet connection and try again.";
          } else if (errorText.includes('rate limit') || errorText.includes('429')) {
            errorMessage = "API rate limit exceeded. Please try again later or get your own API key.";
          } else if (errorText.includes('Invalid API key') || errorText.includes('401')) {
            errorMessage = "Invalid API key. Please check your API access key.";
          } else {
            errorMessage = errorText;
          }
        }
        
        setError(errorMessage);
        setFlightData(null);
      } finally {
        setLoading(false);
        setIsManualRefresh(false); // Reset manual refresh flag
      }
    };

    // Check if all the necessary configuration values are set to fetch data,
    // or if a manual refresh was triggered
    if (isManualRefresh || (localConfig.accessKey && localConfig.flightNumber && 
        localConfig._airlineCode && localConfig._flightNumberOnly)) {
      fetchFlightData();
    }
  }, [
    localConfig.accessKey, 
    localConfig.flightNumber, 
    localConfig._airlineCode, 
    localConfig._flightNumberOnly, 
    localConfig.flightDate, 
    localConfig.airline,
    isManualRefresh // Add isManualRefresh to trigger re-fetch
  ]);

  // Format date and time
  const formatDateTime = (isoDateTimeStr: string): { time: string; date: string } | 'N/A' => {
    if (!isoDateTimeStr) return 'N/A';
    
    const date = new Date(isoDateTimeStr);
    if (isNaN(date.getTime())) return 'N/A';
    
    const timeOptions: Intl.DateTimeFormatOptions = { 
      hour: '2-digit', 
      minute: '2-digit', 
      hour12: true 
    };
    
    const dateOptions: Intl.DateTimeFormatOptions = { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    };
    
    return {
      time: date.toLocaleTimeString(undefined, timeOptions),
      date: date.toLocaleDateString(undefined, dateOptions)
    };
  };

  // Save settings
  const saveSettings = () => {
    if (config?.onUpdate) {
      config.onUpdate(localConfig);
    }
    setShowSettings(false);
  };

  // Trigger manual refresh
  const handleManualRefresh = () => {
    setIsManualRefresh(true);
  };

  // Render initial setup view
  const renderSetupView = () => {
    return (
      <div className="flex h-full flex-col items-center justify-center p-4 text-center">
        <Plane className="mb-2 h-8 w-8 text-gray-400" />
        <h3 className="mb-2 text-base font-medium">Flight Tracker Setup</h3>
        <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
          Click the settings icon to configure your API key and flight details.
        </p>
        <button
          onClick={() => setShowSettings(true)}
          className="rounded bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600"
        >
          Configure Widget
        </button>
      </div>
    );
  };

  // Render error state
  const renderErrorState = () => {
    // Detect specific error types to provide more helpful information
    let errorTitle = "Error";
    let errorMessage = error;
    let helpText = "";
    
    if (error?.includes("No flight data found")) {
      errorTitle = "Flight Not Found";
      
      // Check if the flight number might be from FlightAware
      const mightBeFlightAware = localConfig.flightNumber && 
                               localConfig.flightNumber.length > 0 && 
                               localConfig._airlineCode && 
                               localConfig._airlineCode.length === 3;
      
      // Provide specific guidance for common issues
      helpText = (
        <>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Try these solutions:
          </p>
          <ul className="mt-1 text-left text-xs text-gray-500 dark:text-gray-400 list-disc pl-4">
            <li>Double-check your flight number format (e.g., AA123 for IATA or AXB744 for ICAO)</li>
            <li>Make sure you're using the correct airline code (2-letter IATA or 3-letter ICAO)</li>
            <li>Try a different date or a more recent flight</li>
            {mightBeFlightAware && (
              <li className="text-amber-600 dark:text-amber-400">
                It appears you may be using a FlightAware code. Try using one of our demo flights instead.
              </li>
            )}
            <li>Not all flights are available in the free API tier (limited to 100 monthly calls)</li>
          </ul>
          <div className="mt-2">
            <p className="text-xs text-blue-500 dark:text-blue-400">
              Try one of these demo flights:
            </p>
            <div className="mt-1 grid grid-cols-2 gap-1">
              <button 
                onClick={() => {
                  setLocalConfig({...localConfig, flightNumber: 'ASH6040'});
                  setIsManualRefresh(true);
                }}
                className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded hover:bg-blue-100 dark:hover:bg-blue-900"
              >
                ASH6040 (Air Shuttle)
              </button>
              <button 
                onClick={() => {
                  setLocalConfig({...localConfig, flightNumber: 'UAL123'});
                  setIsManualRefresh(true);
                }}
                className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded hover:bg-blue-100 dark:hover:bg-blue-900"
              >
                UAL123 (United)
              </button>
              <button 
                onClick={() => {
                  setLocalConfig({...localConfig, flightNumber: 'AAL456'});
                  setIsManualRefresh(true);
                }}
                className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded hover:bg-blue-100 dark:hover:bg-blue-900"
              >
                AAL456 (American)
              </button>
              <button 
                onClick={() => {
                  setLocalConfig({...localConfig, flightNumber: 'DAL789'});
                  setIsManualRefresh(true);
                }}
                className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded hover:bg-blue-100 dark:hover:bg-blue-900"
              >
                DAL789 (Delta)
              </button>
            </div>
          </div>
        </>
      );
    } else if (error?.includes("API responded with status") || error?.includes("API error")) {
      errorTitle = "API Error";
      helpText = (
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Please check your AviationStack API access key and ensure you're within usage limits (100 calls/month for free tier).
        </p>
      );
    } else if (error?.includes("Network request failed")) {
      errorTitle = "Connection Error";
      helpText = (
        <>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Please check your internet connection and try again.
          </p>
          <button
            onClick={handleManualRefresh}
            className="mt-2 flex items-center text-xs px-2 py-1 rounded bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300"
          >
            <RefreshCw className="mr-1 h-3 w-3" /> Retry connection
          </button>
          <div className="mt-3">
            <p className="text-xs text-amber-600 dark:text-amber-400">
              Try our offline demo flights:
            </p>
            <div className="mt-1 grid grid-cols-2 gap-1">
              <button 
                onClick={() => {
                  setLocalConfig({...localConfig, flightNumber: 'ASH6040'});
                  setIsManualRefresh(true);
                }}
                className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded hover:bg-blue-100 dark:hover:bg-blue-900"
              >
                ASH6040 (Air Shuttle)
              </button>
              <button 
                onClick={() => {
                  setLocalConfig({...localConfig, flightNumber: 'UAL123'});
                  setIsManualRefresh(true);
                }}
                className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded hover:bg-blue-100 dark:hover:bg-blue-900"
              >
                UAL123 (United)
              </button>
              <button 
                onClick={() => {
                  setLocalConfig({...localConfig, flightNumber: 'AAL456'});
                  setIsManualRefresh(true);
                }}
                className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded hover:bg-blue-100 dark:hover:bg-blue-900"
              >
                AAL456 (American)
              </button>
              <button 
                onClick={() => {
                  setLocalConfig({...localConfig, flightNumber: 'DAL789'});
                  setIsManualRefresh(true);
                }}
                className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded hover:bg-blue-100 dark:hover:bg-blue-900"
              >
                DAL789 (Delta)
              </button>
            </div>
          </div>
        </>
      );
    }
    
    return (
      <div className="flex h-full flex-col items-center justify-center p-4 text-center">
        <AlertCircle className="mb-2 h-8 w-8 text-red-500" />
        <h3 className="mb-2 text-base font-medium">{errorTitle}</h3>
        <p className="mb-1 text-sm text-gray-500 dark:text-gray-400">{errorMessage}</p>
        {helpText}
        <button
          onClick={() => setShowSettings(true)}
          className="mt-4 rounded bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600"
        >
          Configure Widget
        </button>
      </div>
    );
  };

  // Render loading state
  const renderLoadingState = () => {
    return (
      <div className="flex h-full flex-col items-center justify-center p-4 text-center">
        <div className="animate-spin mb-2 h-8 w-8 border-t-2 border-b-2 border-blue-500 rounded-full"></div>
        <p className="text-sm text-gray-500 dark:text-gray-400">Loading flight details...</p>
      </div>
    );
  };

  // Render flight information card
  const renderFlightInfoCard = () => {
    if (!flightData) return null;

    const departureDateTime = formatDateTime(flightData.departure.scheduled);
    const arrivalDateTime = formatDateTime(flightData.arrival.scheduled);
    
    // Handle 'N/A' case for date/time formatting
    const depTime = departureDateTime === 'N/A' ? 'N/A' : departureDateTime.time;
    const depDate = departureDateTime === 'N/A' ? 'N/A' : departureDateTime.date;
    const arrTime = arrivalDateTime === 'N/A' ? 'N/A' : arrivalDateTime.time;
    const arrDate = arrivalDateTime === 'N/A' ? 'N/A' : arrivalDateTime.date;
    
    // Determine flight status display
    let statusClass = "text-blue-500";
    let statusText = flightData.flight_status || "Unknown";
    let statusBgClass = "bg-blue-100 dark:bg-blue-900/30";
    
    switch (flightData.flight_status?.toLowerCase()) {
      case "scheduled":
        statusClass = "text-blue-500";
        statusBgClass = "bg-blue-100 dark:bg-blue-900/30";
        break;
      case "active":
        statusClass = "text-green-500";
        statusBgClass = "bg-green-100 dark:bg-green-900/30";
        statusText = "In Flight";
        break;
      case "landed":
        statusClass = "text-green-500";
        statusBgClass = "bg-green-100 dark:bg-green-900/30";
        break;
      case "cancelled":
        statusClass = "text-red-500";
        statusBgClass = "bg-red-100 dark:bg-red-900/30";
        break;
      case "incident":
        statusClass = "text-red-500";
        statusBgClass = "bg-red-100 dark:bg-red-900/30";
        break;
      case "diverted":
        statusClass = "text-orange-500";
        statusBgClass = "bg-orange-100 dark:bg-orange-900/30";
        break;
      case "delayed":
        statusClass = "text-orange-500";
        statusBgClass = "bg-orange-100 dark:bg-orange-900/30";
        break;
      default:
        statusClass = "text-gray-500";
        statusBgClass = "bg-gray-100 dark:bg-gray-800";
    }

    // Format delay information
    const departureDelay = flightData.departure.delay ? `Delayed ${Math.floor(flightData.departure.delay / 60)}h ${flightData.departure.delay % 60}m` : null;
    const arrivalDelay = flightData.arrival.delay ? `Delayed ${Math.floor(flightData.arrival.delay / 60)}h ${flightData.arrival.delay % 60}m` : null;

    // Different layout based on widget size
    const isCompact = [WidgetSizeCategory.SMALL].includes(sizeCategory);
    
    // Small widget design (2x2)
    if (isCompact) {
      const isInFlight = flightData.flight_status?.toLowerCase() === 'active';
      
      return (
        <div className="h-full flex flex-col">
          {/* Status bar with date and refresh */}
          <div className={`flex items-center justify-between px-3 py-1.5 ${statusBgClass}`}>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${statusClass} ${isInFlight ? 'animate-pulse' : ''}`}></div>
              <span className={`text-sm font-medium ${statusClass}`}>{statusText}</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <div className="text-xs text-gray-500 dark:text-gray-400">{flightData.flight_date}</div>
              <button 
                onClick={handleManualRefresh} 
                className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                title="Refresh data"
                disabled={loading}
              >
                <RefreshCw className={`h-3 w-3 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
          
          {/* Flight info */}
          <div className="flex flex-col flex-1 p-3">
            <div className="mb-2">
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400">Flight</div>
              <div className="flex items-center justify-between">
                <div className="text-xl font-bold">{flightData.flight.iata}</div>
                <Plane className={`h-5 w-5 text-blue-500 ${isInFlight ? 'animate-bounce' : ''}`} />
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300 truncate">{flightData.airline.name}</div>
            </div>
            
            <div className="mt-auto grid grid-cols-2 gap-2">
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400">From</div>
                <div className="text-sm font-medium">{flightData.departure.iata}</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-500 dark:text-gray-400">To</div>
                <div className="text-sm font-medium">{flightData.arrival.iata}</div>
              </div>
            </div>
            
            {isInFlight && flightData.live && (
              <div className="mt-2 pt-1 border-t border-gray-200 dark:border-gray-700">
                <div className="text-xs text-green-500 flex items-center justify-center space-x-1">
                  <div className="w-1 h-1 rounded-full bg-green-500 animate-pulse"></div>
                  <span>Live: {Math.round(flightData.live.altitude)} ft</span>
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }
    
    // Regular layout for larger widgets
    return (
      <div className="h-full flex flex-col overflow-hidden">
        {/* Flight Status Bar */}
        <div className={`w-full py-2 px-4 ${statusClass} ${statusBgClass} flex justify-between items-center`}>
          <div className="flex items-center space-x-1">
            <div className={`w-2 h-2 rounded-full ${statusClass}`}></div>
            <span className="text-sm font-medium">{statusText}</span>
          </div>
          <div className="flex items-center">
            <div className="text-sm mr-2">{flightData.flight_date}</div>
            <button 
              onClick={handleManualRefresh} 
              className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
              title="Refresh data"
              disabled={loading}
            >
              <RefreshCw className={`h-3.5 w-3.5 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
        
        {/* Flight Info */}
        <div className="flex-1 p-4 overflow-y-auto">
          {/* Flight Number & Airline */}
          <div className="mb-4 flex justify-between items-center">
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Flight</div>
              <div className="text-lg font-bold">{flightData.flight.iata}</div>
              <div className="text-sm">{flightData.airline.name}</div>
            </div>
            <Plane className="h-7 w-7 text-blue-500" />
          </div>
          
          {/* Route Information */}
          <div className="mb-4 flex justify-between items-start">
            {/* Departure */}
            <div className="flex-1">
              <div className="text-sm text-gray-500 dark:text-gray-400">From</div>
              <div className="text-lg font-medium">{flightData.departure.iata}</div>
              <div className="text-sm">{flightData.departure.airport}</div>
              <div className="mt-1 text-xs flex items-center">
                <Clock className="h-3 w-3 mr-1" />
                {depTime}
              </div>
              <div className="text-xs flex items-center">
                <Calendar className="h-3 w-3 mr-1" />
                {depDate}
              </div>
              {departureDelay && (
                <div className="mt-1 text-xs text-orange-500">{departureDelay}</div>
              )}
              {flightData.departure.terminal && (
                <div className="mt-1 text-xs">Terminal {flightData.departure.terminal}</div>
              )}
              {flightData.departure.gate && (
                <div className="text-xs">Gate {flightData.departure.gate}</div>
              )}
            </div>
            
            {/* Arrow */}
            <div className="mx-2 pt-6">
              <div className="w-12 h-0.5 bg-gray-300 dark:bg-gray-700 relative">
                <div className="absolute right-0 -top-1.5 w-3 h-3 border-t-2 border-r-2 border-gray-300 dark:border-gray-700 transform rotate-45"></div>
              </div>
            </div>
            
            {/* Arrival */}
            <div className="flex-1 text-right">
              <div className="text-sm text-gray-500 dark:text-gray-400">To</div>
              <div className="text-lg font-medium">{flightData.arrival.iata}</div>
              <div className="text-sm">{flightData.arrival.airport}</div>
              <div className="mt-1 text-xs flex items-center justify-end">
                <Clock className="h-3 w-3 mr-1" />
                {arrTime}
              </div>
              <div className="text-xs flex items-center justify-end">
                <Calendar className="h-3 w-3 mr-1" />
                {arrDate}
              </div>
              {arrivalDelay && (
                <div className="mt-1 text-xs text-orange-500">{arrivalDelay}</div>
              )}
              {flightData.arrival.terminal && (
                <div className="mt-1 text-xs">Terminal {flightData.arrival.terminal}</div>
              )}
              {flightData.arrival.gate && (
                <div className="text-xs">Gate {flightData.arrival.gate}</div>
              )}
            </div>
          </div>
          
          {/* Aircraft Info - Only show on larger widgets */}
          {!isCompact && flightData.aircraft && (
            <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-800">
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Aircraft</div>
              <div className="flex justify-between">
                <div className="text-sm">
                  {flightData.aircraft.iata ? `Type: ${flightData.aircraft.iata}` : ''}
                </div>
                <div className="text-sm">
                  {flightData.aircraft.registration ? `Reg: ${flightData.aircraft.registration}` : ''}
                </div>
              </div>
            </div>
          )}
          
          {/* Live Data - Only show when available and on larger widgets */}
          {!isCompact && flightData.live && flightData.flight_status === 'active' && (
            <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-800">
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Live Data</div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>Altitude: {Math.round(flightData.live.altitude)} ft</div>
                <div>Speed: {Math.round(flightData.live.speed_horizontal)} km/h</div>
                <div>Direction: {Math.round(flightData.live.direction)}°</div>
                <div>Last updated: {new Date(flightData.live.updated).toLocaleTimeString()}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Render main content based on state
  const renderContent = () => {
    // If API key and flight number are not set, show setup view
    if (!localConfig.accessKey && !localConfig.flightNumber) {
      return renderSetupView();
    }
    
    // If there's an error, show error state
    if (error) {
      return renderErrorState();
    }
    
    // If loading, show loading state
    if (loading) {
      return renderLoadingState();
    }
    
    // If flight data is available, show flight info
    if (flightData) {
      return renderFlightInfoCard();
    }
    
    // Default to setup view
    return renderSetupView();
  };
  
  // Settings modal
  const renderSettings = () => {
    const todayFormatted = () => {
      const today = new Date();
      return today.toISOString().split('T')[0];
    };

    return (
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Flight Tracker Settings</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-3">
            {/* Widget Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Widget Title</Label>
              <Input
                id="title"
                value={localConfig.title || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLocalConfig({ ...localConfig, title: e.target.value })}
                placeholder="Flight Tracker"
              />
            </div>

            {/* Demo Flights - Making this more prominent */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center">
                  <CardTitle className="text-sm">Quick Select Demo Flights</CardTitle>
                  <div className="ml-2 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 rounded text-xs text-blue-600 dark:text-blue-300">Recommended</div>
                </div>
                <p className="text-xs text-gray-500">These flights work without an API key and demonstrate the widget's functionality:</p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { code: 'ASH6040', name: 'Air Shuttle', route: 'JFK → ORD' },
                    { code: 'UAL123', name: 'United', route: 'SFO → DEN' },
                    { code: 'AAL456', name: 'American', route: 'DFW → MIA' },
                    { code: 'DAL789', name: 'Delta', route: 'ATL → LAX' }
                  ].map((flight) => (
                    <Button
                      key={flight.code}
                      variant={localConfig.flightNumber === flight.code ? "default" : "outline"}
                      onClick={() => setLocalConfig({ ...localConfig, flightNumber: flight.code })}
                      className="h-auto flex-col items-start p-2"
                    >
                      <span className="font-medium">{flight.code}</span>
                      <span className="text-xs opacity-70">{flight.name}</span>
                      <span className="text-xs opacity-60">{flight.route}</span>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Flight Number */}
            <div className="space-y-2">
              <div className="flex items-center">
                <Label htmlFor="flightNumber">Flight Number</Label>
                <span className="text-red-500 ml-1">*</span>
              </div>
              <Input
                id="flightNumber"
                value={localConfig.flightNumber || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLocalConfig({ ...localConfig, flightNumber: e.target.value.toUpperCase() })}
                placeholder="e.g. AA123 or AXB744"
              />
              <p className="text-xs text-gray-500">
                Enter airline code + flight number (e.g., AA123 for IATA or AXB744 for ICAO)
              </p>
              {localConfig.flightNumber && (!localConfig._airlineCode || !localConfig._flightNumberOnly) && (
                <p className="text-xs text-red-500">
                  Invalid format. Please check your flight number.
                </p>
              )}
            </div>

            {/* Advanced Settings collapsible section */}
            <Card>
              <CardHeader>
                <details className="group">
                  <summary className="flex items-center cursor-pointer list-none">
                    <CardTitle className="text-sm">Advanced Settings</CardTitle>
                    <svg className="h-4 w-4 ml-2 transition-transform group-open:rotate-180" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </summary>
                  <CardContent className="pt-4 space-y-4">
                    {/* Flight Date */}
                    <div className="space-y-2">
                      <Label htmlFor="flightDate">Flight Date</Label>
                      <div className="relative">
                        <Input
                          id="flightDate"
                          type="date"
                          value={localConfig.flightDate || todayFormatted()}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLocalConfig({ ...localConfig, flightDate: e.target.value })}
                          style={{ WebkitAppearance: 'none', MozAppearance: 'none' }}
                        />
                        <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
                      </div>
                      <p className="text-xs text-gray-500">
                        Defaults to today if left empty
                      </p>
                    </div>

                    {/* API Key */}
                    <div className="space-y-2">
                      <Label htmlFor="accessKey">AviationStack API Key</Label>
                      <Input
                        id="accessKey"
                        value={localConfig.accessKey || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLocalConfig({ ...localConfig, accessKey: e.target.value })}
                        placeholder="Only needed for non-demo flights"
                        type="password"
                      />
                      <p className="text-xs text-gray-500">
                        Only required for tracking real flights. <a href="https://aviationstack.com" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Get API key</a>
                      </p>
                    </div>
                  </CardContent>
                </details>
              </CardHeader>
            </Card>
          </div>
          
          <DialogFooter>
            <div className="flex justify-between w-full">
              {config?.onDelete && (
                <Button
                  variant="destructive"
                  onClick={() => {
                    if (config.onDelete) {
                      config.onDelete();
                    }
                  }}
                >
                  Delete Widget
                </Button>
              )}
              
              <Button
                variant="default"
                onClick={saveSettings}
              >
                Save Changes
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <div ref={widgetRef} className="widget-container h-full flex flex-col">
      <WidgetHeader 
        title={localConfig.title || 'Flight Tracker'} 
        onSettingsClick={() => setShowSettings(true)}
      />
      
      <div className="flex-1 overflow-hidden">
        {renderContent()}
      </div>
      
      {/* Settings modal */}
      {renderSettings()}
    </div>
  );
};

export default FlightTrackerWidget; 