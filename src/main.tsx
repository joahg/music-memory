import React from 'react'
import ReactDOM from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import App from './App'
import './styles.css'

const localHostnames = new Set(['localhost', '127.0.0.1', '::1'])
const isLocalhost = typeof window !== 'undefined' && localHostnames.has(window.location.hostname)

if ('serviceWorker' in navigator) {
  if (isLocalhost) {
    void navigator.serviceWorker.getRegistrations().then(async (registrations) => {
      await Promise.all(registrations.map((registration) => registration.unregister()))

      if ('caches' in window) {
        const cacheKeys = await caches.keys()
        await Promise.all(cacheKeys.map((cacheKey) => caches.delete(cacheKey)))
      }
    })
  } else {
    registerSW({ immediate: true })
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
