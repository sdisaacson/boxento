import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '../../ui/dialog';
import { Play, Pause, RotateCcw } from 'lucide-react';
import WidgetHeader from '../common/WidgetHeader';
import { PomodoroWidgetConfig, PomodoroWidgetProps } from './types';

/**
 * Pomodoro Widget Component
 * 
 * A productivity widget implementing the Pomodoro Technique for time management.
 * 
 * @param {PomodoroWidgetProps} props - Component props
 * @returns {JSX.Element} Widget component
 */
const PomodoroWidget: React.FC<PomodoroWidgetProps> = ({ width, height, config }) => {
  // Default configuration
  const defaultConfig: PomodoroWidgetConfig = {
    title: 'Pomodoro Timer',
    workDuration: 25,
    breakDuration: 5,
    longBreakDuration: 15,
    cyclesBeforeLongBreak: 4
  };

  // Enum for timer modes
  enum TimerMode {
    WORK = 'work',
    BREAK = 'break',
    LONG_BREAK = 'longBreak'
  }

  // Component state
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [localConfig, setLocalConfig] = useState<PomodoroWidgetConfig>({
    ...defaultConfig,
    ...config
  });
  const [timeLeft, setTimeLeft] = useState<number>(localConfig.workDuration ? localConfig.workDuration * 60 : 25 * 60);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [mode, setMode] = useState<TimerMode>(TimerMode.WORK);
  const [cyclesCompleted, setCyclesCompleted] = useState<number>(0);
  
  // Refs
  const widgetRef = useRef<HTMLDivElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Update local config when props config changes
  useEffect(() => {
    setLocalConfig((prevConfig: PomodoroWidgetConfig) => ({
      ...prevConfig,
      ...config
    }));
  }, [config]);

  // Timer logic
  useEffect(() => {
    if (isActive) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isActive]);

  // Handle timer mode changes
  const handleTimerComplete = () => {
    let nextMode: TimerMode;
    let nextDuration: number;
    let nextCycles = cyclesCompleted;

    // Play notification sound
    const audio = new Audio('/sounds/bell.mp3');
    audio.play().catch(e => console.log('Audio playback failed:', e));

    if (mode === TimerMode.WORK) {
      nextCycles = cyclesCompleted + 1;
      setCyclesCompleted(nextCycles);
      
      if (nextCycles % (localConfig.cyclesBeforeLongBreak || 4) === 0) {
        nextMode = TimerMode.LONG_BREAK;
        nextDuration = (localConfig.longBreakDuration || 15) * 60;
      } else {
        nextMode = TimerMode.BREAK;
        nextDuration = (localConfig.breakDuration || 5) * 60;
      }
    } else {
      nextMode = TimerMode.WORK;
      nextDuration = (localConfig.workDuration || 25) * 60;
    }

    setMode(nextMode);
    setTimeLeft(nextDuration);
    setIsActive(true);
  };

  // Toggle timer active state
  const toggleTimer = () => {
    setIsActive(!isActive);
  };

  // Reset timer
  const resetTimer = () => {
    setIsActive(false);
    setMode(TimerMode.WORK);
    setCyclesCompleted(0);
    setTimeLeft((localConfig.workDuration || 25) * 60);
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };

  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Get mode label
  const getModeLabel = (): string => {
    switch (mode) {
      case TimerMode.WORK:
        return 'Focus Time';
      case TimerMode.BREAK:
        return 'Short Break';
      case TimerMode.LONG_BREAK:
        return 'Long Break';
      default:
        return 'Focus Time';
    }
  };

  // Get mode description
  const getModeDescription = (): string => {
    switch (mode) {
      case TimerMode.WORK:
        return 'Time to focus on your task';
      case TimerMode.BREAK:
        return 'Take a short breather';
      case TimerMode.LONG_BREAK:
        return 'Take a longer rest';
      default:
        return 'Time to focus on your task';
    }
  };

  // Get mode color
  const getModeColor = (): string => {
    switch (mode) {
      case TimerMode.WORK:
        return 'text-red-500 dark:text-red-400';
      case TimerMode.BREAK:
        return 'text-green-500 dark:text-green-400';
      case TimerMode.LONG_BREAK:
        return 'text-blue-500 dark:text-blue-400';
      default:
        return 'text-red-500 dark:text-red-400';
    }
  };
  
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
      <div className="flex flex-col items-center justify-center h-full space-y-3">
        <div className={`text-3xl font-bold ${getModeColor()}`}>
          {formatTime(timeLeft)}
        </div>
        <div className="text-sm font-medium">{getModeLabel()}</div>
        <div className="flex space-x-3">
          <button 
            className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
            onClick={toggleTimer}
            aria-label={isActive ? 'Pause' : 'Start'}
          >
            {isActive ? <Pause size={16} /> : <Play size={16} />}
          </button>
          <button 
            className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
            onClick={resetTimer}
            aria-label="Reset"
          >
            <RotateCcw size={16} />
          </button>
        </div>
      </div>
    );
  };
  
  // Wide view (4x2 or larger width)
  const renderWideView = () => {
    return (
      <div className="flex flex-row items-center justify-between h-full px-4">
        <div className="flex flex-col items-center">
          <div className={`text-4xl font-bold ${getModeColor()}`}>
            {formatTime(timeLeft)}
          </div>
          <div className="text-lg font-medium mt-1">{getModeLabel()}</div>
          <div className="text-sm opacity-75 text-center max-w-[180px]">{getModeDescription()}</div>
        </div>
        <div className="flex flex-col items-center">
          <div className="flex space-x-3">
            <button 
              className="p-3 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
              onClick={toggleTimer}
              aria-label={isActive ? 'Pause' : 'Start'}
            >
              {isActive ? <Pause size={20} /> : <Play size={20} />}
            </button>
            <button 
              className="p-3 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
              onClick={resetTimer}
              aria-label="Reset"
            >
              <RotateCcw size={20} />
            </button>
          </div>
          <div className="text-sm mt-2">
            Cycle: {cyclesCompleted % (localConfig.cyclesBeforeLongBreak || 4) || (localConfig.cyclesBeforeLongBreak || 4)}/{localConfig.cyclesBeforeLongBreak || 4}
          </div>
        </div>
      </div>
    );
  };
  
  // Tall view (2x4 or larger height)
  const renderTallView = () => {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4">
        <div className={`text-4xl font-bold ${getModeColor()}`}>
          {formatTime(timeLeft)}
        </div>
        <div className="text-lg font-medium">{getModeLabel()}</div>
        <div className="text-sm opacity-75 text-center max-w-[180px]">{getModeDescription()}</div>
        <div className="flex space-x-3 mt-3">
          <button 
            className="p-3 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
            onClick={toggleTimer}
            aria-label={isActive ? 'Pause' : 'Start'}
          >
            {isActive ? <Pause size={20} /> : <Play size={20} />}
          </button>
          <button 
            className="p-3 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
            onClick={resetTimer}
            aria-label="Reset"
          >
            <RotateCcw size={20} />
          </button>
        </div>
        <div className="text-sm mt-2">
          Cycle: {cyclesCompleted % (localConfig.cyclesBeforeLongBreak || 4) || (localConfig.cyclesBeforeLongBreak || 4)}/{localConfig.cyclesBeforeLongBreak || 4}
        </div>
        <div className="text-sm opacity-75">
          Total completed: {cyclesCompleted}
        </div>
      </div>
    );
  };
  
  // Large view (4x4 or larger)
  const renderLargeView = () => {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-6">
        <div className={`text-6xl font-bold ${getModeColor()}`}>
          {formatTime(timeLeft)}
        </div>
        <div className="text-xl font-medium">{getModeLabel()}</div>
        <div className="text-md opacity-75 text-center max-w-[280px]">{getModeDescription()}</div>
        <div className="flex space-x-4 mt-4">
          <button 
            className="p-4 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
            onClick={toggleTimer}
            aria-label={isActive ? 'Pause' : 'Start'}
          >
            {isActive ? <Pause size={24} /> : <Play size={24} />}
          </button>
          <button 
            className="p-4 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
            onClick={resetTimer}
            aria-label="Reset"
          >
            <RotateCcw size={24} />
          </button>
        </div>
        <div className="text-lg mt-2">
          Cycle: {cyclesCompleted % (localConfig.cyclesBeforeLongBreak || 4) || (localConfig.cyclesBeforeLongBreak || 4)}/{localConfig.cyclesBeforeLongBreak || 4}
        </div>
        <div className="text-md opacity-75">
          Total completed: {cyclesCompleted}
        </div>
        <div className="grid grid-cols-3 gap-4 mt-4 text-center w-full">
          <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg">
            <div className="text-sm opacity-75">Focus Time</div>
            <div className="font-medium">{localConfig.workDuration} min</div>
          </div>
          <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg">
            <div className="text-sm opacity-75">Short Break</div>
            <div className="font-medium">{localConfig.breakDuration} min</div>
          </div>
          <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg">
            <div className="text-sm opacity-75">Long Break</div>
            <div className="font-medium">{localConfig.longBreakDuration} min</div>
          </div>
        </div>
      </div>
    );
  };
  
  // Save settings
  const saveSettings = () => {
    if (config?.onUpdate) {
      config.onUpdate(localConfig);
    }
    setShowSettings(false);
    
    // Update timer based on new settings
    resetTimer();
  };
  
  // Settings dialog
  const renderSettings = () => {
    return (
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Pomodoro Widget Settings</DialogTitle>
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
            
            {/* Work duration setting */}
            <div>
              <label htmlFor="work-duration" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Focus Time Duration (minutes)
              </label>
              <input
                id="work-duration"
                type="number"
                min="1"
                max="60"
                value={localConfig.workDuration || 25}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                  setLocalConfig({...localConfig, workDuration: parseInt(e.target.value)})
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            {/* Break duration setting */}
            <div>
              <label htmlFor="break-duration" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Short Break Duration (minutes)
              </label>
              <input
                id="break-duration"
                type="number"
                min="1"
                max="30"
                value={localConfig.breakDuration || 5}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                  setLocalConfig({...localConfig, breakDuration: parseInt(e.target.value)})
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            {/* Long break duration setting */}
            <div>
              <label htmlFor="long-break-duration" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Long Break Duration (minutes)
              </label>
              <input
                id="long-break-duration"
                type="number"
                min="1"
                max="45"
                value={localConfig.longBreakDuration || 15}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                  setLocalConfig({...localConfig, longBreakDuration: parseInt(e.target.value)})
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            {/* Cycles before long break setting */}
            <div>
              <label htmlFor="cycles-before-long-break" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Cycles Before Long Break
              </label>
              <input
                id="cycles-before-long-break"
                type="number"
                min="1"
                max="10"
                value={localConfig.cyclesBeforeLongBreak || 4}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                  setLocalConfig({...localConfig, cyclesBeforeLongBreak: parseInt(e.target.value)})
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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

export default PomodoroWidget; 