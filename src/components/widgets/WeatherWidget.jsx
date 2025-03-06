import React, { useState, useEffect, useRef } from 'react'
import { Cloud, Sun, CloudRain, CloudSnow, CloudLightning, CloudFog, X, AlertCircle, Loader2 } from 'lucide-react'
import { createPortal } from 'react-dom'
import Modal from '../ui/Modal'
import WidgetHeader from '../ui/WidgetHeader'

// OpenWeatherMap API key - in a real app, you'd want to store this in an environment variable
// For development purposes, we're using the provided API key
// NOTE: According to OpenWeatherMap, new API keys may take a couple hours to activate
const OPENWEATHER_API_KEY = '9d74c3f72016b8e9a2a15d6c04a9250f'

// Temperature conversion utility functions
const convertFtoC = (fahrenheit) => Math.round((fahrenheit - 32) * 5 / 9);
const convertCtoF = (celsius) => Math.round((celsius * 9 / 5) + 32);

// Convert all temperature values in mock data based on desired units
const convertMockData = (data, toUnits) => {
  if (toUnits === 'fahrenheit') {
    // Data is already in Fahrenheit, no conversion needed
    return { ...data };
  } else {
    // Convert from Fahrenheit to Celsius
    return {
      ...data,
      temperature: convertFtoC(data.temperature),
      feelsLike: convertFtoC(data.feelsLike),
      high: convertFtoC(data.high),
      low: convertFtoC(data.low),
      forecast: data.forecast.map(day => ({
        ...day,
        temp: convertFtoC(day.temp)
      }))
    };
  }
};

// Mock data to use during development when API key is not provided
// Values are stored in Fahrenheit and will be converted if needed
const mockWeatherData = {
  temperature: 72,
  feelsLike: 70,
  condition: 'sunny',
  description: 'clear sky',
  location: 'San Francisco',
  high: 75,
  low: 65,
  humidity: 45,
  windSpeed: 5,
  icon: '01d',
  forecast: [
    { day: 'Mon', temp: 72, condition: 'sunny', description: 'clear sky', icon: '01d' },
    { day: 'Tue', temp: 70, condition: 'cloudy', description: 'few clouds', icon: '02d' },
    { day: 'Wed', temp: 68, condition: 'rainy', description: 'light rain', icon: '10d' },
    { day: 'Thu', temp: 73, condition: 'sunny', description: 'clear sky', icon: '01d' },
    { day: 'Fri', temp: 74, condition: 'sunny', description: 'clear sky', icon: '01d' },
  ]
};

