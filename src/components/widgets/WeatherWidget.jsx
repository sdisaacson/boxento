import { useState, useEffect, useRef } from 'react'
import { Cloud, Sun, CloudRain, CloudSnow, CloudLightning, CloudFog, Settings, X } from 'lucide-react'

const WeatherWidget = ({ width, height, config }) => {
  const [weather, setWeather] = useState({
    temperature: 72,
    condition: 'sunny',
    location: config?.location || 'San Francisco',
    high: 75,
    low: 65,
    forecast: [
      { day: 'Tue', temp: 72, condition: 'sunny' },
      { day: 'Wed', temp: 70, condition: 'cloudy' },
      { day: 'Thu', temp: 68, condition: 'rainy' },
      { day: 'Fri', temp: 73, condition: 'sunny' },
      { day: 'Sat', temp: 74, condition: 'sunny' },
    ]
  })
  
  const [showSettings, setShowSettings] = useState(false)
  const [locationInput, setLocationInput] = useState(config?.location || 'San Francisco')
  const [units, setUnits] = useState(config?.units || 'fahrenheit')
  const settingsRef = useRef(null)
  const settingsButtonRef = useRef(null)
  
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
  
  // In a real implementation, you would fetch weather data here
  // using a weather API based on user's location or a configured location
  
  const getWeatherIcon = (condition, size = 24) => {
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
  
  const renderCompactView = () => {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="text-xl mb-1">{weather.temperature}°</div>
        <div className="text-sm">{weather.location}</div>
      </div>
    )
  }
  
  const renderMediumView = () => {
    return (
      <div className="flex items-center justify-between h-full">
        <div className="flex flex-col">
          <div className="text-3xl font-medium">{weather.temperature}°</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">{weather.location}</div>
          <div className="text-xs mt-1">H: {weather.high}° L: {weather.low}°</div>
        </div>
        <div className="flex items-center">
          {getWeatherIcon(weather.condition, 40)}
        </div>
      </div>
    )
  }
  
  const renderFullView = () => {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-3xl font-medium">{weather.temperature}°</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">{weather.location}</div>
            <div className="text-xs mt-1">H: {weather.high}° L: {weather.low}°</div>
          </div>
          <div className="flex items-center">
            {getWeatherIcon(weather.condition, 50)}
          </div>
        </div>
        
        <div className="grid grid-cols-5 gap-2 mt-auto">
          {weather.forecast.map((day, index) => (
            <div key={index} className="flex flex-col items-center">
              <div className="text-xs">{day.day}</div>
              <div className="my-1">{getWeatherIcon(day.condition, 20)}</div>
              <div className="text-xs font-medium">{day.temp}°</div>
            </div>
          ))}
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
          <h3 className="text-sm font-medium mb-2">Weather Settings</h3>
          
          <div className="mb-4">
            <label className="block text-sm mb-1 font-medium">Location</label>
            <input
              type="text"
              className="w-full p-2 bg-gray-100 dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600"
              value={locationInput}
              onChange={(e) => setLocationInput(e.target.value)}
              placeholder="City name (e.g. New York)"
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-sm mb-1 font-medium">Units</label>
            <div className="flex gap-4">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  className="mr-2"
                  checked={units === 'fahrenheit'}
                  onChange={() => setUnits('fahrenheit')}
                />
                <span className="text-sm">°F</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  className="mr-2"
                  checked={units === 'celsius'}
                  onChange={() => setUnits('celsius')}
                />
                <span className="text-sm">°C</span>
              </label>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end">
          <button 
            onClick={() => {
              setWeather({...weather, location: locationInput})
              setShowSettings(false)
            }}
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
          <Cloud size={16} />
          <h3 className="text-sm font-medium">Weather</h3>
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
      {width <= 1 && height <= 1 
        ? renderCompactView() 
        : width <= 3 && height <= 2 
          ? renderMediumView() 
          : renderFullView()}
      
      {/* Settings dropdown */}
      {renderSettings()}
    </div>
  )
}

export default WeatherWidget