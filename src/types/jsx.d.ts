// TypeScript JSX declarations
declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: any;
  }
  
  interface Element {
    type: any;
    props: any;
    key: any;
  }
} 