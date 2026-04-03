import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Initialize Sentry error monitoring
import { initSentry, setSentryUser, clearSentryUser, reportError } from './config/sentry'

// Load saved language and apply on startup
const savedLanguage = localStorage.getItem('school_language') || 'en'
document.documentElement.lang = savedLanguage
document.documentElement.dir = savedLanguage === 'ar' ? 'rtl' : 'ltr'
document.body.style.direction = savedLanguage === 'ar' ? 'rtl' : 'ltr'

// Apply appropriate font
if (savedLanguage === 'ar') {
  document.body.style.fontFamily = "'Tajawal', 'Segoe UI', Tahoma, sans-serif"
} else if (savedLanguage === 'fr') {
  document.body.style.fontFamily = "'Roboto', 'Segoe UI', sans-serif"
} else {
  document.body.style.fontFamily = "'Inter', 'Segoe UI', sans-serif"
}

// Initialize Sentry
initSentry()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// Export Sentry functions for use in app
export { setSentryUser, clearSentryUser, reportError }
