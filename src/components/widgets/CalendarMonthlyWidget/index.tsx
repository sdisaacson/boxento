import React, { useState, useEffect, useMemo } from 'react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  addMonths, 
  subMonths,
  isToday
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '../../ui/dialog';
import { Button } from '../../ui/button';
import { Label } from '../../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Input } from '../../ui/input';
import WidgetHeader from '../common/WidgetHeader';
import { CalendarMonthlyWidgetProps, CalendarMonthlyWidgetConfig } from './types';
import { cn } from '@/lib/utils';

/**
 * Monthly Calendar Widget Component
 * 
 * Displays a full month calendar with navigation and highlights today.
 * Supports configurable start of the week.
 * 
 * @param {CalendarMonthlyWidgetProps} props - Component props
 * @returns {JSX.Element} Widget component
 */
const CalendarMonthlyWidget: React.FC<CalendarMonthlyWidgetProps> = ({ width: _width, height: _height, config }) => {
  const defaultConfig: CalendarMonthlyWidgetConfig = {
    startOfWeek: 0, // Sunday
    title: 'Monthly Calendar',
    showTodayButton: true
  };

  const [showSettings, setShowSettings] = useState(false);
  const [localConfig, setLocalConfig] = useState<CalendarMonthlyWidgetConfig>({
    ...defaultConfig,
    ...config
  });
  
  // Current view date (not necessarily today)
  const [viewDate, setViewDate] = useState(new Date());

  // Update local config when props change
  useEffect(() => {
    setLocalConfig(prevConfig => ({
      ...prevConfig,
      ...config
    }));
  }, [config]);

  const weekDayNames = useMemo(() => {
    const start = localConfig.startOfWeek ?? 0;
    const names = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return [...names.slice(start), ...names.slice(0, start)];
  }, [localConfig.startOfWeek]);

  const days = useMemo(() => {
    const monthStart = startOfMonth(viewDate);
    const monthEnd = endOfMonth(monthStart);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: localConfig.startOfWeek as any });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: localConfig.startOfWeek as any });

    return eachDayOfInterval({
      start: calendarStart,
      end: calendarEnd,
    });
  }, [viewDate, localConfig.startOfWeek]);

  const handlePrevMonth = () => setViewDate(subMonths(viewDate, 1));
  const handleNextMonth = () => setViewDate(addMonths(viewDate, 1));
  const handleToday = () => setViewDate(new Date());

  const saveSettings = () => {
    if (config?.onUpdate) {
      config.onUpdate(localConfig);
    }
    setShowSettings(false);
  };

  const renderCalendar = () => {
    return (
      <div className="flex flex-col h-full select-none">
        {/* Navigation */}
        <div className="flex items-center justify-between mb-4 px-1">
          <h3 className="text-sm font-semibold capitalize">
            {format(viewDate, 'MMMM yyyy')}
          </h3>
          <div className="flex items-center gap-1">
            {localConfig.showTodayButton && !isSameMonth(viewDate, new Date()) && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleToday}
                className="h-8 text-xs px-2"
              >
                Today
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={handlePrevMonth} className="h-8 w-8">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleNextMonth} className="h-8 w-8">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="flex-grow grid grid-cols-7 gap-px overflow-hidden">
          {/* Day Headers */}
          {weekDayNames.map(day => (
            <div key={day} className="text-center text-[10px] font-medium text-muted-foreground pb-2">
              {day}
            </div>
          ))}
          
          {/* Days */}
          {days.map((day, idx) => {
            const isSelectedMonth = isSameMonth(day, viewDate);
            const isTodayDay = isToday(day);
            
            return (
              <div 
                key={idx} 
                className={cn(
                  "relative flex items-center justify-center p-1 rounded-md transition-colors",
                  isSelectedMonth ? "text-foreground" : "text-muted-foreground opacity-30",
                  isTodayDay && "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-bold"
                )}
              >
                <span className="text-xs">{format(day, 'd')}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderSettings = () => {
    return (
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Calendar Settings</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Widget Title</Label>
              <Input
                id="title"
                value={localConfig.title}
                onChange={(e) => setLocalConfig({ ...localConfig, title: e.target.value })}
                placeholder="Monthly Calendar"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="startOfWeek">Start of Week</Label>
              <Select 
                value={String(localConfig.startOfWeek)} 
                onValueChange={(val) => setLocalConfig({ ...localConfig, startOfWeek: parseInt(val) as any })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select day" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Sunday</SelectItem>
                  <SelectItem value="1">Monday</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <div className="flex justify-between w-full">
              {config?.onDelete && (
                <Button
                  variant="destructive"
                  onClick={() => config.onDelete?.()}
                  aria-label="Delete this widget"
                >
                  Delete
                </Button>
              )}
              <Button onClick={saveSettings}>Save</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <div className="widget-container h-full flex flex-col">
      <WidgetHeader 
        title={localConfig.title || 'Monthly Calendar'} 
        onSettingsClick={() => setShowSettings(true)}
      />
      
      <div className="flex-grow p-4 overflow-hidden">
        {renderCalendar()}
      </div>
      
      {renderSettings()}
    </div>
  );
};

export default CalendarMonthlyWidget;
