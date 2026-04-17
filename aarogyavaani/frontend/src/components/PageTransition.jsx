import { useLocation } from 'react-router-dom'

export default function PageTransition({ children }) {
  const location = useLocation()
  return (
    <div key={location.pathname} className="page-enter" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      {children}
    </div>
  )
}
