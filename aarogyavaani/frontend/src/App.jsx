import { Suspense, lazy } from 'react'
import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import PageTransition from './components/PageTransition'
import OnboardingPopup from './components/OnboardingPopup'
import { Link } from 'react-router-dom'

const LandingPage = lazy(() => import('./pages/LandingPage'))
const CallPage = lazy(() => import('./pages/CallPage'))
const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const HistoryPage = lazy(() => import('./pages/HistoryPage'))
const ProfilePage = lazy(() => import('./pages/ProfilePage'))
const BlogPage = lazy(() => import('./pages/BlogPage'))
const BlogPostPage = lazy(() => import('./pages/BlogPostPage'))
const DoctorBriefPage = lazy(() => import('./pages/DoctorBriefPage'))
const MedicationsPage = lazy(() => import('./pages/MedicationsPage'))
const ReportComparePage = lazy(() => import('./pages/ReportComparePage'))
const FamilyPage = lazy(() => import('./pages/FamilyPage'))
const TasksPage = lazy(() => import('./pages/TasksPage'))
const KnowledgeBasePage = lazy(() => import('./pages/KnowledgeBasePage'))
const SettingsPage = lazy(() => import('./pages/SettingsPage'))
const PrivateDocumentsPage = lazy(() => import('./pages/PrivateDocumentsPage'))
const AgentChatPage = lazy(() => import('./pages/AgentChatPage'))
const SchemeMatcherPage = lazy(() => import('./pages/SchemeMatcherPage'))
const SmartScanPage = lazy(() => import('./pages/SmartScanPage'))
const ProactiveHealthPage = lazy(() => import('./pages/ProactiveHealthPage'))

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
    <>
      <OnboardingPopup />
      <Suspense fallback={<div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#fffdf9', color: 'hsl(45 21% 40%)' }}>Loading...</div>}>
      <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/blog" element={<BlogPage />} />
      <Route path="/blog/:slug" element={<BlogPostPage />} />
      <Route element={<Layout />}>
        <Route path="/call" element={<PageTransition><CallPage /></PageTransition>} />
        <Route path="/agent" element={<PageTransition><AgentChatPage /></PageTransition>} />
        <Route path="/dashboard" element={<PageTransition><DashboardPage /></PageTransition>} />
        <Route path="/history" element={<PageTransition><HistoryPage /></PageTransition>} />
        <Route path="/profile" element={<PageTransition><ProfilePage /></PageTransition>} />
        <Route path="/doctor-brief" element={<PageTransition><DoctorBriefPage /></PageTransition>} />
        <Route path="/medications" element={<PageTransition><MedicationsPage /></PageTransition>} />
        <Route path="/compare" element={<PageTransition><ReportComparePage /></PageTransition>} />
        <Route path="/family" element={<PageTransition><FamilyPage /></PageTransition>} />
        <Route path="/tasks" element={<PageTransition><TasksPage /></PageTransition>} />
        <Route path="/knowledge" element={<PageTransition><KnowledgeBasePage /></PageTransition>} />
        <Route path="/settings" element={<PageTransition><SettingsPage /></PageTransition>} />
        <Route path="/private-documents" element={<PageTransition><PrivateDocumentsPage /></PageTransition>} />
        <Route path="/schemes" element={<PageTransition><SchemeMatcherPage /></PageTransition>} />
        <Route path="/scan" element={<PageTransition><SmartScanPage /></PageTransition>} />
        <Route path="/proactive" element={<PageTransition><ProactiveHealthPage /></PageTransition>} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
      </Suspense>
    </>
  )
}
