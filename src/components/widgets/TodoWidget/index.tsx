import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '../../ui/dialog';
import {
  Check,
  Plus,
  Trash2,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import WidgetHeader from '../common/WidgetHeader';
import { TodoWidgetProps, TodoWidgetConfig, TodoItem } from './types';
import { Button } from '../../ui/button';
import { Label } from '../../ui/label';
import { Switch } from '../../ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../ui/select';

/**
 * Todo Widget Component
 * 
 * A widget for managing a todo list
 * 
 * @param {TodoWidgetProps} props - Component props
 * @returns {JSX.Element} Widget component
 */
const TodoWidget: React.FC<TodoWidgetProps> = ({ width, height, config }) => {
  const defaultConfig: TodoWidgetConfig = {
    title: 'Todo List',
    items: [],
    backgroundColor: '#FFFFFF',
    darkBackgroundColor: '#1A1A1A',
    showCompletedItems: true,
    sortOrder: 'created'
  };

  const [showSettings, setShowSettings] = useState(false);
  const [localConfig, setLocalConfig] = useState<TodoWidgetConfig>({
    ...defaultConfig,
    ...config
  });
  
  const [newTodoText, setNewTodoText] = useState('');
  const newTodoInputRef = useRef<HTMLInputElement | null>(null);
  const widgetRef = useRef<HTMLDivElement | null>(null);
  
  // Update local config when props change
  useEffect(() => {
    setLocalConfig(prevConfig => ({
      ...prevConfig,
      ...config
    }));
  }, [config]);

  // Add a new todo item
  const addTodo = () => {
    if (!newTodoText.trim()) return;
    
    const newItem: TodoItem = {
      id: Date.now().toString(),
      text: newTodoText.trim(),
      completed: false,
      createdAt: new Date()
    };
    
    const updatedItems = [...(localConfig.items || []), newItem];
    
    setLocalConfig(prev => ({
      ...prev,
      items: updatedItems
    }));
    
    // Save to parent config
    if (config?.onUpdate) {
      config.onUpdate({
        ...localConfig,
        items: updatedItems
      });
    }
    
    setNewTodoText('');
    
    // Focus the input field after adding
    setTimeout(() => {
      if (newTodoInputRef.current) {
        newTodoInputRef.current.focus();
      }
    }, 0);
  };

  // Toggle todo completion
  const toggleTodo = (id: string) => {
    const updatedItems = (localConfig.items || []).map(item => {
      if (item.id === id) {
        return { ...item, completed: !item.completed };
      }
      return item;
    });
    
    setLocalConfig(prev => ({
      ...prev,
      items: updatedItems
    }));
    
    // Save to parent config
    if (config?.onUpdate) {
      config.onUpdate({
        ...localConfig,
        items: updatedItems
      });
    }
  };

  // Delete a todo item
  const deleteTodo = (id: string) => {
    const updatedItems = (localConfig.items || []).filter(item => item.id !== id);
    
    setLocalConfig(prev => ({
      ...prev,
      items: updatedItems
    }));
    
    // Save to parent config
    if (config?.onUpdate) {
      config.onUpdate({
        ...localConfig,
        items: updatedItems
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

  // Handle show completed items change
  const handleShowCompletedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const showCompleted = e.target.checked;
    setLocalConfig(prev => ({
      ...prev,
      showCompletedItems: showCompleted
    }));
  };

  // Handle sort order change
  const handleSortOrderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSortOrder = e.target.value as 'created' | 'alphabetical' | 'completed';
    setLocalConfig(prev => ({
      ...prev,
      sortOrder: newSortOrder
    }));
  };

  // Save settings
  const saveSettings = () => {
    if (config?.onUpdate) {
      config.onUpdate(localConfig);
    }
    setShowSettings(false);
  };

  // Get filtered and sorted todo items
  const getFilteredAndSortedItems = () => {
    let items = [...(localConfig.items || [])];
    
    // Filter out completed items if needed
    if (!localConfig.showCompletedItems) {
      items = items.filter(item => !item.completed);
    }
    
    // Sort items
    switch (localConfig.sortOrder) {
      case 'alphabetical':
        items.sort((a, b) => a.text.localeCompare(b.text));
        break;
      case 'completed':
        items.sort((a, b) => {
          if (a.completed === b.completed) {
            return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          }
          return a.completed ? 1 : -1;
        });
        break;
      case 'created':
      default:
        items.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
    }
    
    return items;
  };

  // Render todo items with integrated add form
  const renderContent = () => {
    const items = getFilteredAndSortedItems();
    
    return (
      <div className="h-full flex flex-col">
        <div className="flex-grow overflow-y-auto">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
              <p>No tasks. Add one below!</p>
            </div>
          ) : (
            <ul className="space-y-2 pr-1">
              {items.map(item => (
                <li 
                  key={item.id} 
                  className="flex items-center gap-3 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg group"
                >
                  <button
                    onClick={() => toggleTodo(item.id)}
                    className={`flex-shrink-0 w-5 h-5 rounded-full border ${
                      item.completed 
                        ? 'bg-green-500 border-green-500 text-white' 
                        : 'border-gray-300 dark:border-gray-600'
                    } flex items-center justify-center`}
                    aria-label={item.completed ? "Mark as incomplete" : "Mark as complete"}
                  >
                    {item.completed && <Check size={12} />}
                  </button>
                  
                  <span 
                    className={`flex-grow ${
                      item.completed ? 'line-through text-gray-400 dark:text-gray-500' : 'text-gray-700 dark:text-gray-200'
                    }`}
                  >
                    {item.text}
                  </span>
                  
                  <button
                    onClick={() => deleteTodo(item.id)}
                    className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Delete task"
                  >
                    <Trash2 size={14} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        
        {/* Integrated add todo form */}
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <form 
            onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
              e.preventDefault();
              addTodo();
            }}
            className="flex items-center gap-2"
          >
            <Input
              ref={newTodoInputRef}
              type="text"
              value={newTodoText}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTodoText(e.target.value)}
              placeholder="Add a task..."
              className="flex-grow"
              aria-label="New task"
            />
            <button
              type="submit"
              disabled={!newTodoText.trim()}
              className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50"
              aria-label="Add task"
            >
              <Plus size={20} />
            </button>
          </form>
        </div>
      </div>
    );
  };

  // Settings modal using shadcn/ui Dialog
  const renderSettings = () => {
    return (
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Todo List Settings</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="title-input">Title</Label>
              <Input
                id="title-input"
                type="text"
                value={localConfig.title || ''}
                onChange={handleTitleChange}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="sort-order-select">Sort Order</Label>
              <Select
                value={localConfig.sortOrder || 'created'}
                onValueChange={(value) => handleSortOrderChange({ target: { value } } as React.ChangeEvent<HTMLSelectElement>)}
              >
                <SelectTrigger id="sort-order-select">
                  <SelectValue placeholder="Select sort order" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created">By Creation Date</SelectItem>
                  <SelectItem value="alphabetical">Alphabetically</SelectItem>
                  <SelectItem value="completed">By Completion Status</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="show-completed-toggle">Show completed items</Label>
              <Switch
                id="show-completed-toggle"
                checked={localConfig.showCompletedItems ?? true}
                onCheckedChange={(checked: boolean) => handleShowCompletedChange({ target: { checked } } as React.ChangeEvent<HTMLInputElement>)}
              />
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
                Save Changes
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
        title={localConfig.title || defaultConfig.title} 
        onSettingsClick={() => setShowSettings(true)}
      />
      
      <div className="flex-grow p-4 overflow-hidden">
        <div className="h-full flex flex-col">
          <div className="flex-grow overflow-y-auto">
            {getFilteredAndSortedItems().length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
                <p>No tasks. Add one below!</p>
              </div>
            ) : (
              <ul className="space-y-2 pr-1">
                {getFilteredAndSortedItems().map(item => (
                  <li 
                    key={item.id} 
                    className="flex items-center gap-3 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg group"
                  >
                    <button
                      onClick={() => toggleTodo(item.id)}
                      className={`flex-shrink-0 w-5 h-5 rounded-full border ${
                        item.completed 
                          ? 'bg-green-500 border-green-500 text-white' 
                          : 'border-gray-300 dark:border-gray-600'
                      } flex items-center justify-center`}
                      aria-label={item.completed ? "Mark as incomplete" : "Mark as complete"}
                    >
                      {item.completed && <Check size={12} />}
                    </button>
                    
                    <span 
                      className={`flex-grow ${
                        item.completed ? 'line-through text-gray-400 dark:text-gray-500' : 'text-gray-700 dark:text-gray-200'
                      }`}
                    >
                      {item.text}
                    </span>
                    
                    <button
                      onClick={() => deleteTodo(item.id)}
                      className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label="Delete task"
                    >
                      <Trash2 size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          
          {/* Integrated add todo form */}
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <form 
              onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
                e.preventDefault();
                addTodo();
              }}
              className="flex items-center gap-2"
            >
              <Input
                ref={newTodoInputRef}
                type="text"
                value={newTodoText}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTodoText(e.target.value)}
                placeholder="Add a task..."
                className="flex-grow"
                aria-label="New task"
              />
              <button
                type="submit"
                disabled={!newTodoText.trim()}
                className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50"
                aria-label="Add task"
              >
                <Plus size={20} />
              </button>
            </form>
          </div>
        </div>
      </div>
      
      {renderSettings()}
    </div>
  );
};

export default TodoWidget; 