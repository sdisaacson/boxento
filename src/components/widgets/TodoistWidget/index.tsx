import React, { useState, useEffect, useCallback, memo, useMemo } from 'react';
import { Check, Loader2, CalendarIcon, ExternalLink } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../../ui/dialog';
import { Input } from '../../ui/input';
import { Switch } from '../../ui/switch';
import { Label } from '../../ui/label';
import WidgetHeader from '../common/WidgetHeader';
import { TodoistWidgetProps, TodoistTask } from './types';

// Memoized task content formatter
const TaskContent = memo(({ content, completed }: { content: string; completed: boolean }) => {
  // URL regex pattern
  const urlPattern = /\[(.*?)]\((https?:\/\/[^\s)]+)\)/g;
  
  const formattedContent = useMemo(() => {
    if (!content.match(urlPattern)) {
      return <span>{content}</span>;
    }

    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = urlPattern.exec(content)) !== null) {
      if (match.index > lastIndex) {
        parts.push(
          <span key={`text-${match.index}`}>
            {content.slice(lastIndex, match.index)}
          </span>
        );
      }

      parts.push(
        <a
          key={`link-${match.index}`}
          href={match[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#db4c3f] hover:underline"
        >
          {match[1]}
        </a>
      );

      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < content.length) {
      parts.push(
        <span key={`text-end`}>
          {content.slice(lastIndex)}
        </span>
      );
    }

    return <>{parts}</>;
  }, [content]);

  return (
    <span className={`flex-grow ${completed ? 'line-through text-gray-500' : ''}`}>
      {formattedContent}
    </span>
  );
});

TaskContent.displayName = 'TaskContent';

// Memoized task component
const Task = memo(({ 
  task, 
  onToggle,
  isPending
}: { 
  task: TodoistTask; 
  onToggle: (id: string, completed: boolean) => void;
  isPending: boolean;
}) => {
  return (
    <div className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg group">
      <button
        onClick={() => onToggle(task.id, !task.completed)}
        className={`flex-shrink-0 w-[18px] h-[18px] rounded-full border-2 ${
          task.completed 
            ? 'bg-[#db4c3f] border-[#db4c3f]' 
            : 'border-gray-400 dark:border-gray-500 hover:border-[#db4c3f] dark:hover:border-[#db4c3f]'
        } flex items-center justify-center transition-colors relative`}
        aria-label={task.completed ? "Mark task as incomplete" : "Mark task as complete"}
        disabled={isPending}
      >
        {task.completed && (
          <Check 
            className={`w-3 h-3 text-white ${isPending ? 'opacity-50' : ''}`} 
            strokeWidth={3} 
          />
        )}
        {isPending && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="w-3 h-3 animate-spin text-[#db4c3f]" />
          </div>
        )}
      </button>
      <div className="flex-grow min-w-0">
        <div className="flex items-center gap-2">
          <TaskContent content={task.content} completed={task.completed} />
          <a
            href={task.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-all"
            aria-label="Open in Todoist"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
        {task.due && (
          <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
            <CalendarIcon className="w-3 h-3" />
            <span>{task.due.string}</span>
          </div>
        )}
      </div>
    </div>
  );
});

Task.displayName = 'Task';

