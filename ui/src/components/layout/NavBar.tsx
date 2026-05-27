import { Link, useLocation } from 'react-router'
import { Waves, Menu, Home, Info } from 'lucide-react'
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetTitle,
} from '@/components/ui/sheet'

const NAV_ITEMS = [
  { to: '/', label: 'River Levels', icon: Home, current: true },
  { to: '#favorites', label: 'Favorites', icon: Info, disabled: true },
  { to: '#settings', label: 'Settings', icon: Info, disabled: true },
]

function NavBar() {
  const location = useLocation()

  return (
    <header className="flex items-center justify-between px-4 py-3 bg-white border-b border-neutral-200">
      {/* Desktop: app title */}
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-lg font-semibold text-neutral-900"
      >
        <Waves className="h-5 w-5 text-blue-600" />
        Splash
      </Link>

      {/* Desktop navigation (hidden on mobile) */}
      <nav className="hidden md:flex items-center gap-6">
        <Link
          to="/"
          className="text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
        >
          River Levels
        </Link>
      </nav>

      {/* Mobile: hamburger menu with Sheet drawer */}
      <Sheet>
        <SheetTrigger
          className="flex md:hidden items-center justify-center min-h-11 min-w-11 rounded-md hover:bg-neutral-100 transition-colors"
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5 text-neutral-700" />
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <div className="flex items-center gap-2 px-4 py-4 border-b border-neutral-200">
            <Waves className="h-5 w-5 text-blue-600" />
            <span className="text-lg font-semibold text-neutral-900">Splash</span>
          </div>
          <nav className="flex flex-col p-2 gap-1">
            {NAV_ITEMS.map((item) => {
              const isActive = !item.disabled && location.pathname === item.to
              const Icon = item.icon
              return (
                <Link
                  key={item.to}
                  to={item.disabled ? '#' : item.to}
                  className={`flex items-center gap-3 min-h-11 px-3 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'text-blue-600 bg-blue-50'
                      : item.disabled
                        ? 'text-neutral-400 cursor-not-allowed'
                        : 'text-neutral-700 hover:bg-neutral-100'
                  }`}
                  aria-disabled={item.disabled}
                  tabIndex={item.disabled ? -1 : undefined}
                  onClick={item.disabled ? (e) => e.preventDefault() : undefined}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                  {item.disabled && (
                    <span className="ml-auto text-xs text-neutral-400">Soon</span>
                  )}
                </Link>
              )
            })}
          </nav>
        </SheetContent>
      </Sheet>
    </header>
  )
}

export default NavBar
