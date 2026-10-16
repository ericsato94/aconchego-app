import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import '@fontsource/baloo-2/600.css'
import '@fontsource/baloo-2/700.css'
import '@fontsource/baloo-2/800.css'
import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '@fontsource/inter/600.css'
import '@fontsource/inter/700.css'
import './styles/global.css'
import App from './App'
import { AppProvider } from './store/AppStore'
import { PlayerProvider } from './store/PlayerStore'
import { ToastProvider } from './store/ToastStore'

registerSW({ immediate: true })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProvider>
      <PlayerProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </PlayerProvider>
    </AppProvider>
  </StrictMode>,
)
