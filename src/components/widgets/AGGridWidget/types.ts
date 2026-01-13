import { WidgetProps } from '@/types';

// Using 'any' for rowData and colDefs for flexibility with various data structures
export interface AGGridWidgetConfig {
  title?: string;
  dataUrl?: string;
  rowData?: any[];
  colDefs?: any[];
  s3AccessKey?: string;
  s3SecretAccessKey?: string;
  s3BucketName?: string;
  s3EndpointUrl?: string;
  s3Region?: string;
  s3FileName?: string;
  isEditable?: boolean;
  showDebug?: boolean;
  onUpdate?: (config: AGGridWidgetConfig) => void;
  onDelete?: () => void;
  [key: string]: unknown;
}

export type AGGridWidgetProps = WidgetProps<AGGridWidgetConfig>;
