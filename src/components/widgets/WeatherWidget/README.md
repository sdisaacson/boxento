# Weather Widget

A responsive widget that displays current weather conditions and forecasts for any location around the world. Powered by the Open-Meteo API, this widget provides accurate weather data without requiring an API key.

## Design Philosophy

The Weather Widget adheres to the following principles:

- **Accuracy**: Uses the Open-Meteo API, which aggregates data from various national weather services for reliable forecasts
- **Simplicity**: Clean interface focusing on the most important weather information
- **Adaptability**: Responsive design that displays different levels of detail based on widget size
- **Accessibility**: Weather information presented with both text and visual indicators

## Features

- **Current Weather**: Temperature, weather conditions, "feels like" temperature, humidity, and wind speed
- **Forecast**: 5-day weather forecast with daily high/low temperatures
- **Automatic Location Support**: Enter any city name to get weather information
- **Unit Switching**: Toggle between Celsius and Fahrenheit
- **Responsive Design**: Multiple views optimized for different widget sizes
- **Time Information**: Sunrise and sunset times
- **Visual Icons**: Weather conditions represented with intuitive icons
- **No API Key Required**: Uses the free Open-Meteo API that doesn't require registration

## Usage

1. Add the Weather Widget to your dashboard
2. Configure the widget with your preferred location and units
3. Resize the widget to see more or less detailed weather information

## Configuration Options

The Weather Widget offers these configuration options:

- **Location**: Any city name or location (e.g., "New York", "Tokyo", "Paris")
- **Temperature Units**: Choose between Celsius (°C) and Fahrenheit (°F)

## Responsive Views

The widget adapts to different sizes with varying levels of detail:

- **Minimal (2x2)**: Shows temperature, weather icon, and location
- **Compact (3x2)**: Adds humidity, wind speed, and feels-like temperature
- **Horizontal Forecast (4x2+)**: Adds a 5-day horizontal forecast
- **Vertical Forecast (2x3+)**: Adds a vertical forecast display
- **Detailed (4x4+)**: Complete weather information with extended forecast details

## Implementation Details

### API Integration

The widget uses the [Open-Meteo API](https://open-meteo.com/), which provides:

- Free access with no API key required
- Data from high-resolution weather models (1-11 km)
- Hourly and daily forecasts up to 16 days
- Current conditions and detailed weather parameters

The implementation includes:

1. **Geocoding API**: Converts location names to coordinates
2. **Forecast API**: Retrieves current weather and daily forecasts
3. **WMO Code Mapping**: Converts standard WMO weather codes to human-readable conditions

### Data Processing

The widget implements several utility functions:

- `mapWeatherCodeToCondition`: Maps WMO weather codes to simple condition names
- `mapWeatherCodeToDescription`: Provides detailed weather descriptions
- `getWeatherIcon`: Selects the appropriate icon based on weather conditions
- `formatTemperature`: Formats temperature values with the appropriate unit

### State Management

Weather data and configuration are maintained through React's state management:

- `weather`: Current weather data and forecast
- `loading`: Loading state during API requests
- `error`: Error state for failed requests
- `localConfig`: User configuration including location and units

## Technical Considerations

- The widget handles network errors gracefully with informative error messages
- Weather data is automatically refreshed when location or units change
- Multiple layouts are implemented to optimize information display at different sizes
- Mock data is provided as a fallback if the API request fails

## Attribution

Weather data provided by [Open-Meteo](https://open-meteo.com/), an open-source weather API. 