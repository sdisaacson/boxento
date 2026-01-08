import { WidgetProps } from '@/types';

export interface QRCodeWidgetConfig {
  id?: string;
  title?: string;
  content?: string; // Text or URL to encode
  onUpdate?: (config: QRCodeWidgetConfig) => void;
  onDelete?: () => void;
  [key: string]: unknown;
}

export type QRCodeWidgetProps = WidgetProps<QRCodeWidgetConfig>;
