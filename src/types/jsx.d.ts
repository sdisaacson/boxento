// TypeScript JSX declarations
declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: Record<string, unknown>;
  }
  
  interface Element {
    type: string | React.JSXElementConstructor<unknown>;
    props: Record<string, unknown>;
    key: string | number | null;
  }
} 