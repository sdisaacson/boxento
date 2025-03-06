import React from 'react';
import { WidgetConfig, WidgetProps } from '@/types';

// Widget Components
import CalendarWidget from './CalendarWidget/index';
import WeatherWidget from './WeatherWidget/index';
import WorldClocksWidget from './WorldClocksWidget/index';
import QuickLinksWidget from './QuickLinksWidget/index';

// Export widget types
export * from './CalendarWidget/types';
export * from './WeatherWidget/types';
export * from './WorldClocksWidget/types';
export * from './QuickLinksWidget/types';

// Enhanced Widget Config
export interface EnhancedWidgetConfig extends WidgetConfig {
  category: string;
  description: string;
}

// Widget registry with enhanced metadata
export const WIDGET_REGISTRY: EnhancedWidgetConfig[] = [
  {
    type: 'calendar',
    name: 'Calendar',
    icon: 'Calendar',
    minWidth: 2,
    minHeight: 2,
    defaultWidth: 3,
    defaultHeight: 3,
    category: 'Productivity',
    description: 'Display your upcoming events and appointments'
  },
  {
    type: 'weather',
    name: 'Weather',
    icon: 'Cloud',
    minWidth: 1,
    minHeight: 1,
    defaultWidth: 2,
    defaultHeight: 2,
    category: 'Information',
    description: 'Display current weather and forecast'
  },
  {
    type: 'world-clocks',
    name: 'World Clocks',
    icon: 'Clock',
    minWidth: 1, 
    minHeight: 1,
    defaultWidth: 2,
    defaultHeight: 2,
    category: 'Information',
    description: 'Display time across different timezones'
  },
  {
    type: 'quick-links',
    name: 'Quick Links',
    icon: 'Link',
    minWidth: 1,
    minHeight: 1,
    defaultWidth: 2,
    defaultHeight: 2,
    category: 'Productivity',
    description: 'Save and quickly access your favorite links'
  }
];

// Widget categories
export const WIDGET_CATEGORIES = [
  { id: 'productivity', name: 'Productivity' },
  { id: 'information', name: 'Information' },
  { id: 'social', name: 'Social' },
  { id: 'utilities', name: 'Utilities' }
];

/**
 * Get widget component by type
 */
export const getWidgetComponent = (type: string): React.ComponentType<WidgetProps<any>> | null => {
  switch (type) {
    case 'calendar':
      return CalendarWidget;
    case 'weather':
      return WeatherWidget;
    case 'world-clocks':
      return WorldClocksWidget;
    case 'quick-links':
      return QuickLinksWidget;
    default:
      return null;
  }
};

/**
 * Get widget configuration by type
 */
export const getWidgetConfigByType = (type: string): EnhancedWidgetConfig | undefined => {
  return WIDGET_REGISTRY.find(widget => widget.type === type);
};