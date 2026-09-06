import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import { ErrorBoundary } from 'react-error-boundary'
import { HelmetProvider } from 'react-helmet-async'
import { Toaster } from 'sonner'
import App from './App.jsx'
import { store } from './app/store'
import AppErrorFallback from './components/AppErrorFallback.jsx'
import './index.css'
import './pages/properties.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <HelmetProvider>
        <BrowserRouter>
          <ErrorBoundary FallbackComponent={AppErrorFallback} onReset={() => window.location.reload()}>
            <App />
          </ErrorBoundary>
          <Toaster
            richColors
            closeButton
            position="top-right"
            toastOptions={{
              style: {
                background: '#0c1914',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#f7fff9',
              },
            }}
          />
        </BrowserRouter>
      </HelmetProvider>
    </Provider>
  </StrictMode>,
)
