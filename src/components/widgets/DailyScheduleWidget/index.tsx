import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../ui/dialog';
import WidgetHeader from '../common/WidgetHeader';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Switch } from '../../ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { AlertCircle, Calendar } from 'lucide-react';
import {
  addDays,
  endOfDay,
  format,
  isBefore,
  isWithinInterval,
  startOfDay,
} from 'date-fns';
import type { DailyScheduleEvent, DailyScheduleWidgetConfig, DailyScheduleWidgetProps } from './types';

const unfoldIcs = (raw: string): string => {
  // RFC 5545: lines may be folded by inserting CRLF followed by a single space or tab.
  return raw.replace(/\r\n[ \t]/g, '').replace(/\n[ \t]/g, '');
};

const parseDurationToMs = (value: string): number | null => {
  // Very small subset of ISO8601 durations: PnDTnHnMnS or PT...
  // Examples: PT30M, PT1H, P1D
  const match = value.match(/^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/);
  if (!match) return null;
  const days = Number(match[1] || 0);
  const hours = Number(match[2] || 0);
  const minutes = Number(match[3] || 0);
  const seconds = Number(match[4] || 0);
  return (((days * 24 + hours) * 60 + minutes) * 60 + seconds) * 1000;
};

type IcsParams = Record<string, string>;

const parsePropAndParams = (nameAndParams: string): { name: string; params: IcsParams } => {
  const [rawName, ...rawParams] = nameAndParams.split(';');
  const name = rawName.trim().toUpperCase();
  const params: IcsParams = {};

  for (const p of rawParams) {
    const idx = p.indexOf('=');
    if (idx === -1) continue;
    const key = p.slice(0, idx).trim().toUpperCase();
    const val = p.slice(idx + 1).trim();
    params[key] = val;
  }

  return { name, params };
};

const parseIcsDate = (value: string, params: IcsParams): { date: Date; allDay: boolean } | null => {
  const trimmed = value.trim();
  const valueType = (params.VALUE || '').toUpperCase();

  // All-day date: YYYYMMDD
  if (valueType === 'DATE' || /^\d{8}$/.test(trimmed)) {
    const y = Number(trimmed.slice(0, 4));
    const m = Number(trimmed.slice(4, 6));
    const d = Number(trimmed.slice(6, 8));
    // Interpret as local midnight.
    return { date: new Date(y, m - 1, d, 0, 0, 0), allDay: true };
  }

  // Date-time: YYYYMMDDTHHMMSS(Z?)
  const dtMatch = trimmed.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z)?$/);
  if (!dtMatch) return null;

  const [, ys, ms, ds, hs, mins, ss, z] = dtMatch;
  const y = Number(ys);
  const mo = Number(ms);
  const d = Number(ds);
  const h = Number(hs);
  const mi = Number(mins);
  const s = Number(ss);

  if (z) {
    return { date: new Date(Date.UTC(y, mo - 1, d, h, mi, s)), allDay: false };
  }

  // If TZID exists, we treat it as local time.
  // (Accurate TZ conversion requires a timezone library and/or VTIMEZONE parsing.)
  return { date: new Date(y, mo - 1, d, h, mi, s), allDay: false };
};

const decodeIcsText = (value: string): string => {
  return value
    .replace(/\\n/g, '\n')
    .replace(/\\,/g, ',')
    .replace(/\\;/g, ';')
    .trim();
};

