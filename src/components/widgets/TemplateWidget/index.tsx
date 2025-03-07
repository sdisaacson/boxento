import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '../../ui/dialog';
import { Settings } from 'lucide-react';
import WidgetHeader from '../common/WidgetHeader';
import { WidgetProps } from '@/types';

// Define types inline since there's an issue with importing them
interface TemplateWidgetConfig {
  id?: string;
  title?: string;
  onUpdate?: (config: TemplateWidgetConfig) => void;
  onDelete?: () => void;
}

type TemplateWidgetProps = WidgetProps<TemplateWidgetConfig>;

/**
 * Template Widget Component
 * 
 * This is a template for creating new widgets in Boxento.
 * It follows all the required design patterns and structure.
 * 
 * @param {TemplateWidgetProps} props - Component props
 * @returns {JSX.Element} Widget component
 */
const TemplateWidget: React.FC<TemplateWidgetProps> = ({ width, height, config }) => {
  // Default configuration
  const defaultConfig: TemplateWidgetConfig = {
    title: 'Template Widget',
    // Add more default config properties here
  };

  // Component state
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [localConfig, setLocalConfig] = useState<TemplateWidgetConfig>({
    ...defaultConfig,
    ...config
  });
  
  // Ref for the widget container
  const widgetRef = useRef<HTMLDivElement | null>(null);
  
  // Update local config when props config changes
  useEffect(() => {
    setLocalConfig((prevConfig: TemplateWidgetConfig) => ({
      ...prevConfig,
      ...config
    }));
  }, [config]);
  
  // Render content based on widget size
  const renderContent = () => {
    // Adapt content based on widget dimensions
    if (width >= 4 && height >= 4) {
      return renderLargeView();
    } else if (width >= 4) {
      return renderWideView();
    } else if (height >= 4) {
      return renderTallView();
    } else {
      return renderDefaultView();
    }
  };
  
  // Default view (2x2)
  const renderDefaultView = () => {
    return (
      <div className="flex items-center justify-center h-full">
        <p>Default View (2x2)</p>
      </div>
    );
  };
  
  // Wide view (4x2 or larger width)
  const renderWideView = () => {
    return (
      <div className="flex items-center justify-center h-full">
        <p>Wide View (4x2 or larger width)</p>
      </div>
    );
  };
  
  // Tall view (2x4 or larger height)
  const renderTallView = () => {
    return (
      <div className="flex items-center justify-center h-full">
        <p>Tall View (2x4 or larger height)</p>
      </div>
    );
  };
  
  // Large view (4x4 or larger)
  const renderLargeView = () => {
    return (
      <div className="flex items-center justify-center h-full">
        <p>Large View (4x4 or larger)</p>
      </div>
    );
  };
  
  // Save settings
  const saveSettings = () => {
    if (config?.onUpdate) {
      config.onUpdate(localConfig);
    }
    setShowSettings(false);
  };
  
  // Settings dialog
  const renderSettings = () => {
    return (
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Template Widget Settings</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            {/* Title setting */}
            <div>
              <label htmlFor="title-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Widget Title
              </label>
              <input
                id="title-input"
                type="text"
                value={localConfig.title || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                  setLocalConfig({...localConfig, title: e.target.value})
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            {/* Add more settings fields here */}
          </div>
          
          <DialogFooter>
            {config?.onDelete && (
              <button
                className="px-4 py-2 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 border border-transparent hover:border-red-200 dark:hover:border-red-800 rounded-lg text-sm font-medium transition-colors"
                onClick={() => {
                  if (config.onDelete) {
                    config.onDelete();
                  }
                }}
                aria-label="Delete this widget"
              >
                Delete Widget
              </button>
            )}
            <button
              type="button"
              onClick={saveSettings}
              className="ml-2 py-2 px-4 rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Save
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  // Main render
  return (
    <div ref={widgetRef} className="widget-container h-full flex flex-col">
      <WidgetHeader 
        title={localConfig.title || defaultConfig.title} 
        onSettingsClick={() => setShowSettings(true)}
      />
      
      <div className="flex-grow p-4 overflow-hidden">
        {renderContent()}
      </div>
      
      {renderSettings()}
    </div>
  );
};

export default TemplateWidget; 