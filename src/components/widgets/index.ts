import React from 'react';
import { WidgetConfig, WidgetProps } from '@/types';

// Widget Components
import CalendarWidget from './CalendarWidget/index';
import WeatherWidget from './WeatherWidget/index';
import WorldClocksWidget from './WorldClocksWidget/index';
import QuickLinksWidget from './QuickLinksWidget/index';
import NotesWidget from './NotesWidget/index';
import TodoWidget from './TodoWidget/index';
import PomodoroWidget from './PomodoroWidget/index';
import CurrencyConverterWidget from './CurrencyConverterWidget/index';
import ReadwiseWidget from './ReadwiseWidget/index';
import UFWidget from './UFWidget/index';
import YouTubeWidget from './YouTubeWidget/index';
// Import TemplateWidget (commented as it's not for production use)
// import TemplateWidget from './TemplateWidget/index';

// Export widget types
export * from './CalendarWidget/types';
export * from './WeatherWidget/types';
export * from './WorldClocksWidget/types';
export * from './QuickLinksWidget/types';
export * from './NotesWidget/types';
export * from './TodoWidget/types';
export * from './PomodoroWidget/types';
export * from './CurrencyConverterWidget/types';
export * from './ReadwiseWidget/types';
export * from './UFWidget/types';
export * from './YouTubeWidget/types';
// Export TemplateWidget types (commented as it's not for production use)
// export * from './TemplateWidget/types';

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
    defaultWidth: 2,
    defaultHeight: 2,
    category: 'Productivity',
    description: 'Display your upcoming events and appointments'
  },
  {
    type: 'weather',
    name: 'Weather',
    icon: 'Cloud',
    minWidth: 2,
    minHeight: 2,
    defaultWidth: 2,
    defaultHeight: 2,
    category: 'Information',
    description: 'Display current weather and forecast'
  },
  {
    type: 'world-clocks',
    name: 'World Clocks',
    icon: 'Clock',
    minWidth: 2, 
    minHeight: 2,
    defaultWidth: 2,
    defaultHeight: 2,
    category: 'Information',
    description: 'Display time across different timezones'
  },
  {
    type: 'quick-links',
    name: 'Quick Links',
    icon: 'Link',
    minWidth: 2,
    minHeight: 2,
    defaultWidth: 2,
    defaultHeight: 2,
    category: 'Productivity',
    description: 'Save and quickly access your favorite links'
  },
  {
    type: 'notes',
    name: 'Notes',
    icon: 'StickyNote',
    minWidth: 2,
    minHeight: 2,
    defaultWidth: 2,
    defaultHeight: 2,
    category: 'Productivity',
    description: 'Take and save quick notes'
  },
  {
    type: 'todo',
    name: 'Todo List',
    icon: 'CheckSquare',
    minWidth: 2,
    minHeight: 2,
    defaultWidth: 2,
    defaultHeight: 2,
    category: 'Productivity',
    description: 'Manage your tasks and to-dos'
  },
  {
    type: 'pomodoro',
    name: 'Pomodoro Timer',
    icon: 'Timer',
    minWidth: 2,
    minHeight: 2,
    defaultWidth: 2,
    defaultHeight: 2,
    category: 'Productivity',
    description: 'Time management with the Pomodoro Technique'
  },
  {
    type: 'currency-converter',
    name: 'Currency Converter',
    icon: 'DollarSign',
    minWidth: 2,
    minHeight: 2,
    defaultWidth: 2,
    defaultHeight: 2,
    category: 'Finance',
    description: 'Convert between currencies using live exchange rates'
  },
  {
    type: 'readwise',
    name: 'Readwise Highlights',
    icon: 'BookOpen',
    minWidth: 2,
    minHeight: 2,
    defaultWidth: 2,
    defaultHeight: 3,
    category: 'Information',
    description: 'Display highlights from your Readwise account'
  },
  {
    type: 'uf-chile',
    name: 'UF (Chile)',
    icon: 'DollarSign',
    minWidth: 2,
    minHeight: 2,
    defaultWidth: 2,
    defaultHeight: 2,
    category: 'Finance',
    description: 'Display the value of UF in Chilean Pesos'
  },
  {
    type: 'youtube',
    name: 'YouTube Video',
    icon: 'Video',
    minWidth: 2,
    minHeight: 2,
    defaultWidth: 2,
    defaultHeight: 2,
    category: 'Entertainment',
    description: 'Watch YouTube videos directly on your dashboard'
  }
];

// Widget categories
export const WIDGET_CATEGORIES = [
  { id: 'productivity', name: 'Productivity' },
  { id: 'information', name: 'Information' },
  { id: 'social', name: 'Social' },
  { id: 'utilities', name: 'Utilities' },
  { id: 'finance', name: 'Finance' },
  { id: 'entertainment', name: 'Entertainment' }
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
    case 'notes':
      return NotesWidget;
    case 'todo':
      return TodoWidget;
    case 'pomodoro':
      return PomodoroWidget;
    case 'currency-converter':
      return CurrencyConverterWidget;
    case 'readwise':
      return ReadwiseWidget;
    case 'uf-chile':
      return UFWidget;
    case 'youtube':
      return YouTubeWidget;
    // Template widget registration (commented as it's not for production use)
    // case 'template':
    //   return TemplateWidget;
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