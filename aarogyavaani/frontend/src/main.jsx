import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ClerkProvider } from '@clerk/clerk-react'
import App from './App'
import './styles/index.css'

const clerkKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

const tree = (
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
)

ReactDOM.createRoot(document.getElementById('root')).render(
  clerkKey
    ? <ClerkProvider publishableKey={clerkKey}>{tree}</ClerkProvider>
    : tree
)
