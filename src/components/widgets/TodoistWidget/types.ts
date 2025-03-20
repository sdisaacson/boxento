import { WidgetProps } from '@/types';

/**
 * Represents a Todoist task
 */
export interface TodoistTask {
  id: string;
  content: string;
  completed: boolean;
  due?: {
    date: string;
    string: string;
  };
  priority: number;
  project_id: string;
  url: string;
}

/**
 * Configuration options for the Todoist widget
 */
export interface TodoistWidgetConfig {
  id?: string;
  apiToken?: string;
  projectId?: string;
  showCompleted?: boolean;
  maxTasks?: number;
  onUpdate?: (config: TodoistWidgetConfig) => void;
  onDelete?: () => void;
  [key: string]: unknown; // Add index signature for Record<string, unknown> compatibility
}

/**
 * Props for the Todoist widget component
 */
export type TodoistWidgetProps = WidgetProps<TodoistWidgetConfig>; 