const parseIcsEvents = (rawIcs: string): DailyScheduleEvent[] => {
  const unfolded = unfoldIcs(rawIcs);
  const lines = unfolded.split(/\r?\n/);

  const events: DailyScheduleEvent[] = [];
  let inEvent = false;
  let current: {
    uid?: string;
    summary?: string;
    description?: string;
    location?: string;
    dtStart?: { date: Date; allDay: boolean };
    dtEnd?: { date: Date; allDay: boolean };
    durationMs?: number;
  } | null = null;

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    if (!line) continue;

    if (line === 'BEGIN:VEVENT') {
      inEvent = true;
      current = {};
      continue;
    }

    if (line === 'END:VEVENT') {
      if (inEvent && current?.dtStart) {
        const start = current.dtStart.date;

        let end: Date | null = current.dtEnd?.date ?? null;
        if (!end && current.durationMs != null) {
          end = new Date(start.getTime() + current.durationMs);
        }
        if (!end) {
          // Default fallback: 30 minutes
          end = new Date(start.getTime() + 30 * 60 * 1000);
        }

        const allDay = current.dtStart.allDay || current.dtEnd?.allDay || false;

        // For all-day events, DTEND is exclusive per RFC; if end is same-day midnight, adjust to end-of-day.
        if (allDay) {
          // Common patterns: DTSTART=DATE, DTEND=DATE (next day). We'll display as all-day on DTSTART.
          // Keep start at midnight; set end to end of start day for classification.
          end = endOfDay(start);
        }

        events.push({
          uid: current.uid,
          summary: current.summary,
          description: current.description,
          location: current.location,
          start,
          end,
          allDay,
        });
      }

      inEvent = false;
      current = null;
      continue;
    }

    if (!inEvent || !current) continue;

    const sepIdx = line.indexOf(':');
    if (sepIdx === -1) continue;

    const left = line.slice(0, sepIdx);
    const right = line.slice(sepIdx + 1);

    const { name, params } = parsePropAndParams(left);

    switch (name) {
      case 'UID':
        current.uid = decodeIcsText(right);
        break;
      case 'SUMMARY':
        current.summary = decodeIcsText(right);
        break;
      case 'DESCRIPTION':
        current.description = decodeIcsText(right);
        break;
      case 'LOCATION':
        current.location = decodeIcsText(right);
        break;
      case 'DTSTART':
        current.dtStart = parseIcsDate(right, params) ?? undefined;
        break;
      case 'DTEND':
        current.dtEnd = parseIcsDate(right, params) ?? undefined;
        break;
      case 'DURATION': {
        const ms = parseDurationToMs(right.trim());
        if (ms != null) current.durationMs = ms;
        break;
      }
      default:
        break;
    }
  }

  return events;
};

