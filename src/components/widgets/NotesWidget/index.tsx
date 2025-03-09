import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '../../ui/dialog';
import WidgetHeader from '../common/WidgetHeader';
import { NotesWidgetProps, NotesWidgetConfig } from './types';
import './styles.css';

/**
 * Notes Widget Component
 * 
 * A simple notepad widget for taking and saving notes
 * 
 * @param {NotesWidgetProps} props - Component props
 * @returns {JSX.Element} Widget component
 */
const NotesWidget: React.FC<NotesWidgetProps> = ({ width, height, config }) => {
  const defaultConfig: NotesWidgetConfig = {
    content: '',
    title: 'Notes',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    fontSize: 14,
    lineHeight: 26,
    lineColor: '#E6E6E6', // Very subtle light gray
    paperColor: '#FFFBE6', // Cream/beige background color
    darkPaperColor: '#1E293B' // Dark mode paper color - matching other widgets
  };

  const [showSettings, setShowSettings] = useState(false);
  const [localConfig, setLocalConfig] = useState<NotesWidgetConfig>({
    ...defaultConfig,
    ...config
  });
  
  const widgetRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Update local config when props change
  useEffect(() => {
    setLocalConfig(prevConfig => ({
      ...prevConfig,
      ...config
    }));
  }, [config]);

  // Focus the textarea when the widget is resized
  useEffect(() => {
    if (textareaRef.current && document.activeElement !== textareaRef.current) {
      // Store current scroll position to prevent jump
      const scrollPos = textareaRef.current.scrollTop;
      // Focus and restore scroll position
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.scrollTop = scrollPos;
        }
      }, 0);
    }
  }, [width, height]);

  // Handle content change
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setLocalConfig(prev => ({
      ...prev,
      content: newContent
    }));
    
    // Save to parent config
    if (config?.onUpdate) {
      config.onUpdate({
        ...localConfig,
        content: newContent
      });
    }
  };

  // Handle title change
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setLocalConfig(prev => ({
      ...prev,
      title: newTitle
    }));
  };

  // Handle font family change
  const handleFontFamilyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newFontFamily = e.target.value;
    setLocalConfig(prev => ({
      ...prev,
      fontFamily: newFontFamily
    }));
  };

  // Handle font size change
  const handleFontSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFontSize = parseInt(e.target.value, 10);
    setLocalConfig(prev => ({
      ...prev,
      fontSize: newFontSize
    }));
  };

  // Handle line height change
  const handleLineHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newLineHeight = parseInt(e.target.value, 10);
    setLocalConfig(prev => ({
      ...prev,
      lineHeight: newLineHeight
    }));
  };

  // Save settings
  const saveSettings = () => {
    if (config?.onUpdate) {
      config.onUpdate(localConfig);
    }
    setShowSettings(false);
  };

  // Generate the linear gradient for the lined paper effect
  const getLinedPaperBackground = () => {
    const lineHeight = localConfig.lineHeight || defaultConfig.lineHeight || 26;
    const isDarkMode = document.documentElement.classList.contains('dark');
    const lineColor = isDarkMode ? 'rgba(255, 255, 255, 0.08)' : (localConfig.lineColor || defaultConfig.lineColor || '#E6E6E6');
    
    return `repeating-linear-gradient(
      to bottom,
      transparent,
      transparent ${lineHeight - 1}px,
      ${lineColor} ${lineHeight - 1}px,
      ${lineColor} ${lineHeight}px
    )`;
  };

  // Settings modal using shadcn/ui Dialog
  const renderSettings = () => {
    return (
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Notes Settings</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            <div>
              <label htmlFor="title-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Title
              </label>
              <input
                id="title-input"
                type="text"
                value={localConfig.title || ''}
                onChange={handleTitleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label htmlFor="font-family-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Font Family
              </label>
              <select
                id="font-family-select"
                value={localConfig.fontFamily || 'system-ui, -apple-system, sans-serif'}
                onChange={handleFontFamilyChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="system-ui, -apple-system, sans-serif">System UI</option>
                <option value="'Helvetica Neue', Helvetica, Arial, sans-serif">Helvetica</option>
                <option value="Georgia, serif">Georgia</option>
                <option value="'Courier New', monospace">Monospace</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="font-size-range" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Font Size: {localConfig.fontSize}px
              </label>
              <input
                id="font-size-range"
                type="range"
                min="12"
                max="24"
                value={localConfig.fontSize || 14}
                onChange={handleFontSizeChange}
                className="w-full"
              />
            </div>

            <div>
              <label htmlFor="line-height-range" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Line Height: {localConfig.lineHeight}px
              </label>
              <input
                id="line-height-range"
                type="range"
                min="20"
                max="40"
                step="2"
                value={localConfig.lineHeight || 26}
                onChange={handleLineHeightChange}
                className="w-full"
              />
            </div>
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
              onClick={saveSettings}
              className="px-4 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Save
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <div
      ref={widgetRef} 
      className="widget-container notes-widget h-full flex flex-col rounded-lg shadow overflow-hidden"
    >
      <WidgetHeader 
        title={localConfig.title || 'Notes'} 
        onSettingsClick={() => setShowSettings(!showSettings)}
      />
      
      <div className="flex-1 overflow-hidden p-2">
        <div 
          className="h-full relative overflow-hidden rounded-md"
          style={{
            backgroundImage: getLinedPaperBackground(),
            backgroundColor: 'transparent'
          }}
        >
          <textarea
            ref={textareaRef}
            value={localConfig.content || ''}
            onChange={handleContentChange}
            className="w-full h-full resize-none border-none focus:outline-none focus:ring-0 bg-transparent 
                      text-gray-800 dark:text-gray-200 py-1 leading-relaxed placeholder-gray-500 dark:placeholder-gray-400"
            style={{
              fontFamily: localConfig.fontFamily || defaultConfig.fontFamily,
              fontSize: `${localConfig.fontSize || defaultConfig.fontSize}px`,
              lineHeight: `${localConfig.lineHeight || defaultConfig.lineHeight}px`,
              caretColor: 'currentColor',
            }}
            placeholder="Write your notes here..."
            aria-label="Notes content"
          />
        </div>
      </div>
      
      {/* Settings modal */}
      {renderSettings()}
    </div>
  );
};

export default NotesWidget; 