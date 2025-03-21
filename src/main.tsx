import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import App from './App'
import { AuthProvider } from './lib/AuthContext'
import { SafeSyncProvider } from './lib/SyncContext'
import { AppSettingsProvider } from './context/AppSettingsContext'

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('Failed to find the root element')

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <AuthProvider>
      <SafeSyncProvider>
        <AppSettingsProvider>
          <App />
        </AppSettingsProvider>
      </SafeSyncProvider>
    </AuthProvider>
  </React.StrictMode>
)