const DailyScheduleWidget: React.FC<DailyScheduleWidgetProps> = ({ config }) => {
  const defaultConfig = useMemo<DailyScheduleWidgetConfig>(
    () => ({
      title: 'Daily Schedule',
      icsUrl: '',
      daysAhead: 7,
      refreshInterval: 30,
      showLocation: true,
      showDescription: false,
    }),
    [],
  );

  const [showSettings, setShowSettings] = useState(false);
  const [activeTab, setActiveTab] = useState('schedule');

  const [localConfig, setLocalConfig] = useState<DailyScheduleWidgetConfig>({
    ...defaultConfig,
    ...config,
  });

  const [events, setEvents] = useState<DailyScheduleEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const widgetRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setLocalConfig((prev) => ({
      ...prev,
      ...config,
    }));
  }, [config]);

  const fetchIcs = React.useCallback(async (configToUse?: DailyScheduleWidgetConfig) => {
    const cfg = configToUse ?? localConfig;

    const url = (cfg.icsUrl ?? '').trim();
    if (!url) {
      setEvents([]);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const corsProxy = 'https://api.allorigins.win/raw?url=';
      const response = await fetch(`${corsProxy}${encodeURIComponent(url)}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch ICS: ${response.statusText}`);
      }

      const text = await response.text();
      const parsed = parseIcsEvents(text);

      // Filter to date range
      const now = new Date();
      const days = Math.max(1, Number(cfg.daysAhead ?? 7));
      const rangeStart = startOfDay(now);
      const rangeEnd = endOfDay(addDays(now, days - 1));

      const filtered = parsed
        .filter((e) => e.end >= rangeStart && e.start <= rangeEnd)
        .sort((a, b) => a.start.getTime() - b.start.getTime());

      setEvents(filtered);
      setIsLoading(false);
    } catch (e) {
      console.error('Error fetching/parsing ICS:', e);
      setError('Failed to load schedule');
      setIsLoading(false);
    }
  }, [localConfig]);

  // Fetch when url/daysAhead changes
  useEffect(() => {
    fetchIcs();
  }, [localConfig.icsUrl, localConfig.daysAhead, fetchIcs]);

  // Auto-refresh
  useEffect(() => {
    const minutes = Number(localConfig.refreshInterval ?? 30);
    if (minutes <= 0) return;

    const id = window.setInterval(() => {
      fetchIcs();
    }, minutes * 60 * 1000);

    return () => window.clearInterval(id);
  }, [localConfig.refreshInterval, fetchIcs]);

  const groupedByDay = useMemo(() => {
    const groups = new Map<string, { date: Date; items: DailyScheduleEvent[] }>();

    for (const ev of events) {
      const day = startOfDay(ev.start);
      const key = day.toISOString();
      const existing = groups.get(key);
      if (existing) {
        existing.items.push(ev);
      } else {
        groups.set(key, { date: day, items: [ev] });
      }
    }

    return Array.from(groups.values())
      .map((g) => ({
        date: g.date,
        items: g.items.sort((a, b) => a.start.getTime() - b.start.getTime()),
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [events]);

  const renderTimeRange = (ev: DailyScheduleEvent): string => {
    if (ev.allDay) return 'All day';
    const startStr = format(ev.start, 'p');
    const endStr = format(ev.end, 'p');
    return `${startStr} – ${endStr}`;
  };

  const getStatus = (ev: DailyScheduleEvent, now: Date): 'past' | 'ongoing' | 'upcoming' => {
    if (isBefore(ev.end, now)) return 'past';
    if (isWithinInterval(now, { start: ev.start, end: ev.end })) return 'ongoing';
    return 'upcoming';
  };

  const renderSchedule = () => {
    if (isLoading) {
      return (
        <div className="h-full flex items-center justify-center p-4">
          <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      );
    }

    if (error) {
      return (
        <div className="h-full flex flex-col items-center justify-center text-center p-4">
          <AlertCircle size={24} className="text-red-500 mb-2" strokeWidth={1.5} />
          <div className="text-sm text-red-500 dark:text-red-400 mb-3">{error}</div>
          <Button size="sm" onClick={() => fetchIcs()}>
            Try Again
          </Button>
        </div>
      );
    }

    if (!localConfig.icsUrl) {
      return (
        <div className="h-full flex flex-col items-center justify-center text-center p-4">
          <Calendar size={24} className="text-gray-400 mb-3" strokeWidth={1.5} />
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">No calendar configured.</p>
          <Button size="sm" variant="outline" onClick={() => setShowSettings(true)}>
            Configure Widget
          </Button>
        </div>
      );
    }

    if (groupedByDay.length === 0) {
      return (
        <div className="h-full flex flex-col items-center justify-center text-center p-4">
          <Calendar size={24} className="text-gray-400 mb-3" strokeWidth={1.5} />
          <p className="text-sm text-gray-500 dark:text-gray-400">No meetings found.</p>
        </div>
      );
    }

    const now = new Date();

    return (
      <div className="h-full overflow-y-auto pr-1">
        <div className="space-y-4">
          {groupedByDay.map((day) => (
            <div key={day.date.toISOString()} className="space-y-2">
              <div className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">
                {format(day.date, 'EEE, MMM d')}
              </div>

              <div className="space-y-2">
                {day.items.map((ev) => {
                  const status = getStatus(ev, now);

                  const base =
                    'rounded-lg border p-3 transition-colors';
                  const statusClass =
                    status === 'past'
                      ? 'border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950/40 text-gray-500 dark:text-gray-400 opacity-80'
                      : status === 'ongoing'
                        ? 'border-blue-300 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30'
                        : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950/50';

                  return (
                    <div key={`${ev.uid ?? ''}-${ev.start.toISOString()}`} className={`${base} ${statusClass}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-2">
                            {ev.summary || 'Untitled meeting'}
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                            {renderTimeRange(ev)}
                          </div>
                        </div>

                        <div className="text-[10px] uppercase tracking-wide text-gray-500 dark:text-gray-400 shrink-0">
                          {status === 'past' ? 'Past' : status === 'ongoing' ? 'Now' : 'Next'}
                        </div>
                      </div>

                      {localConfig.showLocation && ev.location ? (
                        <div className="text-xs text-gray-600 dark:text-gray-300 mt-2 line-clamp-2">
                          {ev.location}
                        </div>
                      ) : null}

                      {localConfig.showDescription && ev.description ? (
                        <div className="text-xs text-gray-600 dark:text-gray-300 mt-2 whitespace-pre-wrap line-clamp-4">
                          {ev.description}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const saveSettings = () => {
    if (config?.onUpdate && typeof config.onUpdate === 'function') {
      config.onUpdate(localConfig);
    }

    setShowSettings(false);
    fetchIcs(localConfig);
  };

  const renderSettings = () => (
    <Dialog open={showSettings} onOpenChange={setShowSettings}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Daily Schedule Settings</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
            <TabsTrigger value="display">Display</TabsTrigger>
          </TabsList>

          <TabsContent value="schedule" className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="ds-title">Widget Title</Label>
              <Input
                id="ds-title"
                value={localConfig.title ?? ''}
                onChange={(e) => setLocalConfig({ ...localConfig, title: e.target.value })}
                placeholder="Daily Schedule"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ds-url">ICS URL</Label>
              <Input
                id="ds-url"
                value={localConfig.icsUrl ?? ''}
                onChange={(e) => setLocalConfig({ ...localConfig, icsUrl: e.target.value })}
                placeholder="https://.../calendar.ics"
              />
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Public URL required. The widget fetches via a CORS proxy.
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="ds-days">Days ahead</Label>
                <Input
                  id="ds-days"
                  type="number"
                  min={1}
                  value={String(localConfig.daysAhead ?? 7)}
                  onChange={(e) => setLocalConfig({ ...localConfig, daysAhead: Number(e.target.value || 1) })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ds-refresh">Refresh (min)</Label>
                <Input
                  id="ds-refresh"
                  type="number"
                  min={0}
                  value={String(localConfig.refreshInterval ?? 30)}
                  onChange={(e) => setLocalConfig({ ...localConfig, refreshInterval: Number(e.target.value || 0) })}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="display" className="space-y-4 py-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">Show location</div>
              </div>
              <Switch
                checked={localConfig.showLocation !== false}
                onCheckedChange={(checked) => setLocalConfig({ ...localConfig, showLocation: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">Show description</div>
              </div>
              <Switch
                checked={!!localConfig.showDescription}
                onCheckedChange={(checked) => setLocalConfig({ ...localConfig, showDescription: checked })}
              />
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <div className="flex justify-between w-full">
            {config?.onDelete ? (
              <Button
                variant="destructive"
                onClick={() => {
                  if (config.onDelete) config.onDelete();
                }}
              >
                Delete Widget
              </Button>
            ) : (
              <div />
            )}

            <Button onClick={saveSettings}>Save</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  return (
    <div ref={widgetRef} className="widget-container h-full flex flex-col relative">
      <WidgetHeader title={localConfig.title || defaultConfig.title || 'Daily Schedule'} onSettingsClick={() => setShowSettings(true)} />

      <div className="flex-1 overflow-hidden">{renderSchedule()}</div>

      {renderSettings()}
    </div>
  );
};

export default DailyScheduleWidget;
