import { Outlet } from 'react-router'
import NavBar from './NavBar'

function AppShell() {
  return (
    <div className="min-h-screen bg-white">
      <NavBar />
      <main className="mx-auto max-w-4xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}

export default AppShell
