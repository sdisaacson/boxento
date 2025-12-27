import React, { useState, useEffect } from 'react';
import { Calendar, Clock } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../../ui/dialog';
import { Input } from '../../ui/input';
import { Button } from '../../ui/button';
import { Label } from '../../ui/label';
import { Switch } from '../../ui/switch';
import WidgetHeader from '../common/WidgetHeader';
import type { CountdownWidgetProps, TimeRemaining } from './types';

const CountdownWidget: React.FC<CountdownWidgetProps> = ({ width, height, config }) => {
  const [showSettings, setShowSettings] = useState(false);
  const [targetDate, setTargetDate] = useState(config?.targetDate || '');
  const [eventName, setEventName] = useState(config?.eventName || '');
  const [showTime, setShowTime] = useState(config?.showTime ?? true);
  const [inputTargetDate, setInputTargetDate] = useState(config?.targetDate || '');
  const [inputEventName, setInputEventName] = useState(config?.eventName || '');
  const [inputShowTime, setInputShowTime] = useState(config?.showTime ?? true);
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining | null>(null);

  // Calculate time remaining
  useEffect(() => {
    if (!targetDate) {
      setTimeRemaining(null);
      return;
    }

    const calculateTimeRemaining = () => {
      const now = new Date().getTime();
      const target = new Date(targetDate).getTime();
      const difference = target - now;

      if (difference <= 0) {
        setTimeRemaining({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          isPast: true
        });
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeRemaining({ days, hours, minutes, seconds, isPast: false });
    };

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [targetDate]);

  // Save settings
  const handleSave = () => {
    setTargetDate(inputTargetDate);
    setEventName(inputEventName);
    setShowTime(inputShowTime);

    if (config?.onUpdate) {
      config.onUpdate({
        ...config,
        targetDate: inputTargetDate,
        eventName: inputEventName,
        showTime: inputShowTime
      });
    }
    setShowSettings(false);
  };

  // Determine if compact mode based on size
  const isCompact = width <= 2 && height <= 2;

  // Render setup view when no date configured
  const renderSetup = () => (
    <div className="h-full flex flex-col items-center justify-center text-center p-4">
      <Calendar size={32} className="text-gray-400 mb-3" strokeWidth={1.5} />
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
        Set a countdown date
      </p>
      <Button size="sm" variant="outline" onClick={() => setShowSettings(true)}>
        Configure
      </Button>
    </div>
  );

  // Render countdown display
  const renderCountdown = () => {
    if (!timeRemaining) return renderSetup();

    if (timeRemaining.isPast) {
      return (
        <div className="h-full flex flex-col items-center justify-center text-center">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">
            {eventName || 'Event'} is here!
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {new Date(targetDate).toLocaleDateString()}
          </div>
        </div>
      );
    }

    // Compact view for small widgets
    if (isCompact) {
      return (
        <div className="h-full flex flex-col items-center justify-center">
          {eventName && (
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 truncate max-w-full px-2">
              {eventName}
            </div>
          )}
          <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
            {timeRemaining.days}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {timeRemaining.days === 1 ? 'day' : 'days'}
          </div>
          {showTime && (
            <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              {String(timeRemaining.hours).padStart(2, '0')}:
              {String(timeRemaining.minutes).padStart(2, '0')}:
              {String(timeRemaining.seconds).padStart(2, '0')}
            </div>
          )}
        </div>
      );
    }

    // Full view for larger widgets
    return (
      <div className="h-full flex flex-col items-center justify-center">
        {eventName && (
          <div className="text-sm text-gray-600 dark:text-gray-300 mb-3 text-center px-2">
            {eventName}
          </div>
        )}

        <div className="flex gap-4 items-center justify-center">
          <div className="flex flex-col items-center">
            <div className="text-4xl font-bold text-blue-600 dark:text-blue-400">
              {timeRemaining.days}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {timeRemaining.days === 1 ? 'day' : 'days'}
            </div>
          </div>

          {showTime && (
            <>
              <div className="flex flex-col items-center">
                <div className="text-3xl font-bold text-gray-700 dark:text-gray-300">
                  {String(timeRemaining.hours).padStart(2, '0')}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">hrs</div>
              </div>

              <div className="flex flex-col items-center">
                <div className="text-3xl font-bold text-gray-700 dark:text-gray-300">
                  {String(timeRemaining.minutes).padStart(2, '0')}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">min</div>
              </div>

              {width >= 3 && (
                <div className="flex flex-col items-center">
                  <div className="text-3xl font-bold text-gray-700 dark:text-gray-300">
                    {String(timeRemaining.seconds).padStart(2, '0')}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">sec</div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="text-xs text-gray-400 dark:text-gray-500 mt-3">
          {new Date(targetDate).toLocaleDateString(undefined, {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </div>
      </div>
    );
  };

  // Settings dialog
  const renderSettings = () => (
    <Dialog open={showSettings} onOpenChange={setShowSettings}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Countdown Settings
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="eventName">Event Name</Label>
            <Input
              id="eventName"
              placeholder="My Birthday, Vacation, etc."
              value={inputEventName}
              onChange={(e) => setInputEventName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="targetDate">Target Date</Label>
            <Input
              id="targetDate"
              type="datetime-local"
              value={inputTargetDate}
              onChange={(e) => setInputTargetDate(e.target.value)}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="showTime"
              checked={inputShowTime}
              onCheckedChange={setInputShowTime}
            />
            <Label htmlFor="showTime">Show hours/minutes/seconds</Label>
          </div>
        </div>

        <DialogFooter>
          <div className="flex justify-between w-full">
            {config?.onDelete && (
              <Button variant="destructive" onClick={config.onDelete}>
                Delete
              </Button>
            )}
            {!config?.onDelete && <div />}
            <Button onClick={handleSave}>
              Save
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="widget-container h-full flex flex-col">
      <WidgetHeader
        title={config?.title || 'Countdown'}
        onSettingsClick={() => setShowSettings(true)}
      />

      <div className="flex-grow overflow-hidden p-3">
        {renderCountdown()}
      </div>

      {renderSettings()}
    </div>
  );
};

export default CountdownWidget;
