import { WidgetProps } from '@/types';

/**
 * Configuration options for the GitHub Streak widget
 * 
 * @interface GitHubStreakWidgetConfig
 * @property {string} [id] - Unique identifier for the widget instance
 * @property {string} [title] - Title to display in the widget header
 * @property {string} [username] - GitHub username to track contributions for
 * @property {boolean} [showContributionGraph] - Whether to display the contribution graph
 * @property {number} [daysToShow] - Number of past days to display in the graph
 */
export interface GitHubStreakWidgetConfig {
  id?: string;
  title?: string;
  username?: string;
  showContributionGraph?: boolean;
  daysToShow?: number;
  onUpdate?: (config: GitHubStreakWidgetConfig) => void;
  onDelete?: () => void;
  [key: string]: unknown; // Index signature to satisfy Record<string, unknown>
}

/**
 * Props for the GitHub Streak widget component
 * 
 * @type GitHubStreakWidgetProps
 */
export type GitHubStreakWidgetProps = WidgetProps<GitHubStreakWidgetConfig>; 