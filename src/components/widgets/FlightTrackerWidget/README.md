# Flight Tracker Widget

The Flight Tracker Widget allows you to track flights in real-time using the AviationStack API. It displays essential flight information including departure and arrival details, flight status, and scheduling data.

## Features

- Real-time flight tracking
- Display flight departure and arrival information
- Show aircraft type and flight status
- Support for both IATA and ICAO flight number formats
- Responsive layout that adapts to different widget sizes
- Live flight data for flights in the air (altitude, speed, direction)
- Demo flights for testing without API calls

## API Key Requirement

This widget requires an AviationStack API access key to function. The widget is pre-configured with a free tier API key, but you should register for your own free account at [aviationstack.com](https://aviationstack.com) to get a personal API key.

## Usage

1. Add the Flight Tracker widget to your dashboard
2. Click the settings icon to configure the widget
3. Enter your AviationStack API access key (or use the default one)
4. Enter the following flight details:
   - Flight Number (e.g., AA123 for IATA or AXB744 for ICAO format)
   - Flight Date (defaults to today)
   - Optional: Airline code to filter results
5. Save your settings

## Demo Flights

If you're having trouble connecting to the API or want to test the widget without using API calls, you can use one of the following demo flights:

| Flight Code | Airline | Route |
|-------------|---------|-------|
| ASH6040 | Air Shuttle (Mesa Airlines) | JFK → ORD |
| UAL123 | United Airlines | SFO → DEN |
| AAL456 | American Airlines | DFW → MIA |
| DAL789 | Delta Air Lines | ATL → LAX |

These demo flights will work even without an internet connection or valid API key.

## Settings

| Setting | Description |
|---------|-------------|
| Widget Title | Custom title for the widget |
| API Access Key | Your AviationStack API access key |
| Flight Number | Combined airline code and flight number (can use IATA or ICAO) |
| Flight Date | Filter for specific flight date in YYYY-MM-DD format |
| Airline Code | Optional 2-letter IATA code or 3-letter ICAO code to filter results |

## Flight Number Format

The widget supports two flight number formats:

### IATA Format
- First 2 characters are letters representing the airline's IATA code (e.g., AA, BA, UA)
- Followed by 1-4 digits representing the flight number (e.g., 123, 456, 78)

Examples of valid IATA flight numbers:
- AA123 (American Airlines flight 123)
- BA456 (British Airways flight 456)
- UA789 (United Airlines flight 789)

### ICAO Format
- First 3 characters are letters representing the airline's ICAO code (e.g., AXB, UAE, DAL)
- Followed by 1-4 digits representing the flight number (e.g., 744, 123)

Examples of valid ICAO flight numbers:
- AXB744 (Air India Express flight 744)
- UAE123 (Emirates flight 123)
- DAL456 (Delta Airlines flight 456)

## Responsive Sizing

The widget adapts to different sizes:

- **2x2 (Small)**: Basic flight information in a compact format
- **Larger sizes**: More detailed flight information with additional data

## Data Refresh

The widget shows real-time information for the configured flight. You can manually refresh the data using the refresh button in the top-right corner of the widget.

## Free Tier API Limitations

The free tier of AviationStack API has the following limitations:
- 100 monthly API calls
- No dedicated support
- Limited to personal use
- Full access to aviation data and real-time flights
- HTTPS encryption included

For production use or more data, consider upgrading to a paid plan on AviationStack. 