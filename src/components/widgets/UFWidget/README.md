# UF Widget (Chile)

This widget displays the current value of UF (Unidad de Fomento) in Chilean Pesos using data from the public mindicador.cl API.

## What is UF?

The Unidad de Fomento (UF) is a unit of account used in Chile. The exchange rate between the UF and the Chilean peso is constantly adjusted for inflation. It was created for the use in determining principal and interest in international secured loans for development, but its use has now expanded to all types of bank loans, private and public.

## Features

- Displays the current UF value in Chilean Pesos
- Automatically refreshes data at configurable intervals
- Supports responsive layouts for different widget sizes
- Optional historical data display
- Light and dark theme support

## Usage

Add the UF Widget to your dashboard to monitor the current value of UF in Chilean Pesos. The widget will automatically fetch the latest data from mindicador.cl API.

## Settings

The widget provides the following configurable options:

- **Widget Title**: Customize the title displayed in the widget header
- **Show Historical Data**: Toggle to show or hide historical UF values
- **Refresh Interval**: Set how often (in minutes) the widget should refresh data

## Responsive Sizing

The widget adapts to different sizes:

- **2x2 (Small)**: Shows the current UF value and date
- **3x2 (Wide Small)**: Adds an update button and last updated time
- **2x3 (Tall Small)**: Vertical layout with update button
- **3x3 (Medium)**: Adds historical data if enabled
- **4x3 (Wide Medium)**: Expanded historical data in a grid
- **3x4 (Tall Medium)**: More historical data in a vertical layout
- **4x4+ (Large)**: Full view with expanded data and styling

## Data Source

This widget uses the public API from [mindicador.cl](https://mindicador.cl/), specifically the UF endpoint. The API provides the current UF value and historical data.

## Development Notes

The widget follows all the standard design patterns and requirements outlined in the [Widget Development Guide](../../../docs/WIDGET_DEVELOPMENT.md), including:

- Standard widget structure with proper container classes
- Responsive layout handling
- Settings dialog with proper form handling and delete button
- TypeScript types and documentation
- Light and dark theme support 