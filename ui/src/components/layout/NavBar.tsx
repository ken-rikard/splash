import { Link } from 'react-router'
import { Waves, Menu } from 'lucide-react'
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetTitle,
} from '@/components/ui/sheet'
import { useAlerts } from '@/hooks/useAlerts'

function NavBar() {
  const { count: alertCount } = useAlerts()

  const NAV_ITEMS = [
    { to: '/', label: 'River Levels' },
    { to: '/alerts', label: `Alerts${alertCount > 0 ? ` (${alertCount})` : ''}` },
    { to: '#favorites', label: 'Favorites', disabled: true },
    { to: '#settings', label: 'Settings', disabled: true },
  ]
  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-deep-bg/80 backdrop-blur-lg">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 sm:px-6 py-4">
        <Link
          to="/"
          className="inline-flex items-center gap-2.5 text-xl font-display font-semibold tracking-tight text-white"
        >
          <Waves className="h-5 w-5 text-accent-water" />
          Splash
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          {NAV_ITEMS.filter(i => !i.disabled).map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="text-xs font-medium text-slate-400 hover:text-white transition-colors tracking-widest uppercase"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <Sheet>
          <SheetTrigger
            className="flex md:hidden items-center justify-center min-h-11 min-w-11 rounded-md hover:bg-white/5 transition-colors"
            aria-label="Open navigation menu"
          >
            <Menu className="h-5 w-5 text-slate-300" />
          </SheetTrigger>
          <SheetContent side="left" className="w-64 border-r border-white/5 bg-deep-bg p-0">
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <div className="flex items-center gap-2.5 px-4 py-4 border-b border-white/5">
              <Waves className="h-5 w-5 text-accent-water" />
              <span className="text-lg font-display font-semibold text-white">Splash</span>
            </div>
            <nav className="flex flex-col p-2 gap-1">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.to}
                  to={item.disabled ? '#' : item.to}
                  className={`flex items-center gap-3 min-h-11 px-3 rounded-md text-sm font-medium transition-colors ${
                    item.disabled
                      ? 'text-slate-600 cursor-not-allowed'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                  aria-disabled={item.disabled}
                  tabIndex={item.disabled ? -1 : undefined}
                  onClick={item.disabled ? (e) => e.preventDefault() : undefined}
                >
                  {item.label}
                  {item.disabled && (
                    <span className="ml-auto text-[10px] text-slate-600 tracking-wide uppercase">Soon</span>
                  )}
                </Link>
              ))}
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  )
}

export default NavBar
