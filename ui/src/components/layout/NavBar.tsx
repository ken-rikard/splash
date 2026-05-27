import { Link } from 'react-router'
import { Waves } from 'lucide-react'

function NavBar() {
  return (
    <header className="flex items-center justify-between px-4 py-3 bg-white border-b border-neutral-200">
      <Link to="/" className="inline-flex items-center gap-2 text-lg font-semibold text-neutral-900">
        <Waves className="h-5 w-5 text-blue-600" />
        Splash
      </Link>
    </header>
  )
}

export default NavBar
