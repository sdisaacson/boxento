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
      return renderWideView(); // Wide view (e.g., 4x2)
    } else if (width === 2 && height > 2) {
      return renderTallView(); // Tall view (e.g., 2x4)
    } else {
      return renderFullView(); // Large view (e.g., 4x4, 6x6)
    }
  };

  // Default view for 2x2 layout (previously renderMediumView)
  const renderDefaultView = () => {
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
  
  // Wide view for layouts like 4x2, 6x2
  const renderWideView = () => {
    return (
      <div className="flex items-center justify-between h-full">
        <div className="flex flex-col">
          <div className="text-3xl font-medium">{weather.temperature}°</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">{weather.location}</div>
          <div className="text-xs mt-1">H: {weather.high}° L: {weather.low}°</div>
        </div>
        <div className="flex items-center gap-4">
          {getWeatherIcon(weather.condition, 40)}
          <div className="grid grid-cols-3 gap-2">
            {weather.forecast.slice(0, 3).map((day, index) => (
              <div key={index} className="flex flex-col items-center">
                <div className="text-xs">{day.day}</div>
                <div className="my-1">{getWeatherIcon(day.condition, 20)}</div>
                <div className="text-xs font-medium">{day.temp}°</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }
  
  // Tall view for layouts like 2x4, 2x6
  const renderTallView = () => {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-3xl font-medium">{weather.temperature}°</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">{weather.location}</div>
            <div className="text-xs mt-1">H: {weather.high}° L: {weather.low}°</div>
          </div>
          <div className="flex items-center">
            {getWeatherIcon(weather.condition, 40)}
          </div>
        </div>
        
        <div className="flex flex-col gap-2 mt-auto">
          {weather.forecast.map((day, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="text-sm">{day.day}</div>
              <div className="flex items-center gap-2">
                {getWeatherIcon(day.condition, 16)}
                <div className="text-sm font-medium">{day.temp}°</div>
              </div>
            </div>
          ))}
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