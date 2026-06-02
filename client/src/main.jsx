import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import { PersistGate } from 'redux-persist/integration/react'
import { Toaster } from 'react-hot-toast'
import App from './App.jsx'
import store, { persistor } from './store/store.js'
import './utils/axiosConfig.js'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import './index.css'

// Если запущено в Cypress, отключаем PersistGate, чтобы не восстанавливать состояние
const isCypress = typeof window !== 'undefined' && window.Cypress;

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      {isCypress ? (
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <ErrorBoundary>
            <App />
            <Toaster position="bottom-right" toastOptions={{ duration: 3000 }} />
          </ErrorBoundary>
        </BrowserRouter>
      ) : (
        <PersistGate loading={null} persistor={persistor}>
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <ErrorBoundary>
              <App />
              <Toaster position="bottom-right" toastOptions={{ duration: 3000 }} />
            </ErrorBoundary>
          </BrowserRouter>
        </PersistGate>
      )}
    </Provider>
  </StrictMode>
)
