import { WidgetProps } from '@/types';

/**
 * Configuration options for the Pomodoro widget
 * 
 * @interface PomodoroWidgetConfig
 * @property {string} [id] - Unique identifier for the widget instance
 * @property {string} [title] - Title to display in the widget header
 * @property {number} [workDuration] - Focus time duration in minutes
 * @property {number} [breakDuration] - Short break duration in minutes
 * @property {number} [longBreakDuration] - Long break duration in minutes
 * @property {number} [cyclesBeforeLongBreak] - Number of focus time cycles before a long break
 */
export interface PomodoroWidgetConfig {
  id?: string;
  title?: string;
  workDuration?: number;
  breakDuration?: number;
  longBreakDuration?: number;
  cyclesBeforeLongBreak?: number;
  onUpdate?: (config: PomodoroWidgetConfig) => void;
  onDelete?: () => void;
}

/**
 * Props for the Pomodoro widget component
 * 
 * @type PomodoroWidgetProps
 */
export type PomodoroWidgetProps = WidgetProps<PomodoroWidgetConfig>; 