const WeatherWidget = ({ width, height, config }) => {
  // Initialize with default weather state to prevent rendering errors
  const [weather, setWeather] = useState({
    temperature: 0,
    feelsLike: 0,
    condition: 'sunny',
    description: 'Loading...',
    location: 'Loading...',
    high: 0,
    low: 0,
    humidity: 0,
    windSpeed: 0,
    icon: '01d',
    forecast: [
      { day: 'Mon', temp: 0, condition: 'sunny', description: 'Loading...', icon: '01d' },
      { day: 'Tue', temp: 0, condition: 'sunny', description: 'Loading...', icon: '01d' },
      { day: 'Wed', temp: 0, condition: 'sunny', description: 'Loading...', icon: '01d' },
      { day: 'Thu', temp: 0, condition: 'sunny', description: 'Loading...', icon: '01d' },
      { day: 'Fri', temp: 0, condition: 'sunny', description: 'Loading...', icon: '01d' }
    ]
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  const [showSettings, setShowSettings] = useState(false)
  const [locationInput, setLocationInput] = useState(() => {
    // Try to get saved location from localStorage first
    const savedLocation = localStorage.getItem('weatherWidget_location')
    return savedLocation || config?.location || 'San Francisco'
  })
  const [units, setUnits] = useState(() => {
    // Try to get saved units from localStorage first
    const savedUnits = localStorage.getItem('weatherWidget_units')
    return savedUnits || config?.units || 'fahrenheit'
  })
  const settingsRef = useRef(null)
  const settingsButtonRef = useRef(null)
  const widgetRef = useRef(null)
  
  // Fetch weather data based on location and units
  const fetchWeatherData = async (location, tempUnits) => {
    console.log('Fetching weather data with units:', tempUnits);
    try {
      setLoading(true)
      setError(null)
      
      // Check if we want to use mock data (either no API key or forced mock data for testing)
      const useMockData = !OPENWEATHER_API_KEY || localStorage.getItem('weatherWidget_useMockData') === 'true';
      console.log('UseMockData status:', useMockData);
      
      if (useMockData) {
        console.log('Using mock weather data with units:', tempUnits);
        setTimeout(() => {
          // Convert mock data temperatures based on selected units
          const convertedData = convertMockData(mockWeatherData, tempUnits);
          setWeather({
            ...convertedData,
            location: location || convertedData.location
          });
          setLoading(false);
        }, 1000); // Simulate API delay
        return;
      }
      
      // Fetch current weather data
      // For OpenWeatherMap API: 'metric' is for Celsius, 'imperial' is for Fahrenheit
      const apiUnits = tempUnits === 'celsius' ? 'metric' : 'imperial';
      console.log('Using API units parameter:', apiUnits, 'for tempUnits:', tempUnits);
      
      const currentWeatherResponse = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(location)}&units=${apiUnits}&appid=${OPENWEATHER_API_KEY}`
      )
      
      if (!currentWeatherResponse.ok) {
        const errorData = await currentWeatherResponse.json()
        const errorMessage = errorData.message || 'Failed to fetch weather data'
        
        // Check for the common error code when API key is still being activated
        if (errorData.cod === 401 || errorMessage.includes('Invalid API key')) {
          throw new Error('API key may still be in the activation period (usually takes up to 2 hours after signup). Try again later.')
        } else {
          throw new Error(errorMessage)
        }
      }
      
      const currentWeatherData = await currentWeatherResponse.json()
      
      // Fetch 5-day forecast
      const forecastResponse = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(location)}&units=${apiUnits}&appid=${OPENWEATHER_API_KEY}`
      )
      
      if (!forecastResponse.ok) {
        const errorData = await forecastResponse.json()
        const errorMessage = errorData.message || 'Failed to fetch forecast data'
        
        // Check for the common error code when API key is still being activated
        if (errorData.cod === 401 || errorMessage.includes('Invalid API key')) {
          throw new Error('API key may still be in the activation period (usually takes up to 2 hours after signup). Try again later.')
        } else {
          throw new Error(errorMessage)
        }
      }
      
      const forecastData = await forecastResponse.json()
      
      // Process forecast data to get one entry per day (noon time)
      const processedForecast = []
      const dailyForecasts = {}
      
      forecastData.list.forEach(entry => {
        const date = new Date(entry.dt * 1000)
        const day = date.toLocaleDateString('en-US', { weekday: 'short' })
        
        // We want to get the noon forecast for each day
        const hour = date.getHours()
        
        // If this day isn't in our map yet, or if this entry is closer to noon than what we have
        if (!dailyForecasts[day] || Math.abs(12 - hour) < Math.abs(12 - new Date(dailyForecasts[day].dt * 1000).getHours())) {
          dailyForecasts[day] = entry
        }
      })
      
      // Convert the map to an array for our 5-day forecast
      Object.entries(dailyForecasts).slice(0, 5).forEach(([day, data]) => {
        processedForecast.push({
          day,
          temp: Math.round(data.main.temp),
          condition: mapWeatherCondition(data.weather[0].main),
          description: data.weather[0].description,
          icon: data.weather[0].icon
        })
      })
      
      // Create the final weather object
      const processedWeatherData = {
        temperature: Math.round(currentWeatherData.main.temp),
        feelsLike: Math.round(currentWeatherData.main.feels_like),
        condition: mapWeatherCondition(currentWeatherData.weather[0].main),
        description: currentWeatherData.weather[0].description,
        location: currentWeatherData.name,
        high: Math.round(currentWeatherData.main.temp_max),
        low: Math.round(currentWeatherData.main.temp_min),
        humidity: currentWeatherData.main.humidity,
        windSpeed: Math.round(currentWeatherData.wind.speed),
        icon: currentWeatherData.weather[0].icon,
        forecast: processedForecast
      }
      
      setWeather(processedWeatherData)
    } catch (err) {
      console.error('Error fetching weather data:', err)
      // More detailed error logging
      if (err.name) console.error('Error name:', err.name)
      if (err.stack) console.error('Error stack:', err.stack)
      
      // Check if this is an API key activation error
      if (err.message && (err.message.includes('API key may still be in the activation period') || 
                          err.message.includes('Invalid API key'))) {
        console.log('Detected API key activation issue, falling back to mock data');
        localStorage.setItem('weatherWidget_useMockData', 'true');
        
        // Fall back to mock data
        setWeather({
          ...mockWeatherData,
          location: location || mockWeatherData.location
        });
        setLoading(false);
        setError(null); // Clear the error since we're showing data
        return;
      }
      
      // Set a more informative error message
      setError(`Failed to fetch weather data: ${err.message || 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }
  
  // Map OpenWeatherMap condition codes to our simplified condition types
  const mapWeatherCondition = (condition) => {
    const conditionMap = {
      'Clear': 'sunny',
      'Clouds': 'cloudy',
      'Rain': 'rainy',
      'Drizzle': 'rainy',
      'Thunderstorm': 'stormy',
      'Snow': 'snowy',
      'Mist': 'foggy',
      'Smoke': 'foggy',
      'Haze': 'foggy',
      'Dust': 'foggy',
      'Fog': 'foggy',
      'Sand': 'foggy',
      'Ash': 'foggy',
      'Squall': 'stormy',
      'Tornado': 'stormy'
    }
    
    return conditionMap[condition] || 'sunny'
  }
  
  // Fetch weather data when component mounts or when location/units change
  useEffect(() => {
    fetchWeatherData(locationInput, units)
    
    // Create a notification element for API key activation status
    let notificationDiv = document.getElementById('weather-api-notification');
    if (!notificationDiv) {
      notificationDiv = document.createElement('div');
      notificationDiv.id = 'weather-api-notification';
    notificationDiv.style.position = 'fixed';
    notificationDiv.style.bottom = '10px';
    notificationDiv.style.right = '10px';
    notificationDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    notificationDiv.style.color = 'white';
    notificationDiv.style.padding = '8px 12px';
    notificationDiv.style.borderRadius = '4px';
    notificationDiv.style.fontSize = '12px';
    notificationDiv.style.zIndex = '9999';
    notificationDiv.style.display = 'none';
    notificationDiv.textContent = 'Using sample weather data (API key activation in progress)';
      document.body.appendChild(notificationDiv);
    }
    
    // Check if we're using mock data
    const checkMockDataStatus = () => {
      const usingMockData = localStorage.getItem('weatherWidget_useMockData') === 'true';
      notificationDiv.style.display = usingMockData ? 'block' : 'none';
    };
    
    // Initial check
    checkMockDataStatus();
    
    // Set up an interval to check mock data status
    const intervalId = setInterval(checkMockDataStatus, 1000);
    
    return () => {
      // Clean up
      clearInterval(intervalId);
      if (document.getElementById('weather-api-notification')) {
        document.body.removeChild(notificationDiv);
      }
    };
  }, [])
  
  // Save settings to localStorage when they change and refresh weather data when units change
  useEffect(() => {
    localStorage.setItem('weatherWidget_location', locationInput)
    localStorage.setItem('weatherWidget_units', units)
    
    // If there's an error related to API key activation, show a helpful message in the UI
    if (error && error.includes('API key may still be in the activation period')) {
      const notification = document.getElementById('weather-api-notification');
      if (notification) {
        notification.style.display = 'block';
      }
    }
    
    // Refresh weather data when units change to update the temperature display
    fetchWeatherData(locationInput, units);
  }, [locationInput, units, error])
  
  // Use OpenWeatherMap icons when available, fallback to Lucide icons
  const getWeatherIcon = (condition, size = 24, iconCode = null) => {
    // If we have an icon code from OpenWeatherMap, use their icon
    if (iconCode) {
      return (
        <img 
          src={`https://openweathermap.org/img/wn/${iconCode}@2x.png`} 
          alt={condition}
          style={{ width: size, height: size }}
          className="weather-icon"
        />
      )
    }
    
    // Fallback to our built-in icons
    switch (condition) {
      case 'sunny':
        return <Sun size={size} />
      case 'cloudy':
        return <Cloud size={size} />
      case 'rainy':
        return <CloudRain size={size} />
      case 'snowy':
        return <CloudSnow size={size} />
      case 'stormy':
        return <CloudLightning size={size} />
      case 'foggy':
        return <CloudFog size={size} />
      default:
        return <Sun size={size} />
    }
  }
  
  // Render different views based on widget size
  const renderContent = () => {
    // If loading, show loading state
    if (loading) {
      return renderLoadingState();
    }
    
    // If error, show error state
    if (error) {
      return renderErrorState();
    }
    
    // Check for different size combinations
    if (width === 2 && height === 2) {
      return renderDefaultView(); // 2x2 default view
    } else if (width > 2 && height === 2) {
      return renderWideView(); // Wide view (e.g., 4x2, 6x2)
    } else if (width === 2 && height > 2) {
      return renderTallView(); // Tall view (e.g., 2x4, 2x6)
    } else {
      return renderFullView(); // Large view (e.g., 4x4, 6x6)
    }
  };

  // Default view for 2x2 layout
  const renderDefaultView = () => {
    return (
      <div className="flex items-center justify-between h-full p-2">
        <div className="flex flex-col">
          <div className="text-4xl font-medium">{weather.temperature}°{units === 'celsius' ? 'C' : 'F'}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">{weather.location}</div>
          <div className="text-xs mt-2">H: {weather.high}° L: {weather.low}°</div>
        </div>
        <div className="flex items-center">
          {getWeatherIcon(weather.condition, 56, weather.icon)}
        </div>
      </div>
    )
  }
  
  // Wide view for layouts like 3x2, 4x2, 6x2
  const renderWideView = () => {
    // Determine how many forecast days to show based on width
    const forecastDays = width === 3 ? 2 : width <= 4 ? 3 : 5;
    
    return (
      <div className="flex flex-col h-full p-1">
        {/* Current weather - takes top portion */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex flex-col">
            <div className="text-4xl font-medium">{weather.temperature}°{units === 'celsius' ? 'C' : 'F'}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">{weather.location}</div>
            <div className="text-xs">H: {weather.high}° L: {weather.low}°</div>
            <div className="text-xs mt-1">{weather.description}</div>
          </div>
          <div className="flex items-center ml-auto">
            {getWeatherIcon(weather.condition, width === 3 ? 48 : 64, weather.icon)}
          </div>
        </div>
        
        {/* Forecast - takes bottom portion */}
        <div className="flex justify-around items-center flex-1 pt-1 border-t border-gray-200 dark:border-gray-700">
          {weather.forecast.slice(0, forecastDays).map((day, index) => (
            <div key={index} className="flex flex-col items-center">
              <div className="font-medium text-sm">{day.day}</div>
              <div className="my-1">{getWeatherIcon(day.condition, width === 3 ? 28 : 36, day.icon)}</div>
              <div className="text-sm font-medium">{day.temp}°{units === 'celsius' ? 'C' : 'F'}</div>
            </div>
          ))}
        </div>
      </div>
    )
  }
  
  // Tall view for layouts like 2x3
  const renderTallView = () => {
    return (
      <div className="h-full flex flex-col">
        {/* Current weather section - takes about 40% of height */}
        <div className="flex items-center justify-between p-3 mb-2">
          <div>
            <div className="text-5xl font-medium">{weather.temperature}°{units === 'celsius' ? 'C' : 'F'}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">{weather.location}</div>
            <div className="text-xs mt-1">H: {weather.high}° L: {weather.low}°</div>
          </div>
          <div>
            {getWeatherIcon(weather.condition, 64, weather.icon)}
          </div>
        </div>
        
        {/* Divider */}
        <div className="border-t border-gray-200 dark:border-gray-700 mb-2 mx-3"></div>
        
        {/* Forecast section - takes about 60% of height */}
        <div className="flex-1 px-3">
          <div className="grid grid-cols-1 h-full">
            {weather.forecast.slice(0, 3).map((day, index) => (
              <div key={index} className="flex items-center py-2">
                <div className="w-16 text-sm font-medium">{day.day}</div>
                <div className="flex-grow flex justify-center">
                  {getWeatherIcon(day.condition, 24, day.icon)}
                </div>
                <div className="w-10 text-right text-sm font-medium">{day.temp}°{units === 'celsius' ? 'C' : 'F'}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }
  
  const renderFullView = () => {
    // In full view we show detailed current weather and full forecast
    return (
      <div className="h-full flex flex-col">
        {/* Current weather details */}
        <div className="flex items-start p-3 bg-gray-50 dark:bg-gray-800 rounded-lg mb-4">
          <div className="flex-1">
            <div className="text-2xl font-medium">{weather.location}</div>
            <div className="flex items-center mt-2">
              <span className="text-5xl font-medium">{weather.temperature}°{units === 'celsius' ? 'C' : 'F'}</span>
              <span className="text-sm ml-3">Feels like {weather.feelsLike}°{units === 'celsius' ? 'C' : 'F'}</span>
            </div>
            <div className="text-sm mt-1">H: {weather.high}° L: {weather.low}°</div>
            <div className="text-sm mt-3 capitalize">{weather.description}</div>
            <div className="mt-3 text-sm grid grid-cols-2 gap-x-4 gap-y-2">
              <div>Humidity: {weather.humidity}%</div>
              <div>Wind: {weather.windSpeed} {units === 'celsius' ? 'm/s' : 'mph'}</div>
            </div>
          </div>
          <div className="flex items-start justify-end">
            {getWeatherIcon(weather.condition, 80, weather.icon)}
          </div>
        </div>
        
        {/* Forecast section */}
        <div className="flex-1 bg-white dark:bg-gray-850 rounded-lg p-3">
          <div className="text-base font-medium mb-3">5-Day Forecast</div>
          <div className="grid grid-cols-5 gap-4 h-full">
            {weather.forecast.map((day, index) => (
              <div key={index} className="flex flex-col items-center p-3 hover:bg-gray-50 dark:hover:bg-gray-750 rounded-lg">
                <div className="text-sm font-medium mb-2">{day.day}</div>
                <div className="my-3 flex-grow flex items-center">{getWeatherIcon(day.condition, 40, day.icon)}</div>
                <div className="text-lg font-medium">{day.temp}°{units === 'celsius' ? 'C' : 'F'}</div>
                <div className="text-xs mt-1 capitalize">{day.description}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }
  
  const renderSettings = () => {
    if (!showSettings) return null;
    
    return createPortal(
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]"
        onClick={(e) => {
          // Prevent clicks in the modal backdrop from affecting widgets underneath
          e.stopPropagation();
          setShowSettings(false);
        }}
      >
        <div 
          ref={settingsRef}
          className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96 shadow-lg max-w-[90vw] max-h-[90vh] overflow-auto"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            e.nativeEvent.stopImmediatePropagation();
          }}
          onMouseDown={(e) => e.stopPropagation()}
          onMouseUp={(e) => e.stopPropagation()}
          onMouseMove={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Weather Settings</h3>
            <button 
              onClick={() => setShowSettings(false)}
              className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              <X size={20} />
            </button>
          </div>
          
          <div className="mb-6">
            <label className="block text-sm mb-2 font-medium">Location</label>
            <input
              type="text"
              className="w-full p-2 bg-gray-100 dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600"
              value={locationInput}
              onChange={(e) => setLocationInput(e.target.value)}
              placeholder="City name (e.g. New York)"
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-sm mb-2 font-medium">Units</label>
            <div className="flex gap-4">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  className="mr-2 h-4 w-4"
                  checked={units === 'fahrenheit'}
                  onChange={() => {
                    console.log('Setting units to fahrenheit');
                    setUnits('fahrenheit');
                  }}
                  id="fahrenheit"
                />
                <span className="text-sm">°F</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  className="mr-2 h-4 w-4"
                  checked={units === 'celsius'}
                  onChange={() => {
                    console.log('Setting units to celsius');
                    setUnits('celsius');
                  }}
                  id="celsius"
                />
                <span className="text-sm">°C</span>
              </label>
            </div>
          </div>
          
          <div className="mb-6">
            <label className="block text-sm mb-2 font-medium">Data Source</label>
            <div className="flex items-center">
              <input
                type="checkbox"
                className="mr-2 h-4 w-4"
                checked={localStorage.getItem('weatherWidget_useMockData') === 'true'}
                onChange={(e) => {
                  if (e.target.checked) {
                    localStorage.setItem('weatherWidget_useMockData', 'true');
                  } else {
                    localStorage.removeItem('weatherWidget_useMockData');
                  }
                }}
                id="useMockData"
              />
              <span className="text-sm">Use sample data (until API key activates)</span>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              Note: New OpenWeatherMap API keys take up to 2 hours to activate.
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
              onClick={() => {
                // Clear the mock data flag if it was set
                localStorage.removeItem('weatherWidget_useMockData');
                fetchWeatherData(locationInput, units)
                setShowSettings(false)
              }}
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
  
  const renderLoadingState = () => (
    <div className="h-full flex items-center justify-center">
      <Loader2 size={36} className="animate-spin text-gray-400" />
    </div>
  )
  
  const renderErrorState = () => (
    <div className="h-full flex flex-col items-center justify-center p-4 text-center">
      <AlertCircle size={36} className="text-red-500 mb-2" />
      <div className="text-sm text-gray-600 dark:text-gray-400">{error}</div>
      <div className="flex flex-col gap-2 mt-4">
        <button 
          onClick={() => fetchWeatherData(locationInput, units)}
          className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Retry
        </button>
        <button 
          onClick={() => setShowSettings(true)}
          className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          Change Location
        </button>
      </div>
    </div>
  )
  
  return (
    <div 
      ref={widgetRef} 
      className={`widget-container h-full flex flex-col ${showSettings ? 'modal-open' : ''}`}
      // This data attribute helps CSS target widgets with open modals if needed
      data-modal-open={showSettings ? 'true' : 'false'}
      data-using-mock={localStorage.getItem('weatherWidget_useMockData') === 'true' ? 'true' : 'false'}
    >
      <WidgetHeader 
        title={localStorage.getItem('weatherWidget_useMockData') === 'true' ? "Weather (Sample Data)" : "Weather"} 
        onSettingsClick={() => setShowSettings(!showSettings)}
      />
      
      <div className="flex-1 overflow-hidden">
        {loading ? renderLoadingState() : 
         error ? renderErrorState() : 
         renderContent()}
      </div>
      
      {/* Settings modal */}
      {renderSettings()}
    </div>
  )
}

// Widget configuration for registration
export const weatherWidgetConfig = {
  type: 'weather',
  name: 'Weather',
  description: 'Displays local weather conditions and forecast',
  defaultSize: { w: 2, h: 2 },
  minSize: { w: 2, h: 2 },
  maxSize: { w: 6, h: 6 }
}

export default WeatherWidget