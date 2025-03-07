/// <reference types="vite/client" />

interface ImportMeta {
  readonly env: {
    readonly VITE_GOOGLE_CLIENT_ID: string;
    readonly VITE_GOOGLE_CLIENT_SECRET: string;
    readonly VITE_OPENWEATHER_API_KEY: string;
    // Add any other environment variables here
    readonly [key: string]: string;
  };
}
