# Currency Converter Widget

A widget that allows users to convert between different currencies using the Open Exchange Rates API.

## Features

- Convert between various currencies in real-time
- Customizable base currency
- Select multiple target currencies to display
- Auto-refresh rates at configurable intervals
- Responsive design that adapts to different widget sizes

## Configuration

The widget can be configured with the following settings:

- **Widget Title**: Customize the display name of the widget
- **API Key**: Your Open Exchange Rates API key
- **Base Currency**: The currency to convert from (default: USD)
- **Target Currencies**: Currencies to display conversions for
- **Auto Refresh**: Toggle automatic refresh of exchange rates
- **Refresh Interval**: How often to refresh rates (in minutes)

## Views

The widget provides different views based on its size:

- **Default (2x2)**: Basic conversion between base currency and one target currency
- **Wide (4x2)**: Shows multiple target currencies in a row
- **Tall (2x4)**: Shows multiple target currencies in a column
- **Large (4x4+)**: Full-featured view with multiple conversions and historical rates

## API Usage

This widget uses the [Open Exchange Rates API](https://openexchangerates.org/) to fetch current exchange rates. You'll need to:

1. Sign up for an account at [openexchangerates.org](https://openexchangerates.org/)
2. Get your API key
3. Enter the API key in the widget settings

## Implementation Notes

- The widget caches exchange rates to minimize API calls
- Free tier of Open Exchange Rates allows 1,000 API calls per month
- Rate limits are handled gracefully with appropriate user feedback 