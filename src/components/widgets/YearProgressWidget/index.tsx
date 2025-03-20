import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '../../ui/dialog';
import { Switch } from '../../ui/switch';
import { Label } from '../../ui/label';
import { Button } from '../../ui/button';
import WidgetHeader from '../common/WidgetHeader';
import { YearProgressProps, YearProgressConfig } from './types';

const YearProgressWidget: React.FC<YearProgressProps> = ({ config }) => {
  const defaultConfig: YearProgressConfig = {
    showPercentage: true,
    showDaysLeft: true
  };

  const [showSettings, setShowSettings] = useState(false);
  const [localConfig, setLocalConfig] = useState<YearProgressConfig>({
    ...defaultConfig,
    ...config
  });

  const widgetRef = useRef<HTMLDivElement>(null);

  // Calculate year progress
  const calculateYearProgress = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const end = new Date(now.getFullYear() + 1, 0, 1);
    const daysInYear = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
    const daysPassed = (now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
    return {
      total: Math.floor(daysInYear),
      passed: Math.floor(daysPassed),
      percentage: (daysPassed / daysInYear) * 100
    };
  };

  const progress = useMemo(() => calculateYearProgress(), []);

  // Update progress every hour
  useEffect(() => {
    const interval = setInterval(() => {
      setLocalConfig(prev => ({ ...prev })); // Force re-render
    }, 1000 * 60 * 60);

    return () => clearInterval(interval);
  }, []);

  const renderDots = () => {
    const dots = [];
    const totalDays = progress.total;
    const columns = 19; // Odd number for better centering
    const rows = Math.ceil(totalDays / columns);

    for (let i = 0; i < totalDays; i++) {
      const isPassed = i < progress.passed;

      dots.push(
        <div key={i} className="relative group">
          <div
            className={`w-1.5 h-1.5 rounded-full transition-all duration-300 transform hover:scale-150 ${
              isPassed
                ? 'bg-primary shadow-sm'
                : 'bg-gray-100 dark:bg-gray-800/40'
            }`}
            aria-label={`Day ${i + 1}${isPassed ? ' (passed)' : ' (remaining)'}`}
            role="status"
          >
            <span className="sr-only">
              {isPassed ? 'Completed day' : 'Future day'} {i + 1}
            </span>
          </div>
          <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity bg-gray-800 dark:bg-gray-700 text-white px-2 py-1 rounded text-xs -top-8 left-1/2 transform -translate-x-1/2 pointer-events-none whitespace-nowrap z-10">
            {new Date(new Date().getFullYear(), 0, i + 1).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric'
            })}
          </div>
        </div>
      );
    }

    return (
      <div
        className="grid gap-[2px] p-1"
        style={{
          gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`
        }}
      >
        {dots}
      </div>
    );
  };

  const renderStats = () => {
    return (
      <div className="flex justify-between items-center mt-2 text-xs font-medium">
        {localConfig.showDaysLeft && (
          <div className="bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
            <span className="text-gray-900 dark:text-gray-100">{progress.total - progress.passed}</span>
            <span className="text-gray-500 dark:text-gray-400 ml-1">days left</span>
          </div>
        )}
        {localConfig.showPercentage && (
          <div className="bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
            <span className="text-gray-900 dark:text-gray-100">{progress.percentage.toFixed(1)}%</span>
            <span className="text-gray-500 dark:text-gray-400 ml-1">complete</span>
          </div>
        )}
      </div>
    );
  };

  const saveSettings = () => {
    if (config?.onUpdate) {
      config.onUpdate(localConfig);
    }
    setShowSettings(false);
  };

  const renderSettings = () => {
    return (
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Widget Settings</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Display Options</Label>
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="show-percentage"
                    checked={localConfig.showPercentage}
                    onCheckedChange={(checked) => 
                      setLocalConfig(prev => ({ ...prev, showPercentage: checked }))
                    }
                  />
                  <Label htmlFor="show-percentage">Show Percentage</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="show-days"
                    checked={localConfig.showDaysLeft}
                    onCheckedChange={(checked) => 
                      setLocalConfig(prev => ({ ...prev, showDaysLeft: checked }))
                    }
                  />
                  <Label htmlFor="show-days">Show Days Left</Label>
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <div className="flex justify-between w-full">
              {config?.onDelete && (
                <Button
                  variant="destructive"
                  onClick={() => {
                    if (config.onDelete) {
                      config.onDelete();
                    }
                  }}
                >
                  Delete Widget
                </Button>
              )}
              <Button
                variant="default"
                onClick={saveSettings}
              >
                Save
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <div ref={widgetRef} className="widget-container h-full flex flex-col">
      <WidgetHeader 
        title="Year Progress" 
        onSettingsClick={() => setShowSettings(true)}
      />
      
      <div className="flex-grow p-2 overflow-hidden">
        <div className="h-full flex flex-col justify-between">
          {renderDots()}
          {(localConfig.showPercentage || localConfig.showDaysLeft) && renderStats()}
        </div>
      </div>
      
      {renderSettings()}
    </div>
  );
};

export default YearProgressWidget; 