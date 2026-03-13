import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { TerminalProvider } from './context/TerminalContext.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <TerminalProvider>
      <App />
    </TerminalProvider>
  </StrictMode>,
)
