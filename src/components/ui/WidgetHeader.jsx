import React from 'react';
import { Settings } from 'lucide-react';

/**
 * Shared widget header component
 * 
 * @param {Object} props Component props
 * @param {string} props.title Optional widget title
 * @param {Function} props.onSettingsClick Callback for settings button click
 * @param {React.ReactNode} props.children Optional children to render in the header
 * @returns {JSX.Element} Widget header component
 */
const WidgetHeader = ({ title, onSettingsClick, children }) => {
  return (
    <div className="flex justify-between items-center mb-2 cursor-move widget-drag-handle">
      <div className="flex items-center space-x-2">
        {title && <h3 className="text-sm font-medium">{title}</h3>}
        {children}
      </div>
      <button 
        className="settings-button p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
        onClick={onSettingsClick}
      >
        <Settings size={16} />
      </button>
    </div>
  );
};

export default WidgetHeader; 