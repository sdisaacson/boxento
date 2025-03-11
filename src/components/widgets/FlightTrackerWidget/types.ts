import { WidgetProps } from '@/types';

/**
 * Configuration options for the Flight Tracker widget
 * 
 * @interface FlightTrackerWidgetConfig
 * @property {string} [id] - Unique identifier for the widget instance
 * @property {string} [title] - Title to display in the widget header
 * @property {string} [accessKey] - AviationStack API access key
 * @property {string} [flightNumber] - Combined flight number (e.g., "AA123" or "AXB744")
 * @property {string} [flightDate] - Flight date in YYYY-MM-DD format
 * @property {string} [airline] - Optional airline code to filter results
 * @property {number} [refreshInterval] - Automatic refresh interval in milliseconds
 * @property {string} [accentColor] - UI accent color theme
 * 
 * @property {string} [_airlineCode] - Internal use: extracted airline code from flightNumber (IATA or ICAO)
 * @property {string} [_flightNumberOnly] - Internal use: extracted numeric part from flightNumber
 * @property {boolean} [_isIcao] - Internal use: whether the airline code is ICAO (3 letters) or IATA (2 letters)
 */
export interface FlightTrackerWidgetConfig {
  id?: string;
  title?: string;
  accessKey?: string;
  flightNumber?: string;
  flightDate?: string;
  airline?: string;
  refreshInterval?: number;
  accentColor?: string;
  
  // Internal properties used after parsing the combined flight number
  _airlineCode?: string;
  _flightNumberOnly?: string;
  _isIcao?: boolean;
  
  onUpdate?: (config: FlightTrackerWidgetConfig) => void;
  onDelete?: () => void;
  [key: string]: unknown; // Index signature to satisfy Record<string, unknown>
}

/**
 * Props for the Flight Tracker widget component
 * 
 * @type FlightTrackerWidgetProps
 */
export type FlightTrackerWidgetProps = WidgetProps<FlightTrackerWidgetConfig>; 

/**
 * AviationStack API Response interfaces
 */
export interface AviationStackResponse {
  pagination?: {
    limit: number;
    offset: number;
    count: number;
    total: number;
  };
  data?: AviationStackFlight[];
  error?: {
    code: number;
    type: string;
    info: string;
  };
}

export interface AviationStackFlight {
  flight_date: string;
  flight_status: string;
  departure: AviationStackAirport;
  arrival: AviationStackAirport;
  airline: AviationStackAirline;
  flight: {
    number: string;
    iata: string;
    icao: string;
  };
  aircraft?: {
    registration: string;
    iata: string;
    icao: string;
    icao24: string;
  };
  live?: {
    updated: string;
    latitude: number;
    longitude: number;
    altitude: number;
    direction: number;
    speed_horizontal: number;
    speed_vertical: number;
    is_ground: boolean;
  };
}

export interface AviationStackAirport {
  airport: string;
  timezone: string;
  iata: string;
  icao: string;
  terminal?: string;
  gate?: string;
  delay?: number;
  scheduled: string;
  estimated: string;
  actual?: string | null;
  estimated_runway?: string;
  actual_runway?: string | null;
}

export interface AviationStackAirline {
  name: string;
  iata: string;
  icao: string;
}

// Keep the old interfaces for backwards compatibility until the migration is complete
export interface AmadeusAuthResponse {
  type: string;
  username: string;
  application_name: string;
  client_id: string;
  token_type: string;
  access_token: string;
  expires_in: number;
  state: string;
  scope: string;
}

export interface AmadeusApiResponse {
  meta: {
    count: number;
    links: {
      self: string;
    }
  };
  data: DatedFlight[];
}

export interface DatedFlight {
  type: string;
  scheduledDepartureDate: string;
  flightDesignator: {
    carrierCode: string;
    flightNumber: number;
    operationalSuffix?: string;
  };
  flightPoints: FlightPoint[];
  segments: Segment[];
  legs: Leg[];
}

export interface FlightPoint {
  iataCode: string;
  departure?: {
    timings: Timing[];
  };
  arrival?: {
    timings: Timing[];
  };
  terminal?: {
    code: string;
  };
}

export interface Timing {
  qualifier: string; // STD (Scheduled Time Departure), STA (Scheduled Time Arrival), etc.
  value: string; // ISO 8601 date-time
  delays?: {
    duration: string;
  };
}

export interface Segment {
  boardPointIataCode: string;
  offPointIataCode: string;
  scheduledSegmentDuration: string; // ISO 8601 duration format (e.g., PT2H5M = 2 hours 5 minutes)
}

export interface Leg {
  boardPointIataCode: string;
  offPointIataCode: string;
  aircraftEquipment: {
    aircraftType: string;
  };
  scheduledLegDuration: string; // ISO 8601 duration format
} 