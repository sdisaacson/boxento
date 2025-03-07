import { WidgetProps } from '@/types';

/**
 * Forecast data for a single day
 * 
 * @interface ForecastDay
 * @property {string} day - Day name (e.g., "Monday")
 * @property {object} temp - Temperature range
 * @property {number} temp.min - Minimum temperature
 * @property {number} temp.max - Maximum temperature
 * @property {string} condition - Weather condition
 * @property {string} description - Detailed weather description
 * @property {string} icon - Icon code for the weather condition
 */
export interface ForecastDay {
  day: string;
  temp: {
    min: number;
    max: number;
  };
  condition: string;
  description: string;
  icon: string;
}

/**
 * Weather data structure
 * 
 * @interface WeatherData
 * @property {string} location - Name of the location
 * @property {number} temperature - Current temperature
 * @property {number} feelsLike - "Feels like" temperature
 * @property {string} condition - Weather condition (e.g., "Clear", "Cloudy")
 * @property {string} description - Detailed weather description
 * @property {string} icon - Icon code for the weather condition
 * @property {number} humidity - Humidity percentage
 * @property {number} windSpeed - Wind speed
 * @property {number} windDirection - Wind direction in degrees
 * @property {number} sunrise - Sunrise time in Unix timestamp
 * @property {number} sunset - Sunset time in Unix timestamp
 * @property {ForecastDay[]} forecast - Array of forecast days
 */
export interface WeatherData {
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

/**
 * Configuration options for the Weather widget
 * 
 * @interface WeatherWidgetConfig
 * @property {string} [id] - Unique identifier for the widget instance
 * @property {string} [location] - Location for weather data
 * @property {'celsius' | 'fahrenheit'} [unit] - Temperature unit
 * @property {string} [units] - Units system ('metric' or 'imperial')
 * @property {string} [apiKey] - API key for weather service
 * @property {WeatherData} [weatherData] - Weather data
 * @property {() => void} [onDelete] - Callback to delete the widget
 * @property {(config: WeatherWidgetConfig) => void} [onUpdate] - Callback to update widget configuration
 */
export interface WeatherWidgetConfig {
  id?: string;
  location?: string;
  unit?: 'celsius' | 'fahrenheit';
  units?: string;
  apiKey?: string;
  weatherData?: WeatherData;
  onDelete?: () => void;
  onUpdate?: (config: WeatherWidgetConfig) => void;
}

/**
 * Props for the Weather widget component
 * 
 * @type WeatherWidgetProps
 */
export type WeatherWidgetProps = WidgetProps<WeatherWidgetConfig>; 