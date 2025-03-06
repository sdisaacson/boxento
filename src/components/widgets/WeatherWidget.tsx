import { useState, useEffect } from 'react';
import { Cloud, CloudRain, CloudSnow, CloudLightning, Wind, Sun, SunDim } from 'lucide-react';
import Modal from '../ui/Modal';
import WidgetHeader from '../ui/WidgetHeader';
import { WidgetProps, WeatherWidgetConfig, WidgetConfig } from '../../types';

// Extended weather types
interface WeatherData {
  location: string;
  temperature: number;
  feelsLike: number;
  condition: string;
  description: string;
  icon: string;
  humidity: number;
  windSpeed: number;
  windDirection: number;
  sunrise: number;
  sunset: number;
  forecast: ForecastDay[];
}

interface ForecastDay {
  day: string;
  temp: {
    min: number;
    max: number;
  };
  condition: string;
  description: string;
  icon: string;
}

type TemperatureUnit = 'celsius' | 'fahrenheit';
type WeatherCondition = 'sunny' | 'cloudy' | 'rainy' | 'snowy' | 'stormy' | 'foggy';

/**
 * Weather Widget Component
 * 
 * Displays current weather conditions and forecast.
 * Fetches data from OpenWeatherMap API or uses mock data.
 */
const WeatherWidget = ({ width, height, config }: WidgetProps<WeatherWidgetConfig>) => {
  // No longer needed as we're using the widget-container class
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [unit, setUnit] = useState<TemperatureUnit>('celsius');
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [localConfig, setLocalConfig] = useState<WeatherWidgetConfig>(
    config || { id: '', location: 'New York', units: 'metric', apiKey: '' }
  );
  
  // Basic mock data for development/testing
  const mockWeatherData: WeatherData = {
    location: 'New York',
    temperature: 25,
    feelsLike: 26,
    condition: 'Clear',
    description: 'Clear sky',
    icon: '01d',
    humidity: 53,
    windSpeed: 4.12,
    windDirection: 230,
    sunrise: 1618906740,
    sunset: 1618955940,
    forecast: [
      {
        day: 'Mon',
        temp: { min: 15, max: 26 },
        condition: 'Clear',
        description: 'Clear sky',
        icon: '01d'
      },
      {
        day: 'Tue',
        temp: { min: 16, max: 28 },
        condition: 'Clouds',
        description: 'Few clouds',
        icon: '02d'
      },
      {
        day: 'Wed',
        temp: { min: 18, max: 28 },
        condition: 'Rain',
        description: 'Light rain',
        icon: '10d'
      },
      {
        day: 'Thu',
        temp: { min: 16, max: 25 },
        condition: 'Clouds',
        description: 'Scattered clouds',
        icon: '03d'
      },
      {
        day: 'Fri',
        temp: { min: 14, max: 24 },
        condition: 'Clear',
        description: 'Clear sky',
        icon: '01d'
      }
    ]
  };

  // Fetch weather data when location or units change
  useEffect(() => {
    let isMounted = true;
    
    const fetchWeather = async () => {
      setLoading(true);
      
      try {
        // If we have an API key, fetch real data, otherwise use mock data
        if (localConfig.apiKey) {
          const units = localConfig.units || 'metric';
          const location = localConfig.location || 'New York';
          
          // Current weather
          const response = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?q=${location}&units=${units}&appid=${localConfig.apiKey}`
          );
          
          if (!response.ok) {
            throw new Error(`Weather API error: ${response.statusText}`);
          }
          
          const data = await response.json();
          
          // Forecast
          const forecastResponse = await fetch(
            `https://api.openweathermap.org/data/2.5/forecast?q=${location}&units=${units}&appid=${localConfig.apiKey}`
          );
          
          if (!forecastResponse.ok) {
            throw new Error(`Forecast API error: ${forecastResponse.statusText}`);
          }
          
          const forecastData = await forecastResponse.json();
          
          // Process forecast data (get one forecast per day)
          const dailyForecasts: { [key: string]: ForecastDay } = {};
          const today = new Date().getDay();
          
          forecastData.list.forEach((item: any) => {
            const date = new Date(item.dt * 1000);
            const day = date.getDay();
            
            // Skip forecasts for the current day
            if (day !== today) {
              const dayName = getDayName(day);
              
              if (!dailyForecasts[dayName] || date.getHours() === 12) {
                dailyForecasts[dayName] = {
                  day: dayName,
                  temp: {
                    min: item.main.temp_min,
                    max: item.main.temp_max
                  },
                  condition: item.weather[0].main,
                  description: item.weather[0].description,
                  icon: item.weather[0].icon
                };
              }
            }
          });
          
          const forecast = Object.values(dailyForecasts).slice(0, 5);
          
          if (isMounted) {
            setWeather({
              location: data.name,
              temperature: data.main.temp,
              feelsLike: data.main.feels_like,
              condition: data.weather[0].main,
              description: data.weather[0].description,
              icon: data.weather[0].icon,
              humidity: data.main.humidity,
              windSpeed: data.wind.speed,
              windDirection: data.wind.deg,
              sunrise: data.sys.sunrise,
              sunset: data.sys.sunset,
              forecast
            });
            
            setUnit(localConfig.units === 'imperial' ? 'fahrenheit' : 'celsius');
            setError(null);
          }
        } else {
          if (isMounted) {
            // Use mock data for development/testing
            setWeather(mockWeatherData);
            setUnit('celsius');
            setError(null);
          }
        }
      } catch (err) {
        console.error('Error fetching weather data:', err);
        if (isMounted) {
          setWeather(mockWeatherData);  // Fallback to mock data
          setError('Could not fetch weather data. Using sample data.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    
    fetchWeather();
    
    return () => {
      isMounted = false;
    };
  }, [localConfig.location, localConfig.units, localConfig.apiKey]);

  // Helper to get day name
  const getDayName = (dayIndex: number): string => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days[dayIndex];
  };
  
  // Convert temperature based on selected unit
  const formatTemperature = (temp: number): string => {
    if (unit === 'fahrenheit') {
      return `${Math.round(temp)}°F`;
    }
    return `${Math.round(temp)}°C`;
  };
  
  // Map weather conditions to icons
  const getWeatherIcon = (condition: string, icon?: string): JSX.Element => {
    // Try to map based on the OpenWeatherMap icon code if available
    if (icon) {
      if (icon.includes('01')) return <Sun size={24} className="dark:text-yellow-400" />;
      if (icon.includes('02') || icon.includes('03') || icon.includes('04')) return <Cloud size={24} className="dark:text-gray-400" />;
      if (icon.includes('09') || icon.includes('10')) return <CloudRain size={24} className="dark:text-blue-400" />;
      if (icon.includes('11')) return <CloudLightning size={24} className="dark:text-purple-400" />;
      if (icon.includes('13')) return <CloudSnow size={24} className="dark:text-blue-200" />;
      if (icon.includes('50')) return <Wind size={24} className="dark:text-gray-500" />;
    }
    
    // Fallback mapping based on the condition text
    switch (condition.toLowerCase()) {
      case 'clear':
        return <Sun size={24} className="dark:text-yellow-400" />;
      case 'clouds':
        return <Cloud size={24} className="dark:text-gray-400" />;
      case 'rain':
      case 'drizzle':
        return <CloudRain size={24} className="dark:text-blue-400" />;
      case 'thunderstorm':
        return <CloudLightning size={24} className="dark:text-purple-400" />;
      case 'snow':
        return <CloudSnow size={24} className="dark:text-blue-200" />;
      case 'mist':
      case 'smoke':
      case 'haze':
      case 'dust':
      case 'fog':
        return <Wind size={24} className="dark:text-gray-500" />;
      default:
        return <SunDim size={24} className="dark:text-yellow-300" />;
    }
  };
  
  // Default view for 2x2 layout
  const renderDefaultView = () => {
    if (!weather) return (
      <div className="flex items-center justify-center flex-1">
        <div className="animate-pulse flex space-x-3 items-center text-gray-500 dark:text-gray-400">
          <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-700"></div>
          <div className="text-sm">Loading weather data...</div>
        </div>
      </div>
    );
    
    return (
      <div className="h-full flex flex-col items-center justify-center">
        <div className="text-center">
          <div className="mb-3 text-yellow-500 dark:text-yellow-400">
            {getWeatherIcon(weather.condition, weather.icon)}
          </div>
          <div className="text-4xl font-bold mb-2 text-gray-800 dark:text-gray-100">
            {formatTemperature(weather.temperature)}
          </div>
          <div className="text-sm font-medium text-gray-800 dark:text-gray-100">{weather.location}</div>
          <div className="text-xs text-gray-600 dark:text-gray-300 mt-2">
            {weather.description}
          </div>
        </div>
      </div>
    );
  };
  
  // Wide view for 3x2, 4x2 layouts
  const renderWideView = () => {
    if (!weather) return (
      <div className="flex items-center justify-center flex-1">
        <div className="animate-pulse flex space-x-3 items-center text-gray-500 dark:text-gray-400">
          <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-700"></div>
          <div className="text-sm">Loading weather data...</div>
        </div>
      </div>
    );
    
    return (
      <div className="flex flex-1">
        <div className="w-1/3 flex flex-col justify-center items-center pr-4">
          <div className="mb-3">
            {getWeatherIcon(weather.condition, weather.icon)}
          </div>
          <div className="text-3xl font-bold mb-2">
            {formatTemperature(weather.temperature)}
          </div>
          <div className="text-sm font-medium">{weather.location}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            {weather.description}
          </div>
        </div>
        
        <div className="w-2/3 border-l border-gray-200 dark:border-gray-700 pl-4">
          <div className="text-sm font-medium mb-3 text-gray-800 dark:text-gray-100">5-Day Forecast</div>
          <div className="grid grid-cols-5 gap-3 bg-gray-50 dark:bg-slate-700/50 p-3 rounded-lg shadow-sm dark:shadow-slate-900/20">
            {weather.forecast.map((day, i) => (
              <div key={i} className="text-center hover:bg-white dark:hover:bg-slate-700 rounded transition-colors p-1">
                <div className="text-xs mb-1 font-medium text-gray-700 dark:text-gray-300">{day.day}</div>
                <div className="text-center text-blue-500 dark:text-blue-400">
                  {getWeatherIcon(day.condition, day.icon)}
                </div>
                <div className="text-xs mt-1 font-medium text-gray-800 dark:text-gray-100">
                  {formatTemperature(day.temp.max)}
                </div>
              </div>
            ))}
          </div>
          
          <div className="flex justify-between mt-3 text-xs">
            <div className="px-3 py-1.5 bg-gray-50 dark:bg-slate-700/50 rounded-md text-gray-700 dark:text-gray-300 shadow-sm dark:shadow-slate-900/20">Humidity: <span className="font-medium text-gray-800 dark:text-gray-100">{weather.humidity}%</span></div>
            <div className="px-3 py-1.5 bg-gray-50 dark:bg-slate-700/50 rounded-md text-gray-700 dark:text-gray-300 shadow-sm dark:shadow-slate-900/20">Wind: <span className="font-medium text-gray-800 dark:text-gray-100">{weather.windSpeed}m/s</span></div>
          </div>
        </div>
      </div>
    );
  };
  
  // Tall view for 2x3, 2x4 layouts
  const renderTallView = () => {
    if (!weather) return (
      <div className="flex items-center justify-center flex-1">
        <div className="animate-pulse flex space-x-3 items-center text-gray-500 dark:text-gray-400">
          <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-700"></div>
          <div className="text-sm">Loading weather data...</div>
        </div>
      </div>
    );
    
    return (
      <div className="flex flex-col flex-1 space-y-4">
        <div className="flex-shrink-0 text-center">
          <div className="text-sm mb-2 font-medium text-gray-800 dark:text-gray-100">{weather.location}</div>
          <div className="flex justify-center mb-3 text-yellow-500 dark:text-yellow-400">
            {getWeatherIcon(weather.condition, weather.icon)}
          </div>
          <div className="text-4xl font-bold mb-2 text-gray-800 dark:text-gray-100">
            {formatTemperature(weather.temperature)}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-300">
            Feels like {formatTemperature(weather.feelsLike)}
          </div>
        </div>
        
        <div className="border-t border-gray-200 dark:border-gray-700 pt-3 flex-grow">
          <div className="text-xs font-medium mb-1">5-Day Forecast</div>
          <div className="space-y-3 overflow-y-auto pr-1" style={{ maxHeight: 'calc(100% - 24px)' }}>
            {weather.forecast.map((day, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="text-xs w-12">{day.day}</div>
                <div className="pl-1">
                  {getWeatherIcon(day.condition, day.icon)}
                </div>
                <div className="flex-grow pl-2">
                  <div className="text-xs">{day.description}</div>
                </div>
                <div className="text-xs font-medium">
                  {formatTemperature(day.temp.max)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };
  
  // Full view for 3x3, 4x4, etc
  const renderFullView = () => {
    if (!weather) return (
      <div className="flex items-center justify-center flex-1">
        <div className="animate-pulse flex space-x-3 items-center text-gray-500 dark:text-gray-400">
          <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-700"></div>
          <div className="text-sm">Loading weather data...</div>
        </div>
      </div>
    );
    
    return (
      <div className="h-full flex flex-col">
        <div className="flex justify-between items-center mb-3">
          <div>
            <div className="text-xl font-bold">{weather.location}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
            </div>
          </div>
          <div className="flex items-center">
            <div className="mr-4">
              {getWeatherIcon(weather.condition, weather.icon)}
            </div>
            <div>
              <div className="text-3xl font-bold">
                {formatTemperature(weather.temperature)}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {weather.description}
              </div>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Feels Like</div>
            <div className="text-xl font-medium">{formatTemperature(weather.feelsLike)}</div>
          </div>
          <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Humidity</div>
            <div className="text-xl font-medium">{weather.humidity}%</div>
          </div>
          <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Wind</div>
            <div className="text-xl font-medium">{weather.windSpeed} m/s</div>
          </div>
        </div>
        
        <div className="text-sm font-medium mb-3">5-Day Forecast</div>
        <div className="grid grid-cols-5 gap-3">
          {weather.forecast.map((day, i) => (
            <div key={i} className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg text-center">
              <div className="text-sm font-medium mb-1">{day.day}</div>
              <div className="flex justify-center my-2">
                {getWeatherIcon(day.condition, day.icon)}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{day.description}</div>
              <div className="text-sm">
                <span className="font-medium">{formatTemperature(day.temp.max)}</span>
                {' / '}
                <span>{formatTemperature(day.temp.min)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  // Render content based on widget size
  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-pulse rounded-full bg-gray-200 dark:bg-gray-700 h-12 w-12 mx-auto"></div>
            <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">Loading...</div>
          </div>
        </div>
      );
    }
    
    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-full">
          <div className="text-amber-500 mb-2">
            <Cloud size={40} />
          </div>
          <div className="text-center text-sm">
            <p className="mb-1 text-amber-500">{error}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {localConfig.apiKey ? 'Check your API key or network connection.' : 'Add an API key in settings.'}
            </p>
          </div>
        </div>
      );
    }

    // Check widget size and return appropriate view
    if (width >= 4 && height >= 4) {
      return renderFullView();
    } else if (width > 2 && height === 2) {
      return renderWideView();
    } else if (width === 2 && height > 2) {
      return renderTallView();
    } else {
      return renderDefaultView();
    }
  };
  
  // Settings modal content
  const renderSettingsContent = () => {
    return (
      <>
        <div className="mb-6">
          <label className="block text-sm mb-2 font-medium">Location</label>
          <input
            type="text"
            className="w-full p-2 bg-gray-100 dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600"
            placeholder="Enter city name"
            value={localConfig.location || ''}
            onChange={(e) => setLocalConfig({...localConfig, location: e.target.value})}
          />
        </div>
        
        <div className="mb-6">
          <label className="block text-sm mb-2 font-medium">API Key</label>
          <input
            type="text"
            className="w-full p-2 bg-gray-100 dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600"
            placeholder="OpenWeatherMap API Key"
            value={localConfig.apiKey || ''}
            onChange={(e) => setLocalConfig({...localConfig, apiKey: e.target.value})}
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Get a free API key from <a 
              href="https://openweathermap.org/api" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline"
            >
              OpenWeatherMap
            </a>
          </p>
        </div>
        
        <div className="mb-6">
          <label className="block text-sm mb-2 font-medium">Units</label>
          <div className="flex items-center space-x-4">
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
      </>
    );
  };
  
  // Settings modal footer with buttons
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
    );
  };
  
  return (
    <div className={`widget-container h-full flex flex-col ${isSettingsOpen ? 'modal-open' : ''}`}>
      <WidgetHeader
        title="Weather"
        onSettingsClick={() => setIsSettingsOpen(true)}
      />
      
      <div className="flex-1 overflow-hidden">
        {renderContent()}
      </div>
      
      {isSettingsOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsSettingsOpen(false)}
          title="Weather Settings"
          footer={renderSettingsFooter()}
          children={renderSettingsContent()}
        />
      )}
    </div>
  );
};

// Widget configuration for registration
export const weatherWidgetConfig: WidgetConfig = {
  type: 'weather',
  name: 'Weather',
  icon: 'Cloud',
  description: 'Display current weather and forecast',
  minWidth: 2,
  minHeight: 2,
  defaultWidth: 3,
  defaultHeight: 3,
  defaultSize: { w: 2, h: 2 },
  minSize: { w: 2, h: 2 },
  maxSize: { w: 6, h: 6 }
};

export default WeatherWidget;