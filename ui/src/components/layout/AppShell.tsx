import { Outlet } from 'react-router'
import NavBar from './NavBar'

function AppShell() {
  return (
    <div className="min-h-screen bg-deep-bg">
      <NavBar />
      <main className="mx-auto max-w-5xl px-4 sm:px-6 py-8 sm:py-12">
        <Outlet />
      </main>
    </div>
  )
}

export default AppShell
