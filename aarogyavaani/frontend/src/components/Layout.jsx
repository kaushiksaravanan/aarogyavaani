import { Outlet, Link, useLocation } from 'react-router-dom'
import { Phone, LayoutDashboard, Home, Heart } from 'lucide-react'

const navItems = [
  { path: '/call', label: 'Voice Call', icon: Phone },
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
]

export default function Layout() {
  const location = useLocation()
  
  return (
    <div className="min-h-screen bg-surface flex">
      {/* Sidebar */}
      <aside className="w-64 bg-surface-elevated border-r border-gray-200 flex flex-col">
        <div className="p-6">
          <Link to="/" className="flex items-center gap-2">
            <Heart className="w-7 h-7 text-primary-600" fill="currentColor" />
            <span className="text-lg font-bold text-primary-800">AarogyaVaani</span>
          </Link>
          <p className="text-xs text-text-muted mt-1">Voice AI Healthcare</p>
        </div>
        
        <nav className="flex-1 px-3">
          {navItems.map(item => {
            const Icon = item.icon
            const active = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium mb-1 transition-colors ${
                  active
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-text-secondary hover:bg-gray-50 hover:text-text-primary'
                }`}
              >
                <Icon className="w-4.5 h-4.5" />
                {item.label}
              </Link>
            )
          })}
        </nav>
        
        <div className="p-4 border-t border-gray-100">
          <div className="bg-primary-50 rounded-lg p-3">
            <p className="text-xs font-medium text-primary-800">Free Tier</p>
            <p className="text-xs text-primary-600 mt-0.5">Unlimited voice calls</p>
          </div>
        </div>
      </aside>
      
      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
