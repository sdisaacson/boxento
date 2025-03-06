import { useState, useEffect, useRef } from 'react'
import { Cloud, Sun, CloudRain, CloudSnow, CloudLightning, CloudFog, X } from 'lucide-react'
import { createPortal } from 'react-dom'
import Modal from '../ui/Modal'
import WidgetHeader from '../ui/WidgetHeader'

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
      <div className="flex items-center justify-between h-full">
        <div className="flex flex-col">
          <div className="text-4xl font-medium">{weather.temperature}°</div>
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">{weather.location}</div>
          <div className="text-xs mt-2">H: {weather.high}° L: {weather.low}°</div>
        </div>
        <div className="flex items-center">
          {getWeatherIcon(weather.condition, 56)}
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
            <div className="text-4xl font-medium">{weather.temperature}°</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">{weather.location}</div>
            <div className="text-xs">H: {weather.high}° L: {weather.low}°</div>
          </div>
          <div className="flex items-center ml-auto">
            {getWeatherIcon(weather.condition, width === 3 ? 48 : 64)}
          </div>
        </div>
        
        {/* Forecast - takes bottom portion */}
        <div className="flex justify-around items-center flex-1 pt-1 border-t border-gray-200 dark:border-gray-700">
          {weather.forecast.slice(0, forecastDays).map((day, index) => (
            <div key={index} className="flex flex-col items-center">
              <div className="font-medium text-sm">{day.day}</div>
              <div className="my-1">{getWeatherIcon(day.condition, width === 3 ? 28 : 36)}</div>
              <div className="text-sm font-medium">{day.temp}°</div>
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
            <div className="text-5xl font-medium">{weather.temperature}°</div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">{weather.location}</div>
            <div className="text-xs mt-1">H: {weather.high}° L: {weather.low}°</div>
          </div>
          <div>
            {getWeatherIcon(weather.condition, 64)}
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
                  {getWeatherIcon(day.condition, 24)}
                </div>
                <div className="w-10 text-right text-sm font-medium">{day.temp}°</div>
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
              <span className="text-5xl font-medium">{weather.temperature}°</span>
              <span className="text-sm ml-3">Feels like 73°</span>
            </div>
            <div className="text-sm mt-1">H: {weather.high}° L: {weather.low}°</div>
            <div className="text-sm mt-3 capitalize">{weather.condition}</div>
          </div>
          <div className="flex items-start justify-end">
            {getWeatherIcon(weather.condition, 80)}
          </div>
        </div>
        
        {/* Forecast section */}
        <div className="flex-1 bg-white dark:bg-gray-850 rounded-lg p-3">
          <div className="text-base font-medium mb-3">5-Day Forecast</div>
          <div className="grid grid-cols-5 gap-4 h-full">
            {weather.forecast.map((day, index) => (
              <div key={index} className="flex flex-col items-center p-3 hover:bg-gray-50 dark:hover:bg-gray-750 rounded-lg">
                <div className="text-sm font-medium mb-2">{day.day}</div>
                <div className="my-3 flex-grow flex items-center">{getWeatherIcon(day.condition, 40)}</div>
                <div className="text-lg font-medium">{day.temp}°</div>
                <div className="text-xs mt-1 capitalize">{day.condition}</div>
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
    <div ref={widgetRef} className="widget-container h-full flex flex-col">
      <WidgetHeader 
        title="Weather" 
        onSettingsClick={() => setShowSettings(!showSettings)}
      />
      
      <div className="flex-1 overflow-hidden">
        {renderContent()}
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