import { ReactNode } from 'react';
import { Layout } from 'react-grid-layout';

// Widget related types
export interface WidgetConfig {
  type: string;
  minWidth: number;
  minHeight: number;
  defaultWidth: number;
  defaultHeight: number;
  name: string;
  icon: string;
  category?: string;
  description?: string;
  defaultSize?: { w: number, h: number };
  minSize?: { w: number, h: number };
  maxSize?: { w: number, h: number };
}

export interface WidgetProps<T = any> {
  width: number;
  height: number;
  config?: T;
}

// Calendar widget types
export interface CalendarEvent {
  id?: number;
  title: string;
  start?: Date | string;
  end?: Date | string;
  allDay?: boolean;
  location?: string;
  description?: string;
  color?: string;
  time?: string;
}

export interface CalendarWidgetConfig {
  id?: string;
  events?: CalendarEvent[];
  defaultView?: 'day' | 'week' | 'month';
  startDay?: 'sunday' | 'monday';
  showWeekNumbers?: boolean;
}

// Weather widget types
export interface WeatherData {
  location: string;
  current: {
    temp: number;
    feelsLike: number;
    humidity: number;
    windSpeed: number;
    condition: string;
    icon: string;
  };
  forecast: Array<{
    date: string;
    high: number;
    low: number;
    condition: string;
    icon: string;
    precipitation: number;
  }>;
}

export interface WeatherWidgetConfig {
  id?: string;
  location?: string;
  unit?: 'celsius' | 'fahrenheit';
  units?: string;
  apiKey?: string;
  weatherData?: WeatherData;
}

// World clocks widget types
export interface TimezoneItem {
  id?: number;
  name?: string;
  timezone: string;
}

export interface WorldClocksWidgetConfig {
  id?: string;
  timezones?: TimezoneItem[];
}

// Quick links widget types
export interface LinkItem {
  id: number;
  title: string;
  url: string;
  color: string;
}

export interface QuickLinksWidgetConfig {
  id?: string;
  links?: LinkItem[];
}

// UI component types
export interface WidgetHeaderProps {
  title?: string;
  icon?: ReactNode;
  onSettingsClick?: () => void;
  children?: ReactNode;
}

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

export interface WidgetSize {
  w: number;
  h: number;
}

export interface Widget {
  id: string;
  type: string;
  config: Record<string, any>;
}

export type LayoutItem = Layout;