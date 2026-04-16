import { Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import CallPage from './pages/CallPage'
import DashboardPage from './pages/DashboardPage'
import Layout from './components/Layout'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route element={<Layout />}>
        <Route path="/call" element={<CallPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
      </Route>
    </Routes>
  )
}
