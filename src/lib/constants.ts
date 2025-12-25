/**
 * Application-wide constants
 * Centralizes magic numbers and configuration values for better maintainability.
 */

// Timing constants (in milliseconds)
export const TIMING = {
  /** Debounce delay for saving widgets/layouts to Firestore */
  SAVE_DEBOUNCE_MS: 500,
  /** Interval for updating favicon with current time */
  FAVICON_UPDATE_INTERVAL_MS: 60000,
  /** Animation duration for widget removal */
  WIDGET_REMOVE_ANIMATION_MS: 500,
  /** Delay before showing loading state */
  LOADING_DELAY_MS: 150,
  /** Interval for credential sync polling */
  CREDENTIAL_SYNC_INTERVAL_MS: 2000,
} as const;

// Grid layout constants
export const GRID = {
  /** Number of columns for large screens */
  COLS_LG: 12,
  /** Number of columns for medium screens */
  COLS_MD: 10,
  /** Number of columns for small screens */
  COLS_SM: 6,
  /** Number of columns for extra small screens */
  COLS_XS: 4,
  /** Number of columns for extra extra small screens */
  COLS_XXS: 2,
  /** Default minimum widget width */
  MIN_WIDGET_WIDTH: 2,
  /** Default minimum widget height */
  MIN_WIDGET_HEIGHT: 2,
  /** Container padding in pixels */
  CONTAINER_PADDING: 20,
  /** Margin between grid items in pixels */
  ITEM_MARGIN: 10,
} as const;

// Breakpoints for responsive layout (in pixels)
export const BREAKPOINTS = {
  lg: 1200,
  md: 996,
  sm: 768,
  xs: 480,
  xxs: 0,
} as const;

// Column counts for each breakpoint
export const COLS = {
  lg: 12,
  md: 10,
  sm: 6,
  xs: 4,
  xxs: 2,
} as const;

// Storage keys
export const STORAGE_KEYS = {
  WIDGETS: 'boxento-widgets',
  LAYOUTS: 'boxento-layouts',
  WIDGET_CONFIGS: 'boxento-widget-configs',
  APP_SETTINGS: 'boxento-app-settings',
  DEVICE_KEY: 'boxento-device-key',
} as const;
