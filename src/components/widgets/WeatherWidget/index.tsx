import React, { useState, useEffect, useRef } from 'react';
import { Cloud, CloudRain, CloudSnow, CloudLightning, Wind, Sun, SunDim, Droplets, Info } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '../../ui/dialog';
import WidgetHeader from '../../widgets/common/WidgetHeader';
import { WeatherWidgetProps, WeatherData, WeatherWidgetConfig } from './types';

/**
 * Weather Widget Component
 * 
 * Displays current weather conditions and forecast.
 * Adapts to different sizes with varying levels of detail:
 * - Smallest (2x2): Temperature, icon, location
 * - Small (3x2): Adds humidity, wind, and feels-like temp
 * - Wide (4x2): Adds horizontal 5-day forecast
 * - Medium (3x3): Adds weather details and vertical forecast
 * - Large (4x4): Complete weather data with detailed forecast
 * 
 * @component
 * @param {WeatherWidgetProps} props - Component props
 * @returns {JSX.Element} Weather widget component
 */
const WeatherWidget: React.FC<WeatherWidgetProps> = ({ width, height, config }) => {
  // State for weather data and UI
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [unit, setUnit] = useState<'celsius' | 'fahrenheit'>('celsius');
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [localConfig, setLocalConfig] = useState<WeatherWidgetConfig>(
    config || { id: '', location: 'New York', units: 'metric', apiKey: '' }
  );
  const widgetRef = useRef<HTMLDivElement | null>(null);

  // Mock weather data for development/testing
  const mockWeatherData: WeatherData = {
    location: 'New York',
    temperature: 22,
    feelsLike: 24,
    condition: 'Clear',
    description: 'Clear sky',
    icon: '01d',
    humidity: 65,
    windSpeed: 5.2,
    windDirection: 120,
    sunrise: 1617267900,
    sunset: 1617315780,
    forecast: [
      {
        day: 'Mon',
        temp: { min: 18, max: 24 },
        condition: 'Clear',
        description: 'Clear sky',
        icon: '01d'
      },
      {
        day: 'Tue',
        temp: { min: 17, max: 26 },
        condition: 'Clouds',
        description: 'Few clouds',
        icon: '02d'
      },
      {
        day: 'Wed',
        temp: { min: 19, max: 28 },
        condition: 'Clouds',
        description: 'Scattered clouds',
        icon: '03d'
      },
      {
        day: 'Thu',
        temp: { min: 20, max: 27 },
        condition: 'Rain',
        description: 'Light rain',
        icon: '10d'
      },
      {
        day: 'Fri',
        temp: { min: 18, max: 25 },
        condition: 'Clear',
        description: 'Clear sky',
        icon: '01d'
      }
    ]
  };

  /**
   * Fetches weather data from the API or uses mock data
   */
  const fetchWeather = async () => {
    setLoading(true);
    
    try {
      // If we have an API key, fetch real data, otherwise use mock data
      if (localConfig.apiKey) {
        const units = localConfig.units || 'metric';
        const location = localConfig.location || 'New York';
        
        // Fetch current weather
        const currentResponse = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?q=${location}&units=${units}&appid=${localConfig.apiKey}`
        );
        
        if (!currentResponse.ok) {
          throw new Error(`Weather API error: ${currentResponse.statusText}`);
        }
        
        const currentData = await currentResponse.json();
        
        // Fetch forecast
        const forecastResponse = await fetch(
          `https://api.openweathermap.org/data/2.5/forecast?q=${location}&units=${units}&appid=${localConfig.apiKey}`
        );
        
        if (!forecastResponse.ok) {
          throw new Error(`Forecast API error: ${forecastResponse.statusText}`);
        }
        
        const forecastData = await forecastResponse.json();
        
        // Process forecast data to get daily forecasts
        const dailyForecasts: { [key: string]: any } = {};
        
        forecastData.list.forEach((item: any) => {
          const date = new Date(item.dt * 1000);
          const day = date.toLocaleDateString('en-US', { weekday: 'short' });
          
          if (!dailyForecasts[day]) {
            dailyForecasts[day] = {
              day,
              temp: {
                min: item.main.temp_min,
                max: item.main.temp_max
              },
              condition: item.weather[0].main,
              description: item.weather[0].description,
              icon: item.weather[0].icon
            };
          } else {
            // Update min/max temps if needed
            if (item.main.temp_min < dailyForecasts[day].temp.min) {
              dailyForecasts[day].temp.min = item.main.temp_min;
            }
            if (item.main.temp_max > dailyForecasts[day].temp.max) {
              dailyForecasts[day].temp.max = item.main.temp_max;
            }
          }
        });
        
        // Convert to array and limit to 5 days
        const forecast = Object.values(dailyForecasts).slice(0, 5);
        
        setWeather({
          location: currentData.name,
          temperature: currentData.main.temp,
          feelsLike: currentData.main.feels_like,
          condition: currentData.weather[0].main,
          description: currentData.weather[0].description,
          icon: currentData.weather[0].icon,
          humidity: currentData.main.humidity,
          windSpeed: currentData.wind.speed,
          windDirection: currentData.wind.deg,
          sunrise: currentData.sys.sunrise,
          sunset: currentData.sys.sunset,
          forecast
        });
        
        setLoading(false);
        setUnit(localConfig.units === 'imperial' ? 'fahrenheit' : 'celsius');
        setError(null);
      } else {
        // Use mock data
        setWeather(mockWeatherData);
        
        setLoading(false);
        setError(null);
      }
    } catch (err) {
      setError('Failed to fetch weather data');
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      await fetchWeather();
    };
    
    fetchData();
  }, [localConfig.location, localConfig.units, localConfig.apiKey]);

  /**
   * Format temperature with unit
   * 
   * @param {number} temp - Temperature value
   * @returns {string} Formatted temperature with unit
   */
  const formatTemperature = (temp: number): string => {
    const roundedTemp = Math.round(temp);
    return `${roundedTemp}°${unit === 'celsius' ? 'C' : 'F'}`;
  };

  /**
   * Get weather icon component based on condition
   * 
   * @param {string} condition - Weather condition
   * @param {string} [icon] - Icon code from API
   * @returns {JSX.Element} Weather icon component
   */
  const getWeatherIcon = (condition: string, icon?: string): JSX.Element => {
    // Check if it's day or night based on icon code
    const isNight = icon?.includes('n');
    const defaultSize = 24;
    const className = "text-gray-700 dark:text-gray-300";
    
    switch (condition.toLowerCase()) {
      case 'clear':
        return isNight ? <SunDim size={defaultSize} className={className} /> : <Sun size={defaultSize} className={className} />;
      case 'clouds':
        return <Cloud size={defaultSize} className={className} />;
      case 'rain':
      case 'drizzle':
        return <CloudRain size={defaultSize} className={className} />;
      case 'snow':
        return <CloudSnow size={defaultSize} className={className} />;
      case 'thunderstorm':
        return <CloudLightning size={defaultSize} className={className} />;
      case 'mist':
      case 'fog':
      case 'haze':
        return <Wind size={defaultSize} className={className} />;
      default:
        return <Cloud size={defaultSize} className={className} />;
    }
  };

  /**
   * Loading component for all views
   * 
   * @returns {JSX.Element} Loading indicator
   */
  const renderLoading = () => {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <div className="animate-pulse rounded-full bg-gray-200/50 dark:bg-gray-700/50 h-10 w-10"></div>
      </div>
    );
  };

  /**
   * Error component for all views
   * 
   * @returns {JSX.Element} Error indicator
   */
  const renderError = () => {
    return (
      <div className="flex flex-col items-center justify-center h-full p-3 text-center">
        <Info className="text-amber-500 mb-2" size={24} />
        <p className="text-sm text-amber-500 mb-1">{error}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {localConfig.apiKey ? 'Check your API key or network connection.' : 'Add an API key in settings.'}
        </p>
      </div>
    );
  };

  /**
   * Renders the minimal view for smallest widget size (2x2)
   * Displays just the essential information: current temperature, weather icon and location
   * 
   * @returns {JSX.Element} Minimal view
   */
  const renderMinimalView = () => {
    if (!weather) return null;
    
    return (
      <div className="flex flex-col items-center justify-center h-full px-2 py-3">
        <div className="mb-1">
          {getWeatherIcon(weather.condition, weather.icon)}
        </div>
        <div className="text-2xl font-medium tracking-tight">
          {formatTemperature(weather.temperature)}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400 truncate mt-1">
          {weather.location}
        </div>
      </div>
    );
  };

  /**
   * Renders a compact view with essential weather details
   * Adds feels-like temperature, humidity and wind speed to the basic view
   * 
   * @returns {JSX.Element} Compact layout view
   */
  const renderCompactView = () => {
    if (!weather) return null;
    
    return (
      <div className="flex h-full p-3">
        <div className="flex flex-col justify-center items-start flex-1">
          <div className="text-sm text-gray-500 dark:text-gray-400 mb-1 truncate">
            {weather.location}
          </div>
          <div className="flex items-center">
            <span className="text-2xl font-medium tracking-tight mr-2">
              {formatTemperature(weather.temperature)}
            </span>
            {getWeatherIcon(weather.condition, weather.icon)}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {weather.condition}
          </div>
        </div>
        
        <div className="flex flex-col justify-center items-end text-right space-y-1">
          <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
            <span className="mr-1">Feels</span> 
            <span className="font-medium">{formatTemperature(weather.feelsLike)}</span>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
            <Droplets size={12} className="mr-1" /> 
            <span className="font-medium">{weather.humidity}%</span>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
            <Wind size={12} className="mr-1" /> 
            <span className="font-medium">{weather.windSpeed}</span>
            <span className="ml-1">{unit === 'celsius' ? 'm/s' : 'mph'}</span>
          </div>
        </div>
      </div>
    );
  };

  /**
   * Renders a horizontal forecast view for wider widgets
   * Shows current conditions and a 5-day forecast in a horizontal layout
   * 
   * @returns {JSX.Element} Horizontal forecast view
   */
  const renderHorizontalForecastView = () => {
    if (!weather) return null;
    
    return (
      <div className="flex flex-col h-full p-3">
        <div className="flex items-center mb-3">
          <div className="mr-3">
            {getWeatherIcon(weather.condition, weather.icon)}
          </div>
          <div>
            <div className="text-xl font-medium tracking-tight">
              {formatTemperature(weather.temperature)}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {weather.location}
            </div>
          </div>
          <div className="ml-auto text-xs text-gray-500 dark:text-gray-400">
            Feels like {formatTemperature(weather.feelsLike)}
          </div>
        </div>
        
        <div className="flex-1 overflow-hidden">
          <div className="flex space-x-2 h-full">
            {weather.forecast.map((day, index) => (
              <div key={index} className="flex-1 flex flex-col items-center justify-between py-2 px-1 bg-gray-50/50 dark:bg-slate-800/30 rounded-md">
                <div className="text-xs font-medium">{day.day}</div>
                <div className="py-1">
                  {getWeatherIcon(day.condition, day.icon)}
                </div>
                <div className="flex flex-col items-center">
                  <div className="text-xs font-medium">
                    {Math.round(day.temp.max)}°
                  </div>
                  <div className="text-xs text-gray-400 dark:text-gray-500">
                    {Math.round(day.temp.min)}°
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  /**
   * Renders a vertical forecast view for medium-sized widgets
   * Includes current conditions, weather metrics, and a vertical 5-day forecast
   * 
   * @returns {JSX.Element} Vertical forecast view
   */
  const renderVerticalForecastView = () => {
    if (!weather) return null;
    
    // Calculate sunrise and sunset times
    const sunriseTime = new Date(weather.sunrise * 1000).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    const sunsetTime = new Date(weather.sunset * 1000).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    
    return (
      <div className="flex flex-col h-full p-3">
        <div className="mb-3">
          <div className="text-sm font-medium truncate mb-1">{weather.location}</div>
          <div className="flex items-end">
            <div className="text-3xl font-medium tracking-tight mr-2">
              {formatTemperature(weather.temperature)}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
              Feels like {formatTemperature(weather.feelsLike)}
            </div>
            <div className="ml-auto">
              {getWeatherIcon(weather.condition, weather.icon)}
            </div>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {weather.description}
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="bg-gray-50/50 dark:bg-slate-800/30 rounded-md p-2 text-center">
            <div className="text-xs text-gray-500 dark:text-gray-400">Humidity</div>
            <div className="text-sm font-medium mt-1">{weather.humidity}%</div>
          </div>
          <div className="bg-gray-50/50 dark:bg-slate-800/30 rounded-md p-2 text-center">
            <div className="text-xs text-gray-500 dark:text-gray-400">Wind</div>
            <div className="text-sm font-medium mt-1">{weather.windSpeed} {unit === 'celsius' ? 'm/s' : 'mph'}</div>
          </div>
          <div className="bg-gray-50/50 dark:bg-slate-800/30 rounded-md p-2 text-center">
            <div className="text-xs text-gray-500 dark:text-gray-400">Sunrise/Sunset</div>
            <div className="text-xs font-medium mt-1">{sunriseTime} / {sunsetTime}</div>
          </div>
        </div>
        
        <div className="flex-1 overflow-hidden">
          <div className="text-xs font-medium mb-2">5-Day Forecast</div>
          <div className="space-y-2">
            {weather.forecast.map((day, index) => (
              <div key={index} className="flex items-center justify-between bg-gray-50/50 dark:bg-slate-800/30 rounded-md py-2 px-3">
                <div className="text-xs font-medium w-10">{day.day}</div>
                <div className="flex-1 flex justify-center">
                  {getWeatherIcon(day.condition, day.icon)}
                </div>
                <div className="text-xs w-16 text-right">
                  <span className="font-medium">{Math.round(day.temp.max)}°</span>
                  <span className="text-gray-400 dark:text-gray-500 ml-1">{Math.round(day.temp.min)}°</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  /**
   * Renders the full-size detailed view for large widgets
   * Comprehensive display with current conditions, detailed metrics, and complete forecast
   * 
   * @returns {JSX.Element} Full-size detailed view
   */
  const renderDetailedView = () => {
    if (!weather) return null;
    
    // Get current date and time
    const now = new Date();
    const currentTime = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    const currentDate = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    
    // Calculate sunrise and sunset times
    const sunriseTime = new Date(weather.sunrise * 1000).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    const sunsetTime = new Date(weather.sunset * 1000).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    
    return (
      <div className="flex flex-col h-full p-4">
        <div className="flex justify-between items-start mb-5">
          <div>
            <h3 className="text-lg font-medium">{weather.location}</h3>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {currentDate} • {currentTime}
            </div>
            <div className="text-sm mt-1">
              {weather.description}
            </div>
          </div>
          <div className="text-right flex items-center">
            <div className="mr-3">
              {getWeatherIcon(weather.condition, weather.icon)}
            </div>
            <div>
              <div className="text-3xl font-medium tracking-tight">
                {formatTemperature(weather.temperature)}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Feels like {formatTemperature(weather.feelsLike)}
              </div>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-4 gap-3 mb-5">
          <div className="bg-gray-50/50 dark:bg-slate-800/30 rounded-md p-3">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Humidity</div>
            <div className="text-lg font-medium">{weather.humidity}%</div>
          </div>
          <div className="bg-gray-50/50 dark:bg-slate-800/30 rounded-md p-3">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Wind</div>
            <div className="text-lg font-medium">{weather.windSpeed} {unit === 'celsius' ? 'm/s' : 'mph'}</div>
          </div>
          <div className="bg-gray-50/50 dark:bg-slate-800/30 rounded-md p-3">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Sunrise</div>
            <div className="text-lg font-medium">{sunriseTime}</div>
          </div>
          <div className="bg-gray-50/50 dark:bg-slate-800/30 rounded-md p-3">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Sunset</div>
            <div className="text-lg font-medium">{sunsetTime}</div>
          </div>
        </div>
        
        <div className="flex-1">
          <h4 className="text-sm font-medium mb-3">5-Day Forecast</h4>
          <div className="grid grid-cols-5 gap-3">
            {weather.forecast.map((day, index) => (
              <div key={index} className="bg-gray-50/50 dark:bg-slate-800/30 rounded-md p-3 flex flex-col items-center">
                <div className="text-sm font-medium mb-2">{day.day}</div>
                <div className="mb-2">
                  {getWeatherIcon(day.condition, day.icon)}
                </div>
                <div className="text-sm font-medium">
                  {Math.round(day.temp.max)}°
                </div>
                <div className="text-xs text-gray-400 dark:text-gray-500">
                  {Math.round(day.temp.min)}°
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-center">
                  {day.condition}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  /**
   * Determines which view to render based on widget dimensions
   * Adapts the content display to make optimal use of available space
   * 
   * @returns {JSX.Element} The appropriate view for the current dimensions
   */
  const renderContent = () => {
    if (error) {
      return renderError();
    }
    
    if (loading) {
      return renderLoading();
    }
    
    // Determine which view to render based on available space
    // Using a more nuanced approach to sizing
    if (width >= 4 && height >= 4) {
      return renderDetailedView();
    } else if (width >= 3 && height >= 3) {
      return renderVerticalForecastView();
    } else if (width >= 4 && height >= 2) {
      return renderHorizontalForecastView();
    } else if (width >= 3 && height >= 2) {
      return renderCompactView();
    } else {
      return renderMinimalView();
    }
  };

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
            Location
          </label>
          <input
            type="text"
            className="w-full p-2 bg-gray-100 dark:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600"
            placeholder="Enter city name"
            value={localConfig.location || ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLocalConfig({...localConfig, location: e.target.value})}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">
            API Key
          </label>
          <input
            type="text"
            className="w-full p-2 bg-gray-100 dark:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600"
            placeholder="OpenWeatherMap API Key"
            value={localConfig.apiKey || ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLocalConfig({...localConfig, apiKey: e.target.value})}
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Get a free API key from <a href="https://openweathermap.org/api" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">OpenWeatherMap</a>
          </p>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">
            Units
          </label>
          <div className="space-y-2">
            <div className="flex items-center">
              <input
                type="radio"
                id="metric"
                name="units"
                value="metric"
                checked={localConfig.units === 'metric'}
                onChange={() => setLocalConfig({...localConfig, units: 'metric'})}
                className="mr-2 h-4 w-4"
              />
              <label htmlFor="metric" className="text-sm">Celsius</label>
            </div>
            <div className="flex items-center">
              <input
                type="radio"
                id="imperial"
                name="units"
                value="imperial"
                checked={localConfig.units === 'imperial'}
                onChange={() => setLocalConfig({...localConfig, units: 'imperial'})}
                className="mr-2 h-4 w-4"
              />
              <label htmlFor="imperial" className="text-sm">Fahrenheit</label>
            </div>
          </div>
        </div>
      </div>
    );
  };

  /**
   * Renders the settings footer
   * 
   * @returns {JSX.Element} Settings footer
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
              // Save settings via onUpdate callback (will use configManager in App.tsx)
              if (config?.onUpdate) {
                config.onUpdate(localConfig);
              }
              
              // Apply the local config settings
              setUnit(localConfig.units === 'imperial' ? 'fahrenheit' : 'celsius');
              setIsSettingsOpen(false);
              
              // Trigger a weather refresh with new settings
              setLoading(true);
              fetchWeather();
            }}
          >
            Save
          </button>
        </div>
      </>
    );
  };

  return (
    <div ref={widgetRef} className="widget-container h-full flex flex-col">
      <WidgetHeader 
        title="Weather" 
        onSettingsClick={() => setIsSettingsOpen(true)}
      />
      
      <div className="flex-1 overflow-hidden bg-white/30 dark:bg-slate-900/30 rounded-md m-1">
        {renderContent()}
      </div>
      
      {isSettingsOpen && (
        <Dialog open={isSettingsOpen} onOpenChange={(open: boolean) => setIsSettingsOpen(open)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Weather Settings</DialogTitle>
            </DialogHeader>
            {renderSettingsContent()}
            <DialogFooter>
              {renderSettingsFooter()}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default WeatherWidget;

// Export types for use in other files
export * from './types'; 