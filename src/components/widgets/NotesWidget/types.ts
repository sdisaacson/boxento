import { WidgetProps } from '@/types';

/**
 * Configuration options for the Notes widget
 * 
 * @interface NotesWidgetConfig
 * @property {string} [id] - Unique identifier for the widget instance
 * @property {string} [content] - The content of the notes
 * @property {string} [title] - Optional title for the notes
 * @property {string} [fontFamily] - Font family for the notes
 * @property {number} [fontSize] - Font size for the notes
 * @property {number} [lineHeight] - Height of each line in pixels
 * @property {string} [lineColor] - Color of the horizontal lines
 * @property {string} [paperColor] - Background color for the note paper in light mode
 * @property {string} [darkPaperColor] - Background color for the note paper in dark mode
 */
export interface NotesWidgetConfig {
  id?: string;
  content?: string;
  title?: string;
  fontFamily?: string;
  fontSize?: number;
  lineHeight?: number;
  lineColor?: string;
  paperColor?: string;
  darkPaperColor?: string;
  onUpdate?: (config: NotesWidgetConfig) => void;
  onDelete?: () => void;
}

/**
 * Props for the Notes widget component
 * 
 * @type NotesWidgetProps
 */
export type NotesWidgetProps = WidgetProps<NotesWidgetConfig>; 