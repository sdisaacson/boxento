import path from "path"
import tailwindcss from "@tailwindcss/vite"
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { execSync } from 'child_process'

// Get git commit hash for build versioning
const getGitHash = () => {
  try {
    return execSync('git rev-parse --short HEAD').toString().trim()
  } catch {
    return 'unknown'
  }
}

// Get build timestamp
const getBuildTime = () => {
  return new Date().toISOString()
}

// Helper function to get allowed hosts from environment or use defaults
const getAllowedHosts = () => {
  const defaultHosts = [
    // Local development
    'localhost',
    '127.0.0.1',
    // Docker Desktop default hostname pattern
    '.docker.internal',
    // OrbStack domains
    '.orb.local',
    // Allow all subdomains of these base domains
    'boxento-dev.boxento.orb.local',
    'boxento-prod.boxento.orb.local',
    'boxento.boxento.orb.local',
    'sisaacson.io',
    // Allow custom domains set via environment variable
    ...(process.env.VITE_ALLOWED_HOSTS || '').split(',').filter(Boolean)
  ]
  
  return defaultHosts
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: {
    __BUILD_HASH__: JSON.stringify(getGitHash()),
    __BUILD_TIME__: JSON.stringify(getBuildTime()),
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      '/api/mindicador': {
        target: 'https://mindicador.cl',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/mindicador/, ''),
        secure: false
      }
    },
    host: true, // Listen on all network interfaces
    port: 5173,
    strictPort: true,
    cors: true,
    // Hosts allowed for dev server
    allowedHosts: getAllowedHosts()
  },
  preview: {
    port: 5173,
    host: true, // Listen on all network interfaces
    // Use same allowed hosts for preview
    allowedHosts: getAllowedHosts()
  },
  css: {
    postcss: {
      plugins: [],
    },
  },
  build: {
    cssMinify: 'lightningcss',
    chunkSizeWarningLimit: 900,
  },
})
