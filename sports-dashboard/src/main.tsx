import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { LiveFeedProvider } from './context/LiveFeedContext'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <LiveFeedProvider>
      <App />
    </LiveFeedProvider>
  </React.StrictMode>
)
