/**
 * Configuration Manager for Boxento widgets
 * 
 * Handles storing and retrieving widget configurations from localStorage,
 * providing a central point for managing persistent widget data
 */

import { encryptionUtils } from './encryption';

/**
 * Interface for the widget configuration store
 */
export interface WidgetConfigStore {
  [widgetId: string]: Record<string, unknown>;
}

/**
 * Default sensitive fields that should be encrypted
 */
const DEFAULT_SENSITIVE_FIELDS = ['apiKey', 'token', 'secret', 'password', 'key'];

/**
 * Configuration Manager
 * Provides methods to save, retrieve, and manage widget configurations
 */
export const configManager = {
  /**
   * Save a widget's configuration to localStorage
   * 
   * @param widgetId - Unique identifier for the widget
   * @param config - Configuration object to save
   * @param sensitiveFields - Optional array of field names that should be encrypted
   */
  saveWidgetConfig: (widgetId: string, config: Record<string, unknown>, sensitiveFields = DEFAULT_SENSITIVE_FIELDS): void => {
    const configs = configManager.getConfigs();
    
    // Process sensitive fields (like API keys) for encryption
    const processedConfig = encryptionUtils.processObjectForStorage(config, sensitiveFields);
    
    // Store in combined configuration object
    configs[widgetId] = processedConfig;
    localStorage.setItem('boxento-widget-configs', JSON.stringify(configs));
  },
  
  /**
   * Retrieve a widget's configuration from localStorage
   * 
   * @param widgetId - Unique identifier for the widget
   * @param sensitiveFields - Optional array of field names that should be decrypted
   * @returns The widget's configuration or null if not found
   */
  getWidgetConfig: (widgetId: string, sensitiveFields = DEFAULT_SENSITIVE_FIELDS): Record<string, unknown> | null => {
    const configs = configManager.getConfigs();
    const config = configs[widgetId] || null;
    
    if (!config) return null;
    
    // Process and decrypt any sensitive fields
    return encryptionUtils.processObjectFromStorage(config, sensitiveFields);
  },
  
  /**
   * Get all stored widget configurations
   * 
   * @param decryptSensitiveFields - Whether to decrypt sensitive fields in all configs
   * @returns Object containing all widget configurations
   */
  getConfigs: (decryptSensitiveFields = false): WidgetConfigStore => {
    try {
      const stored = localStorage.getItem('boxento-widget-configs');
      const configs = stored ? JSON.parse(stored) : {};
      
      if (!decryptSensitiveFields) return configs;
      
      // Decrypt sensitive fields if requested
      const decryptedConfigs: WidgetConfigStore = {};
      
      Object.keys(configs).forEach(widgetId => {
        decryptedConfigs[widgetId] = encryptionUtils.processObjectFromStorage(
          configs[widgetId], 
          DEFAULT_SENSITIVE_FIELDS
        );
      });
      
      return decryptedConfigs;
    } catch (e) {
      console.error('Error loading widget configurations', e);
      return {};
    }
  },
  
  /**
   * Clear a widget's configuration from storage
   * 
   * @param widgetId - Unique identifier for the widget to clear
   */
  clearConfig: (widgetId: string): void => {
    const configs = configManager.getConfigs();
    delete configs[widgetId];
    localStorage.setItem('boxento-widget-configs', JSON.stringify(configs));
  },
  
  /**
   * Clear all widget configurations from storage
   */
  clearAllConfigs: (): void => {
    localStorage.removeItem('boxento-widget-configs');
  }
};