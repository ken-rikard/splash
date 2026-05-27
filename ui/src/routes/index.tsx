import { createBrowserRouter } from 'react-router'
import AppShell from '@/components/layout/AppShell'
import DashboardPage from '@/features/dashboard/DashboardPage'
import RiverDetailPage from '@/features/river/RiverDetailPage'

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'river/:id', element: <RiverDetailPage /> },
    ],
  },
])

export default router
