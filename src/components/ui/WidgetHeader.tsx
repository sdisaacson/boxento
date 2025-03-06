import React, { ReactNode } from 'react';
import { Settings } from 'lucide-react';

interface WidgetHeaderProps {
  title?: string;
  icon?: ReactNode;
  onSettingsClick?: () => void;
  children?: ReactNode;
}

/**
 * Shared widget header component
 * 
 * @param props Component props
 * @returns Widget header component
 */
const WidgetHeader: React.FC<WidgetHeaderProps> = ({ 
  title, 
  icon, 
  onSettingsClick, 
  children 
}) => {
  return (
    <div className="flex justify-between items-center p-2 cursor-move widget-drag-handle">
      <div className="flex items-center space-x-2">
        {icon && <div className="text-gray-500 dark:text-slate-400">{icon}</div>}
        {title && <h3 className="text-sm font-medium text-gray-800 dark:text-slate-100">{title}</h3>}
        {children}
      </div>
      {onSettingsClick && (
        <button 
          className="settings-button p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full"
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation();
            onSettingsClick();
          }}
        >
          <Settings size={16} className="text-gray-500 dark:text-slate-400" />
        </button>
      )}
    </div>
  );
};

export default WidgetHeader;