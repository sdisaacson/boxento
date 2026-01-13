import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AgGridReact } from 'ag-grid-react';
import "ag-grid-community/styles/ag-theme-alpine.css";
import { AGGridWidgetProps, AGGridWidgetConfig } from './types';
import WidgetHeader from '../common/WidgetHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertCircle, Loader2, FolderOpen, FileUp, Download } from 'lucide-react';
import Papa from 'papaparse';
import { S3Client, GetObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Register all Community features
ModuleRegistry.registerModules([AllCommunityModule]);

const AGGridWidget: React.FC<AGGridWidgetProps> = ({ config }) => {
  const gridRef = useRef<AgGridReact>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [localConfig, setLocalConfig] = useState<AGGridWidgetConfig>(config || {});
  const [rowData, setRowData] = useState<any[]>(config?.rowData || []);
  const [colDefs, setColDefs] = useState<any[]>(config?.colDefs || []);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditable, setIsEditable] = useState(config?.isEditable ?? true);
  const [debugMode, setDebugMode] = useState(config?.showDebug ?? false);

  // S3 File Browser State
  const [isS3BrowserOpen, setIsS3BrowserOpen] = useState(false);
  const [s3BrowserMode, setS3BrowserMode] = useState<'load' | 'save'>('load');
  const [s3Files, setS3Files] = useState<string[]>([]);
  const [s3FileName, setS3FileName] = useState(config?.s3FileName || '');
  const [isS3Loading, setIsS3Loading] = useState(false);

  useEffect(() => {
    if (config) {
      setLocalConfig(config);
      setIsEditable(config.isEditable ?? true);
      setDebugMode(config.showDebug ?? false);
      if (config.rowData) setRowData(config.rowData);

      // Update column definitions to respect isEditable state
      if (config.colDefs) {
        const updatedColDefs = config.colDefs.map((col: any) => ({
          ...col,
          editable: isEditable
        }));
        setColDefs(updatedColDefs);
      }
      
      if (config.s3FileName) setS3FileName(config.s3FileName);
    }
  }, [config]);

  // When the editable toggle changes, push the new editable flag into the grid immediately
  useEffect(() => {
    setColDefs(prev => {
      const updated = (prev || []).map(col => ({
        ...col,
        editable: isEditable,
      }));
      const api = gridRef.current?.api;
      if (api) {
        api.stopEditing();
        if (typeof (api as any).setGridOption === 'function') {
          (api as any).setGridOption('columnDefs', updated);
        } else if (typeof (api as any).setColumnDefs === 'function') {
          (api as any).setColumnDefs(updated);
        }
        api.refreshCells({ force: true });
      }
      return updated;
    });
  }, [isEditable]);

  const streamToString = async (stream: ReadableStream): Promise<string> => {
    const reader = stream.getReader();
    const decoder = new TextDecoder("utf-8");
    let result = "";
    while (true) {
        const { done, value } = await reader.read();
        if (done) { return result; }
        result += decoder.decode(value);
    }
  };

  const getS3Client = useCallback(() => {
    const { s3EndpointUrl, s3Region, s3AccessKey, s3SecretAccessKey, s3BucketName } = localConfig;
    if (!s3AccessKey || !s3SecretAccessKey || !s3BucketName || !s3EndpointUrl || !s3Region) {
      throw new Error("S3 credentials are not fully configured in settings.");
    }
    return new S3Client({
      endpoint: s3EndpointUrl,
      region: s3Region,
      credentials: { accessKeyId: s3AccessKey, secretAccessKey: s3SecretAccessKey },
    });
  }, [localConfig]);

  const loadDataFromS3 = useCallback(async (fileName: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const client = getS3Client();
      const command = new GetObjectCommand({ Bucket: localConfig.s3BucketName, Key: fileName });
      const response = await client.send(command);
      if (response.Body) {
        const bodyString = await streamToString(response.Body as ReadableStream);
        // Call parseData here, passing the bodyString
        Papa.parse(bodyString, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true,
          complete: (result) => {
            const newRowData = result.data;
            const newColDefs = result.meta.fields ? result.meta.fields.map(field => ({ field })) : [];
            setRowData(newRowData);
            setColDefs(newColDefs);
            setS3FileName(fileName);
            config?.onUpdate?.({ ...localConfig, rowData: newRowData, colDefs: newColDefs, s3FileName: fileName });
          },
          error: (err: any) => {
            setError(err.message || "Failed to parse CSV data from S3.");
          }
        });
      } else {
        throw new Error("File is empty or could not be read.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to load data from S3.");
    } finally {
      setIsLoading(false);
      setIsS3BrowserOpen(false);
    }
  }, [localConfig, getS3Client, config?.onUpdate]);

  const saveDataToS3 = useCallback(async (fileName: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const client = getS3Client();
      const csvData = gridRef.current?.api.getDataAsCsv();
      if (csvData === undefined) throw new Error("Could not get data from grid.");
      
      const parallelUploads3 = new Upload({
        client: client,
        params: {
          Bucket: localConfig.s3BucketName,
          Key: fileName,
          Body: csvData,
          ContentType: 'text/csv'
        },
        queueSize: 4,
        partSize: 1024 * 1024 * 5, // 5MB
        leavePartsOnError: false,
      });

      await parallelUploads3.done();
      
      setS3FileName(fileName);
      config?.onUpdate?.({ ...localConfig, s3FileName: fileName });
    } catch (err: any) {
      setError(err.message || "Failed to save data to S3.");
    } finally {
      setIsLoading(false);
      setIsS3BrowserOpen(false);
    }
  }, [localConfig, getS3Client, config?.onUpdate]);

  const openS3Browser = useCallback(async (mode: 'load' | 'save') => {
    setS3BrowserMode(mode);
    setIsS3BrowserOpen(true);
    setIsS3Loading(true);
    setError(null);
    try {
      const client = getS3Client();
      const command = new ListObjectsV2Command({ Bucket: localConfig.s3BucketName });
      const response = await client.send(command);
      const files = response.Contents?.map(obj => obj.Key || '').filter(key => key) || [];
      setS3Files(files);
    } catch (err: any) {
      setError(err.message || "Failed to list S3 bucket contents.");
    } finally {
      setIsS3Loading(false);
    }
  }, [localConfig, getS3Client]);

  const parseData = useCallback((data: string) => {
    Papa.parse(data, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (result) => {
        const newRowData = result.data;
        const newColDefs = result.meta.fields ? result.meta.fields.map(field => ({ field })) : [];
        setRowData(newRowData);
        setColDefs(newColDefs);
        // Note: We deliberately do NOT call onUpdate here to avoid the infinite loop issue
        // when loading data from a URL. Data source URL is saved, data itself is re-fetched on load.
      },
      error: (err: unknown) => {
        const message = err instanceof Error ? err.message : "Failed to parse CSV data.";
        setError(message);
      }
    });
  }, []);

  const loadDataFromUrl = useCallback(async (url: string) => {
    if (!url) return;
    setIsLoading(true);
    setError(null);
    try {
      let response;
      try {
        response = await fetch(url);
      } catch (e) {
        console.warn("Direct fetch failed, trying CORS proxy...");
        response = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`);
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const text = await response.text();
      parseData(text);
    } catch (err: any) {
      setError(err.message || 'Failed to load data from URL.');
    } finally {
      setIsLoading(false);
    }
  }, [parseData]); 
  
  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setError(null);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      parseData(text);
      setIsLoading(false);
    };
    reader.onerror = () => {
      setError("Failed to read file.");
      setIsLoading(false);
    }
    reader.readAsText(file);
  }, [parseData]);
  
  const handleExport = useCallback(() => {
    gridRef.current?.api.exportDataAsCsv();
  }, []);

  const handleSaveSettings = useCallback(() => {
    const updated = { ...localConfig, isEditable, showDebug: debugMode };
    setLocalConfig(updated);
    config?.onUpdate?.(updated);
    setIsSettingsOpen(false);
  }, [config, localConfig, isEditable, debugMode]);

  useEffect(() => {
    if (localConfig.dataUrl && !rowData.length) {
      loadDataFromUrl(localConfig.dataUrl);
    }
  }, [localConfig.dataUrl, rowData.length, loadDataFromUrl]);

  const handleCellValueChanged = useCallback((event: any) => {
    const newData: any[] = [];
    event.api.forEachNode((node: any) => newData.push(node.data));
    setRowData(newData);
    config?.onUpdate?.({ ...localConfig, rowData: newData });
  }, [config, localConfig]);

  const toggleEditable = useCallback((checked: boolean | string) => {
    const next = Boolean(checked);
    setIsEditable(next);
    setLocalConfig(prev => ({ ...prev, isEditable: next }));
    // Optional persistence without waiting for Save
    if (config?.onUpdate) {
      config.onUpdate({ ...localConfig, isEditable: next });
    }
  }, [config, localConfig]);

  return (
    <div className="widget-container h-full flex flex-col">
      <WidgetHeader 
        title={localConfig.title || "AG-Grid"} 
        onSettingsClick={() => setIsSettingsOpen(true)}
      >
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={() => openS3Browser('load')}><FolderOpen className="mr-2 h-4 w-4" /> Load S3</Button>
            <Button variant="outline" size="sm" onClick={() => openS3Browser('save')}><FileUp className="mr-2 h-4 w-4" /> Save S3</Button>
            <div className="flex items-center space-x-2 pl-2">
              <Checkbox id="editable-toggle" checked={isEditable} onCheckedChange={toggleEditable} />
              <Label htmlFor="editable-toggle" className="text-xs">Editable</Label>
            </div>
          </div>
      </WidgetHeader>
      <div className={`flex-1 ag-theme-alpine-dark h-full relative ${!isEditable ? 'ag-non-editable' : ''}`}>
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}
        {error && !isS3BrowserOpen && (
          <div className="absolute top-2 left-2 right-2 z-10 flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-destructive">
            <AlertCircle className="h-4 w-4 mt-0.5" />
            <div className="flex-1 text-sm">{error}</div>
            <Button variant="ghost" size="sm" onClick={() => setError(null)} className="h-7">
              Dismiss
            </Button>
          </div>
        )}

        {/* S3 File Browser Overlay - Contained within widget */}
        {isS3BrowserOpen && (
          <div className="absolute inset-0 z-20 bg-background flex flex-col p-4 border-t">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">{s3BrowserMode === 'load' ? 'Load from S3' : 'Save to S3'}</h3>
                <p className="text-sm text-muted-foreground">
                  Select a file to {s3BrowserMode} or type a new name to save.
                </p>
              </div>
            </div>
            
            <div className="flex-1 flex flex-col gap-4 min-h-0">
              {isS3Loading && <Loader2 className="mx-auto w-8 h-8 animate-spin my-auto" />}
              {error && <div className="text-destructive flex items-center gap-2 mb-4"><AlertCircle className="h-4 w-4" /> {error}</div>}
              
              {!isS3Loading && (
                <>
                  <ScrollArea className="flex-1 border rounded-md min-h-0">
                    <div className="p-2">
                      {s3Files.map(file => (
                        <div key={file} onClick={() => setS3FileName(file)} className={`p-2 rounded-md cursor-pointer truncate ${s3FileName === file ? 'bg-accent' : 'hover:bg-accent/50'}`}>
                          {file}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                  <div className="grid gap-2">
                    <Label htmlFor="s3FileName">File Name</Label>
                    <Input id="s3FileName" value={s3FileName} onChange={(e) => setS3FileName(e.target.value)} className="w-full" />
                  </div>
                </>
              )}
            </div>
            
            <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
              <Button variant="outline" size="sm" onClick={() => setIsS3BrowserOpen(false)}>Cancel</Button>
              <Button size="sm" onClick={() => s3BrowserMode === 'load' ? loadDataFromS3(s3FileName) : saveDataToS3(s3FileName)} disabled={!s3FileName || isS3Loading}>
                {s3BrowserMode === 'load' ? 'Load' : 'Save'}
              </Button>
            </div>
          </div>
        )}

        <AgGridReact
          ref={gridRef}
          rowData={rowData}
          columnDefs={colDefs}
          defaultColDef={{
            sortable: true,
            filter: true,
            resizable: true,
            editable: isEditable,
          }}
          suppressClickEdit={!isEditable}
          singleClickEdit={true}
          onCellValueChanged={handleCellValueChanged}
        />
      </div>
      {debugMode && (
        <div className="absolute bottom-2 right-2 z-20 rounded-md bg-black/70 px-3 py-2 text-xs text-white space-y-1">
          <div>Editable: {String(isEditable)}</div>
          <div>Rows: {rowData.length}</div>
          <div>Columns: {colDefs.length}</div>
          <div>Errors: {error ? 'Yes' : 'No'}</div>
        </div>
      )}

      {/* Settings Modal */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="sm:max-w-xl border">
          <DialogHeader>
            <DialogTitle>AG-Grid Settings</DialogTitle>
            <DialogDescription>
              Configure the AG-Grid widget and data sources.
            </DialogDescription>
          </DialogHeader>
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="general">General & Import</TabsTrigger>
              <TabsTrigger value="s3">S3 Storage</TabsTrigger>
            </TabsList>
            <TabsContent value="general" className="pt-4">
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Widget Title</Label>
                  <Input
                    id="title"
                    value={localConfig.title || ''}
                    onChange={(e) => setLocalConfig({ ...localConfig, title: e.target.value })}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="editable-setting-toggle"
                    checked={isEditable}
                    onCheckedChange={toggleEditable}
                  />
                  <Label htmlFor="editable-setting-toggle">Editable</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="debug-setting-toggle"
                    checked={debugMode}
                    onCheckedChange={(checked) => {
                      const next = Boolean(checked);
                      setDebugMode(next);
                      setLocalConfig(prev => ({ ...prev, showDebug: next }));
                      config?.onUpdate?.({ ...localConfig, showDebug: next });
                    }}
                  />
                  <Label htmlFor="debug-setting-toggle">Debug Overlay</Label>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="dataUrl">Data URL (CSV)</Label>
                  <div className="flex gap-2">
                    <Input
                      id="dataUrl"
                      value={localConfig.dataUrl || ''}
                      onChange={(e) => setLocalConfig({ ...localConfig, dataUrl: e.target.value })}
                    />
                    <Button onClick={() => loadDataFromUrl(localConfig.dataUrl || '')} disabled={isLoading}>
                      Load
                    </Button>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label>Local Data Actions</Label>
                  <div className="flex gap-2">
                     <Input
                        id="file-upload"
                        type="file"
                        accept=".csv"
                        onChange={handleFileUpload}
                        className="cursor-pointer"
                      />
                    <Button onClick={handleExport}><Download className="mr-2 h-4 w-4"/> Export CSV</Button>
                  </div>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="s3" className="pt-4">
              <div className="grid gap-4">
                 <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>Access Key</Label>
                      <Input value={localConfig.s3AccessKey || ''} onChange={e => setLocalConfig({...localConfig, s3AccessKey: e.target.value})} />
                    </div>
                    <div className="grid gap-2">
                      <Label>Secret Access Key</Label>
                      <Input type="password" value={localConfig.s3SecretAccessKey || ''} onChange={e => setLocalConfig({...localConfig, s3SecretAccessKey: e.target.value})} />
                    </div>
                </div>
                <div className="grid gap-2">
                  <Label>Endpoint URL</Label>
                  <Input value={localConfig.s3EndpointUrl || ''} onChange={e => setLocalConfig({...localConfig, s3EndpointUrl: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Bucket Name</Label>
                    <Input value={localConfig.s3BucketName || ''} onChange={e => setLocalConfig({...localConfig, s3BucketName: e.target.value})} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Region</Label>
                    <Input value={localConfig.s3Region || ''} onChange={e => setLocalConfig({...localConfig, s3Region: e.target.value})} />
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
          <DialogFooter className="mt-4">
             {config?.onDelete && typeof config.onDelete === 'function' && (
                <Button variant="destructive" onClick={() => config.onDelete?.()}>
                  Delete Widget
                </Button>
              )}
            <Button onClick={handleSaveSettings}>Save Settings</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AGGridWidget;
