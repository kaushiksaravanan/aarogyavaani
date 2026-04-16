import { Outlet, Link, useLocation } from 'react-router-dom'
import { Phone, LayoutDashboard, Home, Heart } from 'lucide-react'

const navItems = [
  { path: '/call', label: 'Voice Call', icon: Phone },
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
]

export default function Layout() {
  const location = useLocation()

  return (
    <div className="min-h-screen flex" style={{ background: '#fffdf9' }}>
      {/* Sidebar */}
      <aside
        className="w-64 flex flex-col"
        style={{
          background: '#22160e',
          borderRight: '1px solid hsl(28 45% 20%)',
        }}
      >
        <div className="p-6">
          <Link to="/" className="flex items-center gap-2.5">
            <Heart
              className="w-7 h-7"
              fill="currentColor"
              style={{ color: 'hsl(28 45% 57%)' }}
            />
            <span
              className="text-lg"
              style={{
                fontFamily: '"Instrument Serif", Georgia, serif',
                fontWeight: 600,
                color: 'hsl(45 21% 95%)',
              }}
            >
              AarogyaVaani
            </span>
          </Link>
          <p
            className="text-xs mt-1"
            style={{ color: 'hsl(45 21% 65%)' }}
          >
            Voice AI Healthcare
          </p>
        </div>

        <nav className="flex-1 px-3">
          {navItems.map(item => {
            const Icon = item.icon
            const active = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium mb-1 transition-colors"
                style={
                  active
                    ? {
                        background: 'hsla(28, 45%, 57%, 0.12)',
                        color: 'hsl(28 45% 57%)',
                      }
                    : {
                        color: 'hsl(45 21% 65%)',
                      }
                }
                onMouseEnter={e => {
                  if (!active) {
                    e.currentTarget.style.background = 'hsla(28, 45%, 57%, 0.07)'
                    e.currentTarget.style.color = 'hsl(45 21% 85%)'
                  }
                }}
                onMouseLeave={e => {
                  if (!active) {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.color = 'hsl(45 21% 65%)'
                  }
                }}
              >
                <Icon className="w-4.5 h-4.5" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="p-4" style={{ borderTop: '1px solid hsl(28 45% 20%)' }}>
          <div
            className="rounded-lg p-3"
            style={{
              background: 'linear-gradient(135deg, #271a10, #1b130d)',
              border: '1px solid hsl(28 45% 20%)',
            }}
          >
            <p
              className="text-xs font-medium"
              style={{ color: 'hsl(28 45% 57%)' }}
            >
              Free Tier
            </p>
            <p
              className="text-xs mt-0.5"
              style={{ color: 'hsl(45 21% 65%)' }}
            >
              Unlimited voice calls
            </p>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto" style={{ background: '#fffdf9' }}>
        <Outlet />
      </main>
    </div>
  )
}
