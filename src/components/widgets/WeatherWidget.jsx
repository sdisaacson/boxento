import { useState, useEffect, useRef } from 'react'
import { Cloud, Sun, CloudRain, CloudSnow, CloudLightning, CloudFog, Settings, X } from 'lucide-react'
import { createPortal } from 'react-dom'

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
  const widgetRef = useRef(null)
  
  // No need for click outside handler as the modal backdrop handles this
  
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
      return renderMediumView(); // 2x2 
    } else {
      // 3x2, 2x3, or other larger sizes
      return renderFullView(); 
    }
  };

  // Vertical view for 1x2 layout
  const renderVerticalView = () => {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2">
        {getWeatherIcon(weather.condition, 32)}
        <div className="text-2xl font-semibold">{weather.temperature}°</div>
        <div className="text-sm opacity-80">{weather.location}</div>
      </div>
    );
  };

  // Horizontal view for 2x1 layout
  const renderHorizontalView = () => {
    return (
      <div className="flex items-center justify-between h-full px-3">
        <div className="flex items-center gap-2">
          {getWeatherIcon(weather.condition, 24)}
          <div className="text-xl font-semibold">{weather.temperature}°</div>
        </div>
        <div className="text-sm opacity-80">{weather.location}</div>
      </div>
    );
  };
  
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
                  onChange={() => setUnits('fahrenheit')}
                  id="fahrenheit"
                />
                <span className="text-sm">°F</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  className="mr-2 h-4 w-4"
                  checked={units === 'celsius'}
                  onChange={() => setUnits('celsius')}
                  id="celsius"
                />
                <span className="text-sm">°C</span>
              </label>
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
                setWeather({...weather, location: locationInput})
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
      
      {/* Settings modal */}
      {renderSettings()}
    </div>
  )
}

export default WeatherWidget