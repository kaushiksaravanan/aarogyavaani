import { Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import CallPage from './pages/CallPage'
import DashboardPage from './pages/DashboardPage'
import HistoryPage from './pages/HistoryPage'
import ProfilePage from './pages/ProfilePage'
import BlogPage from './pages/BlogPage'
import BlogPostPage from './pages/BlogPostPage'
import Layout from './components/Layout'
import PageTransition from './components/PageTransition'
import { Link } from 'react-router-dom'

function NotFound() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      fontFamily: '"Inter", system-ui, sans-serif',
      background: '#fffdf9', color: 'hsl(28 45% 15%)'
    }}>
      <h1 style={{ fontFamily: '"Instrument Serif", Georgia, serif', fontSize: '4rem', marginBottom: '0.5rem' }}>404</h1>
      <p style={{ color: 'hsl(45 21% 40%)', marginBottom: '2rem' }}>Page not found</p>
      <Link to="/" style={{
        background: 'hsl(28 45% 57%)', color: 'white',
        padding: '0.75rem 2rem', borderRadius: '999px',
        textDecoration: 'none', fontWeight: 600
      }}>
        Go Home
      </Link>
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/blog" element={<BlogPage />} />
      <Route path="/blog/:slug" element={<BlogPostPage />} />
      <Route element={<Layout />}>
        <Route path="/call" element={<PageTransition><CallPage /></PageTransition>} />
        <Route path="/dashboard" element={<PageTransition><DashboardPage /></PageTransition>} />
        <Route path="/history" element={<PageTransition><HistoryPage /></PageTransition>} />
        <Route path="/profile" element={<PageTransition><ProfilePage /></PageTransition>} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
