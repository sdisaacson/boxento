// This file contains global type declarations that help fix TypeScript errors

// If you're getting errors about React JSX elements
declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: Record<string, unknown>;
  }
  type Element = React.ReactElement;
}

// If you're getting errors about React modules
declare module 'react' {
  export const useState: <T>(initialState: T | (() => T)) => [T, (state: T | ((prevState: T) => T)) => void];
  export const useEffect: (effect: () => void | (() => void), deps?: ReadonlyArray<unknown>) => void;
  export const useRef: <T>(initialValue?: T) => { current: T };
  export const createContext: <T>(defaultValue: T) => Context<T>;
  export const useContext: <T>(context: Context<T>) => T;
  export type ReactNode = React.ReactNode;
  export type RefObject<T> = { readonly current: T | null };
  export type MutableRefObject<T> = { current: T };
  export type FunctionComponent<P extends Record<string, unknown>> = React.FC<P>;
  export type FC<P extends Record<string, unknown>> = (props: P) => JSX.Element | null;
  export type MouseEvent<T extends Element> = React.MouseEvent<T>;
  export type KeyboardEvent<T extends Element> = React.KeyboardEvent<T>;
  export type ChangeEvent<T extends Element> = React.ChangeEvent<T>;
  export type FormEvent<T extends Element> = React.FormEvent<T>;
  export type ErrorInfo = {
    componentStack: string;
  };

  // Re-export default React
  export default React;
}

declare module 'react-dom' {
  export const createPortal: (children: React.ReactNode, container: Element) => React.ReactPortal;
  export default ReactDOM;
}

declare module 'react-dom/client' {
  export const createRoot: (container: Element) => { render: (element: React.ReactNode) => void };
  export default ReactDOMClient;
}

declare module 'react/jsx-runtime' {
  export * from 'react/jsx-runtime';
}

declare module 'react-grid-layout' {
  export interface Layout {
    i: string;
    x: number;
    y: number;
    w: number;
    h: number;
    minW?: number;
    minH?: number;
    maxW?: number;
    maxH?: number;
    static?: boolean;
    isDraggable?: boolean;
    isResizable?: boolean;
  }
  
  export interface GridLayoutProps {
    className?: string;
    style?: React.CSSProperties;
    width: number;
    autoSize?: boolean;
    cols: number;
    draggableCancel?: string;
    draggableHandle?: string;
    verticalCompact?: boolean;
    compactType?: 'vertical' | 'horizontal' | null;
    layout: Layout[];
    margin?: [number, number];
    containerPadding?: [number, number];
    rowHeight: number;
    maxRows?: number;
    isBounded?: boolean;
    isDraggable?: boolean;
    isResizable?: boolean;
    preventCollision?: boolean;
    useCSSTransforms?: boolean;
    transformScale?: number;
    resizeHandles?: Array<'s' | 'w' | 'e' | 'n' | 'sw' | 'nw' | 'se' | 'ne'>;
    onLayoutChange?: (layout: Layout[]) => void;
    onDragStart?: (layout: Layout[], oldItem: Layout, newItem: Layout, placeholder: Layout, event: MouseEvent, element: HTMLElement) => void;
    onDrag?: (layout: Layout[], oldItem: Layout, newItem: Layout, placeholder: Layout, event: MouseEvent, element: HTMLElement) => void;
    onDragStop?: (layout: Layout[], oldItem: Layout, newItem: Layout, placeholder: Layout, event: MouseEvent, element: HTMLElement) => void;
    onResizeStart?: (layout: Layout[], oldItem: Layout, newItem: Layout, placeholder: Layout, event: MouseEvent, element: HTMLElement) => void;
    onResize?: (layout: Layout[], oldItem: Layout, newItem: Layout, placeholder: Layout, event: MouseEvent, element: HTMLElement) => void;
    onResizeStop?: (layout: Layout[], oldItem: Layout, newItem: Layout, placeholder: Layout, event: MouseEvent, element: HTMLElement) => void;
    children: React.ReactNode;
  }
  
  export default class GridLayout extends React.Component<GridLayoutProps> {}
} 