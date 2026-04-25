import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import { PersistGate } from 'redux-persist/integration/react'
import './index.css'
import App from './App.jsx'
import store, { persistor } from './store/store.js'
import './utils/axiosConfig.js'
import ErrorBoundary from './components/ErrorBoundary.jsx'


createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <BrowserRouter future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}>
          <ErrorBoundary><App /></ErrorBoundary>

        </BrowserRouter>
      </PersistGate>
    </Provider>
  </StrictMode>,
)
