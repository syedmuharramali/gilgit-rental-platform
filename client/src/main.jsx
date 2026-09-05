import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'sonner'
import App from './App.jsx'
import { store } from './app/store'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <App />
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
    </Provider>
  </StrictMode>,
)