const TodoistWidget: React.FC<TodoistWidgetProps> = ({ config }) => {
  const [tasks, setTasks] = useState<TodoistTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [localConfig, setLocalConfig] = useState(config || {});
  const [pendingTasks, setPendingTasks] = useState<Set<string>>(new Set());

  // Fetch tasks from Todoist
  const fetchTasks = useCallback(async () => {
    if (!localConfig?.apiToken) {
      setError('API token not configured');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const url = localConfig.projectId 
        ? `https://api.todoist.com/rest/v2/tasks?project_id=${localConfig.projectId}`
        : 'https://api.todoist.com/rest/v2/tasks';

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localConfig.apiToken}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch tasks');
      
      const data = await response.json();
      const filteredTasks = localConfig.showCompleted 
        ? data 
        : data.filter((task: TodoistTask) => !task.completed);
      
      setTasks(filteredTasks.slice(0, localConfig.maxTasks || 10));
    } catch (error) {
      console.error('Error fetching Todoist tasks:', error);
      setError('Failed to fetch tasks. Please check your API token.');
    } finally {
      setLoading(false);
    }
  }, [localConfig]);

  // Optimized toggle task function
  const toggleTask = useCallback(async (taskId: string, completed: boolean) => {
    if (!localConfig?.apiToken || pendingTasks.has(taskId)) return;
    
    // Optimistic update
    setPendingTasks(prev => new Set(prev).add(taskId));
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId ? { ...task, completed } : task
      )
    );

    try {
      const endpoint = completed ? 'close' : 'reopen';
      const response = await fetch(`https://api.todoist.com/rest/v2/tasks/${taskId}/${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localConfig.apiToken}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to update task');
      
      // Remove pending state after successful update
      setPendingTasks(prev => {
        const next = new Set(prev);
        next.delete(taskId);
        return next;
      });
    } catch (error) {
      console.error('Error updating task:', error);
      setError('Failed to update task');
      
      // Revert optimistic update on error
      setTasks(prevTasks =>
        prevTasks.map(task =>
          task.id === taskId ? { ...task, completed: !completed } : task
        )
      );
      setPendingTasks(prev => {
        const next = new Set(prev);
        next.delete(taskId);
        return next;
      });
    }
  }, [localConfig?.apiToken, pendingTasks]);

  useEffect(() => {
    if (localConfig?.apiToken) {
      fetchTasks();
    }
  }, [fetchTasks]);

  const renderContent = () => {
    if (!localConfig?.apiToken) {
      return (
        <div className="flex items-center justify-center h-full">
          <p className="text-gray-500">Please configure your Todoist API token</p>
        </div>
      );
    }

    if (loading && tasks.length === 0) {
      return (
        <div className="flex items-center justify-center h-full">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      );
    }

    if (error && tasks.length === 0) {
      return (
        <div className="flex items-center justify-center h-full">
          <p className="text-red-500">{error}</p>
        </div>
      );
    }

    if (tasks.length === 0) {
      return (
        <div className="flex items-center justify-center h-full">
          <p className="text-gray-500">No tasks found</p>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {tasks.map(task => (
          <Task 
            key={task.id} 
            task={task} 
            onToggle={toggleTask}
            isPending={pendingTasks.has(task.id)}
          />
        ))}
      </div>
    );
  };

  const renderSettings = () => (
    <Dialog open={showSettings} onOpenChange={setShowSettings}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Todoist Settings</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>API Token</Label>
            <Input
              type="password"
              value={localConfig?.apiToken || ''}
              onChange={(e) => setLocalConfig({
                ...localConfig,
                apiToken: e.target.value
              })}
              placeholder="Enter your Todoist API token"
            />
            <p className="text-xs text-gray-500">
              Get your API token from Todoist Settings → Integrations
            </p>
          </div>

          <div className="space-y-2">
            <Label>Project ID (Optional)</Label>
            <Input
              type="text"
              value={localConfig?.projectId || ''}
              onChange={(e) => setLocalConfig({
                ...localConfig,
                projectId: e.target.value
              })}
              placeholder="Enter project ID to filter tasks"
            />
          </div>

          <div className="flex items-center justify-between">
            <Label>Show Completed Tasks</Label>
            <Switch
              checked={localConfig?.showCompleted || false}
              onCheckedChange={(checked) => setLocalConfig({
                ...localConfig,
                showCompleted: checked
              })}
            />
          </div>

          <div className="space-y-2">
            <Label>Maximum Tasks</Label>
            <Input
              type="number"
              value={localConfig?.maxTasks || 10}
              onChange={(e) => setLocalConfig({
                ...localConfig,
                maxTasks: parseInt(e.target.value) || 10
              })}
              min="1"
              max="50"
            />
          </div>
        </div>
        
        <DialogFooter>
          {config?.onDelete && (
            <button
              className="px-4 py-2 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 border border-transparent hover:border-red-200 dark:hover:border-red-800 rounded-lg text-sm font-medium transition-colors"
              onClick={config.onDelete}
            >
              Delete Widget
            </button>
          )}
          <button
            onClick={() => {
              if (config?.onUpdate) {
                config.onUpdate(localConfig);
              }
              setShowSettings(false);
            }}
            className="px-4 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Save
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="widget-container h-full flex flex-col">
      <WidgetHeader 
        title="Todoist Tasks" 
        onSettingsClick={() => setShowSettings(true)}
      />
      
      <div className="flex-grow overflow-auto">
        {renderContent()}
      </div>
      
      {renderSettings()}
    </div>
  );
};

export default TodoistWidget; 