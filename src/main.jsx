import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router'
import './index.css'
import { router } from './routes/router'
import { ErrorBoundary } from './layout/components/ErrorBoundary'
import { reportClientError } from './config/ApiService'

window.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason
  const message = reason instanceof Error ? reason.message : String(reason)
  reportClientError('error', 'Unhandled promise rejection: ' + message, window.location.href,
    reason instanceof Error ? reason.stack : undefined)
})

window.addEventListener('error', (event) => {
  reportClientError('error', event.message, event.filename || window.location.href,
    event.error instanceof Error ? event.error.stack : undefined)
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <RouterProvider router={router} />
    </ErrorBoundary>
  </StrictMode>,
)
